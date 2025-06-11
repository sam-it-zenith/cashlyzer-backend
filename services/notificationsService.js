const admin = require('../config/firebase');

class NotificationsService {
  constructor() {
    this.db = admin.firestore();
  }

  // Create a new notification
  async createNotification(uid, notification) {
    try {
      const notificationsRef = this.db
        .collection('users')
        .doc(uid)
        .collection('notifications');

      const notificationData = {
        ...notification,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };

      await notificationsRef.add(notificationData);
      return true;
    } catch (error) {
      console.error('Create notification error:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  }

  // Get user's notifications
  async getUserNotifications(uid, limit = 10, unreadOnly = true) {
    try {
      let query = this.db
        .collection('users')
        .doc(uid)
        .collection('notifications')
        .orderBy('timestamp', 'desc');

      if (unreadOnly) {
        query = query.where('read', '==', false);
      }

      const snapshot = await query.limit(limit).get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
    } catch (error) {
      console.error('Get notifications error:', error);
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }
  }

  // Mark notification as read
  async markAsRead(uid, notificationId) {
    try {
      const notificationRef = this.db
        .collection('users')
        .doc(uid)
        .collection('notifications')
        .doc(notificationId);

      await notificationRef.update({
        read: true,
        readAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Mark notification as read error:', error);
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(uid) {
    try {
      const notificationsRef = this.db
        .collection('users')
        .doc(uid)
        .collection('notifications');

      const snapshot = await notificationsRef.where('read', '==', false).get();
      
      const batch = this.db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          readAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  }

  // Delete old notifications (older than 30 days)
  async deleteOldNotifications(uid) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const notificationsRef = this.db
        .collection('users')
        .doc(uid)
        .collection('notifications');

      const snapshot = await notificationsRef
        .where('timestamp', '<', thirtyDaysAgo)
        .get();

      const batch = this.db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return true;
    } catch (error) {
      console.error('Delete old notifications error:', error);
      throw new Error(`Failed to delete old notifications: ${error.message}`);
    }
  }
}

module.exports = new NotificationsService(); 