import { ChatSession, ChatMessage } from '@prisma/client';
import prisma from '../config/prisma';
import aiService from './aiService';

export interface CreateSessionData {
  userId: number;
  documentId: number;
  title?: string;
}

export interface SessionOptions {
  page?: number;
  limit?: number;
  documentId?: number;
}

export interface PaginatedSessions {
  data: (ChatSession & { 
    document: { id: number; title: string; fileName: string },
    _count: { messages: number }
  })[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ChatService {
  async createSession(userId: number, documentId: number, title?: string): Promise<ChatSession> {
    try {
      return await prisma.chatSession.create({
        data: {
          userId,
          documentId,
          sessionName: title || `Chat ${new Date().toLocaleDateString()}`
        }
      });
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw new Error('Failed to create chat session');
    }
  }

  async getSession(sessionId: number, userId: number): Promise<ChatSession | null> {
    try {
      return await prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId
        }
      });
    } catch (error) {
      console.error('Error getting chat session:', error);
      throw new Error('Failed to get chat session');
    }
  }

  async getSessionWithMessages(sessionId: number, userId: number): Promise<any> {
    try {
      return await prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId
        },
        include: {
          document: {
            select: {
              id: true,
              title: true,
              fileName: true
            }
          },
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
    } catch (error) {
      console.error('Error getting chat session with messages:', error);
      throw new Error('Failed to get chat session');
    }
  }

  async getUserSessions(userId: number, options: SessionOptions = {}): Promise<PaginatedSessions> {
    const { page = 1, limit = 10, documentId } = options;
    const offset = (page - 1) * limit;

    try {
      const whereClause: any = { userId };
      if (documentId) {
        whereClause.documentId = documentId;
      }

      const [sessions, total] = await Promise.all([
        prisma.chatSession.findMany({
          where: whereClause,
          orderBy: { updatedAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            document: {
              select: {
                id: true,
                title: true,
                fileName: true
              }
            },
            _count: {
              select: {
                messages: true
              }
            }
          }
        }),
        prisma.chatSession.count({
          where: whereClause
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: sessions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw new Error('Failed to get chat sessions');
    }
  }

  async deleteSession(sessionId: number, userId: number): Promise<void> {
    try {
      const session = await this.getSession(sessionId, userId);
      if (!session) {
        throw new Error('Chat session not found');
      }

      await prisma.chatSession.delete({
        where: { id: sessionId }
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Chat session not found') {
        throw error;
      }
      console.error('Error deleting chat session:', error);
      throw new Error('Failed to delete chat session');
    }
  }

  async sendMessage(sessionId: number, content: string): Promise<{
    userMessage: ChatMessage,
    aiResponse: ChatMessage
  }> {
    try {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          document: true,
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!session) {
        throw new Error('Chat session not found');
      }

      const aiResponseContent = await aiService.chatWithDocument(
        session.document.extractedText || '',
        content
      );

      const chatMessage = await prisma.chatMessage.create({
        data: {
          sessionId,
          message: content,
          response: aiResponseContent
        }
      });

      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() }
      });

      // Return the same message for both user and AI for compatibility
      return { 
        userMessage: chatMessage, 
        aiResponse: chatMessage 
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  async quickQuery(documentText: string, message: string): Promise<string> {
    try {
      return await aiService.chatWithDocument(documentText, message);
    } catch (error) {
      console.error('Error processing quick query:', error);
      throw new Error('Failed to process query');
    }
  }

  async getSessionStats(userId?: number): Promise<{
    total: number;
    totalMessages: number;
    averageMessagesPerSession: number;
  }> {
    try {
      const whereClause = userId ? { userId } : {};

      const [sessionCount, messageCount] = await Promise.all([
        prisma.chatSession.count({ where: whereClause }),
        prisma.chatMessage.count({
          where: {
            session: whereClause
          }
        })
      ]);

      return {
        total: sessionCount,
        totalMessages: messageCount,
        averageMessagesPerSession: sessionCount > 0 ? messageCount / sessionCount : 0
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      throw new Error('Failed to get session statistics');
    }
  }
}

export default new ChatService();