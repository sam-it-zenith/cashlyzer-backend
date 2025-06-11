const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { verifyToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get user profile
router.get('/', profileController.getUserProfile);

// Update user profile
router.put('/', profileController.updateUserProfile);

// Delete user profile
router.delete('/', profileController.deleteUserProfile);

module.exports = router; 