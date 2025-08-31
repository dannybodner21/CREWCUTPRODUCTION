import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';

import { DocumentService } from '@/server/services/document';
import { getServerDB } from '@/database/core/db-adaptor';

export async function POST(request: NextRequest) {
  try {
    // Get user ID from authentication
    const { userId } = await auth();
    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const db = await getServerDB();
    
    const documentService = new DocumentService(db, userId);
    
    const document = await documentService.createDocument(body);
    
    return Response.json({ success: true, document });
  } catch (error) {
    console.error('Failed to create document:', error);
    return Response.json(
      { success: false, error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get user ID from authentication
    const { userId } = await auth();
    if (!userId) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, content, title } = body;
    
    if (!id || !content) {
      return Response.json(
        { success: false, error: 'Missing required fields: id, content' },
        { status: 400 }
      );
    }

    const db = await getServerDB();
    const documentService = new DocumentService(db, userId);
    
    // Since the id is actually a fileId, we need to update via the file/document relationship
    const result = await documentService.updateDocumentByFileId(id, {
      content,
      title,
      totalCharCount: content.length,
      totalLineCount: content.split('\n').length,
      metadata: {
        title: title || 'Untitled Document',
        source: 'document_editor',
      },
      pages: [{
        pageContent: content,
        charCount: content.length,
        lineCount: content.split('\n').length,
        metadata: {
          lineNumberStart: 1,
          lineNumberEnd: content.split('\n').length,
        },
      }],
    });
    
    return Response.json({ success: true, result });
  } catch (error) {
    console.error('Failed to update document:', error);
    return Response.json(
      { success: false, error: 'Failed to update document' },
      { status: 500 }
    );
  }
}