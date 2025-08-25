import { Document, DocumentStatus, Prisma } from '@prisma/client';
import prisma from '../config/prisma';
import aiService from './aiService';

export interface CreateDocumentData {
  userId: number;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl?: string | null;
  extractedText?: string | null;
}

export interface UpdateDocumentData {
  title?: string | null;
  extractedText?: string | null;
  summary?: string | null;
  status?: DocumentStatus | null;
}

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
      return await prisma.document.create({
        data: {
          userId: documentData.userId,
          title: documentData.title,
          fileName: documentData.fileName,
          fileType: documentData.fileType,
          fileSize: documentData.fileSize,
          fileUrl: documentData.fileUrl || null,
          extractedText: documentData.extractedText || null,
        },
      });
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error('Failed to create document');
    }
  }

  async findById(id: number): Promise<Document | null> {
    try {
      return await prisma.document.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error finding document by ID:', error);
      throw new Error('Failed to find document');
    }
  }

  async findByUserId(userId: number, options: PaginationOptions = {}): Promise<PaginatedResult<Document>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const offset = (page - 1) * limit;

    try {
      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where: { userId },
          orderBy: { [sortBy]: sortOrder },
          take: limit,
          skip: offset,
          include: {
            _count: {
              select: {
                embeddings: true,
                chatSessions: true,
              },
            },
          },
        }),
        prisma.document.count({
          where: { userId },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: documents,
        pagination: {
          page,
          limit,
          total,
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
      return await prisma.document.findFirst({
        where: {
          id: documentId,
          userId: userId,
        },
      });
    } catch (error) {
      console.error('Error finding document by user and document ID:', error);
      throw new Error('Failed to find document');
    }
  }

  async update(id: number, documentData: UpdateDocumentData): Promise<Document> {
    try {
      return await prisma.document.update({
        where: { id },
        data: {
          ...(documentData.title !== undefined && documentData.title !== null && { title: documentData.title }),
          ...(documentData.extractedText !== undefined && documentData.extractedText !== null && { extractedText: documentData.extractedText }),
          ...(documentData.summary !== undefined && documentData.summary !== null && { summary: documentData.summary }),
          ...(documentData.status !== undefined && documentData.status !== null && { status: documentData.status }),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Document not found');
        }
      }
      console.error('Error updating document:', error);
      throw new Error('Failed to update document');
    }
  }

  async delete(id: number): Promise<Document> {
    try {
      return await prisma.document.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Document not found');
        }
      }
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  async searchDocuments(userId: number, searchTerm: string, options: PaginationOptions = {}): Promise<PaginatedResult<Document>> {
    const { page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    try {
      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where: {
            userId,
            OR: [
              {
                title: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
              {
                fileName: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
              {
                extractedText: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.document.count({
          where: {
            userId,
            OR: [
              {
                title: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
              {
                fileName: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
              {
                extractedText: {
                  contains: searchTerm,
                  mode: 'insensitive',
                },
              },
            ],
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: documents,
        pagination: {
          page,
          limit,
          total,
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
      const whereClause = userId ? { userId } : {};

      const [totalResult, statusCounts, totalSizeResult] = await Promise.all([
        prisma.document.count({ where: whereClause }),
        prisma.document.groupBy({
          by: ['status'],
          where: whereClause,
          _count: true,
        }),
        prisma.document.aggregate({
          where: whereClause,
          _sum: {
            fileSize: true,
          },
        }),
      ]);

      const byStatus: Record<string, number> = {};
      statusCounts.forEach(({ status, _count }) => {
        byStatus[status] = _count;
      });

      return {
        total: totalResult,
        byStatus,
        totalSize: totalSizeResult._sum.fileSize || 0,
      };
    } catch (error) {
      console.error('Error getting document stats:', error);
      throw new Error('Failed to get document statistics');
    }
  }

  async getDocumentWithRelations(id: number): Promise<any> {
    try {
      return await prisma.document.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          embeddings: {
            orderBy: { chunkIndex: 'asc' },
            take: 5, // Limit embeddings for performance
          },
          chatSessions: {
            orderBy: { createdAt: 'desc' },
            take: 3, // Recent chat sessions
            include: {
              _count: {
                select: {
                  messages: true,
                },
              },
            },
          },
          _count: {
            select: {
              embeddings: true,
              chatSessions: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error getting document with relations:', error);
      throw new Error('Failed to get document details');
    }
  }

  async getRecentDocuments(userId: number, limit = 5): Promise<Document[]> {
    try {
      return await prisma.document.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
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
        
        await prisma.documentEmbedding.create({
          data: {
            documentId,
            chunkIndex: i,
            chunkText: chunk,
            embedding,
          },
        });
      }

      await this.update(documentId, { status: 'COMPLETED' });
    } catch (error) {
      console.error('Error generating embeddings:', error);
      await this.update(documentId, { status: 'FAILED' });
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
      const queryEmbedding = await aiService.generateEmbedding(queryText);
      
      const similarEmbeddings = await prisma.$queryRaw<Array<{documentId: number}>>`
        SELECT "documentId", 
               (embedding <-> ${queryEmbedding}::vector) as distance
        FROM "DocumentEmbedding" de
        JOIN "Document" d ON de."documentId" = d.id
        WHERE d."userId" = ${userId}
        ORDER BY distance
        LIMIT ${limit}
      `;
      
      const documentIds = [...new Set(similarEmbeddings.map(e => e.documentId))];
      
      return await prisma.document.findMany({
        where: {
          id: { in: documentIds },
          userId,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error searching similar documents:', error);
      return [];
    }
  }
}

export default new DocumentService();