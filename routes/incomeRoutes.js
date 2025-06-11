const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  addIncome,
  getIncomes,
  deleteIncome
} = require('../controllers/incomeController');

// All routes are protected with verifyToken middleware
router.use(verifyToken);

// Add new income
router.post('/', addIncome);

// Get all incomes (with optional date range filtering)
router.get('/', getIncomes);

// Delete income by ID
router.delete('/:id', deleteIncome);

module.exports = router; 