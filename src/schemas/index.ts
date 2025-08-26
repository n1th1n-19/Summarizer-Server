import { z } from 'zod';

// User profile schema (Google OAuth only)
export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name must not exceed 50 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
  })
});

// Document schemas
export const uploadDocumentSchema = z.object({
  body: z.object({
    title: z.string()
      .trim()
      .min(1, 'Title is required')
      .max(255, 'Title must not exceed 255 characters')
      .optional()
  })
});

export const documentParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid document ID').transform(Number)
  })
});

export const documentsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    sortBy: z.enum(['title', 'createdAt', 'updatedAt']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
  })
});

export const searchDocumentsSchema = z.object({
  body: z.object({
    query: z.string()
      .trim()
      .min(1, 'Search query is required')
      .max(500, 'Search query must not exceed 500 characters'),
    limit: z.number().int().min(1).max(20).optional().default(5)
  })
});

// Chat schemas
export const createChatSessionSchema = z.object({
  body: z.object({
    documentId: z.number().int().positive('Valid document ID is required'),
    title: z.string()
      .trim()
      .min(1, 'Title must not be empty')
      .max(255, 'Title must not exceed 255 characters')
      .optional()
  })
});

export const chatSessionParamsSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid session ID').transform(Number)
  })
});

export const chatSessionsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    sortBy: z.enum(['title', 'createdAt', 'updatedAt']).optional().default('updatedAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
  })
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string()
      .trim()
      .min(1, 'Message content is required')
      .max(2000, 'Message must not exceed 2000 characters')
  })
});

export const quickQuerySchema = z.object({
  body: z.object({
    documentId: z.number().int().positive('Valid document ID is required'),
    message: z.string()
      .trim()
      .min(1, 'Message is required')
      .max(2000, 'Message must not exceed 2000 characters')
  })
});

// Type exports for TypeScript
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>['body'];
export type DocumentParams = z.infer<typeof documentParamsSchema>['params'];
export type DocumentsQuery = z.infer<typeof documentsQuerySchema>['query'];
export type SearchDocumentsInput = z.infer<typeof searchDocumentsSchema>['body'];
export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>['body'];
export type ChatSessionParams = z.infer<typeof chatSessionParamsSchema>['params'];
export type ChatSessionsQuery = z.infer<typeof chatSessionsQuerySchema>['query'];
export type SendMessageInput = z.infer<typeof sendMessageSchema>['body'];
export type QuickQueryInput = z.infer<typeof quickQuerySchema>['body'];