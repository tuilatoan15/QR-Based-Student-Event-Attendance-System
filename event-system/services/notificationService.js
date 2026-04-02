const mongoose = require('mongoose');
const { nextLegacySqlId } = require('../utils/legacySequence');

/**
 * Service to handle notification creation in the backend.
 */
class NotificationService {
  /**
   * Send a notification to a specific user.
   * 
   * @param {object} db - MongoDB database instance (req.app.locals.db)
   * @param {string|object} userId - The recipient's user ID (Mongoose ObjectId)
   * @param {string} title - Notification title
   * @param {string} message - Notification content
   * @param {string} type - 'info', 'success', 'warning', etc.
   * @param {string|object} eventId - Optional associated event ID
   * @returns {Promise<object>} The created notification
   */
  static async sendNotification(db, userId, title, message, type = 'info', eventId = null) {
    if (!db) {
      console.error('NotificationService: Database instance is required');
      return null;
    }

    try {
      const legacy_sql_id = await nextLegacySqlId(db, 'notifications');
      
      const doc = {
        legacy_sql_id,
        user_id: new mongoose.Types.ObjectId(userId),
        title,
        message,
        type,
        is_read: false,
        event_id: eventId ? new mongoose.Types.ObjectId(eventId) : null,
        created_at: new Date(),
      };

      await db.collection('notifications').insertOne(doc);
      return doc;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }
}

module.exports = NotificationService;
