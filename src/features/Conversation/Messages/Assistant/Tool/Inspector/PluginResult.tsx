import { Highlighter } from '@lobehub/ui';
import { memo, useMemo } from 'react';

import { useChatStore } from '@/store/chat';
import { chatSelectors } from '@/store/chat/selectors';

export interface FunctionMessageProps {
  toolCallId: string;
  variant?: 'filled' | 'outlined' | 'borderless';
}

const PluginResult = memo<FunctionMessageProps>(({ toolCallId, variant }) => {
  const toolMessage = useChatStore(chatSelectors.getMessageByToolCallId(toolCallId));

  const { data, language } = useMemo(() => {
    try {
      // Check if content is already a valid JSON string
      if (!toolMessage?.content) {
        return { data: '', language: 'plaintext' };
      }

      // Try to parse the content
      const parsed = JSON.parse(toolMessage.content);

      // If parsing succeeds and it's an object with expected structure, format it nicely
      if (typeof parsed === 'object' && parsed !== null && (parsed.success !== undefined || parsed.data !== undefined)) {
        return { data: JSON.stringify(parsed, null, 2), language: 'json' };
      }

      // If it's a string, return it as plaintext
      if (typeof parsed === 'string') {
        return { data: parsed, language: 'plaintext' };
      }

      // For other types, stringify them
      return { data: JSON.stringify(parsed, null, 2), language: 'json' };
    } catch {
      // If parsing fails, treat content as plaintext
      return { data: toolMessage?.content || '', language: 'plaintext' };
    }
  }, [toolMessage?.content]);

  return (
    <Highlighter
      language={language}
      style={{ maxHeight: 200, overflow: 'scroll', width: '100%' }}
      variant={variant}
    >
      {data}
    </Highlighter>
  );
});

export default PluginResult;
