const { pool } = require('../../config/db');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

exports.raiseTicket = async (req, res) => {
  try {
    const { subject, description, priority } = req.body;
    const ticketNum = 'TKT' + Date.now();
    const [r] = await pool.execute('INSERT INTO support_tickets (ticket_number,citizen_id,subject,description,priority) VALUES (?,?,?,?,?)', [ticketNum, req.user.id, subject, description, priority||'medium']);
    return successResponse(res, { ticket_number: ticketNum }, 'Support ticket raised', 201);
  } catch (err) { return errorResponse(res, err.message); }
};

exports.getMyTickets = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM support_tickets WHERE citizen_id=? ORDER BY created_at DESC', [req.user.id]);
    return successResponse(res, rows);
  } catch (err) { return errorResponse(res, err.message); }
};
