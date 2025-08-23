import { ActionIcon, Icon, Text } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { LogsIcon, LucideBug, LucideBugOff, LayoutPanelTop, CircuitBoard } from 'lucide-react';
import { memo, useState, CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { useToolStore } from '@/store/tool';
import { toolSelectors } from '@/store/tool/selectors';

import Debug from './Debug';
import Settings from './Settings';
import ToolTitle from './ToolTitle';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    width: fit-content;
    padding-block: 2px;
    border-radius: 6px;

    color: ${token.colorTextTertiary};

    &:hover {
      background: ${token.colorFillTertiary};
    }
  `,
  tool: css`
    cursor: pointer;
    padding-block: 2px;
    border-radius: 6px;

    &:hover {
      background: ${token.colorFillTertiary};
    }
  `,
  portalButton: css`
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    color: ${token.colorPrimary};

    &:hover {
      background: ${token.colorFillTertiary};
    }
  `,
  actions: css`
    gap: 4px;
  `,
}));

interface InspectorProps {
  apiName: string;
  arguments?: string;
  hidePluginUI?: boolean;
  id: string;
  identifier: string;
  index: number;
  messageId: string;
  payload: object;
  setShowPluginRender: (show: boolean) => void;
  setShowRender: (show: boolean) => void;
  showPluginRender: boolean;
  showPortal?: boolean;
  showRender: boolean;
  style?: CSSProperties;
}

const Inspectors = memo<InspectorProps>(
  ({
    messageId,
    index,
    identifier,
    apiName,
    id,
    arguments: requestArgs,
    showRender,
    payload,
    setShowRender,
    showPluginRender,
    setShowPluginRender,
    hidePluginUI = false,
  }) => {
    const { t } = useTranslation('plugin');
    const { styles } = useStyles();
    const [showDebug, setShowDebug] = useState(false);

    // Check if this tool has a portal UI
    const isToolHasUI = useToolStore(toolSelectors.isToolHasUI(identifier));
    const openToolUI = useChatStore((s) => s.openToolUI);

    const handleOpenPortal = () => {
      if (isToolHasUI && identifier) {
        // Use the assistant message ID (messageId) not the tool call ID (id)
        // This matches how the portal home page works
        openToolUI(messageId, identifier);
      }
    };

    return (
      <Flexbox className={styles.container} gap={4}>
        <Flexbox align={'center'} distribution={'space-between'} gap={8} horizontal>
          <Flexbox
            align={'center'}
            className={styles.tool}
            gap={8}
            horizontal
            onClick={() => {
              setShowRender(!showRender);
            }}
            paddingInline={4}
          >
            <ToolTitle
              apiName={apiName}
              identifier={identifier}
              index={index}
              messageId={messageId}
              toolCallId={id}
            />
          </Flexbox>
          <Flexbox className={styles.actions} horizontal>
            {/* Portal Button - only show for tools that have a portal UI */}
            {isToolHasUI && (
              <ActionIcon
                icon={CircuitBoard}
                onClick={handleOpenPortal}
                size={'small'}
                title="Open Portal"
                className={styles.portalButton}
              />
            )}
            {showRender && !hidePluginUI && (
              <ActionIcon
                icon={showPluginRender ? LogsIcon : LayoutPanelTop}
                onClick={() => {
                  setShowPluginRender(!showPluginRender);
                }}
                size={'small'}
                title={showPluginRender ? t('inspector.args') : t('inspector.pluginRender')}
              />
            )}
            <ActionIcon
              icon={showDebug ? LucideBugOff : LucideBug}
              onClick={() => {
                setShowDebug(!showDebug);
              }}
              size={'small'}
              title={t(showDebug ? 'debug.off' : 'debug.on')}
            />
            <Settings id={identifier} />
          </Flexbox>
        </Flexbox>
        {showDebug && <Debug payload={payload} requestArgs={requestArgs} toolCallId={id} />}
      </Flexbox>
    );
  },
);

export default Inspectors;
