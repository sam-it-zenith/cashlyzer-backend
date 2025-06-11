const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getDashboardSummary } = require('../controllers/summaryController');
const summaryController = require('../controllers/summaryController');

// All routes are protected with verifyToken middleware
router.use(verifyToken);

// Get dashboard summary
router.get('/dashboard', getDashboardSummary);

// Generate and send monthly summary
router.post('/monthly', summaryController.generateMonthlySummary);

module.exports = router; 