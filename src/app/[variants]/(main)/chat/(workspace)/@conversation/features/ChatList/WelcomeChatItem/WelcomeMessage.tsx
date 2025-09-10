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
import { sessionMetaSelectors } from '@/store/session/selectors';

import OpeningQuestions from './OpeningQuestions';
import LewisOpeningQuestions from '@/components/LewisOpeningQuestions';

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
  const showPortal = useChatStore(chatPortalSelectors.showPortal);

  // Debug logging
  console.log('🔧 WELCOME MESSAGE DEBUG:', {
    meta,
    title: meta?.title,
    isLewisSession,
    showButton: isLewisSession,
    activeId,
    showPortal,
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
        {isLewisSession ? (
          <LewisOpeningQuestions />
        ) : (
          openingQuestions.length > 0 && (
            <OpeningQuestions mobile={mobile} questions={openingQuestions} />
          )
        )}

        {/* Lewis Construction Portal Button */}
        {isLewisSession && (
          <Flexbox align="center" justify="center" style={{ marginTop: 40 }}>
            <Button
              icon={<Building size={16} />}
              onClick={() => togglePortal()}
              size="large"
              style={{
                height: 48,
                fontSize: 16,
                paddingInline: 24,
                borderRadius: 8,
                backgroundColor: '#ffffff',
                borderColor: '#6b7280',
                borderWidth: '1px',
                color: '#000000',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 25%, #ffffff 50%, #f1f5f9 75%, #ffffff 100%)',
                backgroundSize: '200% 200%',
                animation: 'shimmer 3s ease-in-out infinite',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                position: 'relative',
                overflow: 'hidden',
              }}
              type="default"
            >
              {showPortal ? 'Close Portal' : 'Open Portal'}
            </Button>
          </Flexbox>
        )}
      </Flexbox>
    </>
  );
};
export default WelcomeMessage;
