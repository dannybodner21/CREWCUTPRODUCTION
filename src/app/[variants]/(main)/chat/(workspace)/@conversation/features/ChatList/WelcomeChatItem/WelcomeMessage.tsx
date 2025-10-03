import isEqual from 'fast-deep-equal';
import qs from 'query-string';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';
import { Button } from 'antd';
import { Building } from 'lucide-react';

import ChatItem from '@/features/ChatItem';
import { useAgentStore } from '@/store/agent';
import { agentChatConfigSelectors, agentSelectors } from '@/store/agent/selectors';
import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/slices/portal/selectors';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';
import { sessionMetaSelectors, sessionSelectors } from '@/store/session/selectors';

import OpeningQuestions from './OpeningQuestions';
import LewisOpeningQuestions from '@/components/LewisOpeningQuestions';
import LewisPortalButton from '@/components/LewisPortalButton';

const WelcomeMessage = () => {
  const mobile = useServerConfigStore((s) => s.isMobile);
  const { t } = useTranslation('chat');
  const type = useAgentStore(agentChatConfigSelectors.displayMode);
  const openingMessage = useAgentStore(agentSelectors.openingMessage);
  const openingQuestions = useAgentStore(agentSelectors.openingQuestions);

  const meta = useSessionStore(sessionMetaSelectors.currentAgentMeta, isEqual);
  const { isAgentEditable } = useServerConfigStore(featureFlagsSelectors);
  const activeId = useChatStore((s) => s.activeId);

  // Check if this is a Lewis session
  const currentSession = useSessionStore(sessionSelectors.currentSession);
  const isLewisSession = currentSession?.config?.plugins?.includes('lewis') ||
    meta?.title?.toLowerCase().includes('lewis') ||
    meta?.title?.toLowerCase().includes('lewis construction');
  const togglePortal = useChatStore((s) => s.togglePortal);
  const showPortal = useChatStore(chatPortalSelectors.showPortal);

  // Debug logging
  console.log('🔧 WELCOME MESSAGE DEBUG:', {
    meta,
    title: meta?.title,
    isLewisSession,
    showButton: isLewisSession,
    activeId,
    showPortal,
    currentSession: useSessionStore.getState().sessions[useSessionStore.getState().activeId] || null,
    plugins: useSessionStore.getState().sessions[useSessionStore.getState().activeId]?.config?.plugins
  });

  const agentSystemRoleMsg = t('agentDefaultMessageWithSystemRole', {
    name: meta.title || t('defaultAgent'),
    systemRole: meta.description,
  });

  const agentMsg = t(isAgentEditable ? 'agentDefaultMessage' : 'agentDefaultMessageWithoutEdit', {
    name: meta.title || t('defaultAgent'),
    url: qs.stringifyUrl({
      query: mobile ? { session: activeId, showMobileWorkspace: mobile } : { session: activeId },
      url: '/chat/settings',
    }),
  });

  const message = useMemo(() => {
    if (openingMessage) return openingMessage;

    // For Lewis sessions, show a custom opening message
    if (isLewisSession) {
      return "What type of construction project are you developing?";
    }

    return !!meta.description ? agentSystemRoleMsg : agentMsg;
  }, [openingMessage, agentSystemRoleMsg, agentMsg, meta.description, isLewisSession]);

  const chatItem = (
    <ChatItem
      avatar={meta}
      editing={false}
      message={message}
      placement={'left'}
      variant={type === 'chat' ? 'bubble' : 'docs'}
    />
  );

  return (
    <>
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: -200% -200%;
          }
          100% {
            background-position: 200% 200%;
          }
        }
      `}</style>
      <Flexbox>
        {chatItem}


        {/* Always show Lewis components for debugging */}
        <LewisOpeningQuestions />
        <LewisPortalButton />

        {!isLewisSession && openingQuestions.length > 0 && (
          <OpeningQuestions mobile={mobile} questions={openingQuestions} />
        )}

      </Flexbox>
    </>
  );
};
export default WelcomeMessage;
