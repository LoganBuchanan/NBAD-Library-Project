const express = require('express');
const { 
  createBook, 
  getAllBooks, 
  getBookById, 
  updateBook, 
  deleteBook, 
  getBookStats 
} = require('../controllers/bookController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getAllBooks);
router.get('/:id', getBookById);

// Librarian-only routes
router.post('/', authenticateToken, requireRole('LIBRARIAN'), createBook);
router.put('/:id', authenticateToken, requireRole('LIBRARIAN'), updateBook);
router.delete('/:id', authenticateToken, requireRole('LIBRARIAN'), deleteBook);
router.get('/admin/stats', authenticateToken, requireRole('LIBRARIAN'), getBookStats);

module.exports = router;