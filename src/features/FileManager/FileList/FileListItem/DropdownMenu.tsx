import { ActionIcon, Dropdown, Icon, copyToClipboard } from '@lobehub/ui';
import { App } from 'antd';
import { ItemType } from 'antd/es/menu/interface';
import {
  BookMinusIcon,
  BookPlusIcon,
  DownloadIcon,
  EditIcon,
  LinkIcon,
  MoreHorizontalIcon,
  Trash,
} from 'lucide-react';
import { memo, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import DocumentEditor from '@/components/DocumentEditor';
import { useAddFilesToKnowledgeBaseModal } from '@/features/KnowledgeBaseModal';
import { lambdaClient } from '@/libs/trpc/client';
import { useFileStore } from '@/store/file';
import { useKnowledgeBaseStore } from '@/store/knowledgeBase';
import { downloadFile } from '@/utils/client/downloadFile';

interface DropdownMenuProps {
  filename: string;
  id: string;
  knowledgeBaseId?: string;
  url: string;
  fileType?: string;
}

const DropdownMenu = memo<DropdownMenuProps>(({ id, knowledgeBaseId, url, filename, fileType }) => {
  const { t } = useTranslation(['components', 'common']);
  const { message, modal } = App.useApp();

  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');

  const [removeFile, updateDocument] = useFileStore((s) => [s.removeFileItem, s.updateDocument]);
  const [removeFilesFromKnowledgeBase] = useKnowledgeBaseStore((s) => [
    s.removeFilesFromKnowledgeBase,
  ]);

  const inKnowledgeBase = !!knowledgeBaseId;
  const { open } = useAddFilesToKnowledgeBaseModal();

  const isMarkdownFile = fileType === 'text/markdown' || filename.toLowerCase().endsWith('.md');

  const handleEditDocument = async () => {
    try {
      // Use the tRPC client to get content with proper encoding
      const result = await lambdaClient.file.getFileContent.query({ id });
      
      setDocumentContent(result.content);
      setDocumentTitle(result.name);
      setShowDocumentEditor(true);
    } catch (error) {
      console.error('Failed to fetch document content:', error);
      message.error('Failed to load document for editing');
    }
  };

  const handleUpdateDocument = async (fileId: string, name: string, content: string) => {
    try {
      await updateDocument(fileId, name, content);
      message.success('Document updated successfully');
      setShowDocumentEditor(false);
    } catch (error) {
      console.error('Failed to update document:', error);
      message.error('Failed to update document');
    }
  };

  const items = useMemo(() => {
    const knowledgeBaseActions = (
      inKnowledgeBase
        ? [
          {
            icon: <Icon icon={BookPlusIcon} />,
            key: 'addToOtherKnowledgeBase',
            label: t('FileManager.actions.addToOtherKnowledgeBase'),
            onClick: async ({ domEvent }) => {
              domEvent.stopPropagation();

              open({ fileIds: [id], knowledgeBaseId });
            },
          },
          {
            icon: <Icon icon={BookMinusIcon} />,
            key: 'removeFromKnowledgeBase',
            label: t('FileManager.actions.removeFromKnowledgeBase'),
            onClick: async ({ domEvent }) => {
              domEvent.stopPropagation();

              modal.confirm({
                okButtonProps: {
                  danger: true,
                },
                onOk: async () => {
                  await removeFilesFromKnowledgeBase(knowledgeBaseId, [id]);

                  message.success(t('FileManager.actions.removeFromKnowledgeBaseSuccess'));
                },
                title: t('FileManager.actions.confirmRemoveFromKnowledgeBase', {
                  count: 1,
                }),
              });
            },
          },
        ]
        : [
          {
            icon: <Icon icon={BookPlusIcon} />,
            key: 'addToKnowledgeBase',
            label: t('FileManager.actions.addToKnowledgeBase'),
            onClick: async ({ domEvent }) => {
              domEvent.stopPropagation();
              open({ fileIds: [id] });
            },
          },
        ]
    ) as ItemType[];

    const editAction = isMarkdownFile
      ? [
          {
            icon: <Icon icon={EditIcon} />,
            key: 'edit',
            label: t('FileManager.actions.editDocument', 'Edit Document'),
            onClick: async ({ domEvent }: { domEvent: React.MouseEvent }) => {
              domEvent.stopPropagation();
              await handleEditDocument();
            },
          },
          {
            type: 'divider',
          },
        ]
      : [];

    return (
      [
        ...knowledgeBaseActions,
        ...editAction,
        {
          type: 'divider',
        },
        {
          icon: <Icon icon={LinkIcon} />,
          key: 'copyUrl',
          label: t('FileManager.actions.copyUrl'),
          onClick: async ({ domEvent }) => {
            domEvent.stopPropagation();
            await copyToClipboard(url);
            message.success(t('FileManager.actions.copyUrlSuccess'));
          },
        },
        {
          icon: <Icon icon={DownloadIcon} />,
          key: 'download',
          label: t('download', { ns: 'common' }),
          onClick: async ({ domEvent }) => {
            domEvent.stopPropagation();
            const key = 'file-downloading';
            message.loading({
              content: t('FileManager.actions.downloading'),
              duration: 0,
              key,
            });
            await downloadFile(url, filename);
            message.destroy(key);
          },
        },
        {
          type: 'divider',
        },
        {
          danger: true,
          icon: <Icon icon={Trash} />,
          key: 'delete',
          label: t('delete', { ns: 'common' }),
          onClick: async ({ domEvent }) => {
            domEvent.stopPropagation();
            modal.confirm({
              content: t('FileManager.actions.confirmDelete'),
              okButtonProps: { danger: true },
              onOk: async () => {
                await removeFile(id);
              },
            });
          },
        },
      ] as ItemType[]
    ).filter(Boolean);
  }, [inKnowledgeBase, isMarkdownFile, handleEditDocument]);
  
  return (
    <>
      <Dropdown menu={{ items }}>
        <ActionIcon icon={MoreHorizontalIcon} size={'small'} />
      </Dropdown>
      
      {/* Document Editor Modal */}
      {showDocumentEditor && (
        <DocumentEditor
          fileId={id}
          initialContent={documentContent}
          initialTitle={documentTitle}
          isEditing={true}
          onClose={() => setShowDocumentEditor(false)}
          onSave={async () => {}} // Not used in edit mode
          onUpdate={handleUpdateDocument}
        />
      )}
    </>
  );
});

export default DropdownMenu;
