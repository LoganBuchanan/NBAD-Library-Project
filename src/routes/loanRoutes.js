const express = require('express');
const { 
  createLoan, 
  getAllLoans, 
  getLoanById, 
  returnBook, 
  extendLoan, 
  deleteLoan, 
  getLoanStats 
} = require('../controllers/loanController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Customer and librarian routes
router.post('/', authenticateToken, createLoan); // Borrow book
router.get('/', authenticateToken, getAllLoans); // Get user's loans or all loans (librarian)
router.get('/:id', authenticateToken, getLoanById);
router.put('/:id/return', authenticateToken, returnBook);

// Librarian-only routes
router.put('/:id/extend', authenticateToken, requireRole('LIBRARIAN'), extendLoan);
router.delete('/:id', authenticateToken, requireRole('LIBRARIAN'), deleteLoan);
router.get('/admin/stats', authenticateToken, requireRole('LIBRARIAN'), getLoanStats);

module.exports = router;