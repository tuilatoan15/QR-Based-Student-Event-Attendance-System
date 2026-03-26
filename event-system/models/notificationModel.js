const { sql, poolPromise } = require('../config/db');

const getNotificationsByUser = async (user_id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('user_id', sql.Int, user_id)
    .query(
      'SELECT id, user_id, title, message, is_read, [type], event_id, created_at FROM notifications WHERE user_id = @user_id ORDER BY created_at DESC'
    );
  return result.recordset;
};

const createNotification = async ({ user_id, title, message, type, event_id }) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('user_id', sql.Int, user_id)
    .input('title', sql.NVarChar(255), title)
    .input('message', sql.NVarChar(sql.MAX), message)
    .input('type', sql.NVarChar(50), type)
    .input('event_id', sql.Int, event_id || null)
    .query(
      `INSERT INTO notifications (user_id, title, message, [type], event_id, created_at)
       VALUES (@user_id, @title, @message, @type, @event_id, SYSUTCDATETIME());
       SELECT SCOPE_IDENTITY() AS id;`
    );
  return result.recordset[0];
};

const markAsRead = async (id, user_id) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input('id', sql.Int, id)
    .input('user_id', sql.Int, user_id)
    .query('UPDATE notifications SET is_read = 1 WHERE id = @id AND user_id = @user_id');
};

const markAllAsRead = async (user_id) => {
  const pool = await poolPromise;
  await pool
    .request()
    .input('user_id', sql.Int, user_id)
    .query('UPDATE notifications SET is_read = 1 WHERE user_id = @user_id');
};

const getUnreadCount = async (user_id) => {
  const pool = await poolPromise;
  const result = await pool
    .request()
    .input('user_id', sql.Int, user_id)
    .query('SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = @user_id AND is_read = 0');
  return result.recordset[0].unread_count;
};

module.exports = {
  getNotificationsByUser,
  createNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
