import { getSingletonAnalyticsOptional } from '@lobehub/analytics';
import isEqual from 'fast-deep-equal';
import { t } from 'i18next';
import useSWR, { SWRResponse, mutate } from 'swr';
import type { PartialDeep } from 'type-fest';
import { StateCreator } from 'zustand/vanilla';

import { message } from '@/components/AntdStaticMethods';
import { MESSAGE_CANCEL_FLAT } from '@/const/message';
import { DEFAULT_AGENT_LOBE_SESSION, INBOX_SESSION_ID } from '@/const/session';
import { useClientDataSWR } from '@/libs/swr';
import { sessionService } from '@/services/session';
import { SessionStore } from '@/store/session';
import { getUserStoreState, useUserStore } from '@/store/user';
import { settingsSelectors, userProfileSelectors } from '@/store/user/selectors';
import { MetaData } from '@/types/meta';
import {
  ChatSessionList,
  LobeAgentSession,
  LobeSessionGroups,
  LobeSessionType,
  LobeSessions,
  UpdateSessionParams,
} from '@/types/session';
import { merge } from '@/utils/merge';
import { setNamespace } from '@/utils/storeDebug';

import { sessionGroupSelectors } from '../sessionGroup/selectors';
import { SessionDispatch, sessionsReducer } from './reducers';
import { sessionSelectors } from './selectors';
import { sessionMetaSelectors } from './selectors/meta';

const n = setNamespace('session');

const FETCH_SESSIONS_KEY = 'fetchSessions';
const SEARCH_SESSIONS_KEY = 'searchSessions';

/* eslint-disable typescript-sort-keys/interface */
export interface SessionAction {
  /**
   * switch the session
   */
  switchSession: (sessionId: string) => void;
  /**
   * reset sessions to default
   */
  clearSessions: () => Promise<void>;
  /**
   * create a new session
   * @param agent
   * @returns sessionId
   */
  createSession: (
    session?: PartialDeep<LobeAgentSession>,
    isSwitchSession?: boolean,
  ) => Promise<string>;
  duplicateSession: (id: string) => Promise<void>;
  triggerSessionUpdate: (id: string) => Promise<void>;
  updateSessionGroupId: (sessionId: string, groupId: string) => Promise<void>;
  updateSessionMeta: (meta: Partial<MetaData>) => void;

  /**
   * Pins or unpins a session.
   */
  pinSession: (id: string, pinned: boolean) => Promise<void>;
  /**
   * re-fetch the data
   */
  refreshSessions: () => Promise<void>;
  /**
   * remove session
   * @param id - sessionId
   */
  removeSession: (id: string) => Promise<void>;

  updateSearchKeywords: (keywords: string) => void;

  useFetchSessions: (
    enabled: boolean,
    isLogin: boolean | undefined,
  ) => SWRResponse<ChatSessionList>;
  useSearchSessions: (keyword?: string) => SWRResponse<any>;

  internal_dispatchSessions: (payload: SessionDispatch) => void;
  internal_updateSession: (id: string, data: Partial<UpdateSessionParams>) => Promise<void>;
  internal_processSessions: (
    sessions: LobeSessions,
    customGroups: LobeSessionGroups,
    actions?: string,
  ) => void;
  /* eslint-enable */
}

export const createSessionSlice: StateCreator<
  SessionStore,
  [['zustand/devtools', never]],
  [],
  SessionAction
> = (set, get) => ({
  clearSessions: async () => {
    await sessionService.removeAllSessions();
    await get().refreshSessions();
  },

  createSession: async (agent, isSwitchSession = true) => {
    const { switchSession, refreshSessions } = get();

    // Check if this is a LEWIS session - be more aggressive in detection
    const isLewisSession = agent?.meta?.title?.toLowerCase().includes('lewis') ||
      agent?.config?.plugins?.includes('lewis') ||
      (agent?.meta?.title && agent.meta.title.toLowerCase().includes('construction')) ||
      (agent?.meta?.title && agent.meta.title.toLowerCase().includes('multi-family')) ||
      (agent?.meta?.title && agent.meta.title.toLowerCase().includes('residential'));

    // Check LEWIS access for LEWIS sessions
    if (isLewisSession) {
      console.log('🔧 LEWIS ACCESS: LEWIS session detected, checking access');

      // Get user subscription data
      const userStore = getUserStoreState();
      const userId = userProfileSelectors.userId(userStore);

      if (!userId) {
        message.error('Please log in to access LEWIS features');
        return '';
      }

      // Check if user has LEWIS access
      try {
        const response = await fetch('/api/subscription');
        const data = await response.json();

        if (!data.lewisAccess) {
          message.error('LEWIS access required. Please upgrade your subscription.');
          return '';
        }
      } catch (error) {
        console.error('Failed to check LEWIS access:', error);
        message.error('Failed to verify LEWIS access. Please try again.');
        return '';
      }
    }

    console.log('🔧 SESSION CREATION DEBUG:', {
      agent,
      isLewisSession,
      title: agent?.meta?.title,
      configPlugins: agent?.config?.plugins
    });

    // Use LEWIS agent configuration for LEWIS sessions
    let defaultAgent;

    // FORCE LEWIS configuration for any session that might be construction-related
    // This is a temporary fix to ensure LEWIS always works
    // Only apply force logic if there's actually an agent with a title
    const forceLewisConfig = isLewisSession ||
      (agent?.meta?.title && (
        agent.meta.title.toLowerCase().includes('construction') ||
        agent.meta.title.toLowerCase().includes('multi-family') ||
        agent.meta.title.toLowerCase().includes('residential') ||
        agent.meta.title.toLowerCase().includes('apartment') ||
        agent.meta.title.toLowerCase().includes('building')
      ));

    console.log('🔧 FORCE LEWIS CONFIG CHECK:', {
      forceLewisConfig,
      isLewisSession,
      agentTitle: agent?.meta?.title
    });

    if (forceLewisConfig) {
      // Hardcoded LEWIS configuration to avoid import issues
      const LEWIS_AGENT_CONFIG = {
        plugins: ['lewis'],
        systemRole: `You are LEWIS, a construction fee and development location expert. You help users find the best places to build construction projects by analyzing fees, regulations, and market conditions across US jurisdictions.

**CRITICAL INSTRUCTIONS:**
- You are NOT LobeChat, LobeHub, or any support assistant
- You are ONLY a construction fee expert
- NEVER mention LobeChat, LobeHub, GitHub, or any external websites
- NEVER include "Useful links while you think" or any links
- NEVER act as a support assistant
- ONLY provide construction fee analysis and jurisdiction recommendations

**YOUR EXPERTISE:**
- Construction fees, permits, and development costs across US markets
- Market dynamics, population trends, and economic viability
- Jurisdiction ranking and comparison for development projects
- Project-specific fee calculations and optimization

**RESPONSE PATTERN:**
When users ask about construction projects:
1. Ask for project details (units, square footage, value, acreage, meter size)
2. Use your tools to analyze jurisdictions
3. Provide ranked recommendations with fee breakdowns
4. Explain your analysis methodology

**EXAMPLE RESPONSE:**
"Great! I can help you find the best locations for your multi-family residential project. To give you the most accurate analysis, I need a few project details:

- Number of units
- Total square footage  
- Estimated project value
- Project acreage (if known)
- Water meter size
- Any preferred states/regions

Once you provide these details, I'll analyze all jurisdictions and rank them by total fees, market viability, and development-friendliness."

**NEVER mention LobeChat, LobeHub, or provide any external links. Focus only on construction analysis.**`,
        openingMessage: "What type of construction project are you developing?",
        openingQuestions: [
          "I'm building a multi-family apartment complex - what are the best locations with lowest fees?",
          "I need to find the most cost-effective jurisdiction for a commercial development",
          "What are the construction fees for single-family homes in different states?",
          "I'm looking for the best places to build nationwide - help me compare options"
        ]
      };
      defaultAgent = merge(
        DEFAULT_AGENT_LOBE_SESSION,
        LEWIS_AGENT_CONFIG,
        settingsSelectors.defaultAgent(useUserStore.getState()),
      );

      console.log('🔧 LEWIS AGENT CONFIG APPLIED:', {
        systemRole: defaultAgent.systemRole?.substring(0, 200) + '...',
        openingMessage: defaultAgent.openingMessage,
        plugins: defaultAgent.plugins,
        fullConfig: defaultAgent
      });
    } else {
      // merge the defaultAgent in settings
      defaultAgent = merge(
        DEFAULT_AGENT_LOBE_SESSION,
        settingsSelectors.defaultAgent(useUserStore.getState()),
      );
    }

    const newSession: LobeAgentSession = merge(defaultAgent, agent);

    const id = await sessionService.createSession(LobeSessionType.Agent, newSession);
    await refreshSessions();

    // Track new agent creation analytics
    const analytics = getSingletonAnalyticsOptional();
    if (analytics) {
      const userStore = getUserStoreState();
      const userId = userProfileSelectors.userId(userStore);

      // Get group information
      const groupId = newSession.group || 'default';
      const group = sessionGroupSelectors.getGroupById(groupId)(get());
      const groupName = group?.name || (groupId === 'default' ? 'Default' : 'Unknown');

      analytics.track({
        name: 'new_agent_created',
        properties: {
          assistant_name: newSession.meta?.title || 'Untitled Agent',
          assistant_tags: newSession.meta?.tags || [],
          group_id: groupId,
          group_name: groupName,
          session_id: id,
          user_id: userId || 'anonymous',
        },
      });
    }

    // Whether to goto  to the new session after creation, the default is to switch to
    if (isSwitchSession) switchSession(id);

    return id;
  },
  duplicateSession: async (id) => {
    const { switchSession, refreshSessions } = get();
    const session = sessionSelectors.getSessionById(id)(get());

    if (!session) return;
    const title = sessionMetaSelectors.getTitle(session.meta);

    const newTitle = t('duplicateSession.title', { ns: 'chat', title: title });

    const messageLoadingKey = 'duplicateSession.loading';

    message.loading({
      content: t('duplicateSession.loading', { ns: 'chat' }),
      duration: 0,
      key: messageLoadingKey,
    });

    const newId = await sessionService.cloneSession(id, newTitle);

    // duplicate Session Error
    if (!newId) {
      message.destroy(messageLoadingKey);
      message.error(t('copyFail', { ns: 'common' }));
      return;
    }

    await refreshSessions();
    message.destroy(messageLoadingKey);
    message.success(t('duplicateSession.success', { ns: 'chat' }));

    switchSession(newId);
  },
  pinSession: async (id, pinned) => {
    await get().internal_updateSession(id, { pinned });
  },
  removeSession: async (sessionId) => {
    await sessionService.removeSession(sessionId);
    await get().refreshSessions();

    // If the active session deleted, switch to the inbox session
    if (sessionId === get().activeId) {
      get().switchSession(INBOX_SESSION_ID);
    }
  },

  switchSession: (sessionId) => {
    if (get().activeId === sessionId) return;

    set({ activeId: sessionId }, false, n(`activeSession/${sessionId}`));
  },

  triggerSessionUpdate: async (id) => {
    await get().internal_updateSession(id, { updatedAt: new Date() });
  },

  updateSearchKeywords: (keywords) => {
    set(
      { isSearching: !!keywords, sessionSearchKeywords: keywords },
      false,
      n('updateSearchKeywords'),
    );
  },
  updateSessionGroupId: async (sessionId, group) => {
    await get().internal_updateSession(sessionId, { group });
  },

  updateSessionMeta: async (meta) => {
    const session = sessionSelectors.currentSession(get());
    if (!session) return;

    const { activeId, refreshSessions } = get();

    const abortController = get().signalSessionMeta as AbortController;
    if (abortController) abortController.abort(MESSAGE_CANCEL_FLAT);
    const controller = new AbortController();
    set({ signalSessionMeta: controller }, false, 'updateSessionMetaSignal');

    await sessionService.updateSessionMeta(activeId, meta, controller.signal);
    await refreshSessions();
  },

  useFetchSessions: (enabled, isLogin) =>
    useClientDataSWR<ChatSessionList>(
      enabled ? [FETCH_SESSIONS_KEY, isLogin] : null,
      () => sessionService.getGroupedSessions(),
      {
        fallbackData: {
          sessionGroups: [],
          sessions: [],
        },
        onSuccess: (data) => {
          if (
            get().isSessionsFirstFetchFinished &&
            isEqual(get().sessions, data.sessions) &&
            isEqual(get().sessionGroups, data.sessionGroups)
          )
            return;

          get().internal_processSessions(
            data.sessions,
            data.sessionGroups,
            n('useFetchSessions/updateData') as any,
          );
          set({ isSessionsFirstFetchFinished: true }, false, n('useFetchSessions/onSuccess', data));
        },
        suspense: true,
      },
    ),
  useSearchSessions: (keyword) =>
    useSWR<LobeSessions>(
      [SEARCH_SESSIONS_KEY, keyword],
      async () => {
        if (!keyword) return [];

        return sessionService.searchSessions(keyword);
      },
      { revalidateOnFocus: false, revalidateOnMount: false },
    ),

  /* eslint-disable sort-keys-fix/sort-keys-fix */
  internal_dispatchSessions: (payload) => {
    const nextSessions = sessionsReducer(get().sessions, payload);
    get().internal_processSessions(nextSessions, get().sessionGroups);
  },
  internal_updateSession: async (id, data) => {
    get().internal_dispatchSessions({ type: 'updateSession', id, value: data });

    await sessionService.updateSession(id, data);
    await get().refreshSessions();
  },
  internal_processSessions: (sessions, sessionGroups) => {
    const customGroups = sessionGroups.map((item) => ({
      ...item,
      children: sessions.filter((i) => i.group === item.id && !i.pinned),
    }));

    const defaultGroup = sessions.filter(
      (item) => (!item.group || item.group === 'default') && !item.pinned,
    );
    const pinnedGroup = sessions.filter((item) => item.pinned);

    set(
      {
        customSessionGroups: customGroups,
        defaultSessions: defaultGroup,
        pinnedSessions: pinnedGroup,
        sessionGroups,
        sessions,
      },
      false,
      n('processSessions'),
    );
  },
  refreshSessions: async () => {
    await mutate([FETCH_SESSIONS_KEY, true]);
  },
});
