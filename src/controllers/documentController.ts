import { Request, Response } from 'express';
import documentService from '../services/documentService';
import fileService from '../services/fileService';
import aiService from '../services/aiService';
import { User } from '../types/user';
import { DocumentStatus } from '../types/document';

export class DocumentController {
  async upload(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as User;
      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Validate file
      const validation = await fileService.validateFile(req.file);
      if (!validation.isValid) {
        res.status(400).json({ error: validation.error });
        return;
      }

      // Extract text from file
      const extractedText = await fileService.extractTextFromFile(
        req.file.buffer,
        req.file.originalname
      );

      // Create document record
      const document = await documentService.create({
        userId: user.id,
        title: req.body.title || req.file.originalname.split('.')[0],
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        extractedText,
      });

      // Generate summary asynchronously
      try {
        const summary = await aiService.summarizeText(extractedText);
        await documentService.update(document.id, { 
          summary, 
          status: DocumentStatus.COMPLETED 
        });
      } catch (summaryError) {
        console.error('Summary generation failed:', summaryError);
        await documentService.update(document.id, { status: DocumentStatus.FAILED });
      }

      res.status(201).json({
        message: 'Document uploaded successfully',
        document: {
          id: document.id,
          title: document.title,
          fileName: document.fileName,
          fileType: document.fileType,
          fileSize: document.fileSize,
          status: document.status,
          createdAt: document.createdAt
        }
      });
    } catch (error) {
      console.error('Document upload error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to upload document'
      });
    }
  }

  async getDocuments(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as User;
      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = req.query.sortBy as string || 'createdAt';
      const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';

      const result = await documentService.findByUserId(user.id, {
        page,
        limit,
        sortBy,
        sortOrder
      });

      res.json(result);
    } catch (error) {
      console.error('Get documents error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve documents'
      });
    }
  }

  async getDocument(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as User;
      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        res.status(400).json({ error: 'Invalid document ID' });
        return;
      }

      const document = await documentService.findByUserIdAndDocumentId(user.id, documentId);
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      res.json({ document });
    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to retrieve document'
      });
    }
  }

  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as User;
      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        res.status(400).json({ error: 'Invalid document ID' });
        return;
      }

      // Check if document belongs to user
      const document = await documentService.findByUserIdAndDocumentId(user.id, documentId);
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      // Delete document
      await documentService.delete(documentId);

      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to delete document'
      });
    }
  }

  async summarize(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as User;
      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        res.status(400).json({ error: 'Invalid document ID' });
        return;
      }

      const document = await documentService.findByUserIdAndDocumentId(user.id, documentId);
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      if (!document.extractedText) {
        res.status(400).json({ error: 'No text available for summarization' });
        return;
      }

      // Generate new summary
      const summary = await aiService.summarizeText(document.extractedText);
      
      // Update document with new summary
      await documentService.update(documentId, { 
        summary, 
        status: DocumentStatus.COMPLETED 
      });

      res.json({
        message: 'Summary generated successfully',
        summary
      });
    } catch (error) {
      console.error('Summarization error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to generate summary'
      });
    }
  }

  async generateEmbeddings(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as User;
      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        res.status(400).json({ error: 'Invalid document ID' });
        return;
      }

      const document = await documentService.findByUserIdAndDocumentId(user.id, documentId);
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      if (!document.extractedText) {
        res.status(400).json({ error: 'No text available for embedding generation' });
        return;
      }

      await documentService.generateAndStoreEmbeddings(documentId);

      res.json({
        message: 'Embeddings generated successfully',
        documentId
      });
    } catch (error) {
      console.error('Embedding generation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to generate embeddings'
      });
    }
  }

  async searchSimilar(req: Request, res: Response): Promise<void> {
    try {

      const user = req.user as User;
      if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const { query } = req.body;
      const limit = parseInt(req.body.limit as string) || 5;

      const similarDocuments = await documentService.searchSimilarDocuments(
        user.id, 
        query, 
        limit
      );

      res.json({
        query,
        results: similarDocuments,
        count: similarDocuments.length
      });
    } catch (error) {
      console.error('Search similar documents error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to search similar documents'
      });
    }
  }
}

export default new DocumentController();