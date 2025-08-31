import { loadFile } from '@lobechat/file-loaders';
import debug from 'debug';

import { DocumentModel } from '@/database/models/document';
import { FileModel } from '@/database/models/file';
import { LobeChatDatabase } from '@/database/type';
import { LobeDocument } from '@/types/document';

import { FileService } from '../file';

const log = debug('lobe-chat:service:document');

export class DocumentService {
  userId: string;
  private db: LobeChatDatabase;
  private fileModel: FileModel;
  private documentModel: DocumentModel;
  private fileService: FileService;

  constructor(db: LobeChatDatabase, userId: string) {
    this.userId = userId;
    this.db = db;
    this.fileModel = new FileModel(db, userId);
    this.fileService = new FileService(db, userId);
    this.documentModel = new DocumentModel(db, userId);
  }

  /**
   * Create a document directly from content
   */
  async createDocument(params: {
    content: string;
    title: string;
    fileType: string;
    source: string;
    sourceType: 'file' | 'web' | 'api';
    totalCharCount: number;
    totalLineCount: number;
    metadata?: Record<string, any>;
    pages?: any[];
  }): Promise<LobeDocument> {
    const document = await this.documentModel.create({
      content: params.content,
      title: params.title,
      fileType: params.fileType,
      source: params.source,
      sourceType: params.sourceType,
      totalCharCount: params.totalCharCount,
      totalLineCount: params.totalLineCount,
      metadata: params.metadata,
      pages: params.pages,
    });

    return document as LobeDocument;
  }

  /**
   * Update a document's content directly
   */
  async updateDocument(id: string, params: {
    content: string;
    title?: string;
    totalCharCount: number;
    totalLineCount: number;
    metadata?: Record<string, any>;
    pages?: any[];
  }): Promise<LobeDocument> {
    await this.documentModel.update(id, {
      content: params.content,
      title: params.title,
      totalCharCount: params.totalCharCount,
      totalLineCount: params.totalLineCount,
      metadata: params.metadata,
      pages: params.pages,
    });

    // Fetch and return the updated document
    const document = await this.documentModel.findById(id);
    if (!document) {
      throw new Error('Document not found after update');
    }

    return document as LobeDocument;
  }

  /**
   * Update a document by its associated file ID
   */
  async updateDocumentByFileId(fileId: string, params: {
    content: string;
    title?: string;
    totalCharCount: number;
    totalLineCount: number;
    metadata?: Record<string, any>;
    pages?: any[];
  }): Promise<{ file: any; document?: LobeDocument }> {
    // Update the file record with new name and content metadata
    await this.fileModel.update(fileId, {
      name: params.title ? `${params.title}.md` : undefined,
      size: new Blob([params.content], { type: 'text/markdown' }).size,
    });

    // Find and update the associated document
    const existingDocument = await this.db.query.documents.findFirst({
      where: (documents, { eq, and }) => and(
        eq(documents.fileId, fileId),
        eq(documents.userId, this.userId)
      ),
    });

    let document: LobeDocument | undefined;
    
    if (existingDocument) {
      // Update existing document
      await this.documentModel.update(existingDocument.id, {
        content: params.content,
        title: params.title,
        totalCharCount: params.totalCharCount,
        totalLineCount: params.totalLineCount,
        metadata: params.metadata,
        pages: params.pages,
      });
      
      document = await this.documentModel.findById(existingDocument.id) as LobeDocument;
    } else {
      // Create new document record for this file
      document = await this.documentModel.create({
        content: params.content,
        title: params.title || 'Untitled Document',
        fileType: 'text/markdown',
        source: 'document_editor',
        sourceType: 'file',
        totalCharCount: params.totalCharCount,
        totalLineCount: params.totalLineCount,
        metadata: params.metadata,
        pages: params.pages,
        fileId,
      }) as LobeDocument;
    }

    const file = await this.fileModel.findById(fileId);
    return { file, document };
  }

  /**
   * 解析文件内容
   *
   */
  async parseFile(fileId: string): Promise<LobeDocument> {
    const { filePath, file, cleanup } = await this.fileService.downloadFileToLocal(fileId);

    const logPrefix = `[${file.name}]`;
    log(`${logPrefix} 开始解析文件, 路径: ${filePath}`);

    try {
      // 使用loadFile加载文件内容
      const fileDocument = await loadFile(filePath);

      log(`${logPrefix} 文件解析成功 %O`, {
        fileType: fileDocument.fileType,
        size: fileDocument.content.length,
      });

      const document = await this.documentModel.create({
        content: fileDocument.content,
        fileId,
        fileType: file.fileType,
        metadata: fileDocument.metadata,
        pages: fileDocument.pages,
        source: file.url,
        sourceType: 'file',
        title: fileDocument.metadata?.title,
        totalCharCount: fileDocument.totalCharCount,
        totalLineCount: fileDocument.totalLineCount,
      });

      return document as LobeDocument;
    } catch (error) {
      console.error(`${logPrefix} 文件解析失败:`, error);
      throw error;
    } finally {
      cleanup();
    }
  }
}
