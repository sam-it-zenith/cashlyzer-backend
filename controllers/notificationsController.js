const notificationsService = require('../services/notificationsService');

// Get user's notifications
exports.getNotifications = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { limit = 10, unreadOnly = true } = req.query;

    const notifications = await notificationsService.getUserNotifications(
      uid,
      parseInt(limit),
      unreadOnly === 'true'
    );

    res.json({
      message: 'Notifications retrieved successfully',
      notifications
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
      message: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const uid = req.user.uid;
    const { notificationId } = req.params;

    if (!notificationId) {
      return res.status(400).json({
        error: 'Missing notification ID',
        message: 'Please provide a notification ID'
      });
    }

    await notificationsService.markAsRead(uid, notificationId);

    res.json({
      message: 'Notification marked as read successfully'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
      message: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const uid = req.user.uid;

    await notificationsService.markAllAsRead(uid);

    res.json({
      message: 'All notifications marked as read successfully'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      error: 'Failed to mark all notifications as read',
      message: error.message
    });
  }
};

// Delete old notifications
exports.deleteOldNotifications = async (req, res) => {
  try {
    const uid = req.user.uid;

    await notificationsService.deleteOldNotifications(uid);

    res.json({
      message: 'Old notifications deleted successfully'
    });
  } catch (error) {
    console.error('Delete old notifications error:', error);
    res.status(500).json({
      error: 'Failed to delete old notifications',
      message: error.message
    });
  }
}; 