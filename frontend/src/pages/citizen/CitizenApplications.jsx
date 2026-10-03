import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { citizenAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { exportToCSV } from '../../utils/exportUtils'
import toast from 'react-hot-toast'
import { FaSearch, FaFileExport, FaPrint, FaLandmark, FaBarcode } from 'react-icons/fa'

const STATUSES = ['','submitted','under_verification','verified','approved','completed','rejected','returned','cancelled']

export default function CitizenApplications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)
  const [resubmittingId, setResubmittingId] = useState(null)
  const [slipApp, setSlipApp] = useState(null)

  const fetchApps = () => {
    setLoading(true)
    citizenAPI.getApplications({
      status: status || undefined,
      limit: 100
    })
      .then(r => {
        setApps(r.data.data.applications || [])
        setTotal(r.data.data.total || 0)
      })
      .catch(err => {
        console.error(err)
        toast.error(err.response?.data?.message || 'Failed to load data')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchApps()
  }, [status])

  const filteredApps = apps.filter(app => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      app.application_number?.toLowerCase().includes(q) ||
      app.certificate_name?.toLowerCase().includes(q) ||
      app.department_name?.toLowerCase().includes(q) ||
      app.certificate_number?.toLowerCase().includes(q)
    )
  })

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this application?')) return
    try {
      await citizenAPI.cancelApplication(id)
      toast.success('Application cancelled')
      fetchApps()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel')
    }
  }

  const handleResubmit = async (id) => {
    setResubmittingId(id)
    try {
      await citizenAPI.resubmitApplication(id)
      toast.success('Resubmitted — application returned to verification queue')
      fetchApps()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resubmit')
    } finally {
      setResubmittingId(null)
    }
  }

  const handleExport = () => {
    const exportData = filteredApps.map(a => ({
      'Application No': a.application_number,
      'Service Name': a.certificate_name,
      'Department': a.department_name,
      'Submission Date': a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('en-IN') : '',
      'Status': a.status,
      'Certificate No': a.certificate_number || 'N/A'
    }))
    exportToCSV(exportData, `My_Applications_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div>
      <PageHeader
        title="My Applications"
        subtitle={`${total} total service applications submitted`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
            >
              <FaFileExport className="text-emerald-600" /> Export CSV
            </button>
            <Link to="/citizen/apply" className="btn-primary text-sm py-2">
              + Apply New
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm space-y-3">
        <div className="flex gap-2 flex-wrap items-center">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                status === s ? 'bg-[#1a3a6b] text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:border-[#1a3a6b]'
              }`}
            >
              {s ? s.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase()) : 'All'}
            </button>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            className="form-input w-full pl-8 text-xs py-2"
            placeholder="Search by Application Number, Certificate name, or Department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filteredApps.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-500 text-sm">No applications found matching your criteria</p>
          <Link to="/citizen/apply" className="inline-block mt-3 btn-primary text-sm">
            Apply for Certificate
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredApps.map(app => (
            <div key={app.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#1a3a6b] font-bold text-sm">{app.application_number}</span>
                    <StatusBadge status={app.status}/>
                  </div>
                  <h3 className="font-semibold text-slate-800 text-base">{app.certificate_name}</h3>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                    <span>{app.department_name}</span>
                    <span>•</span>
                    <span>Applied: {new Date(app.submitted_at || app.created_at).toLocaleDateString('en-IN')}</span>
                    {app.certificate_number && (
                      <>
                        <span>•</span>
                        <span className="text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded">
                          Cert No: {app.certificate_number}
                        </span>
                      </>
                    )}
                  </div>

                  {app.status === 'returned' && app.return_reason && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800">
                      <strong>Returned for correction:</strong> {app.return_reason}
                    </div>
                  )}

                  {app.status === 'rejected' && app.rejection_reason && (
                    <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700">
                      <strong>Rejection reason:</strong> {app.rejection_reason}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Print Acknowledgement Receipt Button */}
                  <button
                    onClick={() => setSlipApp(app)}
                    className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-200 flex items-center gap-1.5 shadow-xs"
                    title="Print Acknowledgement Receipt"
                  >
                    <FaPrint className="text-slate-500" /> Receipt Slip
                  </button>

                  {app.status === 'completed' && (
                    <button
                      onClick={async () => {
                        try {
                          const { data } = await citizenAPI.downloadCertificate(app.id)
                          if (data.data.certificate_path) {
                            window.open(`/uploads/certificates/${data.data.certificate_path}`, '_blank')
                          } else {
                            toast.error('Certificate file is being finalized — please try again shortly.')
                          }
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Download failed')
                        }
                      }}
                      className="text-xs bg-green-600 text-white px-3.5 py-1.5 rounded-lg font-semibold hover:bg-green-700 shadow-xs"
                    >
                      ⬇️ Download
                    </button>
                  )}

                  {app.status === 'returned' && (
                    <button
                      onClick={() => handleResubmit(app.id)}
                      disabled={resubmittingId === app.id}
                      className="text-xs bg-amber-600 text-white px-3.5 py-1.5 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 shadow-xs"
                    >
                      {resubmittingId === app.id ? 'Resubmitting...' : '🔄 Resubmit'}
                    </button>
                  )}

                  {['submitted','draft'].includes(app.status) && (
                    <button
                      onClick={() => handleCancel(app.id)}
                      className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-100"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PRINTABLE ACKNOWLEDGEMENT RECEIPT MODAL */}
      {slipApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={() => setSlipApp(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div id="printable-receipt" className="border-2 border-dashed border-slate-300 p-6 rounded-xl bg-slate-50/50">
              {/* Header */}
              <div className="text-center border-b border-slate-200 pb-4 mb-4">
                <div className="w-12 h-12 bg-[#1a3a6b] text-white rounded-full flex items-center justify-center mx-auto mb-2 text-xl shadow-sm">
                  <FaLandmark />
                </div>
                <h2 className="text-base font-bold text-[#1a3a6b] uppercase tracking-wide">Government of Karnataka</h2>
                <h3 className="text-xs font-semibold text-slate-600">NagrikSeva — Citizen Services Portal</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Official E-Governance Acknowledgement Slip</p>
              </div>

              {/* Barcode representation */}
              <div className="bg-white border border-slate-200 rounded p-2 text-center mb-4">
                <div className="font-mono text-2xl tracking-[0.25em] text-slate-700 select-all font-bold">
                  |||||| |||| ||||| ||| |||||||
                </div>
                <p className="text-[11px] font-mono font-bold text-slate-600 mt-1">
                  {slipApp.application_number}
                </p>
              </div>

              {/* Data fields */}
              <div className="space-y-2 text-xs mb-4">
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500 font-medium">Service Name:</span>
                  <span className="font-bold text-slate-800 text-right">{slipApp.certificate_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500 font-medium">Department:</span>
                  <span className="font-semibold text-slate-800 text-right">{slipApp.department_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500 font-medium">Application Date:</span>
                  <span className="text-slate-800">{new Date(slipApp.submitted_at || slipApp.created_at).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1">
                  <span className="text-slate-500 font-medium">Current Status:</span>
                  <span className="font-bold uppercase text-slate-700">{slipApp.status}</span>
                </div>
                {slipApp.certificate_number && (
                  <div className="flex justify-between border-b border-slate-200/60 pb-1 text-green-700 font-bold">
                    <span>Certificate No:</span>
                    <span>{slipApp.certificate_number}</span>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[10px] text-amber-800 text-center">
                ℹ️ Please quote your Application Number <strong>{slipApp.application_number}</strong> for tracking and in all future communications.
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSlipApp(null)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <FaPrint /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}