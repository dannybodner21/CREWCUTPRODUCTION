'use client';

import { Button } from 'antd';
import { Building } from 'lucide-react';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/slices/portal/selectors';
import { ChatMessage } from '@/types/message';

export const AssistantBelowMessage = memo<ChatMessage>(({ content }) => {
    const togglePortal = useChatStore((s) => s.togglePortal);
    const showPortal = useChatStore(chatPortalSelectors.showPortal);

    // Check if this is Lewis's portal update message
    const isLewisPortalMessage =
        typeof content === 'string' &&
        content.includes('Great! I\'ve updated the Construction Fee Portal with your project details') &&
        content.includes('Check the portal on the right to see the fee calculations');

    if (!isLewisPortalMessage) {
        return null;
    }

    return (
        <Flexbox align="center" justify="center" style={{ marginTop: 16 }}>
            <hr style={{
                width: '50%',
                border: 'none',
                borderTop: '1px solid rgba(0, 0, 0, 0.5)',
                margin: '20px 0'
            }} />
        </Flexbox>
    );
});

AssistantBelowMessage.displayName = 'AssistantBelowMessage';
