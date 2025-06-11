const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  addExpense,
  getExpenses,
  deleteExpense
} = require('../controllers/expenseController');

// All routes are protected with verifyToken middleware
router.use(verifyToken);

// Add new expense
router.post('/', addExpense);
// Get all expenses (with optional date range filtering)
router.get('/', getExpenses);

// Delete expense by ID
router.delete('/:id', deleteExpense);

module.exports = router; 