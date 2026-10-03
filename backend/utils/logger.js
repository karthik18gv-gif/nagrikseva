const { pool } = require('../config/db');

const logActivity = async (userType, userId, activity, ip = null) => {
  try {
    await pool.execute('INSERT INTO activity_logs (user_type,user_id,activity,ip_address) VALUES (?,?,?,?)', [userType, userId, activity, ip]);
  } catch (e) {}
};

const logAudit = async (userType, userId, action, tableName, recordId, oldVal, newVal, ip) => {
  try {
    await pool.execute('INSERT INTO audit_logs (user_type,user_id,action,table_name,record_id,old_values,new_values,ip_address) VALUES (?,?,?,?,?,?,?,?)',
      [userType, userId, action, tableName, recordId, oldVal ? JSON.stringify(oldVal) : null, newVal ? JSON.stringify(newVal) : null, ip]);
  } catch (e) {}
};

module.exports = { logActivity, logAudit };
