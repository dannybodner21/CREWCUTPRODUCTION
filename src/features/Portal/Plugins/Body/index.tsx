import isEqual from 'fast-deep-equal';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors, chatSelectors } from '@/store/chat/selectors';
import { safeParseJSON } from '@/utils/safeParseJSON';

import ToolRender from './ToolRender';

const ToolUI = () => {
  const messageId = useChatStore(chatPortalSelectors.toolMessageId);
  const identifier = useChatStore(chatPortalSelectors.toolUIIdentifier);
  const message = useChatStore(chatSelectors.getMessageById(messageId || ''), isEqual);

  console.log('🔧 PORTAL BODY DEBUG: ToolUI rendered with:', {
    messageId,
    identifier,
    hasMessage: !!message,
    messagePlugin: message?.plugin,
    messageContent: message?.content
  });

  // For builtin tools (like LEWIS), we have the identifier directly
  if (identifier) {
    console.log('🔧 PORTAL BODY DEBUG: Builtin tool detected, rendering ToolRender');
    return (
      <Flexbox flex={1} height={'100%'} paddingInline={12} style={{ overflow: 'auto' }}>
        <ToolRender />
      </Flexbox>
    );
  }

  // For regular plugins, check message and plugin structure
  if (!messageId || !message) {
    console.log('🔧 PORTAL BODY DEBUG: No message or messageId, returning early');
    return;
  }

  const { plugin } = message;
  if (!plugin || !plugin.identifier) {
    console.log('🔧 PORTAL BODY DEBUG: No plugin or identifier, returning early');
    return;
  }

  const args = safeParseJSON(plugin.arguments);
  console.log('🔧 PORTAL BODY DEBUG: Plugin args:', args);

  if (!args) {
    console.log('🔧 PORTAL BODY DEBUG: No args, returning early');
    return;
  }

  console.log('🔧 PORTAL BODY DEBUG: Rendering ToolRender component for plugin');
  return (
    <Flexbox flex={1} height={'100%'} paddingInline={12} style={{ overflow: 'auto' }}>
      <ToolRender />
    </Flexbox>
  );
};

export default ToolUI;
