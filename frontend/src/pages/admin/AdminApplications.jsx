import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { exportToCSV } from '../../utils/exportUtils'
import toast from 'react-hot-toast'
import { FaSearch, FaFileExport, FaFilter, FaCheckCircle, FaTimesCircle, FaClock, FaHistory } from 'react-icons/fa'

const ALL_STATUSES = ['rejected','returned','completed','cancelled']

export default function AdminApplications() {
  const [apps, setApps] = useState([])
  const [departments, setDepartments] = useState([])
  const [certTypes, setCertTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [certFilter, setCertFilter] = useState('')

  // Detail Modal
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)

  // Initial load of reference data
  useEffect(() => {
    Promise.all([adminAPI.getDepartments(), adminAPI.getCertificateTypes()])
      .then(([resDept, resCert]) => {
        setDepartments(resDept.data.data || [])
        setCertTypes(resCert.data.data || [])
      })
      .catch(() => {})
  }, [])

  const fetchApps = () => {
    setLoading(true)
    adminAPI.getApplications({
      status: status || undefined,
      department_id: deptFilter || undefined,
      certificate_type_id: certFilter || undefined,
      search: search || undefined,
      limit: 100
    })
      .then(r => {
        setApps(r.data.data.applications || [])
        setTotal(r.data.data.total || 0)
      })
      .catch(err => {
        console.error(err)
        toast.error(err.response?.data?.message || 'Failed to load applications')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(fetchApps, 300)
    return () => clearTimeout(timer)
  }, [status, deptFilter, certFilter, search])

  const openDetail = (id) => {
    setSelected(id)
    setDetail(null)
    setDetailLoading(true)
    adminAPI.getApplicationDetail(id)
      .then(r => {
        setDetail(r.data.data)
        const cur = r.data.data.application.status
        setNewStatus(ALL_STATUSES.includes(cur) ? cur : ALL_STATUSES[0])
        setRemarks('')
      })
      .catch(err => {
        toast.error(err.response?.data?.message || 'Failed to load application')
        setSelected(null)
      })
      .finally(() => setDetailLoading(false))
  }

  const closeDetail = () => {
    setSelected(null)
    setDetail(null)
  }

  const handleStatusSave = async () => {
    if (!detail) return
    setSaving(true)
    try {
      const { data } = await adminAPI.updateApplicationStatus(selected, {
        status: newStatus,
        remarks: remarks || undefined
      })
      toast.success(data.message || 'Status updated')
      closeDetail()
      fetchApps()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = () => {
    const exportData = apps.map(a => ({
      'Application No': a.application_number,
      'Citizen Name': `${a.first_name || ''} ${a.last_name || ''}`.trim(),
      'Mobile': a.mobile || '',
      'Certificate': a.certificate_name,
      'Department': a.department_name,
      'Applied Date': a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : '',
      'Status': a.status,
      'Certificate Number': a.certificate_number || 'N/A'
    }))
    exportToCSV(exportData, `Applications_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div>
      <PageHeader
        title="All Applications"
        subtitle={`${total} total citizen applications across all departments`}
        actions={
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FaFileExport className="text-emerald-600" /> Export CSV
          </button>
        }
      />

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm space-y-4">
        {/* Status Pills */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <FaFilter className="text-xs" /> Status:
          </span>
          {['','submitted','under_verification','verified','approved','completed','rejected','returned'].map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                status === s ? 'bg-[#1a3a6b] text-white shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {s ? s.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase()) : 'All Applications'}
            </button>
          ))}
        </div>

        {/* Search and Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              className="form-input w-full pl-8 text-xs py-2"
              placeholder="Search App ID, Citizen, Mobile, Aadhaar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div>
            <select
              className="form-input w-full text-xs py-2"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              className="form-input w-full text-xs py-2"
              value={certFilter}
              onChange={e => setCertFilter(e.target.value)}
            >
              <option value="">All Certificate Services</option>
              {certTypes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {(search || status || deptFilter || certFilter) && (
            <button
              onClick={() => { setSearch(''); setStatus(''); setDeptFilter(''); setCertFilter('') }}
              className="text-xs text-red-600 hover:text-red-700 font-semibold self-center"
            >
              Clear All Filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[850px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['App ID','Citizen','Certificate','Department','Date','Status','Action'].map(h => (
                    <th key={h} className="text-left text-xs font-bold text-slate-600 px-4 py-3 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-slate-400 py-12">
                      No applications match the specified criteria.
                    </td>
                  </tr>
                ) : apps.map(a => (
                  <tr
                    key={a.id}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                    onClick={() => openDetail(a.id)}
                  >
                    <td className="px-4 py-3 text-blue-700 font-bold text-xs">{a.application_number}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800 font-semibold text-xs">{a.first_name} {a.last_name}</p>
                      <p className="text-slate-400 text-[11px]">{a.mobile}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700 text-xs font-medium">{a.certificate_name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{a.department_name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={a.status}/></td>
                    <td className="px-4 py-3 text-xs text-[#1a3a6b] font-bold">Manage →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL WITH AUDIT TIMELINE */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={closeDetail}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            {detailLoading || !detail ? (
              <LoadingSpinner />
            ) : (
              <>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400">Application Details</span>
                    <h3 className="font-bold text-slate-900 text-xl">{detail.application.application_number}</h3>
                  </div>
                  <StatusBadge status={detail.application.status} />
                </div>

                {/* Core Attributes */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-6 bg-slate-50 p-4 rounded-xl">
                  {[
                    ['Certificate Service', detail.application.certificate_name],
                    ['Department', detail.application.department_name],
                    ['Applicant Name', `${detail.application.first_name || ''} ${detail.application.last_name || ''}`],
                    ['Mobile Number', detail.application.mobile],
                    ['Email Address', detail.application.email],
                    ['Aadhaar Number', detail.application.aadhaar_number],
                    ['Assigned Employee', detail.application.employee_name || 'Not yet assigned'],
                    ['Approving Officer', detail.application.officer_name || 'Not yet assigned'],
                    ['Certificate No.', detail.application.certificate_number || 'Pending Generation']
                  ].map(([label, val]) => (
                    <div key={label}>
                      <p className="text-[11px] font-semibold text-slate-400 uppercase">{label}</p>
                      <p className="font-semibold text-slate-800 text-xs mt-0.5">{val}</p>
                    </div>
                  ))}
                </div>

                {detail.application.purpose && (
                  <div className="mb-6 bg-blue-50/60 border border-blue-100 rounded-xl p-3.5">
                    <p className="text-xs font-bold text-blue-900 mb-1">Citizen's Statement of Purpose</p>
                    <p className="text-xs text-blue-800 leading-relaxed">{detail.application.purpose}</p>
                  </div>
                )}

                {/* LIFECYCLE AUDIT TIMELINE */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FaHistory className="text-indigo-600" /> Lifecycle Audit Timeline
                  </h4>
                  <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
                    {/* Stage 1: Submitted */}
                    <div className="relative">
                      <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-xs"></div>
                      <p className="text-xs font-bold text-slate-800">1. Submitted by Citizen</p>
                      <p className="text-[11px] text-slate-500">
                        {detail.application.submitted_at ? new Date(detail.application.submitted_at).toLocaleString('en-IN') : 'Completed'}
                      </p>
                    </div>

                    {/* Stage 2: Employee Verification */}
                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                        ['under_verification','verified','approved','completed'].includes(detail.application.status) ? 'bg-amber-500' : 'bg-slate-300'
                      }`}></div>
                      <p className="text-xs font-bold text-slate-800">2. Staff Verification</p>
                      <p className="text-[11px] text-slate-500">
                        Staff: {detail.application.employee_name || 'Staff Member'}
                        {detail.application.verified_at && ` • Verified on ${new Date(detail.application.verified_at).toLocaleDateString('en-IN')}`}
                      </p>
                      {detail.application.employee_remarks && (
                        <p className="text-xs text-slate-600 bg-slate-100 p-2 rounded mt-1 italic">
                          "{detail.application.employee_remarks}"
                        </p>
                      )}
                    </div>

                    {/* Stage 3: Officer Approval */}
                    <div className="relative">
                      <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                        ['approved','completed'].includes(detail.application.status) ? 'bg-emerald-600' :
                        detail.application.status === 'rejected' ? 'bg-red-600' : 'bg-slate-300'
                      }`}></div>
                      <p className="text-xs font-bold text-slate-800">3. Officer Decision</p>
                      <p className="text-[11px] text-slate-500">
                        Officer: {detail.application.officer_name || 'Designated Officer'}
                        {detail.application.approved_at && ` • Approved on ${new Date(detail.application.approved_at).toLocaleDateString('en-IN')}`}
                      </p>
                      {detail.application.officer_remarks && (
                        <p className="text-xs text-slate-600 bg-slate-100 p-2 rounded mt-1 italic">
                          "{detail.application.officer_remarks}"
                        </p>
                      )}
                      {detail.application.rejection_reason && (
                        <p className="text-xs text-red-700 bg-red-50 p-2 rounded mt-1">
                          Rejection Reason: {detail.application.rejection_reason}
                        </p>
                      )}
                    </div>

                    {/* Stage 4: Certificate Issue */}
                    {detail.application.status === 'completed' && (
                      <div className="relative">
                        <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-green-600 border-2 border-white shadow-xs"></div>
                        <p className="text-xs font-bold text-green-700">4. Certificate Issued</p>
                        <p className="text-[11px] text-slate-500">
                          Certificate #{detail.application.certificate_number} • Completed
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Uploaded Documents */}
                {detail.documents?.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Citizen Documents ({detail.documents.length})
                    </p>
                    <div className="space-y-2">
                      {detail.documents.map(d => (
                        <div key={d.id} className="flex justify-between items-center bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-2 text-xs">
                          <span className="font-medium text-slate-700">📄 {d.document_name}</span>
                          <a
                            href={`/uploads/documents/${d.file_path}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 font-semibold hover:underline"
                          >
                            View File
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Status Override Action */}
                <div className="border-t border-slate-200 pt-4 bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                  <p className="font-bold text-slate-800 text-sm mb-2">Administrative Status Override</p>
                  {detail.application.status !== 'approved' && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3">
                      ⚠️ Note: To mark as "Completed" and generate a certificate, the application must normally be approved by an officer. You can still return, cancel, or reject it.
                    </p>
                  )}
                  <div className="space-y-3">
                    <select
                      className="form-input w-full text-xs"
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value)}
                    >
                      {ALL_STATUSES.map(s => (
                        <option key={s} value={s} disabled={s === 'completed' && detail.application.status !== 'approved'}>
                          {s.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}
                          {s === 'completed' && detail.application.status !== 'approved' ? ' (requires officer approval first)' : ''}
                        </option>
                      ))}
                    </select>
                    <textarea
                      className="form-input w-full resize-none text-xs"
                      rows={2}
                      placeholder="Administrative remarks (visible in log)..."
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                    />
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={handleStatusSave}
                        disabled={saving || newStatus === detail.application.status || (newStatus === 'completed' && detail.application.status !== 'approved')}
                        className="btn-primary flex-1 text-sm py-2 disabled:opacity-50"
                      >
                        {saving ? 'Updating...' : 'Save Status Override'}
                      </button>
                      <button onClick={closeDetail} className="btn-secondary text-sm py-2 px-5">
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
