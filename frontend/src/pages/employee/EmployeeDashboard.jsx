import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { employeeAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import StatusBadge from '../../components/common/StatusBadge'
import { 
  FaClipboardList, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaArrowRight, 
  FaBell, 
  FaLandmark,
  FaSearch,
  FaShieldAlt
} from 'react-icons/fa'

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [appSearch, setAppSearch] = useState('')

  useEffect(() => {
    employeeAPI.getDashboard()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading verification desk..." />

  const { stats, pending_applications, notifications } = data || {}

  const filteredApps = pending_applications?.filter(app => {
    if (!appSearch) return true
    const q = appSearch.toLowerCase()
    return (
      app.certificate_name?.toLowerCase().includes(q) ||
      app.first_name?.toLowerCase().includes(q) ||
      app.last_name?.toLowerCase().includes(q) ||
      app.application_number?.toLowerCase().includes(q)
    )
  }) ?? []

  return (
    <div className="space-y-6 pb-10">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-700 rounded-2xl p-6 md:p-8 text-white shadow-md overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-[10px] font-bold uppercase tracking-wider mb-2 border border-white/10">
              <FaLandmark /> Karnataka Revenue Administration
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
              Namaskara, {user?.name || 'Officer'}! 👋
            </h1>
            <p className="text-emerald-100 text-xs md:text-sm">
              {user?.designation} — {user?.department_name}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
            <FaShieldAlt className="text-emerald-300" />
            <span className="text-emerald-100">Verification Desk Active</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Review', key: 'pending', icon: FaClock, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Under Verification', key: 'under_verification', icon: FaClipboardList, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Verified & Forwarded', key: 'verified', icon: FaCheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Total Assigned', key: 'total_assigned', icon: FaClipboardList, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' }
        ].map(item => {
          const Icon = item.icon
          return (
            <div key={item.label} className={`bg-white rounded-2xl p-5 border ${item.border} shadow-xs hover:shadow-md transition-all flex items-center justify-between`}>
              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1">{item.label}</span>
                <span className={`text-2xl md:text-3xl font-black ${item.color}`}>{stats?.[item.key] || 0}</span>
              </div>
              <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center text-xl`}>
                <Icon />
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Applications Queue */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Pending Applications Queue</h2>
              <p className="text-xs text-slate-500">Applications awaiting document verification</p>
            </div>
            <Link to="/employee/applications" className="text-xs text-emerald-700 hover:underline font-bold flex items-center gap-1">
              Full Queue <FaArrowRight className="text-[10px]" />
            </Link>
          </div>

          {/* Quick Search */}
          <div className="relative mb-4">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              value={appSearch}
              onChange={e => setAppSearch(e.target.value)}
              placeholder="Quick search by name, certificate, or app number..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>

          {filteredApps.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-2">🎉</div>
              <p className="font-bold text-slate-700 text-sm">Queue is Clear!</p>
              <p className="text-xs text-slate-400 mt-1">All assigned applications have been processed.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredApps.slice(0, 8).map(app => (
                <Link
                  key={app.id}
                  to={`/employee/applications/${app.id}`}
                  className="flex items-center justify-between p-3.5 rounded-xl hover:bg-emerald-50/60 border border-slate-100 hover:border-emerald-200 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-900 truncate">{app.certificate_name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      {app.first_name} {app.last_name} • {app.application_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                    <StatusBadge status={app.status} />
                    <span className="text-emerald-700 text-xs font-bold group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Notifications */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FaBell className="text-emerald-700 text-xs" />
                <h3 className="font-bold text-slate-900 text-sm">Recent Notifications</h3>
              </div>
            </div>

            {notifications?.length > 0 ? (
              <div className="space-y-2.5">
                {notifications.slice(0, 5).map(n => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-base flex-shrink-0">
                        {n.type === 'success' ? '✅' : n.type === 'error' ? '❌' : 'ℹ️'}
                      </span>
                      <div>
                        <p className="font-semibold text-slate-800">{n.title}</p>
                        <p className="text-slate-500 text-[11px] line-clamp-2 mt-0.5">{n.message?.substring(0, 80)}...</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-5">No notifications</p>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
            <h4 className="font-bold text-emerald-900 text-xs mb-3">Quick Actions</h4>
            <div className="space-y-2">
              {[
                { to: '/employee/applications', label: 'View All Assigned Applications' },
                { to: '/employee/pension', label: 'My Pension Application' },
                { to: '/employee/reports', label: 'View Monthly Reports' }
              ].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block text-xs font-semibold text-emerald-800 hover:text-emerald-600 hover:underline py-1"
                >
                  → {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
