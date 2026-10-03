const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/db');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { logActivity } = require('../../utils/logger');

const genToken = (p) => jwt.sign(p, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const loginUser = async (table, role, req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE username=? AND is_active=1`, [username]);
    if (!rows.length) return errorResponse(res, 'Invalid credentials.', 401);
    const user = rows[0];
    if (!await bcrypt.compare(password, user.password)) return errorResponse(res, 'Invalid credentials.', 401);
    await pool.execute(`UPDATE ${table} SET last_login=NOW() WHERE id=?`, [user.id]);
    await logActivity(role, user.id, 'Login', req.ip);
    const token = genToken({ id: user.id, role, username: user.username });
    const { password: _, ...userData } = user;
    return successResponse(res, { token, user: userData }, 'Login successful');
  } catch (err) { return errorResponse(res, err.message); }
};

exports.employeeLogin = (req, res) => loginUser('employees', 'employee', req, res);
exports.officerLogin  = (req, res) => loginUser('officers',  'officer',  req, res);
exports.adminLogin    = (req, res) => loginUser('admins',    'admin',    req, res);

exports.getStaffProfile = (table) => async (req, res) => {
  try {
    // FIX: the `admins` table has no department_id column (only employees/officers
    // do), so joining on it unconditionally threw "Unknown column 'u.department_id'"
    // and broke the Admin Profile page every time. Only join departments for tables
    // that actually have that column.
    const hasDepartment = table === 'employees' || table === 'officers';
    const query = hasDepartment
      ? `SELECT u.*,d.name as department_name FROM ${table} u LEFT JOIN departments d ON u.department_id=d.id WHERE u.id=?`
      : `SELECT u.* FROM ${table} u WHERE u.id=?`;
    const [rows] = await pool.execute(query, [req.user.id]);
    if (!rows.length) return errorResponse(res, 'Not found', 404);
    const { password, ...profile } = rows[0];
    return successResponse(res, profile);
  } catch (err) { return errorResponse(res, err.message); }
};
