const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getBudgetRecommendations, getInsights } = require('../controllers/aiController');

// All routes are protected with verifyToken middleware
router.use(verifyToken);

// Get budget recommendations
router.get('/budget-recommendation', getBudgetRecommendations);

// Get insights
router.get('/insights', getInsights);

module.exports = router; 