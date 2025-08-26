import { Document, DocumentStatus, CreateDocumentData, UpdateDocumentData } from '../types/document';
import { query } from '../config/database';
import aiService from './aiService';


export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class DocumentService {
  async create(documentData: CreateDocumentData): Promise<Document> {
    try {
      const result = await query(`
        INSERT INTO documents (user_id, title, file_name, file_type, file_size, file_url, extracted_text, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING id, user_id, title, file_name, file_type, file_size, file_url, extracted_text, summary, status, created_at, updated_at
      `, [
        documentData.userId,
        documentData.title,
        documentData.fileName,
        documentData.fileType,
        documentData.fileSize,
        documentData.fileUrl || null,
        documentData.extractedText || null,
        DocumentStatus.PENDING
      ]);
      
      if (result.rows.length === 0) {
        throw new Error('Failed to create document');
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        fileName: row.file_name,
        fileType: row.file_type,
        fileSize: row.file_size,
        fileUrl: row.file_url,
        extractedText: row.extracted_text,
        summary: row.summary,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error('Failed to create document');
    }
  }

  async findById(id: number): Promise<Document | null> {
    try {
      const result = await query(`
        SELECT d.id, d.user_id, d.title, d.file_name, d.file_type, d.file_size, d.file_url, 
               d.extracted_text, d.summary, d.status, d.created_at, d.updated_at
        FROM documents d
        WHERE d.id = $1
      `, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        fileName: row.file_name,
        fileType: row.file_type,
        fileSize: row.file_size,
        fileUrl: row.file_url,
        extractedText: row.extracted_text,
        summary: row.summary,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('Error finding document by ID:', error);
      throw new Error('Failed to find document');
    }
  }

  async findByUserId(userId: number, options: PaginationOptions = {}): Promise<PaginatedResult<Document>> {
    const { page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;

    try {
      const [documents, total] = await Promise.all([
        query(`
          SELECT id, user_id, title, file_name, file_type, file_size, file_url, 
                 extracted_text, summary, status, created_at, updated_at
          FROM documents 
          WHERE user_id = $1
          ORDER BY ${sortBy} ${sortOrder}
          LIMIT $2 OFFSET $3
        `, [userId, limit, offset]),
        query('SELECT COUNT(*) as count FROM documents WHERE user_id = $1', [userId])
      ]);

      const documentsData = documents.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        fileName: row.file_name,
        fileType: row.file_type,
        fileSize: row.file_size,
        fileUrl: row.file_url,
        extractedText: row.extracted_text,
        summary: row.summary,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      const totalCount = parseInt(total.rows[0].count);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: documentsData,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error finding documents by user ID:', error);
      throw new Error('Failed to find documents');
    }
  }

  async findByUserIdAndDocumentId(userId: number, documentId: number): Promise<Document | null> {
    try {
      const result = await query(`
        SELECT id, user_id, title, file_name, file_type, file_size, file_url, 
               extracted_text, summary, status, created_at, updated_at
        FROM documents 
        WHERE id = $1 AND user_id = $2
      `, [documentId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        fileName: row.file_name,
        fileType: row.file_type,
        fileSize: row.file_size,
        fileUrl: row.file_url,
        extractedText: row.extracted_text,
        summary: row.summary,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('Error finding document by user and document ID:', error);
      throw new Error('Failed to find document');
    }
  }

  async update(id: number, documentData: UpdateDocumentData): Promise<Document> {
    try {
      const setParts: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (documentData.title !== undefined && documentData.title !== null) {
        setParts.push(`title = $${paramIndex++}`);
        values.push(documentData.title);
      }
      if (documentData.extractedText !== undefined && documentData.extractedText !== null) {
        setParts.push(`extracted_text = $${paramIndex++}`);
        values.push(documentData.extractedText);
      }
      if (documentData.summary !== undefined && documentData.summary !== null) {
        setParts.push(`summary = $${paramIndex++}`);
        values.push(documentData.summary);
      }
      if (documentData.status !== undefined && documentData.status !== null) {
        setParts.push(`status = $${paramIndex++}`);
        values.push(documentData.status);
      }

      if (setParts.length === 0) {
        throw new Error('No fields to update');
      }

      setParts.push(`updated_at = NOW()`);
      values.push(id);

      const result = await query(`
        UPDATE documents 
        SET ${setParts.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, user_id, title, file_name, file_type, file_size, file_url, extracted_text, summary, status, created_at, updated_at
      `, values);

      if (result.rows.length === 0) {
        throw new Error('Document not found');
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        fileName: row.file_name,
        fileType: row.file_type,
        fileSize: row.file_size,
        fileUrl: row.file_url,
        extractedText: row.extracted_text,
        summary: row.summary,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error: any) {
      console.error('Error updating document:', error);
      throw new Error('Failed to update document');
    }
  }

  async delete(id: number): Promise<Document> {
    try {
      const result = await query(`
        DELETE FROM documents 
        WHERE id = $1
        RETURNING id, user_id, title, file_name, file_type, file_size, file_url, extracted_text, summary, status, created_at, updated_at
      `, [id]);

      if (result.rows.length === 0) {
        throw new Error('Document not found');
      }

      const row = result.rows[0];
      return {
        id: row.id,
        userId: row.user_id,
        title: row.title,
        fileName: row.file_name,
        fileType: row.file_type,
        fileSize: row.file_size,
        fileUrl: row.file_url,
        extractedText: row.extracted_text,
        summary: row.summary,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  async searchDocuments(userId: number, searchTerm: string, options: PaginationOptions = {}): Promise<PaginatedResult<Document>> {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    try {
      const searchPattern = `%${searchTerm.toLowerCase()}%`;
      const [documents, total] = await Promise.all([
        query(`
          SELECT id, user_id, title, file_name, file_type, file_size, file_url, 
                 extracted_text, summary, status, created_at, updated_at
          FROM documents
          WHERE user_id = $1 
            AND (LOWER(title) LIKE $2 OR LOWER(file_name) LIKE $2 OR LOWER(extracted_text) LIKE $2)
          ORDER BY created_at DESC
          LIMIT $3 OFFSET $4
        `, [userId, searchPattern, limit, offset]),
        query(`
          SELECT COUNT(*) as count
          FROM documents
          WHERE user_id = $1 
            AND (LOWER(title) LIKE $2 OR LOWER(file_name) LIKE $2 OR LOWER(extracted_text) LIKE $2)
        `, [userId, searchPattern])
      ]);

      const documentsData = documents.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        fileName: row.file_name,
        fileType: row.file_type,
        fileSize: row.file_size,
        fileUrl: row.file_url,
        extractedText: row.extracted_text,
        summary: row.summary,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      const totalCount = parseInt(total.rows[0].count);
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: documentsData,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error searching documents:', error);
      throw new Error('Failed to search documents');
    }
  }

  async getDocumentStats(userId?: number): Promise<{ 
    total: number; 
    byStatus: Record<string, number>; 
    totalSize: number; 
  }> {
    try {
      const whereCondition = userId ? 'WHERE user_id = $1' : '';
      const params = userId ? [userId] : [];

      const [totalResult, statusCounts, totalSizeResult] = await Promise.all([
        query(`SELECT COUNT(*) as count FROM documents ${whereCondition}`, params),
        query(`SELECT status, COUNT(*) as count FROM documents ${whereCondition} GROUP BY status`, params),
        query(`SELECT SUM(file_size) as total_size FROM documents ${whereCondition}`, params)
      ]);

      const byStatus: Record<string, number> = {};
      statusCounts.rows.forEach((row: any) => {
        byStatus[row.status] = parseInt(row.count);
      });

      return {
        total: parseInt(totalResult.rows[0].count),
        byStatus,
        totalSize: parseInt(totalSizeResult.rows[0].total_size) || 0,
      };
    } catch (error) {
      console.error('Error getting document stats:', error);
      throw new Error('Failed to get document statistics');
    }
  }

  async getDocumentWithRelations(id: number): Promise<any> {
    try {
      const documentResult = await query(`
        SELECT d.id, d.user_id, d.title, d.file_name, d.file_type, d.file_size, d.file_url, 
               d.extracted_text, d.summary, d.status, d.created_at, d.updated_at,
               u.id as user_id, u.name as user_name, u.email as user_email
        FROM documents d
        LEFT JOIN users u ON d.user_id = u.id
        WHERE d.id = $1
      `, [id]);

      if (documentResult.rows.length === 0) {
        return null;
      }

      const docRow = documentResult.rows[0];
      return {
        id: docRow.id,
        userId: docRow.user_id,
        title: docRow.title,
        fileName: docRow.file_name,
        fileType: docRow.file_type,
        fileSize: docRow.file_size,
        fileUrl: docRow.file_url,
        extractedText: docRow.extracted_text,
        summary: docRow.summary,
        status: docRow.status,
        createdAt: docRow.created_at,
        updatedAt: docRow.updated_at,
        user: {
          id: docRow.user_id,
          name: docRow.user_name,
          email: docRow.user_email,
        }
      };
    } catch (error) {
      console.error('Error getting document with relations:', error);
      throw new Error('Failed to get document details');
    }
  }

  async getRecentDocuments(userId: number, limit = 5): Promise<Document[]> {
    try {
      const result = await query(`
        SELECT id, user_id, title, file_name, file_type, file_size, file_url, 
               extracted_text, summary, status, created_at, updated_at
        FROM documents 
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [userId, limit]);

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        fileName: row.file_name,
        fileType: row.file_type,
        fileSize: row.file_size,
        fileUrl: row.file_url,
        extractedText: row.extracted_text,
        summary: row.summary,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.error('Error getting recent documents:', error);
      throw new Error('Failed to get recent documents');
    }
  }

  async generateAndStoreEmbeddings(documentId: number): Promise<void> {
    try {
      const document = await this.findById(documentId);
      if (!document || !document.extractedText) {
        throw new Error('Document not found or has no extracted text');
      }

      const chunkSize = 1000;
      const chunks = this.chunkText(document.extractedText, chunkSize);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await aiService.generateEmbedding(chunk);
        
        await query(`
          INSERT INTO document_embeddings (document_id, chunk_index, chunk_text, embedding, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [documentId, i, chunk, JSON.stringify(embedding)]);
      }

      await this.update(documentId, { status: DocumentStatus.COMPLETED });
    } catch (error) {
      console.error('Error generating embeddings:', error);
      await this.update(documentId, { status: DocumentStatus.FAILED });
      throw new Error('Failed to generate embeddings');
    }
  }

  private chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  async searchSimilarDocuments(userId: number, queryText: string, limit = 5): Promise<Document[]> {
    try {
      const searchPattern = `%${queryText.toLowerCase()}%`;
      const similarEmbeddings = await query(`
        SELECT DISTINCT de.document_id as documentId
        FROM document_embeddings de
        JOIN documents d ON de.document_id = d.id
        WHERE d.user_id = $1 
          AND (LOWER(d.title) LIKE $3 OR LOWER(de.chunk_text) LIKE $3)
        ORDER BY d.created_at DESC
        LIMIT $2
      `, [userId, limit, searchPattern]);
      
      const documentIds = [...new Set(similarEmbeddings.rows.map((e: any) => e.documentid))];
      
      if (documentIds.length === 0) {
        return [];
      }

      const placeholders = documentIds.map((_, index) => `$${index + 2}`).join(',');
      const result = await query(`
        SELECT id, user_id, title, file_name, file_type, file_size, file_url, 
               extracted_text, summary, status, created_at, updated_at
        FROM documents
        WHERE id IN (${placeholders}) AND user_id = $1
        ORDER BY created_at DESC
      `, [userId, ...documentIds]);

      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        title: row.title,
        fileName: row.file_name,
        fileType: row.file_type,
        fileSize: row.file_size,
        fileUrl: row.file_url,
        extractedText: row.extracted_text,
        summary: row.summary,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      console.error('Error searching similar documents:', error);
      return [];
    }
  }
}

export default new DocumentService();