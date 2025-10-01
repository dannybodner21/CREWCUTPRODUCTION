'use client';

import { Button } from 'antd';
import { Building } from 'lucide-react';
import { useChatStore } from '@/store/chat';

const SimpleConstructionButton = () => {
    const togglePortal = useChatStore((s) => s.togglePortal);

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '10px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            border: '1px solid #d9d9d9'
        }}>
            <Button
                type="primary"
                size="large"
                icon={<Building size={16} />}
                onClick={() => togglePortal()}
                style={{
                    backgroundColor: '#1890ff',
                    borderColor: '#1890ff',
                    fontSize: '16px',
                    padding: '12px 24px',
                    height: 'auto'
                }}
            >
                🏗️ Open Construction Portal
            </Button>
        </div>
    );
};

export default SimpleConstructionButton;
