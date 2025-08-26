import { ChatSession, ChatMessage } from '../types/document';
import { query } from '../config/database';
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
      const result = await query(`
        INSERT INTO chat_sessions (user_id, document_id, session_name, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, user_id, document_id, session_name, created_at, updated_at
      `, [userId, documentId, title || `Chat ${new Date().toLocaleDateString()}`]);

      if (result.rows.length === 0) {
        throw new Error('Failed to create chat session');
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        documentId: row.document_id,
        sessionName: row.session_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('Error creating chat session:', error);
      throw new Error('Failed to create chat session');
    }
  }

  async getSession(sessionId: number, userId: number): Promise<ChatSession | null> {
    try {
      const result = await query(`
        SELECT id, user_id, document_id, session_name, created_at, updated_at
        FROM chat_sessions
        WHERE id = $1 AND user_id = $2
      `, [sessionId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        documentId: row.document_id,
        sessionName: row.session_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('Error getting chat session:', error);
      throw new Error('Failed to get chat session');
    }
  }

  async getSessionWithMessages(sessionId: number, userId: number): Promise<any> {
    try {
      const sessionResult = await query(`
        SELECT cs.id, cs.user_id, cs.document_id, cs.session_name, cs.created_at, cs.updated_at,
               d.id as doc_id, d.title as doc_title, d.file_name as doc_filename
        FROM chat_sessions cs
        LEFT JOIN documents d ON cs.document_id = d.id
        WHERE cs.id = $1 AND cs.user_id = $2
      `, [sessionId, userId]);

      if (sessionResult.rows.length === 0) {
        return null;
      }

      const messagesResult = await query(`
        SELECT id, session_id, message, response, created_at, updated_at
        FROM chat_messages
        WHERE session_id = $1
        ORDER BY created_at ASC
      `, [sessionId]);

      const sessionRow = sessionResult.rows[0];
      return {
        id: sessionRow.id,
        userId: sessionRow.user_id,
        documentId: sessionRow.document_id,
        sessionName: sessionRow.session_name,
        createdAt: sessionRow.created_at,
        updatedAt: sessionRow.updated_at,
        document: sessionRow.doc_id ? {
          id: sessionRow.doc_id,
          title: sessionRow.doc_title,
          fileName: sessionRow.doc_filename
        } : null,
        messages: messagesResult.rows.map(row => ({
          id: row.id,
          sessionId: row.session_id,
          message: row.message,
          response: row.response,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }))
      };
    } catch (error) {
      console.error('Error getting chat session with messages:', error);
      throw new Error('Failed to get chat session');
    }
  }

  async getUserSessions(userId: number, options: SessionOptions = {}): Promise<PaginatedSessions> {
    const { page = 1, limit = 10, documentId } = options;
    const offset = (page - 1) * limit;

    try {
      let whereCondition = 'cs.user_id = $1';
      const params: any[] = [userId];
      let paramIndex = 2;

      if (documentId) {
        whereCondition += ` AND cs.document_id = $${paramIndex}`;
        params.push(documentId);
        paramIndex++;
      }

      const [sessionsResult, totalResult] = await Promise.all([
        query(`
          SELECT cs.id, cs.user_id, cs.document_id, cs.session_name, cs.created_at, cs.updated_at,
                 d.id as doc_id, d.title as doc_title, d.file_name as doc_filename,
                 COUNT(cm.id) as message_count
          FROM chat_sessions cs
          LEFT JOIN documents d ON cs.document_id = d.id
          LEFT JOIN chat_messages cm ON cs.id = cm.session_id
          WHERE ${whereCondition}
          GROUP BY cs.id, d.id, d.title, d.file_name
          ORDER BY cs.updated_at DESC
          LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `, [...params, limit, offset]),
        query(`SELECT COUNT(*) as count FROM chat_sessions cs WHERE ${whereCondition}`, params)
      ]);

      const sessions = sessionsResult.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        documentId: row.document_id,
        sessionName: row.session_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        document: {
          id: row.doc_id,
          title: row.doc_title,
          fileName: row.doc_filename
        },
        _count: {
          messages: parseInt(row.message_count) || 0
        }
      }));

      const total = parseInt(totalResult.rows[0].count);
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

      // Delete messages first due to foreign key constraint
      await query('DELETE FROM chat_messages WHERE session_id = $1', [sessionId]);
      
      // Then delete the session
      await query('DELETE FROM chat_sessions WHERE id = $1', [sessionId]);
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
      const sessionResult = await query(`
        SELECT cs.id, cs.user_id, cs.document_id, cs.session_name,
               d.extracted_text
        FROM chat_sessions cs
        LEFT JOIN documents d ON cs.document_id = d.id
        WHERE cs.id = $1
      `, [sessionId]);

      if (sessionResult.rows.length === 0) {
        throw new Error('Chat session not found');
      }

      const session = sessionResult.rows[0];
      const aiResponseContent = await aiService.chatWithDocument(
        session.extracted_text || '',
        content
      );

      const messageResult = await query(`
        INSERT INTO chat_messages (session_id, message, response, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, session_id, message, response, created_at, updated_at
      `, [sessionId, content, aiResponseContent]);

      await query(`
        UPDATE chat_sessions 
        SET updated_at = NOW() 
        WHERE id = $1
      `, [sessionId]);

      const chatMessage: ChatMessage = {
        id: messageResult.rows[0].id,
        sessionId: messageResult.rows[0].session_id,
        message: messageResult.rows[0].message,
        response: messageResult.rows[0].response,
        createdAt: messageResult.rows[0].created_at,
        updatedAt: messageResult.rows[0].updated_at,
      };

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
      let sessionWhereCondition = '';
      let messageWhereCondition = '';
      const params: any[] = [];

      if (userId) {
        sessionWhereCondition = 'WHERE user_id = $1';
        messageWhereCondition = 'WHERE cm.session_id IN (SELECT id FROM chat_sessions WHERE user_id = $1)';
        params.push(userId);
      }

      const [sessionCountResult, messageCountResult] = await Promise.all([
        query(`SELECT COUNT(*) as count FROM chat_sessions ${sessionWhereCondition}`, params),
        query(`SELECT COUNT(*) as count FROM chat_messages cm ${messageWhereCondition}`, params)
      ]);

      const sessionCount = parseInt(sessionCountResult.rows[0].count);
      const messageCount = parseInt(messageCountResult.rows[0].count);

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