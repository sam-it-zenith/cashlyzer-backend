const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getSavingsPrediction } = require('../controllers/predictionController');

// All routes are protected with verifyToken middleware
router.use(verifyToken);

// Get savings prediction
router.get('/savings', getSavingsPrediction);

module.exports = router; 