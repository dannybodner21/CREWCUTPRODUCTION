'use client';

import { Button } from 'antd';
import { Building } from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/slices/portal/selectors';
import { useSessionStore } from '@/store/session';
import { sessionMetaSelectors, sessionSelectors } from '@/store/session/selectors';

const LewisPortalButton = memo(() => {
    const currentSession = useSessionStore(sessionSelectors.currentSession);
    const currentAgent = useChatStore((s) => s.currentAgent);
    const title = useSessionStore(sessionMetaSelectors.currentAgentTitle);

    // Use the same detection logic as useLewisPortalAutoOpen
    const isLewisSession = currentSession?.agentId === 'lewis' ||
        currentAgent?.identifier === 'lewis' ||
        currentSession?.meta?.title?.toLowerCase().includes('lewis');

    const togglePortal = useChatStore((s) => s.togglePortal);
    const showPortal = useChatStore(chatPortalSelectors.showPortal);

    // Debug logging
    console.log('🔧 LewisPortalButton DEBUG:', {
        currentSession,
        currentAgent,
        title,
        isLewisSession,
        showPortal,
        agentId: currentSession?.agentId,
        identifier: currentAgent?.identifier
    });

    // TEMPORARY: Force show button for debugging
    const forceShow = true;

    if (!isLewisSession && !forceShow) {
        console.log('🔧 LewisPortalButton: Not a Lewis session, returning null');
        return null;
    }

    return (
        <Flexbox
            align="center"
            justify="center"
            style={{
                padding: '16px 0',
                marginTop: '20px',
                marginBottom: '20px',
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: '#fafafa'
            }}
        >
            <Button
                icon={<Building size={20} style={{ color: '#000000' }} />}
                onClick={() => togglePortal()}
                size="large"
                style={{
                    height: 56,
                    fontSize: 14,
                    paddingInline: 32,
                    borderRadius: 12,
                    backgroundColor: '#ffffff',
                    borderColor: '#d9d9d9',
                    color: '#000000',
                    fontWeight: 400,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
                type="default"
            >
                {showPortal ? 'Close Construction Portal' : 'Open Construction Portal'}
            </Button>
        </Flexbox>
    );
});

LewisPortalButton.displayName = 'LewisPortalButton';

export default LewisPortalButton;
