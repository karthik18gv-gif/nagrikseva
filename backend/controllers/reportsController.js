/**
 * reportsController.js
 * ---------------------------------------------------------------
 * Analytics / reporting endpoints for all four NagrikSeva roles:
 *   - Citizen   : GET /api/citizen/reports
 *   - Employee  : GET /api/employee/reports
 *   - Officer   : GET /api/officer/reports
 *   - Admin     : GET /api/admin/reports
 *
 * Every handler returns the SAME top-level shape so the frontend can
 * use one shared set of chart components:
 *
 * {
 *   generated_at        : ISO timestamp,
 *   scope               : human readable scope label,
 *   summary             : [{ label, value, sub, tone }]        -> KPI cards
 *   status_distribution : [{ label, value }]                   -> donut / pie
 *   monthly_trend       : [{ month, total, completed, rejected }] -> line / area
 *   by_certificate_type : [{ name, total, completed }]         -> bar chart
 *   by_department       : [{ name, total, completed }]         -> horizontal bars
 *   extra               : { ...role specific blocks }
 * }
 * ---------------------------------------------------------------
 */
const { pool } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const n = (v) => Number(v || 0);

/** Normalise a raw mysql monthly row-set into clean numbers, oldest first. */
const cleanMonthly = (rows) =>
  (rows || [])
    .map((r) => ({
      month: r.month,
      label: monthLabel(r.month),
      total: n(r.total),
      completed: n(r.completed),
      rejected: n(r.rejected),
      pending: Math.max(n(r.total) - n(r.completed) - n(r.rejected), 0),
    }))
    .reverse();

/** '2026-07' -> 'Jul 26' */
function monthLabel(m) {
  if (!m || typeof m !== 'string' || m.length < 7) return m || '-';
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const [y, mm] = m.split('-');
  return `${names[parseInt(mm, 10) - 1] || mm} ${String(y).slice(2)}`;
}

/** Turn a flat status count row into a pretty distribution array. */
const statusDistribution = (row) => {
  const map = [
    ['Submitted', 'submitted'],
    ['Under Verification', 'under_verification'],
    ['Verified', 'verified'],
    ['Under Review', 'under_review'],
    ['Approved', 'approved'],
    ['Completed', 'completed'],
    ['Returned', 'returned'],
    ['Rejected', 'rejected'],
    ['Cancelled', 'cancelled'],
  ];
  return map
    .map(([label, key]) => ({ label, value: n(row?.[key]) }))
    .filter((s) => s.value > 0);
};

const STATUS_SELECT = `
  COUNT(*) AS total,
  SUM(status='submitted')           AS submitted,
  SUM(status='under_verification')  AS under_verification,
  SUM(status='verified')            AS verified,
  SUM(status='under_review')        AS under_review,
  SUM(status='approved')            AS approved,
  SUM(status='completed')           AS completed,
  SUM(status='returned')            AS returned,
  SUM(status='rejected')            AS rejected,
  SUM(status='cancelled')           AS cancelled
`;

const MONTH_SELECT = `
  DATE_FORMAT(created_at,'%Y-%m') AS month,
  COUNT(*) AS total,
  SUM(status='completed') AS completed,
  SUM(status='rejected')  AS rejected
`;

/* ------------------------------------------------------------------ */
/* 1. CITIZEN REPORTS                                                  */
/* ------------------------------------------------------------------ */
exports.citizenReports = async (req, res) => {
  try {
    const cid = req.user.id;

    const [[statusRow]] = await pool.execute(
      `SELECT ${STATUS_SELECT} FROM applications WHERE citizen_id=?`, [cid]
    );
    const [monthly] = await pool.execute(
      `SELECT ${MONTH_SELECT} FROM applications WHERE citizen_id=?
       GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY month DESC LIMIT 12`, [cid]
    );
    const [byCert] = await pool.execute(
      `SELECT ct.name, COUNT(a.id) AS total, SUM(a.status='completed') AS completed
       FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id
       WHERE a.citizen_id=? GROUP BY ct.id, ct.name ORDER BY total DESC LIMIT 8`, [cid]
    );
    const [byDept] = await pool.execute(
      `SELECT d.name, COUNT(a.id) AS total, SUM(a.status='completed') AS completed
       FROM applications a JOIN departments d ON a.department_id=d.id
       WHERE a.citizen_id=? GROUP BY d.id, d.name ORDER BY total DESC LIMIT 8`, [cid]
    );
    const [[speed]] = await pool.execute(
      `SELECT ROUND(AVG(DATEDIFF(completed_at, submitted_at)),1) AS avg_days,
              MIN(DATEDIFF(completed_at, submitted_at)) AS fastest
       FROM applications WHERE citizen_id=? AND completed_at IS NOT NULL`, [cid]
    );
    const [[tickets]] = await pool.execute(
      `SELECT COUNT(*) AS total, SUM(status='open') AS open_t,
              SUM(status='resolved' OR status='closed') AS closed_t
       FROM support_tickets WHERE citizen_id=?`, [cid]
    );
    const [[fees]] = await pool.execute(
      `SELECT COALESCE(SUM(ct.fee),0) AS spent
       FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id
       WHERE a.citizen_id=? AND a.status IN ('approved','completed')`, [cid]
    );

    const total = n(statusRow.total);
    const completed = n(statusRow.completed) + n(statusRow.approved);
    const rejected = n(statusRow.rejected);
    const inProgress = Math.max(total - completed - rejected - n(statusRow.cancelled), 0);
    const successRate = total ? Math.round((completed / total) * 100) : 0;

    return successResponse(res, {
      generated_at: new Date().toISOString(),
      scope: 'My Personal Service Report',
      summary: [
        { label: 'Total Applications', value: total, sub: 'Lifetime submissions', tone: 'blue' },
        { label: 'Certificates Issued', value: completed, sub: `${successRate}% success rate`, tone: 'green' },
        { label: 'In Progress', value: inProgress, sub: 'Currently being processed', tone: 'amber' },
        { label: 'Rejected / Returned', value: rejected + n(statusRow.returned), sub: 'Needs your attention', tone: 'red' },
      ],
      status_distribution: statusDistribution(statusRow),
      monthly_trend: cleanMonthly(monthly),
      by_certificate_type: (byCert || []).map((r) => ({ name: r.name, total: n(r.total), completed: n(r.completed) })),
      by_department: (byDept || []).map((r) => ({ name: r.name, total: n(r.total), completed: n(r.completed) })),
      extra: {
        success_rate: successRate,
        avg_processing_days: speed?.avg_days == null ? null : Number(speed.avg_days),
        fastest_days: speed?.fastest == null ? null : Number(speed.fastest),
        fees_paid: Number(fees?.spent || 0),
        tickets_total: n(tickets?.total),
        tickets_open: n(tickets?.open_t),
        tickets_closed: n(tickets?.closed_t),
      },
    });
  } catch (err) { return errorResponse(res, err.message); }
};

/* ------------------------------------------------------------------ */
/* 2. EMPLOYEE REPORTS                                                 */
/* ------------------------------------------------------------------ */
exports.employeeReports = async (req, res) => {
  try {
    const eid = req.user.id;
    const [[emp]] = await pool.execute(
      `SELECT e.department_id, e.district_id, d.name AS department_name
       FROM employees e LEFT JOIN departments d ON e.department_id=d.id WHERE e.id=?`, [eid]
    );
    const deptId = emp?.department_id || 0;
    const distId = emp?.district_id || 0;

    const WHERE = `(a.employee_id=? OR (a.employee_id IS NULL AND a.department_id=? AND a.district_id=?))`;
    const P = [eid, deptId, distId];

    const [[statusRow]] = await pool.execute(
      `SELECT ${STATUS_SELECT.replace(/status=/g, 'a.status=')} FROM applications a WHERE ${WHERE}`, P
    );
    const [monthly] = await pool.execute(
      `SELECT DATE_FORMAT(a.created_at,'%Y-%m') AS month, COUNT(*) AS total,
              SUM(a.status='completed') AS completed, SUM(a.status='rejected') AS rejected
       FROM applications a WHERE ${WHERE}
       GROUP BY DATE_FORMAT(a.created_at,'%Y-%m') ORDER BY month DESC LIMIT 12`, P
    );
    const [byCert] = await pool.execute(
      `SELECT ct.name, COUNT(a.id) AS total, SUM(a.status='completed') AS completed
       FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id
       WHERE ${WHERE} GROUP BY ct.id, ct.name ORDER BY total DESC LIMIT 8`, P
    );
    const [byDept] = await pool.execute(
      `SELECT d.name, COUNT(a.id) AS total, SUM(a.status='completed') AS completed
       FROM applications a JOIN departments d ON a.department_id=d.id
       WHERE ${WHERE} GROUP BY d.id, d.name ORDER BY total DESC LIMIT 8`, P
    );
    const [[speed]] = await pool.execute(
      `SELECT ROUND(AVG(DATEDIFF(a.verified_at, a.submitted_at)),1) AS avg_days
       FROM applications a WHERE a.employee_id=? AND a.verified_at IS NOT NULL`, [eid]
    );
    const [pension] = await pool.execute(
      `SELECT status, COUNT(*) AS total FROM pension_applications WHERE employee_id=? GROUP BY status`, [eid]
    );

    const total = n(statusRow.total);
    const verified = n(statusRow.verified) + n(statusRow.approved) + n(statusRow.completed);
    const pendingQueue = n(statusRow.submitted) + n(statusRow.under_verification);

    return successResponse(res, {
      generated_at: new Date().toISOString(),
      scope: `${emp?.department_name || 'Department'} — Verification Desk Report`,
      summary: [
        { label: 'Total In My Queue', value: total, sub: 'All assigned applications', tone: 'blue' },
        { label: 'Verified & Forwarded', value: verified, sub: 'Sent to officer', tone: 'green' },
        { label: 'Awaiting Verification', value: pendingQueue, sub: 'Action required', tone: 'amber' },
        { label: 'Returned / Rejected', value: n(statusRow.returned) + n(statusRow.rejected), sub: 'Sent back to citizen', tone: 'red' },
      ],
      status_distribution: statusDistribution(statusRow),
      monthly_trend: cleanMonthly(monthly),
      by_certificate_type: (byCert || []).map((r) => ({ name: r.name, total: n(r.total), completed: n(r.completed) })),
      by_department: (byDept || []).map((r) => ({ name: r.name, total: n(r.total), completed: n(r.completed) })),
      extra: {
        avg_verification_days: speed?.avg_days == null ? null : Number(speed.avg_days),
        clearance_rate: total ? Math.round((verified / total) * 100) : 0,
        pension_status: (pension || []).map((p) => ({ label: String(p.status).replace(/_/g, ' '), value: n(p.total) })),
      },
    });
  } catch (err) { return errorResponse(res, err.message); }
};

/* ------------------------------------------------------------------ */
/* 3. OFFICER REPORTS                                                  */
/* ------------------------------------------------------------------ */
exports.officerReports = async (req, res) => {
  try {
    const oid = req.user.id;
    const [[off]] = await pool.execute(
      `SELECT o.department_id, o.district_id, d.name AS department_name
       FROM officers o LEFT JOIN departments d ON o.department_id=d.id WHERE o.id=?`, [oid]
    );
    const deptId = off?.department_id || 0;

    const [[statusRow]] = await pool.execute(
      `SELECT ${STATUS_SELECT} FROM applications WHERE department_id=?`, [deptId]
    );
    const [monthly] = await pool.execute(
      `SELECT ${MONTH_SELECT} FROM applications WHERE department_id=?
       GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY month DESC LIMIT 12`, [deptId]
    );
    const [byCert] = await pool.execute(
      `SELECT ct.name, COUNT(a.id) AS total, SUM(a.status='completed') AS completed
       FROM applications a JOIN certificate_types ct ON a.certificate_type_id=ct.id
       WHERE a.department_id=? GROUP BY ct.id, ct.name ORDER BY total DESC LIMIT 8`, [deptId]
    );
    const [byDistrict] = await pool.execute(
      `SELECT di.name, COUNT(a.id) AS total, SUM(a.status='completed') AS completed
       FROM applications a JOIN districts di ON a.district_id=di.id
       WHERE a.department_id=? GROUP BY di.id, di.name ORDER BY total DESC LIMIT 8`, [deptId]
    );
    const [staffPerf] = await pool.execute(
      `SELECT e.name, COUNT(a.id) AS total, SUM(a.status IN('verified','approved','completed')) AS completed
       FROM applications a JOIN employees e ON a.employee_id=e.id
       WHERE a.department_id=? GROUP BY e.id, e.name ORDER BY total DESC LIMIT 6`, [deptId]
    );
    const [pension] = await pool.execute(
      `SELECT status, COUNT(*) AS total FROM pension_applications WHERE department_id=? GROUP BY status`, [deptId]
    );
    const [[speed]] = await pool.execute(
      `SELECT ROUND(AVG(DATEDIFF(completed_at, submitted_at)),1) AS avg_days
       FROM applications WHERE department_id=? AND completed_at IS NOT NULL`, [deptId]
    );

    const total = n(statusRow.total);
    const approved = n(statusRow.approved) + n(statusRow.completed);
    const awaiting = n(statusRow.verified) + n(statusRow.under_review);

    return successResponse(res, {
      generated_at: new Date().toISOString(),
      scope: `${off?.department_name || 'Department'} — Departmental Performance Report`,
      summary: [
        { label: 'Department Applications', value: total, sub: 'All time volume', tone: 'blue' },
        { label: 'Approved & Issued', value: approved, sub: `${total ? Math.round((approved / total) * 100) : 0}% approval rate`, tone: 'green' },
        { label: 'Awaiting My Approval', value: awaiting, sub: 'Verified, pending sign-off', tone: 'amber' },
        { label: 'Rejected', value: n(statusRow.rejected), sub: 'Declined applications', tone: 'red' },
      ],
      status_distribution: statusDistribution(statusRow),
      monthly_trend: cleanMonthly(monthly),
      by_certificate_type: (byCert || []).map((r) => ({ name: r.name, total: n(r.total), completed: n(r.completed) })),
      by_department: (byDistrict || []).map((r) => ({ name: r.name, total: n(r.total), completed: n(r.completed) })),
      extra: {
        avg_processing_days: speed?.avg_days == null ? null : Number(speed.avg_days),
        approval_rate: total ? Math.round((approved / total) * 100) : 0,
        staff_performance: (staffPerf || []).map((s) => ({ name: s.name, total: n(s.total), completed: n(s.completed) })),
        pension_status: (pension || []).map((p) => ({ label: String(p.status).replace(/_/g, ' '), value: n(p.total) })),
      },
    });
  } catch (err) { return errorResponse(res, err.message); }
};

/* ------------------------------------------------------------------ */
/* 4. ADMIN REPORTS (system wide)                                      */
/* ------------------------------------------------------------------ */
exports.adminReports = async (req, res) => {
  try {
    const [[statusRow]] = await pool.execute(`SELECT ${STATUS_SELECT} FROM applications`);
    const [monthly] = await pool.execute(
      `SELECT ${MONTH_SELECT} FROM applications
       GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY month DESC LIMIT 12`
    );
    const [byCert] = await pool.execute(
      `SELECT ct.name, COUNT(a.id) AS total, SUM(a.status='completed') AS completed
       FROM certificate_types ct LEFT JOIN applications a ON a.certificate_type_id=ct.id
       GROUP BY ct.id, ct.name ORDER BY total DESC LIMIT 8`
    );
    const [byDept] = await pool.execute(
      `SELECT d.name, COUNT(a.id) AS total, SUM(a.status='completed') AS completed
       FROM departments d LEFT JOIN applications a ON a.department_id=d.id
       WHERE d.is_active=1 GROUP BY d.id, d.name ORDER BY total DESC LIMIT 10`
    );
    const [[counts]] = await pool.execute(
      `SELECT
        (SELECT COUNT(*) FROM citizens  WHERE is_active=1) AS citizens,
        (SELECT COUNT(*) FROM employees WHERE is_active=1) AS employees,
        (SELECT COUNT(*) FROM officers  WHERE is_active=1) AS officers,
        (SELECT COUNT(*) FROM departments WHERE is_active=1) AS departments,
        (SELECT COUNT(*) FROM certificate_types WHERE is_active=1) AS cert_types,
        (SELECT COUNT(*) FROM pension_applications) AS pensions,
        (SELECT COUNT(*) FROM support_tickets) AS tickets,
        (SELECT COUNT(*) FROM support_tickets WHERE status='open') AS open_tickets`
    );
    const [gender] = await pool.execute(
      `SELECT gender AS label, COUNT(*) AS value FROM citizens WHERE is_active=1 GROUP BY gender`
    );
    const [category] = await pool.execute(
      `SELECT category AS label, COUNT(*) AS value FROM citizens WHERE is_active=1 GROUP BY category`
    );
    const [byDistrict] = await pool.execute(
      `SELECT di.name, COUNT(c.id) AS total FROM districts di
       JOIN citizens c ON c.district_id=di.id WHERE c.is_active=1
       GROUP BY di.id, di.name ORDER BY total DESC LIMIT 8`
    );
    const [pension] = await pool.execute(
      `SELECT status AS label, COUNT(*) AS value FROM pension_applications GROUP BY status`
    );
    const [[revenue]] = await pool.execute(
      `SELECT COALESCE(SUM(ct.fee),0) AS total FROM applications a
       JOIN certificate_types ct ON a.certificate_type_id=ct.id
       WHERE a.status IN ('approved','completed')`
    );
    const [[speed]] = await pool.execute(
      `SELECT ROUND(AVG(DATEDIFF(completed_at, submitted_at)),1) AS avg_days
       FROM applications WHERE completed_at IS NOT NULL`
    );
    const [growth] = await pool.execute(
      `SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS total,
              0 AS completed, 0 AS rejected
       FROM citizens GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY month DESC LIMIT 12`
    );

    const total = n(statusRow.total);
    const issued = n(statusRow.completed);

    const titleCase = (s) => String(s || '-').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    return successResponse(res, {
      generated_at: new Date().toISOString(),
      scope: 'NagrikSeva — System Wide Analytics',
      summary: [
        { label: 'Registered Citizens', value: n(counts.citizens), sub: 'Active user accounts', tone: 'blue' },
        { label: 'Total Applications', value: total, sub: 'Across all departments', tone: 'violet' },
        { label: 'Certificates Issued', value: issued, sub: `${total ? Math.round((issued / total) * 100) : 0}% completion rate`, tone: 'green' },
        { label: 'Revenue Collected', value: Number(revenue?.total || 0), sub: 'Service fees (₹)', tone: 'amber', prefix: '₹' },
      ],
      status_distribution: statusDistribution(statusRow),
      monthly_trend: cleanMonthly(monthly),
      by_certificate_type: (byCert || []).map((r) => ({ name: r.name, total: n(r.total), completed: n(r.completed) })),
      by_department: (byDept || []).map((r) => ({ name: r.name, total: n(r.total), completed: n(r.completed) })),
      extra: {
        staff_counts: {
          employees: n(counts.employees),
          officers: n(counts.officers),
          departments: n(counts.departments),
          cert_types: n(counts.cert_types),
          pensions: n(counts.pensions),
          tickets: n(counts.tickets),
          open_tickets: n(counts.open_tickets),
        },
        avg_processing_days: speed?.avg_days == null ? null : Number(speed.avg_days),
        gender_split: (gender || []).map((g) => ({ label: titleCase(g.label), value: n(g.value) })),
        category_split: (category || []).map((c) => ({ label: String(c.label || '-').toUpperCase(), value: n(c.value) })),
        citizens_by_district: (byDistrict || []).map((d) => ({ name: d.name, total: n(d.total), completed: 0 })),
        pension_status: (pension || []).map((p) => ({ label: titleCase(p.label), value: n(p.value) })),
        citizen_growth: cleanMonthly(growth),
      },
    });
  } catch (err) { return errorResponse(res, err.message); }
};
