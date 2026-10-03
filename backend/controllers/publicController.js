const { pool } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.getCertificateTypes = async (req,res) => { try { const [r]=await pool.execute('SELECT ct.*,d.name as department_name FROM certificate_types ct JOIN departments d ON ct.department_id=d.id WHERE ct.is_active=1 ORDER BY ct.name'); return successResponse(res,r); } catch(e){return errorResponse(res,e.message);} };
exports.getCertificateTypeDetail = async (req,res) => { try { const [r]=await pool.execute('SELECT ct.*,d.name as department_name FROM certificate_types ct JOIN departments d ON ct.department_id=d.id WHERE ct.id=? AND ct.is_active=1',[req.params.id]); if(!r.length) return errorResponse(res,'Not found',404); return successResponse(res,r[0]); } catch(e){return errorResponse(res,e.message);} };
exports.getAnnouncements = async (req,res) => { try { const [r]=await pool.execute('SELECT * FROM announcements WHERE is_active=1 ORDER BY created_at DESC LIMIT 10'); return successResponse(res,r); } catch(e){return errorResponse(res,e.message);} };
exports.getFAQs = async (req,res) => { try { const [r]=await pool.execute('SELECT * FROM faqs WHERE is_active=1 ORDER BY sort_order ASC'); return successResponse(res,r); } catch(e){return errorResponse(res,e.message);} };
exports.getDepartments = async (req,res) => { try { const [r]=await pool.execute('SELECT id,name,code,description FROM departments WHERE is_active=1 ORDER BY name'); return successResponse(res,r); } catch(e){return errorResponse(res,e.message);} };
exports.getStates = async (req,res) => { try { const [r]=await pool.execute('SELECT * FROM states ORDER BY name'); return successResponse(res,r); } catch(e){return errorResponse(res,e.message);} };
exports.getDistrictsByState = async (req,res) => { try { const [r]=await pool.execute('SELECT * FROM districts WHERE state_id=? ORDER BY name',[req.params.stateId]); return successResponse(res,r); } catch(e){return errorResponse(res,e.message);} };
exports.getTaluksByDistrict = async (req,res) => { try { const [r]=await pool.execute('SELECT * FROM taluks WHERE district_id=? ORDER BY name',[req.params.districtId]); return successResponse(res,r); } catch(e){return errorResponse(res,e.message);} };
exports.getStats = async (req,res) => { try {
  const [[c],[a],[cert],[d]] = await Promise.all([
    pool.execute('SELECT COUNT(*) as total FROM citizens WHERE is_active=1'),
    pool.execute('SELECT COUNT(*) as total FROM applications'),
    pool.execute("SELECT COUNT(*) as total FROM applications WHERE status='completed'"),
    pool.execute('SELECT COUNT(*) as total FROM departments WHERE is_active=1'),
  ]);
  return successResponse(res, { registered_citizens:c[0].total, applications_processed:a[0].total, certificates_issued:cert[0].total, departments_connected:d[0].total });
} catch(e){return errorResponse(res,e.message);} };

exports.verifyCertificate = async (req, res) => {
  try {
    const { query } = req.params;
    if (!query || !query.trim()) return errorResponse(res, 'Certificate or application number is required.', 400);

    const cleanQuery = query.trim();
    const [rows] = await pool.execute(
      `SELECT a.application_number, a.certificate_number, a.status, a.completed_at, a.submitted_at,
              ct.name as certificate_name, ct.code as certificate_code, d.name as department_name,
              c.first_name, c.last_name, c.gender, dist.name as district_name
       FROM applications a
       JOIN certificate_types ct ON a.certificate_type_id = ct.id
       JOIN departments d ON a.department_id = d.id
       JOIN citizens c ON a.citizen_id = c.id
       LEFT JOIN districts dist ON c.district_id = dist.id
       WHERE a.certificate_number = ? OR a.application_number = ?`,
      [cleanQuery, cleanQuery]
    );

    if (!rows.length) {
      return errorResponse(res, 'No government certificate or application found with the provided reference number.', 404);
    }

    const app = rows[0];
    const maskedName = `${app.first_name[0]}${'*'.repeat(Math.max(app.first_name.length - 1, 3))} ${app.last_name[0]}${'*'.repeat(Math.max(app.last_name.length - 1, 3))}`;

    return successResponse(res, {
      application_number: app.application_number,
      certificate_number: app.certificate_number,
      certificate_name: app.certificate_name,
      certificate_code: app.certificate_code,
      department_name: app.department_name,
      district_name: app.district_name || 'State Central Jurisdiction',
      holder_name: maskedName,
      status: app.status,
      is_valid: app.status === 'completed',
      issued_at: app.completed_at,
      applied_at: app.submitted_at
    }, 'Certificate record verified successfully');
  } catch (err) { return errorResponse(res, err.message); }
};
