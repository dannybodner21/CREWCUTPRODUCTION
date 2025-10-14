'use client';

import { Button } from 'antd';
import { useChatStore } from '@/store/chat';
import { useSessionStore } from '@/store/session';
import { sessionSelectors } from '@/store/session/selectors';
import { useTheme } from 'antd-style';

const ConstructionPortalSection = () => {
    const togglePortal = useChatStore((s) => s.togglePortal);
    const showPortal = useChatStore((s) => s.showPortal);
    const theme = useTheme();
    const currentSession = useSessionStore(sessionSelectors.currentSession);
    const activeId = useSessionStore((s) => s.activeId);

    // Show for LEWIS sessions OR inbox
    const isLewisSession = currentSession?.config?.plugins?.includes('lewis') ||
        currentSession?.meta?.title?.toLowerCase().includes('lewis');

    const isInbox = activeId === 'inbox';

    if (!isLewisSession && !isInbox) {
        return null;
    }

    return (
        <div
            style={{
                width: '100%',
                height: '150px',
                backgroundColor: '#fbfbfb',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Button
                type="default"
                size="large"
                onClick={() => togglePortal()}
                style={{
                    height: '48px',
                    padding: '0 24px',
                    fontSize: '16px',
                    fontWeight: '600',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    borderColor: '#c0c0c0',
                    borderWidth: '1px',
                }}
            >
                {showPortal ? 'Close Construction Portal' : 'Open Construction Portal'}
            </Button>
        </div>
    );
};

export default ConstructionPortalSection;
