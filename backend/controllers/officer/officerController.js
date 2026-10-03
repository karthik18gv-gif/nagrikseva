const { pool } = require('../../config/db');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { logActivity } = require('../../utils/logger');


const getOfficerDept = async (id) => {
  const [r] = await pool.execute('SELECT department_id,district_id FROM officers WHERE id=?', [id]);
  return r[0] || {};
};


// FIX (root cause of "Application must be verified first" error):
// Normalise the status value coming back from MySQL before comparing it as a
// JS string. mysql2 usually returns ENUM values as clean lowercase strings,
// but any accidental casing/whitespace introduced by a manual DB edit, an
// older build, or a stale in-memory record was enough to make the strict
// `!== 'verified'` check fire even though the pending-queue query (which
// uses MySQL's case-insensitive collation) still matched. Normalising here
// makes the check bullet-proof, and if it *does* fail we now surface the
// actual stored status so the real cause is visible instead of hidden.
const normStatus = (s) => String(s ?? '').trim().toLowerCase();


exports.getDashboard = async (req, res) => {
  try {
    const { department_id, district_id } = await getOfficerDept(req.user.id);
    const [stats] = await pool.execute(
      `SELECT SUM(status='verified') as pending_approval, SUM(status IN('approved','completed')) as approved,
       SUM(status='rejected') as rejected, COUNT(*) as total
       FROM applications WHERE officer_id=? OR (officer_id IS NULL AND department_id=? AND district_id=? AND status='verified')`,
      [req.user.id, department_id, district_id]);
    const [queue] = await pool.execute(
      `SELECT a.*,ct.name as certificate_name,c.first_name,c.last_name,c.mobile
       FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id JOIN citizens c ON a.citizen_id=c.id
       WHERE (a.officer_id=? OR (a.officer_id IS NULL AND a.department_id=? AND a.district_id=?)) AND a.status='verified'
       ORDER BY a.verified_at ASC LIMIT 10`, [req.user.id, department_id, district_id]);
    const [pensionQ] = await pool.execute(
      `SELECT pa.*,e.name as employee_name,d.name as department_name
       FROM pension_applications pa JOIN employees e ON pa.employee_id=e.id JOIN departments d ON pa.department_id=d.id
       WHERE pa.department_id=? AND pa.status='submitted' ORDER BY pa.created_at ASC LIMIT 5`, [department_id]);
    const [notifs] = await pool.execute("SELECT * FROM notifications WHERE user_type='officer' AND user_id=? ORDER BY created_at DESC LIMIT 10", [req.user.id]);
    return successResponse(res, { stats: stats[0], approval_queue: queue, pension_queue: pensionQ, notifications: notifs });
  } catch (err) { return errorResponse(res, err.message); }
};


exports.getPendingApplications = async (req, res) => {
  try {
    const { search, certificate_type_id, sort, page = 1, limit = 10 } = req.query;
    const safeLimit = Math.max(parseInt(limit, 10) || 10, 1);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeOffset = (safePage - 1) * safeLimit;

    const { department_id, district_id } = await getOfficerDept(req.user.id);
    let where = "(a.officer_id=? OR (a.officer_id IS NULL AND a.department_id=? AND a.district_id=?)) AND a.status='verified'";
    const params = [req.user.id, department_id, district_id];

    if (certificate_type_id) { where += ' AND a.certificate_type_id=?'; params.push(certificate_type_id); }
    if (search) {
      where += ' AND (a.application_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.mobile LIKE ? OR c.aadhaar_number LIKE ? OR ct.name LIKE ? OR e.name LIKE ?)';
      const s = '%' + search + '%';
      params.push(s, s, s, s, s, s, s);
    }

    const orderBy = sort === 'oldest' ? 'ORDER BY a.verified_at ASC' : 'ORDER BY a.verified_at DESC';

    const [rows] = await pool.execute(
      `SELECT a.*,ct.name as certificate_name,c.first_name,c.last_name,c.mobile,c.aadhaar_number,e.name as verified_by
       FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id JOIN citizens c ON a.citizen_id=c.id LEFT JOIN employees e ON a.employee_id=e.id
       WHERE ${where}
       ${orderBy} LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params);
    return successResponse(res, rows);
  } catch (err) { return errorResponse(res, err.message); }
};


exports.getApplicationDetail = async (req, res) => {
  try {
    const { department_id, district_id } = await getOfficerDept(req.user.id);
    const [rows] = await pool.execute(
      `SELECT a.*,ct.name as certificate_name,ct.required_documents,ct.instructions,
       c.first_name,c.last_name,c.mobile,c.email,c.aadhaar_number,c.father_name,c.mother_name,c.dob,c.gender,c.category,
       c.house_number,c.street,c.area,c.village,c.pin_code,dist.name as district_name,s.name as state_name,e.name as verified_by
       FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id JOIN citizens c ON a.citizen_id=c.id
       LEFT JOIN districts dist ON c.district_id=dist.id LEFT JOIN states s ON c.state_id=s.id
       LEFT JOIN employees e ON a.employee_id=e.id
       WHERE a.id=? AND (a.officer_id=? OR (a.officer_id IS NULL AND a.department_id=? AND a.district_id=?))`,
      [req.params.id, req.user.id, department_id, district_id]);
    if (!rows.length) return errorResponse(res, 'Application not found in your queue', 404);
    const [docs] = await pool.execute('SELECT * FROM application_documents WHERE application_id=?', [req.params.id]);
    return successResponse(res, { application: rows[0], documents: docs });
  } catch (err) { return errorResponse(res, err.message); }
};


exports.approveApplication = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { officer_remarks } = req.body;
    const { department_id, district_id } = await getOfficerDept(req.user.id);
    const [rows] = await conn.execute('SELECT * FROM applications WHERE id=?', [req.params.id]);
    if (!rows.length) { await conn.rollback(); return errorResponse(res, 'Not found', 404); }
    const app = rows[0];

    const owned = app.officer_id === req.user.id ||
      (app.officer_id === null && app.department_id === department_id && app.district_id === district_id);
    if (!owned) { await conn.rollback(); return errorResponse(res, 'This application is not in your queue.', 403); }

    // FIX: use the normalised comparison + include actual status in the
    // error so this never silently reports "must be verified first" when
    // the row is *already* verified.
    const currentStatus = normStatus(app.status);
    if (currentStatus !== 'verified') {
      await conn.rollback();
      return errorResponse(
        res,
        `Application must be verified first (current status: ${app.status || 'unknown'})`,
        400
      );
    }

    // Officer approval is NOT the final stage — it forwards the application
    // to admin for final completion + certificate issuance.
    await conn.execute(
      "UPDATE applications SET status='approved',officer_id=?,officer_remarks=?,approved_at=NOW() WHERE id=?",
      [req.user.id, officer_remarks || null, req.params.id]
    );
    await conn.execute(
      "INSERT INTO notifications (user_type,user_id,title,message,type) VALUES ('citizen',?,?,?,'info')",
      [app.citizen_id, 'Application Approved by Officer', `Application ${app.application_number} approved by officer and forwarded to admin for final certificate issuance.`]
    );
    await conn.commit();
    await logActivity('officer', req.user.id, `Approved application ${app.application_number}`, req.ip);
    return successResponse(res, null, 'Application approved and forwarded to admin for final completion.');
  } catch (err) { await conn.rollback(); return errorResponse(res, err.message); }
  finally { conn.release(); }
};


exports.rejectApplication = async (req, res) => {
  try {
    const { rejection_reason, officer_remarks } = req.body;
    if (!rejection_reason) return errorResponse(res, 'Rejection reason required', 400);
    const { department_id, district_id } = await getOfficerDept(req.user.id);
    const [rows] = await pool.execute('SELECT * FROM applications WHERE id=?', [req.params.id]);
    if (!rows.length) return errorResponse(res, 'Not found', 404);
    const app = rows[0];
    const owned = app.officer_id === req.user.id ||
      (app.officer_id === null && app.department_id === department_id && app.district_id === district_id);
    if (!owned) return errorResponse(res, 'This application is not in your queue.', 403);

    // FIX: same defensive check — an officer should only be able to reject
    // an application that's actually at the "verified" stage awaiting
    // their decision.
    const currentStatus = normStatus(app.status);
    if (currentStatus !== 'verified') {
      return errorResponse(
        res,
        `Application must be verified first (current status: ${app.status || 'unknown'})`,
        400
      );
    }

    await pool.execute(
      "UPDATE applications SET status='rejected',officer_id=?,officer_remarks=?,rejection_reason=? WHERE id=?",
      [req.user.id, officer_remarks || null, rejection_reason, req.params.id]
    );
    await pool.execute(
      "INSERT INTO notifications (user_type,user_id,title,message,type) VALUES ('citizen',?,?,?,'error')",
      [app.citizen_id, 'Application Rejected', `Application ${app.application_number} rejected. Reason: ${rejection_reason}`]
    );
    await logActivity('officer', req.user.id, `Rejected ${app.application_number}`, req.ip);
    return successResponse(res, null, 'Application rejected');
  } catch (err) { return errorResponse(res, err.message); }
};


exports.getPensionApplications = async (req, res) => {
  try {
    const { search, status } = req.query;
    const { department_id } = await getOfficerDept(req.user.id);
    let where = 'pa.department_id=?';
    const params = [department_id];

    if (status) { where += ' AND pa.status=?'; params.push(status); }
    if (search) {
      where += ' AND (pa.application_number LIKE ? OR e.name LIKE ? OR e.employee_id_no LIKE ?)';
      const s = '%' + search + '%';
      params.push(s, s, s);
    }

    const [rows] = await pool.execute(
      `SELECT pa.*,e.name as employee_name,d.name as department_name FROM pension_applications pa
       JOIN employees e ON pa.employee_id=e.id JOIN departments d ON pa.department_id=d.id
       WHERE ${where} ORDER BY pa.created_at DESC`, params);
    return successResponse(res, rows);
  } catch (err) { return errorResponse(res, err.message); }
};


exports.approvePension = async (req, res) => {
  try {
    const { remarks } = req.body;
    const [rows] = await pool.execute('SELECT * FROM pension_applications WHERE id=?', [req.params.id]);
    if (!rows.length) return errorResponse(res, 'Not found', 404);
    const pa = rows[0];
    if (normStatus(pa.status) !== 'submitted') return errorResponse(res, 'This application has already been reviewed.', 400);
    await pool.execute("UPDATE pension_applications SET status='officer_approved',officer_remarks=?,officer_id=? WHERE id=?", [remarks || null, req.user.id, req.params.id]);
    await pool.execute("INSERT INTO notifications (user_type,user_id,title,message,type) VALUES ('employee',?,?,?,'info')", [pa.employee_id, 'Pension Approved by Officer', `Pension application ${pa.application_number} approved by officer and forwarded to admin for final approval.`]);
    await logActivity('officer', req.user.id, `Approved pension application ${pa.application_number}`, req.ip);
    return successResponse(res, null, 'Pension application approved and forwarded to admin.');
  } catch (err) { return errorResponse(res, err.message); }
};


exports.rejectPension = async (req, res) => {
  try {
    const { rejection_reason } = req.body;
    if (!rejection_reason) return errorResponse(res, 'Rejection reason is required', 400);
    const [rows] = await pool.execute('SELECT * FROM pension_applications WHERE id=?', [req.params.id]);
    if (!rows.length) return errorResponse(res, 'Not found', 404);
    const pa = rows[0];
    if (normStatus(pa.status) !== 'submitted') return errorResponse(res, 'This application has already been reviewed.', 400);
    await pool.execute("UPDATE pension_applications SET status='rejected',officer_remarks=?,rejection_reason=?,officer_id=? WHERE id=?", [null, rejection_reason, req.user.id, req.params.id]);
    await pool.execute("INSERT INTO notifications (user_type,user_id,title,message,type) VALUES ('employee',?,?,?,'error')", [pa.employee_id, 'Pension Rejected', `Pension application ${pa.application_number} rejected by officer. Reason: ${rejection_reason}`]);
    await logActivity('officer', req.user.id, `Rejected pension application ${pa.application_number}`, req.ip);
    return successResponse(res, null, 'Pension application rejected');
  } catch (err) { return errorResponse(res, err.message); }
};


exports.getReports = async (req, res) => {
  try {
    const { department_id } = await getOfficerDept(req.user.id);
    const [monthly] = await pool.execute(
      `SELECT DATE_FORMAT(created_at,'%Y-%m') as month, COUNT(*) as total,
       SUM(status='completed') as approved, SUM(status='rejected') as rejected
       FROM applications WHERE department_id=? GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY month DESC LIMIT 12`, [department_id]);
    const [byCert] = await pool.execute(
      `SELECT ct.name, COUNT(a.id) as total, SUM(a.status='completed') as approved
       FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id
       WHERE a.department_id=? GROUP BY ct.id`, [department_id]);
    return successResponse(res, { monthly_stats: monthly, by_certificate_type: byCert });
  } catch (err) { return errorResponse(res, err.message); }
};