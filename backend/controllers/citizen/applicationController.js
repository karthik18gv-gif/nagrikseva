const { pool } = require('../../config/db');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const generateAppNumber = require('../../utils/generateAppNumber');
const { logActivity } = require('../../utils/logger');

exports.applyForCertificate = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { certificate_type_id, purpose, applicant_details } = req.body;
    const cid = req.user.id;
    const [ct] = await conn.execute('SELECT ct.*,d.id as dept_id FROM certificate_types ct JOIN departments d ON ct.department_id=d.id WHERE ct.id=? AND ct.is_active=1', [certificate_type_id]);
    if (!ct.length) { await conn.rollback(); return errorResponse(res, 'Certificate type not found', 404); }
    const [cr] = await conn.execute('SELECT district_id FROM citizens WHERE id=?', [cid]);
    const district_id = cr[0]?.district_id || 1;

    // FIX: generateAppNumber only has a 4-digit random suffix (9000 possible
    // values per day) against a UNIQUE column — on a busy day two citizens
    // could collide and the whole submission would fail with a duplicate-key
    // error. Retry with a fresh number a few times before giving up.
    let app_num, r;
    for (let attempt = 0; attempt < 5; attempt++) {
      app_num = generateAppNumber('NS');
      try {
        [r] = await conn.execute(
          'INSERT INTO applications (application_number,citizen_id,certificate_type_id,department_id,district_id,status,purpose,applicant_details) VALUES (?,?,?,?,?,?,?,?)',
          [app_num, cid, certificate_type_id, ct[0].dept_id, district_id, 'submitted', purpose||null, applicant_details ? JSON.stringify(applicant_details) : null]
        );
        break;
      } catch (dupErr) {
        if (dupErr.code === 'ER_DUP_ENTRY' && attempt < 4) continue;
        throw dupErr;
      }
    }
    if (req.files?.length) {
      for (const f of req.files)
        await conn.execute('INSERT INTO application_documents (application_id,document_name,document_type,file_path,file_size) VALUES (?,?,?,?,?)', [r.insertId, f.originalname, f.mimetype, f.filename, f.size]);
    }
    await conn.execute("INSERT INTO notifications (user_type,user_id,title,message,type) VALUES ('citizen',?,?,?,'success')", [cid, 'Application Submitted', `Application ${app_num} submitted for ${ct[0].name}.`]);
    await conn.commit();
    await logActivity('citizen', cid, `Applied for ${ct[0].name}`, req.ip);
    return successResponse(res, { application_number: app_num, application_id: r.insertId }, 'Application submitted!', 201);
  } catch (err) { await conn.rollback(); return errorResponse(res, err.message); }
  finally { conn.release(); }
};

exports.getMyApplications = async (req, res) => {
  try {
    const { status, search, department_id, certificate_type_id, page = 1, limit = 10 } = req.query;

    const safeLimit = Math.max(parseInt(limit, 10) || 10, 1);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeOffset = (safePage - 1) * safeLimit;

    let where = 'a.citizen_id=?';
    const params = [req.user.id];

    if (status) { where += ' AND a.status=?'; params.push(status); }
    if (department_id) { where += ' AND a.department_id=?'; params.push(department_id); }
    if (certificate_type_id) { where += ' AND a.certificate_type_id=?'; params.push(certificate_type_id); }
    if (search) {
      where += ' AND (a.application_number LIKE ? OR ct.name LIKE ? OR d.name LIKE ?)';
      const s = '%' + search + '%';
      params.push(s, s, s);
    }

    const q = `SELECT a.*,ct.name as certificate_name,d.name as department_name FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id JOIN departments d ON a.department_id=d.id WHERE ${where} ORDER BY a.created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

    const [rows] = await pool.execute(q, params);
    const [cnt] = await pool.execute(`SELECT COUNT(*) as total FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id JOIN departments d ON a.department_id=d.id WHERE ${where}`, params);
    return successResponse(res, { applications: rows, total: cnt[0].total, page: safePage, limit: safeLimit });
  } catch (err) { return errorResponse(res, err.message); }
};

exports.trackApplication = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.*,ct.name as certificate_name,ct.processing_days,d.name as department_name,e.name as employee_name,o.name as officer_name
       FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id JOIN departments d ON a.department_id=d.id
       LEFT JOIN employees e ON a.employee_id=e.id LEFT JOIN officers o ON a.officer_id=o.id
       WHERE a.application_number=? AND a.citizen_id=?`, [req.params.application_number, req.user.id]);
    if (!rows.length) return errorResponse(res, 'Application not found', 404);
    const [docs] = await pool.execute('SELECT * FROM application_documents WHERE application_id=?', [rows[0].id]);
    return successResponse(res, { application: rows[0], documents: docs });
  } catch (err) { return errorResponse(res, err.message); }
};

exports.getApplicationDetail = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.*,ct.name as certificate_name,ct.required_documents,ct.instructions,d.name as department_name
       FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id JOIN departments d ON a.department_id=d.id
       WHERE a.id=? AND a.citizen_id=?`, [req.params.id, req.user.id]);
    if (!rows.length) return errorResponse(res, 'Application not found', 404);
    const [docs] = await pool.execute('SELECT * FROM application_documents WHERE application_id=?', [rows[0].id]);
    return successResponse(res, { application: rows[0], documents: docs });
  } catch (err) { return errorResponse(res, err.message); }
};

exports.cancelApplication = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM applications WHERE id=? AND citizen_id=?', [req.params.id, req.user.id]);
    if (!rows.length) return errorResponse(res, 'Not found', 404);
    if (!['submitted','draft'].includes(rows[0].status)) return errorResponse(res, 'Cannot cancel at this stage', 400);
    await pool.execute('UPDATE applications SET status="cancelled" WHERE id=?', [req.params.id]);
    return successResponse(res, null, 'Application cancelled');
  } catch (err) { return errorResponse(res, err.message); }
};

// FIX (new — closes the "returned" dead end for ALL departments/certificate
// types): previously, once an application was set to 'returned' (by an
// employee OR by admin's override), there was NO path back into the
// pipeline. Employee queues only pick up unassigned applications with
// status='submitted'; officer queues only pick up status='verified'. A
// returned application matched neither, so it sat invisible forever —
// regardless of which department it belonged to. This lets the citizen fix
// up their submission and send it back through the normal flow.
exports.resubmitApplication = async (req, res) => {
  try {
    const { purpose } = req.body;
    const [rows] = await pool.execute('SELECT * FROM applications WHERE id=? AND citizen_id=?', [req.params.id, req.user.id]);
    if (!rows.length) return errorResponse(res, 'Not found', 404);
    const app = rows[0];
    if (app.status !== 'returned') return errorResponse(res, 'Only returned applications can be resubmitted.', 400);

    // Clear out the previous review's assignment/remarks so this re-enters
    // the employee's queue as a fresh, unassigned 'submitted' application —
    // exactly like a brand new application would.
    await pool.execute(
      `UPDATE applications SET status='submitted', employee_id=NULL, officer_id=NULL,
       employee_remarks=NULL, return_reason=NULL, purpose=COALESCE(?, purpose),
       submitted_at=NOW(), updated_at=NOW() WHERE id=?`,
      [purpose || null, req.params.id]
    );
    await pool.execute("INSERT INTO notifications (user_type,user_id,title,message,type) VALUES ('citizen',?,?,?,'info')",
      [req.user.id, 'Application Resubmitted', `Application ${app.application_number} has been resubmitted and is back in the review queue.`]);
    await logActivity('citizen', req.user.id, `Resubmitted application ${app.application_number}`, req.ip);
    return successResponse(res, null, 'Application resubmitted successfully');
  } catch (err) { return errorResponse(res, err.message); }
};

exports.downloadCertificate = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM applications WHERE id=? AND citizen_id=? AND status="completed"', [req.params.id, req.user.id]);
    if (!rows.length) return errorResponse(res, 'Certificate not available', 404);
    await pool.execute('INSERT INTO certificate_downloads (application_id,citizen_id,ip_address) VALUES (?,?,?)', [req.params.id, req.user.id, req.ip]);
    return successResponse(res, { certificate_path: rows[0].certificate_path, certificate_number: rows[0].certificate_number });
  } catch (err) { return errorResponse(res, err.message); }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const cid = req.user.id;
    const [stats] = await pool.execute(
      `SELECT COUNT(*) as total, SUM(status IN('submitted','under_verification','verified','under_review')) as pending,
       SUM(status IN('approved','completed')) as approved, SUM(status='rejected') as rejected, SUM(status='completed') as completed
       FROM applications WHERE citizen_id=?`, [cid]);
    const [recent] = await pool.execute(`SELECT a.*,ct.name as certificate_name FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id WHERE a.citizen_id=? ORDER BY a.created_at DESC LIMIT 5`, [cid]);
    const [notifs] = await pool.execute("SELECT * FROM notifications WHERE user_type='citizen' AND user_id=? ORDER BY created_at DESC LIMIT 10", [cid]);
    const [ann] = await pool.execute('SELECT * FROM announcements WHERE is_active=1 ORDER BY created_at DESC LIMIT 3');
    return successResponse(res, { stats: stats[0], recent_applications: recent, notifications: notifs, announcements: ann });
  } catch (err) { return errorResponse(res, err.message); }
};