const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  setMonthlyBudget,
  getBudgetSummary,
  getBudgetHistory
} = require('../controllers/budgetController');

// All routes are protected with verifyToken middleware
router.use(verifyToken);

// Set monthly budget
router.post('/', setMonthlyBudget);

// Get current month's budget summary
router.get('/', getBudgetSummary);

// Get budget history (optional months parameter)
router.get('/history', getBudgetHistory);

module.exports = router; 