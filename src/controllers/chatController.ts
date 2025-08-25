import { Request, Response } from 'express';
import chatService from '../services/chatService';
import documentService from '../services/documentService';
import type { User as PrismaUser } from '@prisma/client';

export class ChatController {
  async createSession(req: Request, res: Response): Promise<void> {
    try {

      const userId = (req.user as PrismaUser)!.id;
      const { documentId, title } = req.body;

      const document = await documentService.findByUserIdAndDocumentId(userId, documentId);
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      const session = await chatService.createSession(userId, documentId, title);
      res.status(201).json(session);
    } catch (error) {
      console.error('Create session error:', error);
      res.status(500).json({ error: 'Failed to create chat session' });
    }
  }

  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.user as PrismaUser)!.id;
      const { page = 1, limit = 10, documentId } = req.query;

      const sessions = await chatService.getUserSessions(userId, {
        page: Number(page),
        limit: Number(limit),
        documentId: documentId ? Number(documentId) : undefined
      });

      res.json(sessions);
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ error: 'Failed to get chat sessions' });
    }
  }

  async getSession(req: Request, res: Response): Promise<void> {
    try {

      const userId = (req.user as PrismaUser)!.id;
      const sessionId = Number(req.params.id);

      const session = await chatService.getSessionWithMessages(sessionId, userId);
      if (!session) {
        res.status(404).json({ error: 'Chat session not found' });
        return;
      }

      res.json(session);
    } catch (error) {
      console.error('Get session error:', error);
      res.status(500).json({ error: 'Failed to get chat session' });
    }
  }

  async deleteSession(req: Request, res: Response): Promise<void> {
    try {

      const userId = (req.user as PrismaUser)!.id;
      const sessionId = Number(req.params.id);

      await chatService.deleteSession(sessionId, userId);
      res.json({ message: 'Chat session deleted successfully' });
    } catch (error) {
      console.error('Delete session error:', error);
      if (error instanceof Error && error.message === 'Chat session not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to delete chat session' });
      }
    }
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {

      const userId = (req.user as PrismaUser)!.id;
      const sessionId = Number(req.params.id);
      const { content } = req.body;

      const session = await chatService.getSession(sessionId, userId);
      if (!session) {
        res.status(404).json({ error: 'Chat session not found' });
        return;
      }

      const { userMessage, aiResponse } = await chatService.sendMessage(sessionId, content);

      res.json({
        userMessage,
        aiResponse
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  }

  async quickQuery(req: Request, res: Response): Promise<void> {
    try {

      const userId = (req.user as PrismaUser)!.id;
      const { documentId, message } = req.body;

      const document = await documentService.findByUserIdAndDocumentId(userId, documentId);
      if (!document) {
        res.status(404).json({ error: 'Document not found' });
        return;
      }

      if (!document.extractedText) {
        res.status(400).json({ error: 'Document has no extracted text to query' });
        return;
      }

      const response = await chatService.quickQuery(document.extractedText, message);
      res.json({ response });
    } catch (error) {
      console.error('Quick query error:', error);
      res.status(500).json({ error: 'Failed to process query' });
    }
  }
}

export default new ChatController();