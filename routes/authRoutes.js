const express = require('express');
const router = express.Router();

const { 
  signup, 
  login, 
  getProfile,
  forgotPassword 
} = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Public routes (no authentication required)
router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);

// Protected routes (authentication required)
router.get('/profile', verifyToken, getProfile);

module.exports = router; 