import isEqual from 'fast-deep-equal';
import { memo } from 'react';

import PluginRender from '@/features/PluginsUI/Render';
import { useChatStore } from '@/store/chat';
import { chatPortalSelectors, chatSelectors } from '@/store/chat/selectors';
import { BuiltinToolsPortals } from '@/tools/portals';
import { safeParseJSON } from '@/utils/safeParseJSON';

const ToolRender = memo(() => {
  const messageId = useChatStore(chatPortalSelectors.toolMessageId);
  const identifier = useChatStore(chatPortalSelectors.toolUIIdentifier);
  const message = useChatStore(chatSelectors.getMessageById(messageId || ''), isEqual);

  // make sure the message and id is valid
  if (!messageId || !message) return;

  // Check if this is a builtin tool (has identifier but message might not have plugin structure)
  if (identifier && BuiltinToolsPortals[identifier]) {
    const Render = BuiltinToolsPortals[identifier];

    // Get the tool response data from the message content
    const toolResponse = message.content;

    return (
      <Render
        apiName={identifier}
        arguments={message.plugin?.arguments ? safeParseJSON(message.plugin.arguments) : {}}
        identifier={identifier}
        messageId={messageId}
        state={toolResponse}  // ← FIX: Pass the actual tool response!
      />
    );
  }

  const { plugin, pluginState } = message;

  // make sure the plugin and identifier is valid
  if (!plugin || !plugin.identifier) return;

  const args = safeParseJSON(plugin.arguments);

  if (!args) return;

  const Render = BuiltinToolsPortals[plugin.identifier];

  if (!Render)
    return (
      <PluginRender
        arguments={plugin.arguments}
        content={message.content}
        id={messageId}
        identifier={plugin.identifier}
        payload={plugin}
        pluginState={pluginState}
        type={plugin?.type}
      />
    );

  return (
    <Render
      apiName={plugin.apiName}
      arguments={args}
      identifier={plugin.identifier}
      messageId={messageId}
      state={pluginState}
    />
  );
});

export default ToolRender;
