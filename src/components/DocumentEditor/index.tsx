import { Button, Input, Modal, Tabs } from 'antd';
import { TextArea, Markdown } from '@lobehub/ui';
import { createStyles } from 'antd-style';
import { FileText, Save, Eye, Edit3 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Center, Flexbox } from 'react-layout-kit';

import { Icon } from '@lobehub/ui';

const useStyles = createStyles(({ css, token }) => ({
    documentEditor: css`
    .document-title-input {
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 500;
    }

    .document-content-editor {
      margin-bottom: 16px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 14px;
      line-height: 1.6;
    }

    .editor-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-top: 1px solid ${token.colorSplit};
      color: ${token.colorTextSecondary};
      font-size: 12px;
    }

    .character-count,
    .word-count {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .markdown-preview {
      padding: 16px;
      border: 1px solid ${token.colorSplit};
      border-radius: ${token.borderRadius}px;
      background-color: ${token.colorBgContainer};
      min-height: 400px;
      overflow-y: auto;
    }

    .empty-preview {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 400px;
      color: ${token.colorTextSecondary};
      font-style: italic;
    }
  `,
}));

export interface DocumentData {
    name: string;
    content: string;
    fileType: string;
    size: number;
    createdAt: Date;
    source: string;
}

interface DocumentEditorProps {
    onClose: () => void;
    onSave: (documentData: DocumentData) => Promise<void>;
    onUpdate?: (id: string, name: string, content: string) => Promise<void>;
    initialContent?: string;
    initialTitle?: string;
    fileId?: string;
    isEditing?: boolean;
}

const DocumentEditor = ({ onClose, onSave, onUpdate, initialContent = '', initialTitle = '', fileId, isEditing = false }: DocumentEditorProps) => {
    const { t } = useTranslation('common');
    const { styles } = useStyles();

    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);

    // Auto-save draft functionality
    useEffect(() => {
        const autoSaveTimer = setTimeout(() => {
            if (title || content) {
                localStorage.setItem('document_draft', JSON.stringify({ title, content }));
            }
        }, 3000);

        return () => clearTimeout(autoSaveTimer);
    }, [title, content]);

    // Load draft on mount (only if no initial content provided)
    useEffect(() => {
        if (initialContent && initialTitle) {
            // If we have initial content, use it and don't load draft
            return;
        }

        const draft = localStorage.getItem('document_draft');
        if (draft) {
            try {
                const { title: draftTitle, content: draftContent } = JSON.parse(draft);
                setTitle(draftTitle || '');
                setContent(draftContent || '');
            } catch (error) {
                console.error('Failed to parse draft:', error);
            }
        }
    }, [initialContent, initialTitle]);

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) return;

        setIsSaving(true);
        try {
            // Ensure content is properly encoded and clean
            const cleanContent = content.trim();

            if (isEditing && onUpdate && fileId) {
                // Update existing document
                await onUpdate(fileId, title.trim(), cleanContent);
            } else {
                // Create new document
                await onSave({
                    name: title.trim(),
                    content: cleanContent,
                    fileType: 'text/markdown',
                    size: new Blob([cleanContent], { type: 'text/plain; charset=utf8' }).size,
                    createdAt: new Date(),
                    source: 'document_editor'
                });
            }

            // Clear draft after successful save
            localStorage.removeItem('document_draft');
            onClose();
        } catch (error) {
            console.error('Failed to save document:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    const handleCancel = () => {
        // Clear draft when canceling
        localStorage.removeItem('document_draft');
        onClose();
    };

    const wordCount = content.split(/\s+/).filter(Boolean).length;

    return (
        <Modal
            title={
                <Flexbox align="center" gap={8} horizontal>
                    <Icon icon={FileText} />
                    {isEditing ? t('documentEditor.editTitle', 'Edit Document') : t('documentEditor.title', 'Create New Document')}
                </Flexbox>
            }
            open={true}
            onCancel={handleCancel}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    {t('cancel', 'Cancel')}
                </Button>,
                <Button
                    key="save"
                    type="primary"
                    loading={isSaving}
                    onClick={handleSave}
                    icon={<Icon icon={Save} />}
                    disabled={!title.trim() || !content.trim()}
                >
                    {isEditing ? t('update', 'Update Document') : t('save', 'Save Document')}
                </Button>
            ]}
            width={800}
            destroyOnClose
        >
            <div className={styles.documentEditor}>
                <Input
                    placeholder={t('documentEditor.titlePlaceholder', 'Document Title')}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="document-title-input"
                    size="large"
                />

                <Tabs
                    defaultActiveKey="edit"
                    items={[
                        {
                            key: 'edit',
                            label: (
                                <Flexbox align="center" gap={8} horizontal>
                                    <Icon icon={Edit3} />
                                    {t('documentEditor.editTab', 'Edit')}
                                </Flexbox>
                            ),
                            children: (
                                <>
                                    <TextArea
                                        placeholder={t('documentEditor.contentPlaceholder', 'Start writing your document...')}
                                        value={content}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                                        rows={20}
                                        className="document-content-editor"
                                        autoFocus
                                        showCount={false}
                                    />

                                    <div className="editor-toolbar">
                                        <Flexbox gap={16} horizontal>
                                            <span className="character-count">
                                                {t('documentEditor.characterCount', '{{count}} characters', { count: content.length })}
                                            </span>
                                            <span className="word-count">
                                                {t('documentEditor.wordCount', '{{count}} words', { count: wordCount })}
                                            </span>
                                        </Flexbox>
                                        <span>
                                            {t('documentEditor.shortcut', 'Ctrl+S to save')}
                                        </span>
                                    </div>
                                </>
                            ),
                        },
                        {
                            key: 'preview',
                            label: (
                                <Flexbox align="center" gap={8} horizontal>
                                    <Icon icon={Eye} />
                                    {t('documentEditor.previewTab', 'Preview')}
                                </Flexbox>
                            ),
                            children: (
                                <div className="markdown-preview">
                                    {content ? (
                                        <Markdown>{content}</Markdown>
                                    ) : (
                                        <div className="empty-preview">
                                            {t('documentEditor.emptyPreview', 'Start writing to see a preview...')}
                                        </div>
                                    )}
                                </div>
                            ),
                        },
                    ]}
                />
            </div>
        </Modal>
    );
};

export default DocumentEditor;
