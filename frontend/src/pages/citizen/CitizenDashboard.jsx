import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { citizenAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import StatusBadge from '../../components/common/StatusBadge'
import { 
  FaPlusCircle, 
  FaSearch, 
  FaFileAlt, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaLandmark, 
  FaArrowRight, 
  FaBell, 
  FaShieldAlt,
  FaFileDownload,
  FaHeadset
} from 'react-icons/fa'

export default function CitizenDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    citizenAPI.getDashboard()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading your citizen dashboard..." />

  const { stats, recent_applications, notifications, announcements } = data || {}

  return (
    <div className="space-y-6 pb-10">
      {/* Personalized Welcome Banner */}
      <div className="relative bg-gradient-to-r from-[#0F2347] via-[#1A3A6B] to-[#2457A6] rounded-2xl p-6 md:p-8 text-white shadow-md overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-white/10">
              <FaLandmark /> Karnataka Citizen Services Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
              Namaskara, {user?.first_name} {user?.last_name}! 👋
            </h1>
            <p className="text-blue-100 text-xs md:text-sm max-w-xl">
              Manage your digital certificates, monitor verification stages in real-time, and access welfare schemes.
            </p>
            <div className="flex items-center gap-3 mt-3 text-[11px] text-blue-200">
              <span className="flex items-center gap-1">
                <FaShieldAlt className="text-emerald-400" /> Aadhaar Verified: {user?.aadhaar_number ? `XXXX-XXXX-${user.aadhaar_number.slice(-4)}` : 'Verified'}
              </span>
              <span>•</span>
              <span>District: {user?.district_name || 'Bengaluru Urban'}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/citizen/apply"
              className="flex items-center gap-2 bg-[#F4A200] hover:bg-[#D97706] text-slate-900 font-bold px-5 py-3 rounded-xl text-xs md:text-sm transition-all shadow-md hover:shadow-lg whitespace-nowrap"
            >
              <FaPlusCircle /> Apply for Certificate
            </Link>
            <Link
              to="/citizen/track"
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-4 py-3 rounded-xl text-xs md:text-sm backdrop-blur-sm transition-colors border border-white/20 whitespace-nowrap"
            >
              <FaSearch /> Track Status
            </Link>
          </div>
        </div>
      </div>

      {/* Announcements / Alerts Banner */}
      {announcements?.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
          <span className="text-amber-600 text-lg mt-0.5 flex-shrink-0">📢</span>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-amber-900 text-xs md:text-sm">{announcements[0].title}</h4>
              <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">Important Notice</span>
            </div>
            <p className="text-amber-800 text-xs mt-1 leading-relaxed">{announcements[0].content}</p>
          </div>
        </div>
      )}

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Submitted', key: 'total', icon: FaFileAlt, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
          { label: 'Under Review', key: 'pending', icon: FaClock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Approved & Issued', key: 'approved', icon: FaCheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Returned / Rejected', key: 'rejected', icon: FaTimesCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' }
        ].map((item) => {
          const Icon = item.icon
          const count = stats?.[item.key] || 0
          return (
            <div
              key={item.label}
              className={`bg-white rounded-2xl p-5 border ${item.border} shadow-xs hover:shadow-md transition-all flex items-center justify-between`}
            >
              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1">{item.label}</span>
                <span className={`text-2xl md:text-3xl font-black ${item.color}`}>
                  {count}
                </span>
              </div>
              <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center text-xl shadow-inner`}>
                <Icon />
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Grid: Recent Applications & Sidebar Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Applications Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-extrabold text-slate-900 text-base md:text-lg">Recent Service Applications</h2>
              <p className="text-xs text-slate-500">Track and view the progress of your latest requests</p>
            </div>
            <Link
              to="/citizen/applications"
              className="text-xs text-[#1A3A6B] hover:text-[#2457A6] font-bold flex items-center gap-1 hover:underline"
            >
              View Full History <FaArrowRight className="text-[10px]" />
            </Link>
          </div>

          {recent_applications?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 text-[10px]">
                    <th className="pb-3 pl-2">Application No</th>
                    <th className="pb-3">Certificate Type</th>
                    <th className="pb-3">Applied On</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 pr-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recent_applications.map(app => (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 pl-2 font-mono font-bold text-[#1A3A6B]">
                        {app.application_number}
                      </td>
                      <td className="py-3.5">
                        <div className="font-semibold text-slate-800">{app.certificate_name}</div>
                        <div className="text-[10px] text-slate-400">{app.department_name}</div>
                      </td>
                      <td className="py-3.5 text-slate-500 font-medium">
                        {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="py-3.5 text-center">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="py-3.5 pr-2 text-right">
                        <Link
                          to={`/citizen/track?appId=${app.application_number}`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] inline-flex items-center gap-1 transition-colors"
                        >
                          Track
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-14 h-14 bg-blue-50 text-[#1A3A6B] rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl">
                <FaFileAlt />
              </div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">No Applications Submitted Yet</h4>
              <p className="text-slate-500 text-xs mb-4 max-w-sm mx-auto">
                Apply for certificates like Caste, Income, Birth, Residence, or Agriculture records directly online.
              </p>
              <Link
                to="/citizen/apply"
                className="px-4 py-2 bg-[#1A3A6B] hover:bg-[#2457A6] text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm"
              >
                <FaPlusCircle /> Apply Now
              </Link>
            </div>
          )}
        </div>

        {/* Right: Quick Actions & Notification Preview (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Quick Navigation</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link
                to="/citizen/apply"
                className="p-3 rounded-xl bg-blue-50/60 hover:bg-blue-100/60 text-blue-900 border border-blue-100 flex flex-col items-center text-center transition-all group"
              >
                <span className="text-xl mb-1.5 group-hover:scale-110 transition-transform">📄</span>
                <span className="text-xs font-bold">Apply Service</span>
              </Link>

              <Link
                to="/citizen/track"
                className="p-3 rounded-xl bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-900 border border-emerald-100 flex flex-col items-center text-center transition-all group"
              >
                <span className="text-xl mb-1.5 group-hover:scale-110 transition-transform">🔍</span>
                <span className="text-xs font-bold">Track Status</span>
              </Link>

              <Link
                to="/citizen/applications"
                className="p-3 rounded-xl bg-indigo-50/60 hover:bg-indigo-100/60 text-indigo-900 border border-indigo-100 flex flex-col items-center text-center transition-all group"
              >
                <span className="text-xl mb-1.5 group-hover:scale-110 transition-transform">📋</span>
                <span className="text-xs font-bold">My History</span>
              </Link>

              <Link
                to="/citizen/support"
                className="p-3 rounded-xl bg-amber-50/60 hover:bg-amber-100/60 text-amber-900 border border-amber-100 flex flex-col items-center text-center transition-all group"
              >
                <span className="text-xl mb-1.5 group-hover:scale-110 transition-transform">🎫</span>
                <span className="text-xs font-bold">Help Desk</span>
              </Link>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FaBell className="text-[#1A3A6B] text-xs" />
                <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
              </div>
              <Link to="/citizen/notifications" className="text-[11px] text-[#1A3A6B] font-bold hover:underline">
                View All
              </Link>
            </div>

            {notifications?.length > 0 ? (
              <div className="space-y-2.5">
                {notifications.slice(0, 3).map(n => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border text-xs transition-colors ${
                      n.is_read ? 'bg-slate-50 border-slate-100' : 'bg-blue-50/60 border-blue-100'
                    }`}
                  >
                    <div className="font-semibold text-slate-800">{n.title}</div>
                    <div className="text-slate-500 text-[11px] line-clamp-2 mt-0.5">{n.message}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.created_at).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No unread notifications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
