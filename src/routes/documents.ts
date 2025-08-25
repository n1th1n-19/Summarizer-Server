import express from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../services/fileService';
import documentController from '../controllers/documentController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// @route   POST /documents/upload
// @desc    Upload and process document
// @access  Private
router.post('/upload', 
  upload.single('document'), 
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Title must be between 1 and 255 characters')
  ],
  documentController.upload
);

// @route   GET /documents
// @desc    Get user's documents with pagination
// @access  Private
router.get('/', documentController.getDocuments);

// @route   GET /documents/:id
// @desc    Get specific document
// @access  Private
router.get('/:id', documentController.getDocument);

// @route   DELETE /documents/:id
// @desc    Delete document
// @access  Private
router.delete('/:id', documentController.deleteDocument);

// @route   POST /documents/:id/summarize
// @desc    Generate new summary for document
// @access  Private
router.post('/:id/summarize', documentController.summarize);

export default router;