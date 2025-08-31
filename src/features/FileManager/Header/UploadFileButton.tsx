'use client';

import { Button, Dropdown, Icon, MenuProps } from '@lobehub/ui';
import { Upload } from 'antd';
import { css, cx } from 'antd-style';
import { FileText, FileUp, FolderUp, UploadIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import DocumentEditor from '@/components/DocumentEditor';
import DragUpload from '@/components/DragUpload';
import { useFileStore } from '@/store/file';

const hotArea = css`
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-color: transparent;
  }
`;

const UploadFileButton = ({ knowledgeBaseId }: { knowledgeBaseId?: string }) => {
  const { t } = useTranslation('file');

  const [showDocumentEditor, setShowDocumentEditor] = useState(false);

  const pushDockFileList = useFileStore((s) => s.pushDockFileList);
  const createDocument = useFileStore((s) => s.createDocument);

  const handleSaveDocument = async (documentData: { name: string; content: string; fileType: string; size: number; createdAt: Date; source: string }) => {
    try {
      await createDocument({
        name: documentData.name,
        content: documentData.content,
        knowledgeBaseId,
      });
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  const items = useMemo<MenuProps['items']>(
    () => [
      {
        icon: <Icon icon={FileUp} />,
        key: 'upload-file',
        label: (
          <Upload
            beforeUpload={async (file) => {
              await pushDockFileList([file], knowledgeBaseId);

              return false;
            }}
            multiple={true}
            showUploadList={false}
          >
            <div className={cx(hotArea)}>{t('header.actions.uploadFile')}</div>
          </Upload>
        ),
      },
      {
        icon: <Icon icon={FolderUp} />,
        key: 'upload-folder',
        label: (
          <Upload
            beforeUpload={async (file) => {
              await pushDockFileList([file], knowledgeBaseId);

              return false;
            }}
            directory
            multiple={true}
            showUploadList={false}
          >
            <div className={cx(hotArea)}>{t('header.actions.uploadFolder')}</div>
          </Upload>
        ),
      },
      {
        icon: <Icon icon={FileText} />,
        key: 'create-document',
        label: (
          <div className={cx(hotArea)} onClick={() => setShowDocumentEditor(true)}>
            {t('header.actions.createDocument', 'Create New Document')}
          </div>
        ),
      },
    ],
    [createDocument, knowledgeBaseId],
  );
  return (
    <>
      <Dropdown menu={{ items }} placement="bottomRight">
        <Button icon={UploadIcon}>{t('header.uploadButton')}</Button>
      </Dropdown>
      <DragUpload
        enabledFiles
        onUploadFiles={(files) => pushDockFileList(files, knowledgeBaseId)}
      />

      {/* Document Editor Modal */}
      {showDocumentEditor && (
        <DocumentEditor
          onClose={() => setShowDocumentEditor(false)}
          onSave={handleSaveDocument}
        />
      )}
    </>
  );
};

export default UploadFileButton;
