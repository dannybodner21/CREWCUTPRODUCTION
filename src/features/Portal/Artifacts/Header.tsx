import { ArtifactType } from '@lobechat/types';
import { ActionIcon, Button, Icon, Segmented, Text } from '@lobehub/ui';
import { ConfigProvider, message } from 'antd';
import { cx } from 'antd-style';
import { ArrowLeft, CodeIcon, EyeIcon, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { useChatStore } from '@/store/chat';
import { chatPortalSelectors } from '@/store/chat/selectors';
import { ArtifactDisplayMode } from '@/store/chat/slices/portal/initialState';
import { oneLineEllipsis } from '@/styles';
import { artifactService } from '@/services/artifact';
import { useGlobalStore } from '@/store/global';
import { systemStatusSelectors } from '@/store/global/selectors';

const Header = () => {
  const { t } = useTranslation('portal');

  const [displayMode, artifactType, artifactTitle, isArtifactTagClosed, closeArtifact] =
    useChatStore((s) => {
      const messageId = chatPortalSelectors.artifactMessageId(s) || '';

      return [
        s.portalArtifactDisplayMode,
        chatPortalSelectors.artifactType(s),
        chatPortalSelectors.artifactTitle(s),
        chatPortalSelectors.isArtifactTagClosed(messageId)(s),
        s.closeArtifact,
      ];
    });

  // Check if database is ready (works for both server and client modes)
  const isDatabaseReady = useGlobalStore(systemStatusSelectors.isDBInited);

  // show switch only when artifact is closed and the type is not code
  const showSwitch = isArtifactTagClosed && artifactType !== ArtifactType.Code;

  const handleSaveArtifact = async () => {
    // Check if database is ready (works for both server and client modes)
    if (!isDatabaseReady) {
      message.error('Database is not ready. Please try again.');
      return;
    }

    const messageId = chatPortalSelectors.artifactMessageId(useChatStore.getState()) || '';
    const artifactContent = chatPortalSelectors.artifactCode(messageId)(useChatStore.getState());
    const artifactCodeLanguage = chatPortalSelectors.artifactCodeLanguage(useChatStore.getState());

    if (!messageId || !artifactContent || !artifactType) {
      return;
    }

    // Determine the artifact type for database storage
    let dbType = 'unknown';
    let language = artifactCodeLanguage;

    switch (artifactType) {
      case ArtifactType.React: {
        dbType = 'react';
        language = 'tsx';
        break;
      }
      case ArtifactType.Code: {
        dbType = 'code';
        break;
      }
      case ArtifactType.Python: {
        dbType = 'python';
        language = 'python';
        break;
      }
      case 'image/svg+xml': {
        dbType = 'svg';
        language = 'svg';
        break;
      }
      case 'text/html': {
        dbType = 'html';
        language = 'html';
        break;
      }
      case 'text/markdown': {
        dbType = 'markdown';
        language = 'markdown';
        break;
      }
      case 'application/lobe.artifacts.mermaid': {
        dbType = 'mermaid';
        language = 'mermaid';
        break;
      }
      default: {
        // Handle the actual enum values
        switch (artifactType) {
        case 'application/lobe.artifacts.react': {
          dbType = 'react';
          language = 'tsx';
        
        break;
        }
        case 'application/lobe.artifacts.code': {
          dbType = 'code';
        
        break;
        }
        case 'python': {
          dbType = 'python';
          language = 'python';
        
        break;
        }
        default: {
          dbType = 'unknown';
        }
        }
      }
    }

    await artifactService.saveArtifact({
      messageId,
      type: dbType,
      content: artifactContent,
      title: artifactTitle || 'Untitled Artifact',
      language,
      metadata: {
        originalType: artifactType,
        displayMode,
        isArtifactTagClosed,
      },
    });
  };

  return (
    <Flexbox align={'center'} flex={1} gap={12} horizontal justify={'space-between'} width={'100%'}>
      <Flexbox align={'center'} gap={4} horizontal>
        <ActionIcon icon={ArrowLeft} onClick={() => closeArtifact()} size={'small'} />
        <Text className={cx(oneLineEllipsis)} type={'secondary'}>
          {artifactTitle}
        </Text>
      </Flexbox>
      <Flexbox align={'center'} gap={8} horizontal>
        {/* Save Button */}
        <Button
          disabled={!isDatabaseReady}
          icon={<Save size={16} />}
          onClick={handleSaveArtifact}
          size={'small'}
          type={'primary'}
        >
          Save
        </Button>

        {/* Preview/Code Toggle */}
        <ConfigProvider
          theme={{
            token: {
              borderRadiusSM: 16,
              borderRadiusXS: 16,
              fontSize: 12,
            },
          }}
        >
          {showSwitch && (
            <Segmented
              onChange={(value) => {
                useChatStore.setState({ portalArtifactDisplayMode: value as ArtifactDisplayMode });
              }}
              options={[
                {
                  icon: <Icon icon={EyeIcon} />,
                  label: t('artifacts.display.preview'),
                  value: ArtifactDisplayMode.Preview,
                },
                {
                  icon: <Icon icon={CodeIcon} />,
                  label: t('artifacts.display.code'),
                  value: ArtifactDisplayMode.Code,
                },
              ]}
              size={'small'}
              value={displayMode}
            />
          )}
        </ConfigProvider>
      </Flexbox>
    </Flexbox>
  );
};

export default Header;
