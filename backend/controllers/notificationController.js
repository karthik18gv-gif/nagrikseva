const { pool } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.getNotifications = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM notifications WHERE user_type=? AND user_id=? ORDER BY created_at DESC LIMIT 20', [req.user.role, req.user.id]);
    const [u] = await pool.execute('SELECT COUNT(*) as count FROM notifications WHERE user_type=? AND user_id=? AND is_read=0', [req.user.role, req.user.id]);
    return successResponse(res, { notifications: rows, unread_count: u[0].count });
  } catch (err) { return errorResponse(res, err.message); }
};

exports.markAsRead = async (req, res) => {
  try {
    await pool.execute('UPDATE notifications SET is_read=1 WHERE id=? AND user_type=? AND user_id=?', [req.params.id, req.user.role, req.user.id]);
    return successResponse(res, null, 'Marked as read');
  } catch (err) { return errorResponse(res, err.message); }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await pool.execute('UPDATE notifications SET is_read=1 WHERE user_type=? AND user_id=?', [req.user.role, req.user.id]);
    return successResponse(res, null, 'All marked as read');
  } catch (err) { return errorResponse(res, err.message); }
};
