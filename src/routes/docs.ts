import express from 'express';

const router = express.Router();

// @route   GET /docs
// @desc    Get API documentation
// @access  Public
router.get('/', (_req, res) => {
  const apiDocs = {
    title: 'AI Research Paper Summarizer API',
    version: '1.0.0',
    description: 'API for processing and summarizing research papers using AI services',
    baseUrl: '/api',
    endpoints: {
      authentication: {
        'GET /auth/google': {
          description: 'Google OAuth login',
          response: 'Redirect to Google OAuth'
        },
        'GET /auth/google/callback': {
          description: 'Google OAuth callback',
          response: 'JWT token and user data'
        },
        'GET /auth/profile': {
          description: 'Get user profile (requires JWT)',
          headers: {
            Authorization: 'Bearer <token>'
          },
          response: 'User profile data'
        }
      },
      documents: {
        'POST /documents/upload': {
          description: 'Upload and process document',
          headers: {
            Authorization: 'Bearer <token>',
            'Content-Type': 'multipart/form-data'
          },
          body: {
            document: 'file (required - PDF, DOCX, TXT)',
            title: 'string (optional)'
          },
          response: 'Document metadata and processing status'
        },
        'GET /documents': {
          description: 'Get user documents with pagination',
          headers: {
            Authorization: 'Bearer <token>'
          },
          query: {
            page: 'number (default: 1)',
            limit: 'number (default: 10)',
            sortBy: 'string (default: createdAt)',
            sortOrder: 'asc|desc (default: desc)'
          },
          response: 'Paginated list of documents'
        },
        'GET /documents/:id': {
          description: 'Get specific document',
          headers: {
            Authorization: 'Bearer <token>'
          },
          response: 'Document details'
        },
        'DELETE /documents/:id': {
          description: 'Delete document',
          headers: {
            Authorization: 'Bearer <token>'
          },
          response: 'Deletion confirmation'
        },
        'POST /documents/:id/summarize': {
          description: 'Generate new summary for document',
          headers: {
            Authorization: 'Bearer <token>'
          },
          response: 'Generated summary'
        },
        'POST /documents/:id/embeddings': {
          description: 'Generate embeddings for document',
          headers: {
            Authorization: 'Bearer <token>'
          },
          response: 'Embedding generation confirmation'
        },
        'POST /documents/search': {
          description: 'Search similar documents using query',
          headers: {
            Authorization: 'Bearer <token>'
          },
          body: {
            query: 'string (1-500 chars)',
            limit: 'number (optional, default: 5)'
          },
          response: 'List of similar documents'
        }
      },
      chat: {
        'POST /chat/sessions': {
          description: 'Create new chat session',
          headers: {
            Authorization: 'Bearer <token>'
          },
          body: {
            documentId: 'number (required)',
            title: 'string (optional, 1-255 chars)'
          },
          response: 'Chat session data'
        },
        'GET /chat/sessions': {
          description: 'Get user chat sessions',
          headers: {
            Authorization: 'Bearer <token>'
          },
          query: {
            page: 'number (default: 1)',
            limit: 'number (default: 10)',
            documentId: 'number (optional)'
          },
          response: 'Paginated list of chat sessions'
        },
        'GET /chat/sessions/:id': {
          description: 'Get specific chat session with messages',
          headers: {
            Authorization: 'Bearer <token>'
          },
          response: 'Chat session with message history'
        },
        'DELETE /chat/sessions/:id': {
          description: 'Delete chat session',
          headers: {
            Authorization: 'Bearer <token>'
          },
          response: 'Deletion confirmation'
        },
        'POST /chat/sessions/:id/messages': {
          description: 'Send message in chat session',
          headers: {
            Authorization: 'Bearer <token>'
          },
          body: {
            content: 'string (1-2000 chars)'
          },
          response: 'User message and AI response'
        },
        'POST /chat/query': {
          description: 'Quick query without creating session',
          headers: {
            Authorization: 'Bearer <token>'
          },
          body: {
            documentId: 'number (required)',
            message: 'string (1-1000 chars)'
          },
          response: 'AI response to query'
        }
      },
      utility: {
        'GET /health': {
          description: 'Health check endpoint',
          response: 'Server status and database connection'
        },
        'GET /': {
          description: 'API information',
          response: 'API metadata and endpoint list'
        }
      }
    },
    authentication: {
      type: 'Google OAuth + JWT Bearer Token',
      flow: '1. Login via /auth/google → 2. Get JWT token from callback → 3. Use token in Authorization header',
      header: 'Authorization: Bearer <token>',
      note: 'Authentication is handled via Google OAuth. After successful OAuth, you receive a JWT token to use for API requests.'
    },
    errorHandling: {
      '400': 'Bad Request - Invalid input data',
      '401': 'Unauthorized - Missing or invalid authentication',
      '403': 'Forbidden - Insufficient permissions',
      '404': 'Not Found - Resource not found',
      '500': 'Internal Server Error - Server-side error'
    },
    supportedFileTypes: [
      'PDF (.pdf)',
      'Microsoft Word (.docx)',
      'Plain Text (.txt)',
      'Excel Spreadsheet (.xlsx)'
    ],
    rateLimits: {
      general: '100 requests per 15 minutes per IP',
      fileUpload: '50MB max file size'
    }
  };

  res.json(apiDocs);
});

export default router;