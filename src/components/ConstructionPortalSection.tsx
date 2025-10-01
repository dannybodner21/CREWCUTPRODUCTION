'use client';

import { Button } from 'antd';
import { useChatStore } from '@/store/chat';
import { useTheme } from 'antd-style';

const ConstructionPortalSection = () => {
    const togglePortal = useChatStore((s) => s.togglePortal);
    const showPortal = useChatStore((s) => s.showPortal);
    const theme = useTheme();

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
