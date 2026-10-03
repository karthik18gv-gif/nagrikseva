import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { officerAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import StatusBadge from '../../components/common/StatusBadge'
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaClipboardList,
  FaArrowRight,
  FaBell,
  FaLandmark,
  FaSearch,
  FaShieldAlt
} from 'react-icons/fa'

export default function OfficerDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [queueSearch, setQueueSearch] = useState('')

  useEffect(() => {
    officerAPI.getDashboard()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading officer approval suite..." />

  const { stats, approval_queue, pension_queue, notifications } = data || {}

  const filteredQueue = approval_queue?.filter(app => {
    if (!queueSearch) return true
    const q = queueSearch.toLowerCase()
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
      <div className="relative bg-gradient-to-r from-[#78350F] via-[#92400E] to-[#D97706] rounded-2xl p-6 md:p-8 text-white shadow-md overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-200 text-[10px] font-bold uppercase tracking-wider mb-2 border border-white/10">
              <FaLandmark /> Gazetted Department Officer
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
              Namaskara, {user?.name || 'Officer'}! 👋
            </h1>
            <p className="text-amber-100 text-xs md:text-sm">
              {user?.designation} — {user?.department_name}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
            <FaShieldAlt className="text-amber-300" />
            <span className="text-amber-100">Approvals Authority Active</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending Approval', key: 'pending_approval', icon: FaClock, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Approved by You', key: 'approved', icon: FaCheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Rejected', key: 'rejected', icon: FaTimesCircle, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100' },
          { label: 'Total Processed', key: 'total', icon: FaClipboardList, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' }
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
        {/* Approval Queue */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">Approval Queue</h2>
              <p className="text-xs text-slate-500">Verified applications awaiting your statutory order</p>
            </div>
            <Link to="/officer/applications" className="text-xs text-amber-700 hover:underline font-bold flex items-center gap-1">
              Full Queue <FaArrowRight className="text-[10px]" />
            </Link>
          </div>

          {/* Quick Search */}
          <div className="relative mb-4">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              value={queueSearch}
              onChange={e => setQueueSearch(e.target.value)}
              placeholder="Search by citizen name, certificate, or app number..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white"
            />
          </div>

          {filteredQueue.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-2">🎉</div>
              <p className="font-bold text-slate-700 text-sm">Approval Queue is Clear</p>
              <p className="text-xs text-slate-400 mt-1">All verified applications have been adjudicated.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredQueue.slice(0, 7).map(app => (
                <Link
                  key={app.id}
                  to={`/officer/applications/${app.id}`}
                  className="flex items-center justify-between p-3.5 rounded-xl hover:bg-amber-50/60 border border-slate-100 hover:border-amber-200 transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-amber-900 truncate">{app.certificate_name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      {app.first_name} {app.last_name} • {app.application_number}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                    <StatusBadge status={app.status} />
                    <span className="text-amber-700 text-xs font-bold group-hover:translate-x-0.5 transition-transform">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Pension & Notifications */}
        <div className="lg:col-span-5 space-y-5">
          {/* Pension Queue */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Pension Cases</h3>
              <Link to="/officer/pension" className="text-xs text-amber-700 hover:underline font-bold">
                View All →
              </Link>
            </div>

            {pension_queue?.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No pending pension cases</p>
            ) : (
              <div className="space-y-2">
                {pension_queue?.slice(0, 4).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{p.employee_name}</p>
                      <p className="text-slate-500 font-mono text-[11px] mt-0.5">{p.application_number}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <FaBell className="text-amber-700 text-xs" />
              <h3 className="font-bold text-slate-900 text-sm">Recent Notifications</h3>
            </div>
            {notifications?.length > 0 ? (
              <div className="space-y-2">
                {notifications.slice(0, 3).map(n => (
                  <div key={n.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="font-semibold text-slate-800">{n.title}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">{n.message?.substring(0, 70)}...</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-3">No notifications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
