import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { officerAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { exportToCSV } from '../../utils/exportUtils'
import { FaSearch, FaFileExport, FaCheckCircle } from 'react-icons/fa'

export default function OfficerApplications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')

  const fetchApps = () => {
    setLoading(true)
    officerAPI.getPendingApplications({
      search: search || undefined
    })
      .then(r => setApps(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(fetchApps, 350)
    return () => clearTimeout(timer)
  }, [search])

  const sortedApps = [...apps].sort((a, b) => {
    const dA = new Date(a.submitted_at || a.created_at).getTime()
    const dB = new Date(b.submitted_at || b.created_at).getTime()
    return sortOrder === 'newest' ? dB - dA : dA - dB
  })

  const handleExport = () => {
    const exportData = sortedApps.map(a => ({
      'App Number': a.application_number,
      'Applicant': `${a.first_name || ''} ${a.last_name || ''}`.trim(),
      'Mobile': a.mobile,
      'Certificate': a.certificate_name,
      'Verified By': a.verified_by || '—',
      'Submitted Date': a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('en-IN') : ''
    }))
    exportToCSV(exportData, `Officer_Pending_Approvals_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div>
      <PageHeader
        title="Pending Approvals"
        subtitle={`${apps.length} verified applications awaiting your final approval decision`}
        actions={
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FaFileExport className="text-emerald-600" /> Export CSV
          </button>
        }
      />

      {/* Search & Sort Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            className="form-input w-full pl-8 text-xs py-2"
            placeholder="Search App ID, Citizen, Mobile, or Certificate..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Sort By:</label>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            className="border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-700"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest / Priority</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : sortedApps.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="font-semibold text-slate-700 text-sm">No pending approvals</h3>
          <p className="text-slate-400 text-xs mt-1">All verified citizen applications in your jurisdiction have been reviewed</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[750px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['App ID','Applicant','Certificate Service','Verified By','Submitted Date','Action'].map(h => (
                    <th key={h} className="text-left text-xs font-bold text-slate-600 px-4 py-3 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedApps.map(app => (
                  <tr key={app.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-4 py-3 text-blue-700 font-bold text-xs">{app.application_number}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800 text-xs">{app.first_name} {app.last_name}</p>
                      <p className="text-slate-400 text-[11px]">{app.mobile}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700 text-xs font-medium">{app.certificate_name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{app.verified_by || 'Staff Member'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/officer/applications/${app.id}`}
                        className="text-xs bg-amber-700 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-800 shadow-xs"
                      >
                        Review & Decide →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
