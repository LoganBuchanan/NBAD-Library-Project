const express = require('express');
const { 
  createAuthor, 
  getAllAuthors, 
  getAuthorById, 
  updateAuthor, 
  deleteAuthor, 
  getAuthorStats 
} = require('../controllers/authorController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getAllAuthors);
router.get('/:id', getAuthorById);

// Librarian-only routes
router.post('/', authenticateToken, requireRole('LIBRARIAN'), createAuthor);
router.put('/:id', authenticateToken, requireRole('LIBRARIAN'), updateAuthor);
router.delete('/:id', authenticateToken, requireRole('LIBRARIAN'), deleteAuthor);
router.get('/admin/stats', authenticateToken, requireRole('LIBRARIAN'), getAuthorStats);

module.exports = router;