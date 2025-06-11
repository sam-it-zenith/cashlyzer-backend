const express = require('express');
const router = express.Router();
const savingsController = require('../controllers/savingsController');
const { verifyToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Create a new savings plan
router.post('/', savingsController.createSavingsPlan);

// Get savings plan
router.get('/', savingsController.getSavingsPlan);

// Update savings plan
router.put('/:id', savingsController.updateSavingsPlan);

// Delete savings plan
router.delete('/:id', savingsController.deleteSavingsPlan);

// Contribute to savings
router.post('/:id/contribute', savingsController.contributeToSavings);

module.exports = router; 