import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import DocumentEditor from './index';

// Mock the translation hook
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, defaultValue?: string, options?: any) => {
            // Handle interpolation for character and word counts
            if (key.includes('{{count}}') && options?.count !== undefined) {
                return (defaultValue || key).replace('{{count}}', options.count.toString());
            }
            // Handle specific translation keys
            if (key === 'common.documentEditor.characterCount') {
                return options?.count ? `${options.count} characters` : '{{count}} characters';
            }
            if (key === 'common.documentEditor.wordCount') {
                return options?.count ? `${options.count} words` : '{{count}} words';
            }
            // Return the default value or key for other translations
            return defaultValue || key;
        },
    }),
}));

describe('DocumentEditor', () => {
    const mockOnClose = vi.fn();
    const mockOnSave = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the document editor modal', () => {
        render(<DocumentEditor onClose={mockOnClose} onSave={mockOnSave} />);

        expect(screen.getByText('Create New Document')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Document Title')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Start writing your document...')).toBeInTheDocument();
    });

    it('shows character and word count', () => {
        render(<DocumentEditor onClose={mockOnClose} onSave={mockOnSave} />);

        // Make sure we're on the edit tab
        const editTab = screen.getByText('Edit');
        fireEvent.click(editTab);

        const textarea = screen.getByPlaceholderText('Start writing your document...');
        fireEvent.change(textarea, { target: { value: 'Hello world test' } });

        expect(screen.getByText('15 characters')).toBeInTheDocument();
        expect(screen.getByText('3 words')).toBeInTheDocument();
    });

    it('disables save button when title or content is empty', () => {
        render(<DocumentEditor onClose={mockOnClose} onSave={mockOnSave} />);

        const saveButton = screen.getByText('Save Document');
        expect(saveButton).toBeDisabled();

        // Add title only
        const titleInput = screen.getByPlaceholderText('Document Title');
        fireEvent.change(titleInput, { target: { value: 'Test Document' } });
        expect(saveButton).toBeDisabled();

        // Add content
        const textarea = screen.getByPlaceholderText('Start writing your document...');
        fireEvent.change(textarea, { target: { value: 'Test content' } });
        expect(saveButton).not.toBeDisabled();
    });

    it('calls onSave with correct data when save button is clicked', async () => {
        render(<DocumentEditor onClose={mockOnClose} onSave={mockOnSave} />);

        const titleInput = screen.getByPlaceholderText('Document Title');
        const textarea = screen.getByPlaceholderText('Start writing your document...');

        fireEvent.change(titleInput, { target: { value: 'Test Document' } });
        fireEvent.change(textarea, { target: { value: 'Test content' } });

        const saveButton = screen.getByText('Save Document');
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSave).toHaveBeenCalledWith({
                name: 'Test Document',
                content: 'Test content',
                fileType: 'text/markdown',
                size: 12,
                createdAt: expect.any(Date),
                source: 'document_editor'
            });
        });
    });

    it('calls onClose when cancel button is clicked', () => {
        render(<DocumentEditor onClose={mockOnClose} onSave={mockOnSave} />);

        const cancelButton = screen.getByText('Cancel');
        fireEvent.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('shows preview tab with markdown rendering', () => {
        render(<DocumentEditor onClose={mockOnClose} onSave={mockOnSave} />);

        // Add some content first
        const editTab = screen.getByText('Edit');
        fireEvent.click(editTab);

        const textarea = screen.getByPlaceholderText('Start writing your document...');
        fireEvent.change(textarea, { target: { value: '# Hello World\n\nThis is a **test** document.' } });

        // Switch to preview tab
        const previewTab = screen.getByText('Preview');
        fireEvent.click(previewTab);

        // Check that markdown is rendered
        expect(screen.getByText('Hello World')).toBeInTheDocument();
        expect(screen.getByText('This is a test document.')).toBeInTheDocument();
    });
});
