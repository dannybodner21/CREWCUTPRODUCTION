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
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';
import { useSessionStore } from '@/store/session';
import { sessionMetaSelectors } from '@/store/session/selectors';

import OpeningQuestions from './OpeningQuestions';

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
  const isLewisSession = meta?.title?.toLowerCase().includes('lewis');
  const togglePortal = useChatStore((s) => s.togglePortal);

  // Debug logging
  console.log('🔧 WELCOME MESSAGE DEBUG:', {
    meta,
    title: meta?.title,
    isLewisSession,
    showButton: isLewisSession,
    activeId,
    currentSession: useSessionStore.getState().currentSession
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
    return !!meta.description ? agentSystemRoleMsg : agentMsg;
  }, [openingMessage, agentSystemRoleMsg, agentMsg, meta.description]);

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
    <Flexbox>
      {chatItem}
      {openingQuestions.length > 0 && (
        <OpeningQuestions mobile={mobile} questions={openingQuestions} />
      )}

      {/* Lewis Construction Portal Button */}
      {isLewisSession && (
        <Flexbox align="center" justify="center" style={{ marginTop: 16 }}>
          <Button
            icon={<Building size={16} />}
            onClick={() => togglePortal(true)}
            size="large"
            style={{
              height: 48,
              fontSize: 16,
              paddingInline: 24,
              borderRadius: 8,
            }}
            type="primary"
          >
            🏗️ Open Construction Portal
          </Button>
        </Flexbox>
      )}
    </Flexbox>
  );
};
export default WelcomeMessage;
