import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../services/fileService';
import documentController from '../controllers/documentController';
import { validateRequest, sanitizeInput } from '../middleware/zodValidation';
import { uploadLimiter, aiOperationsLimiter, searchLimiter } from '../middleware/rateLimiting';
import { 
  uploadDocumentSchema, 
  documentParamsSchema, 
  documentsQuerySchema, 
  searchDocumentsSchema 
} from '../schemas';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   POST /documents/upload
// @desc    Upload and process document
// @access  Private
router.post('/upload', 
  uploadLimiter,
  upload.single('document'),
  sanitizeInput,
  validateRequest(uploadDocumentSchema),
  documentController.upload
);

// @route   GET /documents
// @desc    Get user's documents with pagination
// @access  Private
router.get('/', validateRequest(documentsQuerySchema), documentController.getDocuments);

// @route   GET /documents/:id
// @desc    Get specific document
// @access  Private
router.get('/:id', validateRequest(documentParamsSchema), documentController.getDocument);

// @route   DELETE /documents/:id
// @desc    Delete document
// @access  Private
router.delete('/:id', validateRequest(documentParamsSchema), documentController.deleteDocument);

// @route   POST /documents/:id/summarize
// @desc    Generate new summary for document
// @access  Private
router.post('/:id/summarize', aiOperationsLimiter, validateRequest(documentParamsSchema), documentController.summarize);

// @route   POST /documents/:id/embeddings
// @desc    Generate embeddings for document
// @access  Private
router.post('/:id/embeddings', aiOperationsLimiter, validateRequest(documentParamsSchema), documentController.generateEmbeddings);

// @route   POST /documents/search
// @desc    Search similar documents using query
// @access  Private
router.post('/search',
  searchLimiter,
  sanitizeInput,
  validateRequest(searchDocumentsSchema),
  documentController.searchSimilar
);

export default router;