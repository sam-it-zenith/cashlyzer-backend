const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteOldNotifications
} = require('../controllers/notificationsController');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Get user's notifications
router.get('/', getNotifications);

// Mark notification as read
router.patch('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.patch('/read-all', markAllAsRead);

// Delete old notifications
router.delete('/old', deleteOldNotifications);

module.exports = router; 