import { Icon } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { ReactNode, memo } from 'react';
import { Flexbox } from 'react-layout-kit';
import { CircuitBoard } from 'lucide-react';

import Loader from '@/components/CircleLoader';
import { useChatStore } from '@/store/chat';
import { chatSelectors } from '@/store/chat/selectors';
import { useToolStore } from '@/store/tool';
import { toolSelectors } from '@/store/tool/selectors';
import { shinyTextStylish } from '@/styles/loading';

export const useStyles = createStyles(({ css, token }) => ({
  apiName: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;

    font-family: ${token.fontFamilyCode};
    font-size: 12px;
    text-overflow: ellipsis;
  `,

  shinyText: shinyTextStylish(token),

  clickableTitle: css`
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      background: ${token.colorFillTertiary};
    }
  `,
}));

interface BuiltinPluginTitleProps {
  apiName: string;
  icon?: ReactNode;
  identifier: string;
  index: number;
  messageId: string;
  title: string;
  toolCallId: string;
}

const BuiltinPluginTitle = memo<BuiltinPluginTitleProps>(
  ({ messageId, index, apiName, icon, title, identifier }) => {
    const { styles } = useStyles();

    const isLoading = useChatStore(chatSelectors.isInToolsCalling(messageId, index));
    const isToolHasUI = useToolStore(toolSelectors.isToolHasUI(identifier));
    const openToolUI = useChatStore((s) => s.openToolUI);

    const handleTitleClick = () => {
      if (isToolHasUI && identifier) {
        openToolUI(messageId, identifier);
      }
    };

    const titleContent = (
      <Flexbox align={'center'} className={isLoading ? styles.shinyText : ''} gap={4} horizontal>
        {isLoading ? <Loader /> : icon}
        <Flexbox align={'baseline'} gap={4} horizontal>
          <div>{title}</div>/<span className={styles.apiName}>{apiName}</span>
          {isToolHasUI && !isLoading && (
            <Icon icon={CircuitBoard} size={12} style={{ marginLeft: 4, opacity: 0.6 }} />
          )}
        </Flexbox>
      </Flexbox>
    );

    // If the tool has a portal UI, make it clickable
    if (isToolHasUI && !isLoading) {
      return (
        <div className={styles.clickableTitle} onClick={handleTitleClick} title="Click to open portal">
          {titleContent}
        </div>
      );
    }

    return titleContent;
  },
);

export default BuiltinPluginTitle;
