import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { employeeAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { exportToCSV } from '../../utils/exportUtils'
import { FaSearch, FaFileExport, FaFilter } from 'react-icons/fa'

export default function EmployeeApplications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')

  const fetchApps = () => {
    setLoading(true)
    employeeAPI.getApplications({
      status: status || undefined,
      search: search || undefined
    })
      .then(r => setApps(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = setTimeout(fetchApps, 350)
    return () => clearTimeout(timer)
  }, [status, search])

  // Client-side sorting
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
      'Submitted Date': a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('en-IN') : '',
      'Status': a.status
    }))
    exportToCSV(exportData, `Employee_Assigned_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div>
      <PageHeader
        title="Assigned Applications"
        subtitle="Review and process citizen certificate applications for verification"
        actions={
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FaFileExport className="text-emerald-600" /> Export CSV
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm space-y-4">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <FaFilter className="text-xs" /> Filter:
          </span>
          {['','submitted','under_verification','verified','returned','rejected'].map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                status === s ? 'bg-green-700 text-white shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-green-700'
              }`}
            >
              {s ? s.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase()) : 'All Queue'}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              className="form-input w-full pl-8 text-xs py-2"
              placeholder="Search App ID, Citizen, Mobile..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Sort By:</label>
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
              className="border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-700"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest / Longest Pending</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : sortedApps.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="font-semibold text-slate-700 text-sm">No applications found</h3>
          <p className="text-slate-400 text-xs mt-1">All assigned applications have been processed or match no criteria</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[750px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['App ID','Applicant','Certificate Service','Submitted Date','Status','Action'].map(h => (
                    <th key={h} className="text-left text-xs font-bold text-slate-600 px-4 py-3 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedApps.map(app => (
                  <tr key={app.id} className="hover:bg-green-50/40 transition-colors">
                    <td className="px-4 py-3 text-blue-700 font-bold text-xs">{app.application_number}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800 text-xs">{app.first_name} {app.last_name}</p>
                      <p className="text-slate-400 text-[11px]">{app.mobile}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700 text-xs font-medium">{app.certificate_name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={app.status}/></td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/employee/applications/${app.id}`}
                        className="text-xs bg-green-700 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-800 shadow-xs"
                      >
                        Review & Verify →
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
