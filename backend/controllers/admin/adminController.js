const bcrypt = require('bcryptjs');
const { pool } = require('../../config/db');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { logActivity, logAudit } = require('../../utils/logger');
const { generateCertificatePDF, generatePensionLetterPDF } = require('../../utils/certificateGenerator');


exports.getDashboard = async (req, res) => {
  try {
    const [[citizenCount],[empCount],[offCount],[appStats],[pensionStats],[recentApps],[monthly],[byCert]] = await Promise.all([
      pool.execute('SELECT COUNT(*) as total FROM citizens WHERE is_active=1'),
      pool.execute('SELECT COUNT(*) as total FROM employees WHERE is_active=1'),
      pool.execute('SELECT COUNT(*) as total FROM officers WHERE is_active=1'),
      pool.execute("SELECT COUNT(*) as total, SUM(status='completed') as approved, SUM(status='rejected') as rejected, SUM(status IN('submitted','under_verification','verified','under_review')) as pending FROM applications"),
      pool.execute("SELECT COUNT(*) as total, SUM(status='approved') as approved FROM pension_applications"),
      pool.execute('SELECT a.*,ct.name as certificate_name,c.first_name,c.last_name FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id JOIN citizens c ON a.citizen_id=c.id ORDER BY a.created_at DESC LIMIT 10'),
      pool.execute("SELECT DATE_FORMAT(created_at,'%Y-%m') as month, COUNT(*) as total FROM applications GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY month DESC LIMIT 12"),
      pool.execute('SELECT ct.name, COUNT(a.id) as total FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id GROUP BY ct.id ORDER BY total DESC'),
    ]);
    return successResponse(res, {
      counts: { citizens: citizenCount[0].total, employees: empCount[0].total, officers: offCount[0].total },
      application_stats: appStats[0], pension_stats: pensionStats[0],
      recent_applications: recentApps, monthly_trend: monthly, by_certificate_type: byCert
    });
  } catch (err) { return errorResponse(res, err.message); }
};


exports.getAllCitizens = async (req, res) => {
  try {
    const { search, is_active, page = 1, limit = 15 } = req.query;
    const safeLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeOffset = (safePage - 1) * safeLimit;

    let where = '1=1'; const params = [];
    if (search) { where += ' AND (first_name LIKE ? OR last_name LIKE ? OR mobile LIKE ? OR email LIKE ? OR aadhaar_number LIKE ? OR username LIKE ?)'; const s = '%' + search + '%'; params.push(s,s,s,s,s,s); }
    if (is_active !== undefined && is_active !== '') { where += ' AND is_active=?'; params.push(parseInt(is_active, 10)); }

    const [rows] = await pool.execute(
      `SELECT id,username,email,first_name,last_name,mobile,aadhaar_number,is_active,created_at FROM citizens WHERE ${where} ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
    );
    const [cnt] = await pool.execute(`SELECT COUNT(*) as total FROM citizens WHERE ${where}`, params);
    return successResponse(res, { citizens: rows, total: cnt[0].total });
  } catch (err) { return errorResponse(res, err.message); }
};


exports.getCitizenDetail = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM citizens WHERE id=?', [req.params.id]);
    if (!rows.length) return errorResponse(res, 'Not found', 404);
    const { password, security_answer, ...data } = rows[0];
    const [apps] = await pool.execute('SELECT a.*,ct.name as certificate_name FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id WHERE a.citizen_id=? ORDER BY a.created_at DESC', [req.params.id]);
    return successResponse(res, { citizen: data, applications: apps });
  } catch (err) { return errorResponse(res, err.message); }
};


exports.toggleCitizenStatus = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT is_active FROM citizens WHERE id=?', [req.params.id]);
    if (!rows.length) return errorResponse(res, 'Not found', 404);
    const newStatus = rows[0].is_active ? 0 : 1;
    await pool.execute('UPDATE citizens SET is_active=? WHERE id=?', [newStatus, req.params.id]);
    await logAudit('admin', req.user.id, `${newStatus ? 'Activated' : 'Deactivated'} citizen account`, 'citizens', req.params.id, { is_active: rows[0].is_active }, { is_active: newStatus });
    return successResponse(res, null, `Citizen ${newStatus ? 'activated' : 'deactivated'}`);
  } catch (err) { return errorResponse(res, err.message); }
};


exports.getAllEmployees = async (req, res) => {
  try {
    const { search, department_id, is_active } = req.query;
    let where = '1=1'; const params = [];
    if (search) {
      where += ' AND (e.name LIKE ? OR e.employee_id_no LIKE ? OR e.email LIKE ? OR e.phone LIKE ? OR e.designation LIKE ? OR e.username LIKE ?)';
      const s = '%' + search + '%';
      params.push(s, s, s, s, s, s);
    }
    if (department_id) { where += ' AND e.department_id=?'; params.push(department_id); }
    if (is_active !== undefined && is_active !== '') { where += ' AND e.is_active=?'; params.push(parseInt(is_active, 10)); }

    const [rows] = await pool.execute(
      `SELECT e.*,d.name as department_name,dist.name as district_name FROM employees e LEFT JOIN departments d ON e.department_id=d.id LEFT JOIN districts dist ON e.district_id=dist.id WHERE ${where} ORDER BY e.created_at DESC`,
      params
    );
    return successResponse(res, rows);
  } catch (err) { return errorResponse(res, err.message); }
};


exports.createEmployee = async (req, res) => {
  try {
    const { name, username, email, password, phone, designation, department_id, district_id, employee_id_no } = req.body;
    if (!name || !name.trim()) return errorResponse(res, 'Employee name is required.', 400);
    if (!username || !username.trim()) return errorResponse(res, 'Username is required.', 400);
    if (!email || !email.trim()) return errorResponse(res, 'Email is required.', 400);
    if (!password || password.length < 6) return errorResponse(res, 'Password must be at least 6 characters.', 400);
    if (!employee_id_no || !employee_id_no.trim()) return errorResponse(res, 'Employee ID No. is required.', 400);
    if (!department_id) return errorResponse(res, 'Department assignment is required.', 400);

    const cleanEmpId = employee_id_no.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();
    const cleanPhone = phone ? phone.trim() : null;

    // Check unique employee credentials
    const [dup] = await pool.execute(
      'SELECT employee_id_no, username, email, phone FROM employees WHERE employee_id_no=? OR username=? OR email=? OR (phone IS NOT NULL AND phone=?)',
      [cleanEmpId, cleanUsername, cleanEmail, cleanPhone || '___NO_PHONE___']
    );
    if (dup.length > 0) {
      const d = dup[0];
      if (d.employee_id_no === cleanEmpId) return errorResponse(res, 'An employee with this Employee ID Number already exists.', 409);
      if (d.username.toLowerCase() === cleanUsername.toLowerCase()) return errorResponse(res, 'Username is already taken by another employee.', 409);
      if (d.email.toLowerCase() === cleanEmail) return errorResponse(res, 'Email is already registered for another employee.', 409);
      if (cleanPhone && d.phone === cleanPhone) return errorResponse(res, 'Phone number is already associated with another employee.', 409);
      return errorResponse(res, 'An employee with these unique credentials already exists.', 409);
    }

    // Check same employee name in same department warning/blocking
    const [sameNameDept] = await pool.execute(
      'SELECT id FROM employees WHERE LOWER(TRIM(name))=LOWER(?) AND department_id=?',
      [name.trim(), department_id]
    );
    if (sameNameDept.length > 0) {
      return errorResponse(res, 'An employee with the exact same name is already assigned to this department. Please verify the name or department.', 409);
    }

    const hashed = await bcrypt.hash(password, 10);
    const [r] = await pool.execute(
      'INSERT INTO employees (name,username,email,password,phone,designation,department_id,district_id,employee_id_no) VALUES (?,?,?,?,?,?,?,?,?)',
      [name.trim(), cleanUsername, cleanEmail, hashed, cleanPhone, designation ? designation.trim() : null, department_id, district_id || 1, cleanEmpId]
    );
    await logActivity('admin', req.user.id, `Created employee: ${cleanUsername} (${cleanEmpId})`, req.ip);
    return successResponse(res, { id: r.insertId }, 'Employee created successfully', 201);
  } catch (err) { return errorResponse(res, err.message); }
};


exports.updateEmployee = async (req, res) => {
  try {
    const { name, email, phone, designation, department_id, district_id, employee_id_no, is_active } = req.body;
    const empId = req.params.id;

    if (!name || !name.trim()) return errorResponse(res, 'Employee name is required.', 400);
    if (!department_id) return errorResponse(res, 'Department is required.', 400);

    // If employee_id_no or email changed, ensure they don't clash with another employee
    if (employee_id_no || email || phone) {
      const [dup] = await pool.execute(
        `SELECT id, employee_id_no, email, phone FROM employees
         WHERE id != ? AND (
           (employee_id_no IS NOT NULL AND employee_id_no = ?) OR
           (email IS NOT NULL AND LOWER(email) = LOWER(?)) OR
           (phone IS NOT NULL AND phone = ?)
         )`,
        [empId, (employee_id_no || '').trim().toUpperCase(), (email || '').trim(), (phone || '').trim() || '___NO_PHONE___']
      );
      if (dup.length > 0) {
        return errorResponse(res, 'Employee ID, email, or phone is already taken by another employee.', 409);
      }
    }

    await pool.execute(
      'UPDATE employees SET name=?, email=COALESCE(?, email), phone=?, designation=?, department_id=?, district_id=?, employee_id_no=COALESCE(?, employee_id_no), is_active=? WHERE id=?',
      [name.trim(), email ? email.trim().toLowerCase() : null, phone ? phone.trim() : null, designation ? designation.trim() : null, department_id, district_id || 1, employee_id_no ? employee_id_no.trim().toUpperCase() : null, is_active !== undefined ? is_active : 1, empId]
    );
    await logActivity('admin', req.user.id, `Updated employee id: ${empId}`, req.ip);
    return successResponse(res, null, 'Employee updated successfully');
  } catch (err) { return errorResponse(res, err.message); }
};


exports.deleteEmployee = async (req, res) => {
  try {
    const empId = req.params.id;
    // Check if employee has assigned applications
    const [apps] = await pool.execute('SELECT COUNT(*) as count FROM applications WHERE employee_id=?', [empId]);
    if (apps[0].count > 0) {
      return errorResponse(res, `Cannot delete this employee because they are linked to ${apps[0].count} citizen application(s). Please deactivate their account instead to preserve audit records.`, 400);
    }
    // Check if employee has pension applications
    const [pensions] = await pool.execute('SELECT COUNT(*) as count FROM pension_applications WHERE employee_id=?', [empId]);
    if (pensions[0].count > 0) {
      return errorResponse(res, `Cannot delete this employee because they have submitted pension application(s). Please deactivate their account instead.`, 400);
    }

    await pool.execute('DELETE FROM employees WHERE id=?', [empId]);
    await logActivity('admin', req.user.id, `Deleted employee id: ${empId}`, req.ip);
    return successResponse(res, null, 'Employee deleted successfully');
  } catch (err) { return errorResponse(res, err.message); }
};


exports.getAllOfficers = async (req, res) => {
  try {
    const { search, department_id, is_active } = req.query;
    let where = '1=1'; const params = [];
    if (search) {
      where += ' AND (o.name LIKE ? OR o.officer_id_no LIKE ? OR o.email LIKE ? OR o.phone LIKE ? OR o.designation LIKE ? OR o.username LIKE ?)';
      const s = '%' + search + '%';
      params.push(s, s, s, s, s, s);
    }
    if (department_id) { where += ' AND o.department_id=?'; params.push(department_id); }
    if (is_active !== undefined && is_active !== '') { where += ' AND o.is_active=?'; params.push(parseInt(is_active, 10)); }

    const [rows] = await pool.execute(
      `SELECT o.*,d.name as department_name,dist.name as district_name FROM officers o LEFT JOIN departments d ON o.department_id=d.id LEFT JOIN districts dist ON o.district_id=dist.id WHERE ${where} ORDER BY o.created_at DESC`,
      params
    );
    return successResponse(res, rows);
  } catch (err) { return errorResponse(res, err.message); }
};


exports.createOfficer = async (req, res) => {
  try {
    const { name, username, email, password, phone, designation, department_id, district_id, officer_id_no } = req.body;
    if (!name || !name.trim()) return errorResponse(res, 'Officer name is required.', 400);
    if (!username || !username.trim()) return errorResponse(res, 'Username is required.', 400);
    if (!email || !email.trim()) return errorResponse(res, 'Email is required.', 400);
    if (!password || password.length < 6) return errorResponse(res, 'Password must be at least 6 characters.', 400);
    if (!officer_id_no || !officer_id_no.trim()) return errorResponse(res, 'Officer ID No. is required.', 400);
    if (!department_id) return errorResponse(res, 'Department assignment is required.', 400);

    const cleanOfficerId = officer_id_no.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim();
    const cleanPhone = phone ? phone.trim() : null;

    // Check unique officer credentials
    const [dup] = await pool.execute(
      'SELECT officer_id_no, username, email, phone FROM officers WHERE officer_id_no=? OR username=? OR email=? OR (phone IS NOT NULL AND phone=?)',
      [cleanOfficerId, cleanUsername, cleanEmail, cleanPhone || '___NO_PHONE___']
    );
    if (dup.length > 0) {
      const d = dup[0];
      if (d.officer_id_no === cleanOfficerId) return errorResponse(res, 'An officer with this Officer ID Number already exists.', 409);
      if (d.username.toLowerCase() === cleanUsername.toLowerCase()) return errorResponse(res, 'Username is already taken by another officer.', 409);
      if (d.email.toLowerCase() === cleanEmail) return errorResponse(res, 'Email is already registered for another officer.', 409);
      if (cleanPhone && d.phone === cleanPhone) return errorResponse(res, 'Phone number is already associated with another officer.', 409);
      return errorResponse(res, 'An officer with these unique credentials already exists.', 409);
    }

    // Check same officer name in same department
    const [sameNameDept] = await pool.execute(
      'SELECT id FROM officers WHERE LOWER(TRIM(name))=LOWER(?) AND department_id=?',
      [name.trim(), department_id]
    );
    if (sameNameDept.length > 0) {
      return errorResponse(res, 'An officer with the exact same name is already assigned to this department. Please verify the name or department.', 409);
    }

    const hashed = await bcrypt.hash(password, 10);
    const [r] = await pool.execute(
      'INSERT INTO officers (name,username,email,password,phone,designation,department_id,district_id,officer_id_no) VALUES (?,?,?,?,?,?,?,?,?)',
      [name.trim(), cleanUsername, cleanEmail, hashed, cleanPhone, designation ? designation.trim() : null, department_id, district_id || 1, cleanOfficerId]
    );
    await logActivity('admin', req.user.id, `Created officer: ${cleanUsername} (${cleanOfficerId})`, req.ip);
    return successResponse(res, { id: r.insertId }, 'Officer created successfully', 201);
  } catch (err) { return errorResponse(res, err.message); }
};


exports.updateOfficer = async (req, res) => {
  try {
    const { name, email, phone, designation, department_id, district_id, officer_id_no, is_active } = req.body;
    const offId = req.params.id;

    if (!name || !name.trim()) return errorResponse(res, 'Officer name is required.', 400);
    if (!department_id) return errorResponse(res, 'Department is required.', 400);

    if (officer_id_no || email || phone) {
      const [dup] = await pool.execute(
        `SELECT id, officer_id_no, email, phone FROM officers
         WHERE id != ? AND (
           (officer_id_no IS NOT NULL AND officer_id_no = ?) OR
           (email IS NOT NULL AND LOWER(email) = LOWER(?)) OR
           (phone IS NOT NULL AND phone = ?)
         )`,
        [offId, (officer_id_no || '').trim().toUpperCase(), (email || '').trim(), (phone || '').trim() || '___NO_PHONE___']
      );
      if (dup.length > 0) {
        return errorResponse(res, 'Officer ID, email, or phone is already taken by another officer.', 409);
      }
    }

    await pool.execute(
      'UPDATE officers SET name=?, email=COALESCE(?, email), phone=?, designation=?, department_id=?, district_id=?, officer_id_no=COALESCE(?, officer_id_no), is_active=? WHERE id=?',
      [name.trim(), email ? email.trim().toLowerCase() : null, phone ? phone.trim() : null, designation ? designation.trim() : null, department_id, district_id || 1, officer_id_no ? officer_id_no.trim().toUpperCase() : null, is_active !== undefined ? is_active : 1, offId]
    );
    await logActivity('admin', req.user.id, `Updated officer id: ${offId}`, req.ip);
    return successResponse(res, null, 'Officer updated successfully');
  } catch (err) { return errorResponse(res, err.message); }
};


exports.deleteOfficer = async (req, res) => {
  try {
    const offId = req.params.id;
    // Check if officer is assigned to applications
    const [apps] = await pool.execute('SELECT COUNT(*) as count FROM applications WHERE officer_id=?', [offId]);
    if (apps[0].count > 0) {
      return errorResponse(res, `Cannot delete this officer because they have approved or reviewed ${apps[0].count} citizen application(s). Please deactivate their account instead to maintain audit integrity.`, 400);
    }
    const [pensions] = await pool.execute('SELECT COUNT(*) as count FROM pension_applications WHERE officer_id=?', [offId]);
    if (pensions[0].count > 0) {
      return errorResponse(res, `Cannot delete this officer because they have processed pension applications. Please deactivate their account instead.`, 400);
    }

    await pool.execute('DELETE FROM officers WHERE id=?', [offId]);
    await logActivity('admin', req.user.id, `Deleted officer id: ${offId}`, req.ip);
    return successResponse(res, null, 'Officer deleted successfully');
  } catch (err) { return errorResponse(res, err.message); }
};


exports.getAllDepartments = async (req, res) => {
  try {
    const { search, is_active } = req.query;
    let where = '1=1'; const params = [];
    if (search) {
      where += ' AND (name LIKE ? OR code LIKE ? OR description LIKE ?)';
      const s = '%' + search + '%';
      params.push(s, s, s);
    }
    if (is_active !== undefined && is_active !== '') { where += ' AND is_active=?'; params.push(parseInt(is_active, 10)); }

    const [rows] = await pool.execute(`SELECT * FROM departments WHERE ${where} ORDER BY name`, params);
    return successResponse(res, rows);
  } catch (err) { return errorResponse(res, err.message); }
};


exports.createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !name.trim()) return errorResponse(res, 'Department name is required.', 400);
    if (!code || !code.trim()) return errorResponse(res, 'Department code is required.', 400);

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    // Ensure department name and code cannot be added twice
    const [dup] = await pool.execute(
      'SELECT id, name, code FROM departments WHERE LOWER(TRIM(name)) = LOWER(?) OR LOWER(TRIM(code)) = LOWER(?)',
      [cleanName, cleanCode]
    );
    if (dup.length > 0) {
      if (dup[0].code.toUpperCase() === cleanCode) {
        return errorResponse(res, `Department with code "${cleanCode}" already exists.`, 409);
      }
      return errorResponse(res, `Department with name "${cleanName}" already exists.`, 409);
    }

    const [r] = await pool.execute('INSERT INTO departments (name,code,description) VALUES (?,?,?)', [cleanName, cleanCode, description ? description.trim() : null]);
    await logActivity('admin', req.user.id, `Created department: ${cleanName} (${cleanCode})`, req.ip);
    return successResponse(res, { id: r.insertId }, 'Department created successfully', 201);
  } catch (err) { return errorResponse(res, err.message); }
};


exports.updateDepartment = async (req, res) => {
  try {
    const { name, code, description, is_active } = req.body;
    const deptId = req.params.id;

    if (!name || !name.trim()) return errorResponse(res, 'Department name is required.', 400);
    if (!code || !code.trim()) return errorResponse(res, 'Department code is required.', 400);

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    // Check for duplicate name or code excluding this department
    const [dup] = await pool.execute(
      'SELECT id FROM departments WHERE (LOWER(TRIM(name)) = LOWER(?) OR LOWER(TRIM(code)) = LOWER(?)) AND id != ?',
      [cleanName, cleanCode, deptId]
    );
    if (dup.length > 0) {
      return errorResponse(res, 'Another department with this name or code already exists.', 409);
    }

    await pool.execute(
      'UPDATE departments SET name=?, code=?, description=?, is_active=? WHERE id=?',
      [cleanName, cleanCode, description ? description.trim() : null, is_active !== undefined ? is_active : 1, deptId]
    );
    await logActivity('admin', req.user.id, `Updated department id: ${deptId}`, req.ip);
    return successResponse(res, null, 'Department updated successfully');
  } catch (err) { return errorResponse(res, err.message); }
};


exports.deleteDepartment = async (req, res) => {
  try {
    const deptId = req.params.id;
    // Check if certificates belong to this department
    const [certs] = await pool.execute('SELECT COUNT(*) as count FROM certificate_types WHERE department_id=?', [deptId]);
    if (certs[0].count > 0) {
      return errorResponse(res, `Cannot delete department: ${certs[0].count} certificate type(s) are configured under it. Please deactivate the department instead.`, 400);
    }
    // Check if employees or officers belong to this department
    const [emps] = await pool.execute('SELECT COUNT(*) as count FROM employees WHERE department_id=?', [deptId]);
    if (emps[0].count > 0) {
      return errorResponse(res, `Cannot delete department: ${emps[0].count} employee(s) are assigned to it.`, 400);
    }
    const [offs] = await pool.execute('SELECT COUNT(*) as count FROM officers WHERE department_id=?', [deptId]);
    if (offs[0].count > 0) {
      return errorResponse(res, `Cannot delete department: ${offs[0].count} officer(s) are assigned to it.`, 400);
    }

    await pool.execute('DELETE FROM departments WHERE id=?', [deptId]);
    await logActivity('admin', req.user.id, `Deleted department id: ${deptId}`, req.ip);
    return successResponse(res, null, 'Department deleted successfully');
  } catch (err) { return errorResponse(res, err.message); }
};


exports.getCertificateTypes = async (req, res) => {
  try {
    const { search, department_id, is_active, fee_type } = req.query;
    let where = '1=1'; const params = [];
    if (search) {
      where += ' AND (ct.name LIKE ? OR ct.code LIKE ? OR ct.description LIKE ? OR d.name LIKE ?)';
      const s = '%' + search + '%';
      params.push(s, s, s, s);
    }
    if (department_id) { where += ' AND ct.department_id=?'; params.push(department_id); }
    if (is_active !== undefined && is_active !== '') { where += ' AND ct.is_active=?'; params.push(parseInt(is_active, 10)); }
    if (fee_type === 'free') { where += ' AND ct.fee = 0'; }
    else if (fee_type === 'paid') { where += ' AND ct.fee > 0'; }

    const [rows] = await pool.execute(
      `SELECT ct.*,d.name as department_name FROM certificate_types ct JOIN departments d ON ct.department_id=d.id WHERE ${where} ORDER BY ct.name`,
      params
    );
    return successResponse(res, rows);
  } catch (err) { return errorResponse(res, err.message); }
};


exports.createCertificateType = async (req, res) => {
  try {
    const { department_id, name, code, description, processing_days, fee, required_documents, eligibility, instructions } = req.body;
    if (!name || !name.trim()) return errorResponse(res, 'Certificate name is required.', 400);
    if (!code || !code.trim()) return errorResponse(res, 'Certificate code is required.', 400);
    if (!department_id) return errorResponse(res, 'Department is required.', 400);

    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();

    // Check duplicate certificate name or code
    const [dup] = await pool.execute(
      'SELECT id, name, code FROM certificate_types WHERE LOWER(TRIM(name)) = LOWER(?) OR LOWER(TRIM(code)) = LOWER(?)',
      [cleanName, cleanCode]
    );
    if (dup.length > 0) {
      if (dup[0].code.toUpperCase() === cleanCode) {
        return errorResponse(res, `Certificate type with code "${cleanCode}" already exists.`, 409);
      }
      return errorResponse(res, `Certificate type "${cleanName}" already exists.`, 409);
    }

    const [r] = await pool.execute(
      'INSERT INTO certificate_types (department_id,name,code,description,processing_days,fee,required_documents,eligibility,instructions) VALUES (?,?,?,?,?,?,?,?,?)',
      [department_id, cleanName, cleanCode, description ? description.trim() : null, processing_days || 7, fee || 0, required_documents ? JSON.stringify(required_documents) : null, eligibility || null, instructions || null]
    );
    await logActivity('admin', req.user.id, `Created certificate type: ${cleanName}`, req.ip);
    return successResponse(res, { id: r.insertId }, 'Certificate type created successfully', 201);
  } catch (err) { return errorResponse(res, err.message); }
};


exports.updateCertificateType = async (req, res) => {
  try {
    const { department_id, name, code, description, processing_days, fee, required_documents, eligibility, instructions, is_active } = req.body;
    const certId = req.params.id;

    if (!name || !name.trim()) return errorResponse(res, 'Certificate name is required.', 400);

    const cleanName = name.trim();
    const cleanCode = code ? code.trim().toUpperCase() : null;

    // Check duplicate name or code excluding current ID
    if (cleanCode) {
      const [dup] = await pool.execute(
        'SELECT id FROM certificate_types WHERE (LOWER(TRIM(name)) = LOWER(?) OR LOWER(TRIM(code)) = LOWER(?)) AND id != ?',
        [cleanName, cleanCode, certId]
      );
      if (dup.length > 0) {
        return errorResponse(res, 'Another certificate type with this name or code already exists.', 409);
      }
    }

    await pool.execute(
      `UPDATE certificate_types SET
         name=?, code=COALESCE(?, code), department_id=COALESCE(?, department_id),
         description=?, processing_days=?, fee=?, required_documents=?,
         eligibility=?, instructions=?, is_active=?
       WHERE id=?`,
      [cleanName, cleanCode, department_id || null, description || null, processing_days || 7, fee || 0, required_documents ? JSON.stringify(required_documents) : null, eligibility || null, instructions || null, is_active !== undefined ? is_active : 1, certId]
    );
    await logActivity('admin', req.user.id, `Updated certificate type id: ${certId}`, req.ip);
    return successResponse(res, null, 'Certificate type updated successfully');
  } catch (err) { return errorResponse(res, err.message); }
};


exports.deleteCertificateType = async (req, res) => {
  try {
    const certId = req.params.id;
    // Check if citizen applications exist for this certificate
    const [apps] = await pool.execute('SELECT COUNT(*) as count FROM applications WHERE certificate_type_id=?', [certId]);
    if (apps[0].count > 0) {
      return errorResponse(res, `Cannot delete certificate service: ${apps[0].count} application(s) exist under it. Please deactivate the service instead.`, 400);
    }

    await pool.execute('DELETE FROM certificate_types WHERE id=?', [certId]);
    await logActivity('admin', req.user.id, `Deleted certificate type id: ${certId}`, req.ip);
    return successResponse(res, null, 'Certificate type deleted successfully');
  } catch (err) { return errorResponse(res, err.message); }
};


exports.getAllApplications = async (req, res) => {
  try {
    const { status, certificate_type_id, department_id, search, from_date, to_date, sort, page = 1, limit = 15 } = req.query;
    const safeLimit = Math.max(parseInt(limit, 10) || 15, 1);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeOffset = (safePage - 1) * safeLimit;

    let where = '1=1'; const params = [];
    if (status) { where += ' AND a.status=?'; params.push(status); }
    if (certificate_type_id) { where += ' AND a.certificate_type_id=?'; params.push(certificate_type_id); }
    if (department_id) { where += ' AND a.department_id=?'; params.push(department_id); }
    if (from_date) { where += ' AND DATE(a.created_at) >= ?'; params.push(from_date); }
    if (to_date) { where += ' AND DATE(a.created_at) <= ?'; params.push(to_date); }
    if (search) {
      where += ' AND (a.application_number LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.mobile LIKE ? OR c.aadhaar_number LIKE ? OR ct.name LIKE ? OR d.name LIKE ?)';
      const s = '%' + search + '%';
      params.push(s, s, s, s, s, s, s);
    }

    const orderBy = sort === 'oldest' ? 'ORDER BY a.created_at ASC' : 'ORDER BY a.created_at DESC';

    const [rows] = await pool.execute(
      `SELECT a.*,ct.name as certificate_name,c.first_name,c.last_name,c.mobile,d.name as department_name FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id JOIN citizens c ON a.citizen_id=c.id JOIN departments d ON a.department_id=d.id WHERE ${where} ${orderBy} LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      params
    );
    const [cnt] = await pool.execute(`SELECT COUNT(*) as total FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id JOIN citizens c ON a.citizen_id=c.id JOIN departments d ON a.department_id=d.id WHERE ${where}`, params);
    return successResponse(res, { applications: rows, total: cnt[0].total });
  } catch (err) { return errorResponse(res, err.message); }
};


const ADMIN_ALLOWED_STATUSES = ['rejected', 'returned', 'completed', 'cancelled'];


exports.getApplicationDetail = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.*,ct.name as certificate_name,ct.code as certificate_code,ct.required_documents,ct.instructions,
       c.first_name,c.last_name,c.mobile,c.email,c.aadhaar_number,d.name as department_name,
       e.name as employee_name,o.name as officer_name
       FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id JOIN citizens c ON a.citizen_id=c.id
       JOIN departments d ON a.department_id=d.id
       LEFT JOIN employees e ON a.employee_id=e.id LEFT JOIN officers o ON a.officer_id=o.id
       WHERE a.id=?`, [req.params.id]);
    if (!rows.length) return errorResponse(res, 'Application not found', 404);
    const [docs] = await pool.execute('SELECT * FROM application_documents WHERE application_id=?', [req.params.id]);
    return successResponse(res, { application: rows[0], documents: docs });
  } catch (err) { return errorResponse(res, err.message); }
};


exports.updateApplicationStatus = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { status, remarks } = req.body;
    if (!ADMIN_ALLOWED_STATUSES.includes(status)) {
      return errorResponse(res, `Status must be one of: ${ADMIN_ALLOWED_STATUSES.join(', ')}`, 400);
    }
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      `SELECT a.*,ct.code as certificate_code,ct.name as certificate_name,d.name as department_name,
       c.first_name,c.last_name,c.middle_name,c.father_name,c.dob,c.gender,c.category,c.aadhaar_number,
       c.house_number,c.street,c.area,c.village
       FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id
       JOIN departments d ON a.department_id=d.id JOIN citizens c ON a.citizen_id=c.id
       WHERE a.id=?`, [req.params.id]);
    if (!rows.length) { await conn.rollback(); return errorResponse(res, 'Not found', 404); }
    const app = rows[0];

    if (status === 'completed' && app.status !== 'approved') {
      await conn.rollback();
      return errorResponse(res, 'This application must be approved by an officer before it can be marked completed.', 400);
    }

    let certNum = app.certificate_number;

    // FIX (secondary bug — "app disappears after admin sets Returned"):
    // A plain UPDATE status='returned' left employee_id/officer_id still
    // pointing at the previous reviewers. Employee queue lists items where
    // `a.employee_id=? OR (a.employee_id IS NULL AND ... status='submitted')`
    // and officer queue lists only `status='verified'`, so a returned row
    // with employee_id/officer_id filled in was invisible to everyone
    // except the citizen. Now, when admin explicitly chooses "Returned",
    // we push the application back to the very start of the pipeline —
    // status='submitted', clear the employee/officer assignments and their
    // remarks/timestamps — so it re-enters employee3's queue exactly like
    // a fresh submission, and can then flow to officer3 again.
    if (status === 'returned') {
      await conn.execute(
        `UPDATE applications
           SET status='submitted',
               employee_id=NULL,
               officer_id=NULL,
               employee_remarks=NULL,
               officer_remarks=NULL,
               rejection_reason=NULL,
               return_reason=?,
               verified_at=NULL,
               approved_at=NULL,
               submitted_at=NOW(),
               updated_at=NOW()
         WHERE id=?`,
        [remarks || 'Returned by admin for re-review.', req.params.id]
      );

      await conn.execute(
        "INSERT INTO notifications (user_type,user_id,title,message,type) VALUES ('citizen',?,?,?,'warning')",
        [
          app.citizen_id,
          'Application Sent Back for Re-review',
          `Application ${app.application_number} has been sent back for re-review by admin.${remarks ? ' Remarks: ' + remarks : ''}`
        ]
      );

      await conn.commit();
      await logAudit('admin', req.user.id, `Sent application back for re-review`, 'applications', req.params.id, { status: app.status }, { status: 'submitted' });
      await logActivity('admin', req.user.id, `Sent application ${app.application_number} back to employee queue`, req.ip);
      return successResponse(res, { certificate_number: certNum }, 'Application sent back for re-review (now visible again to employee & officer).');
    }

    // For every other admin action (rejected, completed, cancelled) — the
    // original behaviour continues to apply.
    const setClauses = ['status=?', 'updated_at=NOW()'];
    const setParams = [status];

    if (status === 'rejected') { setClauses.push('rejection_reason=?'); setParams.push(remarks || 'Rejected by admin.'); }

    if (status === 'completed' && app.status !== 'completed') {
      certNum = `CERT/${app.certificate_code}/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`;
      const filename = generateCertificatePDF({
        application: app,
        citizen: app,
        certificateCode: app.certificate_code,
        departmentName: app.department_name,
        certificateNumber: certNum,
      });
      setClauses.push('certificate_number=?', 'certificate_path=?', 'completed_at=NOW()');
      setParams.push(certNum, filename);
    }

    await conn.execute(
      `UPDATE applications SET ${setClauses.join(',')} WHERE id=?`,
      [...setParams, req.params.id]
    );

    const notifType = { rejected: 'error', completed: 'success', cancelled: 'warning' }[status] || 'info';
    const notifMsg = status === 'completed'
      ? `Application ${app.application_number} completed! Your ${app.certificate_name} is ready to download. Certificate No: ${certNum}`
      : (remarks
        ? `Application ${app.application_number} status changed to "${status}" by admin. Remarks: ${remarks}`
        : `Application ${app.application_number} status changed to "${status}" by admin.`);
    await conn.execute(
      "INSERT INTO notifications (user_type,user_id,title,message,type) VALUES ('citizen',?,?,?,?)",
      [app.citizen_id, 'Application Status Updated', notifMsg, notifType]
    );

    await conn.commit();
    await logAudit('admin', req.user.id, `Changed application status to ${status}`, 'applications', req.params.id, { status: app.status }, { status });
    await logActivity('admin', req.user.id, `Overrode application ${app.application_number} status to ${status}`, req.ip);

    return successResponse(res, { certificate_number: certNum }, `Application status updated to ${status}`);
  } catch (err) { await conn.rollback(); return errorResponse(res, err.message); }
  finally { conn.release(); }
};


exports.getAllPensionApplications = async (req, res) => {
  try {
    const { search, status, department_id } = req.query;
    let where = '1=1'; const params = [];
    if (status) { where += ' AND pa.status=?'; params.push(status); }
    if (department_id) { where += ' AND pa.department_id=?'; params.push(department_id); }
    if (search) {
      where += ' AND (pa.application_number LIKE ? OR e.name LIKE ? OR e.employee_id_no LIKE ? OR pa.bank_account LIKE ? OR d.name LIKE ?)';
      const s = '%' + search + '%';
      params.push(s, s, s, s, s);
    }

    const [rows] = await pool.execute(
      `SELECT pa.*,e.name as employee_name,e.email as employee_email,e.employee_id_no,d.name as department_name FROM pension_applications pa JOIN employees e ON pa.employee_id=e.id JOIN departments d ON pa.department_id=d.id WHERE ${where} ORDER BY pa.created_at DESC`,
      params
    );
    return successResponse(res, rows);
  } catch (err) { return errorResponse(res, err.message); }
};

exports.updateAdminProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !name.trim()) return errorResponse(res, 'Name is required.', 400);
    if (!email || !email.trim()) return errorResponse(res, 'Email is required.', 400);

    const cleanEmail = email.trim().toLowerCase();
    // Check if another admin has this email
    const [dup] = await pool.execute('SELECT id FROM admins WHERE email=? AND id != ?', [cleanEmail, req.user.id]);
    if (dup.length > 0) {
      return errorResponse(res, 'This email address is already used by another administrator.', 409);
    }

    await pool.execute(
      'UPDATE admins SET name=?, email=?, phone=? WHERE id=?',
      [name.trim(), cleanEmail, phone ? phone.trim() : null, req.user.id]
    );
    await logActivity('admin', req.user.id, 'Updated admin profile details', req.ip);
    return successResponse(res, null, 'Profile updated successfully');
  } catch (err) { return errorResponse(res, err.message); }
};

exports.changeAdminPassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return errorResponse(res, 'Current password and new password are required.', 400);
    }
    if (new_password.length < 8) {
      return errorResponse(res, 'New password must be at least 8 characters long.', 400);
    }

    const [rows] = await pool.execute('SELECT password FROM admins WHERE id=?', [req.user.id]);
    if (!rows.length) return errorResponse(res, 'Admin account not found.', 404);

    const isValid = await bcrypt.compare(current_password, rows[0].password);
    if (!isValid) {
      return errorResponse(res, 'Current password does not match.', 401);
    }

    const hashed = await bcrypt.hash(new_password, 10);
    await pool.execute('UPDATE admins SET password=? WHERE id=?', [hashed, req.user.id]);
    await logActivity('admin', req.user.id, 'Changed admin account password', req.ip);
    return successResponse(res, null, 'Password changed successfully');
  } catch (err) { return errorResponse(res, err.message); }
};


const ADMIN_PENSION_STATUSES = ['approved', 'rejected'];


exports.updatePensionStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    if (!ADMIN_PENSION_STATUSES.includes(status)) {
      return errorResponse(res, `Status must be one of: ${ADMIN_PENSION_STATUSES.join(', ')}`, 400);
    }
    const [rows] = await pool.execute('SELECT * FROM pension_applications WHERE id=?', [req.params.id]);
    if (!rows.length) return errorResponse(res, 'Not found', 404);
    const pa = rows[0];

    if (status === 'approved' && pa.status !== 'officer_approved') {
      return errorResponse(res, 'This pension application must be approved by an officer first.', 400);
    }

    let letterFile = pa.letter_path;
    if (status === 'approved') {
      letterFile = generatePensionLetterPDF({ pension: pa });
      await pool.execute("UPDATE pension_applications SET status='approved',admin_remarks=?,admin_id=?,letter_path=?,approved_at=NOW() WHERE id=?", [remarks || null, req.user.id, letterFile, req.params.id]);
      await pool.execute("INSERT INTO notifications (user_type,user_id,title,message,type) VALUES ('employee',?,?,?,'success')", [pa.employee_id, 'Pension Approved!', `Pension application ${pa.application_number} approved. Your pension letter is ready to download.`]);
    } else {
      await pool.execute("UPDATE pension_applications SET status='rejected',admin_remarks=?,admin_id=? WHERE id=?", [remarks || null, req.user.id, req.params.id]);
      await pool.execute("INSERT INTO notifications (user_type,user_id,title,message,type) VALUES ('employee',?,?,?,'error')", [pa.employee_id, 'Pension Rejected', `Pension application ${pa.application_number} was rejected by admin.${remarks ? ' Reason: ' + remarks : ''}`]);
    }

    await logAudit('admin', req.user.id, `Pension application ${status}`, 'pension_applications', req.params.id, { status: pa.status }, { status });
    await logActivity('admin', req.user.id, `${status === 'approved' ? 'Approved' : 'Rejected'} pension application ${pa.application_number}`, req.ip);
    return successResponse(res, { letter_path: letterFile }, `Pension application ${status}`);
  } catch (err) { return errorResponse(res, err.message); }
};


exports.getAnnouncements = async (req, res) => { try { const [r] = await pool.execute('SELECT * FROM announcements ORDER BY created_at DESC'); return successResponse(res,r); } catch(e){ return errorResponse(res,e.message); } };
exports.createAnnouncement = async (req, res) => { try { const {title,content,type,expires_at}=req.body; const [r]=await pool.execute('INSERT INTO announcements (title,content,type,published_by,expires_at) VALUES (?,?,?,?,?)',[title,content,type||'general',req.user.id,expires_at||null]); return successResponse(res,{id:r.insertId},'Announcement created',201); } catch(e){ return errorResponse(res,e.message); } };
exports.deleteAnnouncement = async (req, res) => { try { await pool.execute('UPDATE announcements SET is_active=0 WHERE id=?',[req.params.id]); return successResponse(res,null,'Deleted'); } catch(e){ return errorResponse(res,e.message); } };
exports.getFAQs = async (req, res) => { try { const [r]=await pool.execute('SELECT * FROM faqs ORDER BY sort_order ASC'); return successResponse(res,r); } catch(e){ return errorResponse(res,e.message); } };
exports.createFAQ = async (req, res) => { try { const {question,answer,category,sort_order}=req.body; const [r]=await pool.execute('INSERT INTO faqs (question,answer,category,sort_order) VALUES (?,?,?,?)',[question,answer,category||'General',sort_order||0]); return successResponse(res,{id:r.insertId},'FAQ created',201); } catch(e){ return errorResponse(res,e.message); } };
exports.getStates = async (req,res) => { try { const [r]=await pool.execute('SELECT * FROM states ORDER BY name'); return successResponse(res,r); } catch(e){return errorResponse(res,e.message);} };
exports.getDistricts = async (req,res) => { try { const [r]=await pool.execute('SELECT d.*,s.name as state_name FROM districts d JOIN states s ON d.state_id=s.id ORDER BY d.name'); return successResponse(res,r); } catch(e){return errorResponse(res,e.message);} };
exports.getTaluks = async (req,res) => { try { const [r]=await pool.execute('SELECT t.*,d.name as district_name FROM taluks t JOIN districts d ON t.district_id=d.id ORDER BY t.name'); return successResponse(res,r); } catch(e){return errorResponse(res,e.message);} };
exports.getSupportTickets = async (req,res) => { try { const [r]=await pool.execute('SELECT st.*,c.first_name,c.last_name,c.email FROM support_tickets st JOIN citizens c ON st.citizen_id=c.id ORDER BY st.created_at DESC'); return successResponse(res,r); } catch(e){return errorResponse(res,e.message);} };
exports.resolveTicket = async (req,res) => { try { const {response}=req.body; await pool.execute("UPDATE support_tickets SET status='resolved',response=?,resolved_at=NOW() WHERE id=?",[response,req.params.id]); return successResponse(res,null,'Ticket resolved'); } catch(e){return errorResponse(res,e.message);} };
exports.getAuditLogs = async (req,res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const safeLimit = Math.max(parseInt(limit, 10) || 20, 1);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeOffset = (safePage - 1) * safeLimit;
    const [r] = await pool.execute(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`);
    return successResponse(res,r);
  } catch(e){return errorResponse(res,e.message);}
};