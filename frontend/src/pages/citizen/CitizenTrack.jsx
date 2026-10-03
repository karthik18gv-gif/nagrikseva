import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { citizenAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { 
  FaSearch, 
  FaCheckCircle, 
  FaClock, 
  FaFileContract, 
  FaLandmark, 
  FaDownload, 
  FaExclamationTriangle,
  FaShieldAlt,
  FaPrint
} from 'react-icons/fa'

const STAGES = [
  { key: 'submitted', label: 'Application Submitted', desc: 'Received by Department Registry' },
  { key: 'under_verification', label: 'Document Verification', desc: 'Scrutiny by Designated Verification Officer' },
  { key: 'verified', label: 'Verification Approved', desc: 'Forwarded to Gazetted Department Officer' },
  { key: 'approved', label: 'Statutory Approval', desc: 'Competent Authority has approved the order' },
  { key: 'completed', label: 'Digital Certificate Issued', desc: 'Digitally signed and released for download' }
]

const stageOrder = ['submitted', 'under_verification', 'verified', 'approved', 'completed']

export default function CitizenTrack() {
  const [searchParams] = useSearchParams()
  const initialAppId = searchParams.get('appId') || ''
  
  const [appNum, setAppNum] = useState(initialAppId)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const executeTrack = async (targetId) => {
    if (!targetId.trim()) {
      toast.error('Please enter an application number')
      return
    }
    setLoading(true)
    try {
      const { data } = await citizenAPI.trackApplication(targetId.trim())
      setResult(data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application not found in state registry')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialAppId) {
      executeTrack(initialAppId)
    }
  }, [initialAppId])

  const handleSearch = (e) => {
    e.preventDefault()
    executeTrack(appNum)
  }

  const app = result?.application
  const isCompleted = app?.status === 'completed'
  const isRejected = app?.status === 'rejected'
  const isReturned = app?.status === 'returned'

  return (
    <div className="space-y-6 pb-12">
      <PageHeader 
        title="Application Status Tracker" 
        subtitle="Live tracking of citizen service applications under Sakala statutory timelines" 
      />

      {/* Search Input Box */}
      <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] bg-slate-50 uppercase tracking-wider font-mono"
              placeholder="Enter Application No. (e.g. NS202506011234)"
              value={appNum}
              onChange={e => setAppNum(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="py-2.5 px-6 bg-[#1A3A6B] hover:bg-[#2457A6] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track Application'}
          </button>
        </form>
        <p className="text-[11px] text-slate-400 mt-2 px-1">
          Note: Application IDs are alphanumeric and case-insensitive.
        </p>
      </div>

      {loading && <LoadingSpinner text="Querying tracking status..." />}

      {/* Tracking Result View */}
      {result && app && (
        <div className="max-w-3xl space-y-6 animate-fadeIn">
          {/* Main Status Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 inline-block mb-1">
                  {app.department_name || 'Revenue Administration'}
                </span>
                <h3 className="text-lg font-black text-slate-900">{app.certificate_name}</h3>
                <div className="flex items-center gap-2 mt-1 font-mono text-xs text-slate-500 font-semibold">
                  <span>Application ID: {app.application_number}</span>
                </div>
              </div>
              <div>
                <StatusBadge status={app.status} />
              </div>
            </div>

            {/* If Completed Banner */}
            {isCompleted && (
              <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg flex-shrink-0">
                    <FaCheckCircle />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 text-xs sm:text-sm">Certificate Approved & Digitally Issued</h4>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      Certificate No: <strong className="font-mono">{app.certificate_number}</strong>
                    </p>
                  </div>
                </div>
                {app.certificate_path && (
                  <a
                    href={`/uploads/certificates/${app.certificate_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <FaDownload /> Download Certificate
                  </a>
                )}
              </div>
            )}

            {/* If Rejected / Returned Banner */}
            {(isRejected || isReturned) && (
              <div className="mt-5 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <FaExclamationTriangle className="text-rose-600 text-lg mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-rose-900 text-xs sm:text-sm">
                    {isRejected ? 'Application Rejected' : 'Returned for Clarification / Resubmission'}
                  </h4>
                  <p className="text-rose-700 text-xs mt-1 leading-relaxed">
                    Officer Remarks: <strong>{app.rejection_reason || app.return_reason || 'Incomplete documentation.'}</strong>
                  </p>
                  {isReturned && (
                    <Link
                      to="/citizen/applications"
                      className="inline-block mt-2 text-xs font-bold text-rose-800 hover:underline"
                    >
                      Go to My Applications to Resubmit →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Detailed Lifecycle Stepper */}
            <div className="mt-8 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
                Lifecycle Progression
              </h4>

              <div className="space-y-0">
                {STAGES.map((stage, idx) => {
                  const currentIdx = stageOrder.indexOf(app.status)
                  const isDone = currentIdx >= idx || isCompleted
                  const isCurrent = currentIdx === idx && !isCompleted

                  return (
                    <div key={stage.key} className="flex items-start gap-4">
                      {/* Left: Icon & Line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            isDone
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : isCurrent
                              ? 'bg-[#1A3A6B] text-white ring-4 ring-[#1A3A6B]/20 scale-105'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {isDone ? (
                            <FaCheckCircle className="text-sm" />
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>
                        {idx < STAGES.length - 1 && (
                          <div
                            className={`w-0.5 h-12 my-1 transition-colors ${
                              isDone ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                          />
                        )}
                      </div>

                      {/* Right: Stage Details */}
                      <div className="pb-8">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-bold ${
                              isDone || isCurrent ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {stage.label}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-[#1A3A6B]">
                              In Progress
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{stage.desc}</p>
                        
                        {stage.key === 'submitted' && app.submitted_at && (
                          <span className="text-[11px] text-slate-400 mt-1 block">
                            Timestamp: {new Date(app.submitted_at).toLocaleString('en-IN')}
                          </span>
                        )}
                        {stage.key === 'under_verification' && app.verified_by && (
                          <span className="text-[11px] text-slate-500 mt-1 block">
                            Assigned Desk: Verification Officer ({app.verified_by})
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
