const { pool } = require('../../config/db');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { logActivity } = require('../../utils/logger');

const getEmpDept = async (empId) => {
  const [r] = await pool.execute('SELECT department_id,district_id FROM employees WHERE id=?', [empId]);
  return r[0] || {};
};

exports.getDashboard = async (req, res) => {
  try {
    const { department_id, district_id } = await getEmpDept(req.user.id);
    const [stats] = await pool.execute(
      `SELECT SUM(status='submitted') as pending, SUM(status='under_verification') as under_verification,
       SUM(status='verified') as verified, SUM(status='returned') as returned, COUNT(*) as total_assigned
       FROM applications WHERE employee_id=? OR (employee_id IS NULL AND department_id=? AND district_id=? AND status='submitted')`,
      [req.user.id, department_id, district_id]);
    const [pending] = await pool.execute(
      `SELECT a.*,ct.name as certificate_name,c.first_name,c.last_name,c.mobile
       FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id JOIN citizens c ON a.citizen_id=c.id
       WHERE (a.employee_id=? OR (a.employee_id IS NULL AND a.department_id=? AND a.district_id=?))
       AND a.status IN ('submitted','under_verification') ORDER BY a.submitted_at ASC LIMIT 10`,
      [req.user.id, department_id, district_id]);
    const [notifs] = await pool.execute("SELECT * FROM notifications WHERE user_type='employee' AND user_id=? ORDER BY created_at DESC LIMIT 10", [req.user.id]);
    return successResponse(res, { stats: stats[0], pending_applications: pending, notifications: notifs });
  } catch (err) { return errorResponse(res, err.message); }
};

exports.getAssignedApplications = async (req, res) => {
  try {
    const { status, certificate_type_id, search, sort, page=1, limit=10 } = req.query;
    const safeLimit = Math.max(parseInt(limit, 10) || 10, 1);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeOffset = (safePage - 1) * safeLimit;

    const { department_id, district_id } = await getEmpDept(req.user.id);
    let where = "(a.employee_id=? OR (a.employee_id IS NULL AND a.department_id=? AND a.district_id=? AND a.status='submitted'))";
    const params = [req.user.id, department_id, district_id];

    if (status) { where += ' AND a.status=?'; params.push(status); }
    if (certificate_type_id) { where += ' AND a.certificate_type_id=?'; params.push(certificate_type_id); }
    if (search) {
      where += ' AND (a.application_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.mobile LIKE ? OR c.aadhaar_number LIKE ? OR ct.name LIKE ?)';
      const s = '%' + search + '%';
      params.push(s, s, s, s, s, s);
    }

    const orderBy = sort === 'newest' ? 'ORDER BY a.submitted_at DESC' : 'ORDER BY a.submitted_at ASC';

    const [rows] = await pool.execute(
      `SELECT a.*,ct.name as certificate_name,c.first_name,c.last_name,c.mobile,c.aadhaar_number
       FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id JOIN citizens c ON a.citizen_id=c.id
       WHERE ${where} ${orderBy} LIMIT ${safeLimit} OFFSET ${safeOffset}`, params);
    return successResponse(res, rows);
  } catch (err) { return errorResponse(res, err.message); }
};

exports.getApplicationDetail = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.*,ct.name as certificate_name,ct.required_documents,ct.instructions,
       c.first_name,c.last_name,c.mobile,c.email,c.aadhaar_number,c.father_name,c.mother_name,c.dob,c.gender,c.category,
       c.house_number,c.street,c.area,c.village,c.pin_code,dist.name as district_name,s.name as state_name
       FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id JOIN citizens c ON a.citizen_id=c.id
       LEFT JOIN districts dist ON c.district_id=dist.id LEFT JOIN states s ON c.state_id=s.id
       WHERE a.id=?`, [req.params.id]);
    if (!rows.length) return errorResponse(res, 'Application not found', 404);
    const [docs] = await pool.execute('SELECT * FROM application_documents WHERE application_id=?', [req.params.id]);
    return successResponse(res, { application: rows[0], documents: docs });
  } catch (err) { return errorResponse(res, err.message); }
};

// FIX: verify/return/reject previously had no check that the application
// actually belonged to this employee's department/district (or was already
// assigned to them) — any logged-in employee could act on *any* application
// just by knowing/guessing its numeric ID, regardless of department. This
// helper enforces the same scoping used to build their queue in the first place.
const assertOwnedByEmployee = async (appId, empId) => {
  const { department_id, district_id } = await getEmpDept(empId);
  const [rows] = await pool.execute('SELECT * FROM applications WHERE id=?', [appId]);
  if (!rows.length) return { error: 'Not found', status: 404 };
  const app = rows[0];
  const owned = app.employee_id === empId ||
    (app.employee_id === null && app.department_id === department_id && app.district_id === district_id);
  if (!owned) return { error: 'This application is not in your queue.', status: 403 };
  return { app };
};

exports.verifyApplication = async (req, res) => {
  try {
    const { remarks } = req.body;
    const { app, error, status } = await assertOwnedByEmployee(req.params.id, req.user.id);
    if (error) return errorResponse(res, error, status);
    if (!['submitted','under_verification'].includes(app.status)) return errorResponse(res, 'Application cannot be verified at its current stage', 400);
    await pool.execute("UPDATE applications SET status='verified',employee_id=?,employee_remarks=?,verified_at=NOW() WHERE id=?", [req.user.id, remarks||null, req.params.id]);
    await pool.execute("INSERT INTO notifications (user_type,user_id,title,message,type) VALUES ('citizen',?,?,?,'info')", [app.citizen_id,'Application Verified',`Application ${app.application_number} verified and forwarded for officer approval.`]);
    await logActivity('employee', req.user.id, `Verified application ${app.application_number}`, req.ip);
    return successResponse(res, null, 'Application verified and forwarded to officer');
  } catch (err) { return errorResponse(res, err.message); }
};

exports.returnApplication = async (req, res) => {
  try {
    const { return_reason } = req.body;
    if (!return_reason) return errorResponse(res, 'Return reason is required', 400);
    const { app, error, status } = await assertOwnedByEmployee(req.params.id, req.user.id);
    if (error) return errorResponse(res, error, status);
    if (!['submitted','under_verification'].includes(app.status)) return errorResponse(res, 'Application cannot be returned at its current stage', 400);
    await pool.execute("UPDATE applications SET status='returned',employee_id=?,return_reason=? WHERE id=?", [req.user.id, return_reason, req.params.id]);
    await pool.execute("INSERT INTO notifications (user_type,user_id,title,message,type) VALUES ('citizen',?,?,?,'warning')", [app.citizen_id,'Application Returned',`Application ${app.application_number} returned. Reason: ${return_reason}`]);
    await logActivity('employee', req.user.id, `Returned application ${app.application_number}`, req.ip);
    return successResponse(res, null, 'Application returned to citizen');
  } catch (err) { return errorResponse(res, err.message); }
};

exports.rejectApplication = async (req, res) => {
  try {
    const { rejection_reason } = req.body;
    if (!rejection_reason) return errorResponse(res, 'Rejection reason is required', 400);
    const { app, error, status } = await assertOwnedByEmployee(req.params.id, req.user.id);
    if (error) return errorResponse(res, error, status);
    if (!['submitted','under_verification'].includes(app.status)) return errorResponse(res, 'Application cannot be rejected at its current stage', 400);
    await pool.execute("UPDATE applications SET status='rejected',employee_id=?,rejection_reason=? WHERE id=?", [req.user.id, rejection_reason, req.params.id]);
    await pool.execute("INSERT INTO notifications (user_type,user_id,title,message,type) VALUES ('citizen',?,?,?,'error')", [app.citizen_id,'Application Rejected',`Application ${app.application_number} rejected. Reason: ${rejection_reason}`]);
    await logActivity('employee', req.user.id, `Rejected application ${app.application_number}`, req.ip);
    return successResponse(res, null, 'Application rejected');
  } catch (err) { return errorResponse(res, err.message); }
};

exports.getPensionApplications = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT pa.*,d.name as department_name FROM pension_applications pa JOIN departments d ON pa.department_id=d.id WHERE pa.employee_id=? ORDER BY pa.created_at DESC', [req.user.id]);
    return successResponse(res, rows);
  } catch (err) { return errorResponse(res, err.message); }
};

exports.applyForPension = async (req, res) => {
  try {
    const { employee_name, designation, date_of_joining, date_of_retirement, years_of_service, basic_salary, estimated_pension, bank_name, bank_account, bank_ifsc } = req.body;
    const [empRow] = await pool.execute('SELECT department_id,employee_id_no FROM employees WHERE id=?', [req.user.id]);
    const { department_id, employee_id_no } = empRow[0];
    const appNum = 'PEN' + new Date().getFullYear() + String(new Date().getMonth()+1).padStart(2,'0') + String(new Date().getDate()).padStart(2,'0') + Math.floor(1000+Math.random()*9000);
    await pool.execute(
      'INSERT INTO pension_applications (application_number,employee_id,department_id,employee_name,employee_id_no,designation,date_of_joining,date_of_retirement,years_of_service,basic_salary,estimated_pension,bank_name,bank_account,bank_ifsc,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,\'submitted\')',
      [appNum, req.user.id, department_id, employee_name, employee_id_no, designation||null, date_of_joining||null, date_of_retirement||null, years_of_service||null, basic_salary||null, estimated_pension||null, bank_name||null, bank_account||null, bank_ifsc||null]);
    return successResponse(res, { application_number: appNum }, 'Pension application submitted!', 201);
  } catch (err) { return errorResponse(res, err.message); }
};

// FIX (new feature): after officer + admin both approve a pension
// application, the employee had no way to actually obtain a pension
// letter/receipt. This serves the PDF generated at admin-approval time.
exports.downloadPensionLetter = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM pension_applications WHERE id=? AND employee_id=?', [req.params.id, req.user.id]);
    if (!rows.length) return errorResponse(res, 'Not found', 404);
    const pa = rows[0];
    if (pa.status !== 'approved' || !pa.letter_path) {
      return errorResponse(res, 'Your pension letter is not available yet — it will be ready once fully approved.', 400);
    }
    return successResponse(res, { letter_path: pa.letter_path, application_number: pa.application_number });
  } catch (err) { return errorResponse(res, err.message); }
};
