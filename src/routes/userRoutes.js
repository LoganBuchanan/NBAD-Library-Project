const express = require('express');
const { 
  signup, 
  login, 
  getProfile, 
  updateProfile, 
  changePassword, 
  getAllUsers, 
  deleteUser 
} = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes (require authentication)
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, changePassword);

// Librarian-only routes
router.get('/', authenticateToken, requireRole('LIBRARIAN'), getAllUsers);
router.delete('/:id', authenticateToken, requireRole('LIBRARIAN'), deleteUser);

module.exports = router;