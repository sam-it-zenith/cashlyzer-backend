const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getCategories,
  getCategoryById,
  validateCategory
} = require('../controllers/categoryController');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get all categories
router.get('/', getCategories);

// Get category by ID
router.get('/:categoryId', getCategoryById);

// Validate category and subcategory
router.post('/validate', validateCategory);

module.exports = router; 