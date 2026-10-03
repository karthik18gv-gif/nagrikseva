import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { adminAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import StatusBadge from '../../components/common/StatusBadge'
import {
  FaUsers,
  FaClipboardList,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaBuilding,
  FaUserTie,
  FaArrowRight,
  FaLandmark,
  FaShieldAlt,
  FaChartBar
} from 'react-icons/fa'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminAPI.getDashboard()
      .then(r => setData(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading administration console..." />

  const {
    counts,
    application_stats,
    pension_stats,
    recent_applications,
    by_certificate_type
  } = data || {}

  const systemKPIs = [
    { label: 'Registered Citizens', value: counts?.citizens, icon: FaUsers, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Total Applications', value: application_stats?.total, icon: FaClipboardList, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
    { label: 'Pending / Under Review', value: application_stats?.pending, icon: FaClock, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'Pension Cases', value: pension_stats?.total, icon: FaUserTie, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { label: 'Approved & Issued', value: application_stats?.approved, icon: FaCheckCircle, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Rejected', value: application_stats?.rejected, icon: FaTimesCircle, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-100' },
    { label: 'Govt. Employees', value: counts?.employees, icon: FaBuilding, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100' },
    { label: 'Dept. Officers', value: counts?.officers, icon: FaLandmark, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-100' },
  ]

  const maxCertCount = Math.max(...(by_certificate_type?.map(c => c.total) ?? [1]), 1)

  return (
    <div className="space-y-6 pb-10">
      {/* Welcome Banner */}
      <div className="relative bg-gradient-to-r from-[#0F2347] via-[#1A3A6B] to-[#2457A6] rounded-2xl p-6 md:p-8 text-white shadow-md overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-2 border border-white/10">
              <FaLandmark /> State Secretariat Master Console
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
              Welcome, {user?.name || 'System Administrator'} 👋
            </h1>
            <p className="text-blue-100 text-xs md:text-sm">
              NagrikSeva Portal — Real-Time System Overview
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] bg-white/10 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10">
            <FaShieldAlt className="text-emerald-300" />
            <span className="text-blue-100">All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* 8 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {systemKPIs.map(item => {
          const Icon = item.icon
          return (
            <div key={item.label} className={`bg-white rounded-2xl p-4 border ${item.border} shadow-xs hover:shadow-md transition-all`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider leading-tight pr-1">{item.label}</span>
                <div className={`w-8 h-8 ${item.bg} ${item.color} rounded-xl flex items-center justify-center text-sm flex-shrink-0`}>
                  <Icon />
                </div>
              </div>
              <div className={`text-2xl font-black ${item.color}`}>{item.value ?? 0}</div>
            </div>
          )
        })}
      </div>

      {/* Main Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recent Applications Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Recent Applications</h3>
              <p className="text-xs text-slate-500">Latest citizen service submissions across all departments</p>
            </div>
            <Link to="/admin/applications" className="text-xs text-[#1A3A6B] hover:underline font-bold flex items-center gap-1">
              View All <FaArrowRight className="text-[10px]" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  <th className="pb-2.5 text-left pl-1">App ID</th>
                  <th className="pb-2.5 text-left">Citizen</th>
                  <th className="pb-2.5 text-left hidden md:table-cell">Service</th>
                  <th className="pb-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recent_applications?.slice(0, 9).map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 pl-1 font-mono font-bold text-[#1A3A6B]">{a.application_number}</td>
                    <td className="py-3 font-semibold text-slate-800">{a.first_name} {a.last_name}</td>
                    <td className="py-3 text-slate-500 hidden md:table-cell">{a.certificate_name}</td>
                    <td className="py-3 text-center">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Certificate Distribution (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <FaChartBar className="text-[#1A3A6B] text-sm" />
              <h3 className="font-extrabold text-slate-900 text-sm">Applications by Service</h3>
            </div>
            <div className="space-y-3">
              {by_certificate_type?.slice(0, 7).map(cert => {
                const pct = Math.round((cert.total / maxCertCount) * 100)
                return (
                  <div key={cert.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-semibold text-slate-700 truncate pr-2">{cert.name}</span>
                      <span className="text-[11px] font-bold text-slate-500">{cert.total}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#1A3A6B] to-[#2457A6] rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* User Summary */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-extrabold text-slate-900 text-sm mb-3 pb-2 border-b border-slate-100">Personnel Summary</h3>
            <div className="space-y-2">
              {[
                { label: 'Citizens Registered', value: counts?.citizens, color: 'text-blue-700' },
                { label: 'Govt. Employees', value: counts?.employees, color: 'text-emerald-700' },
                { label: 'Dept. Officers', value: counts?.officers, color: 'text-amber-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-semibold text-slate-600">{label}</span>
                  <span className={`text-base font-black ${color}`}>{value ?? 0}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Admin Links */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <h4 className="font-bold text-slate-700 text-xs mb-2">Quick Management</h4>
            <div className="space-y-1">
              {[
                { to: '/admin/citizens', label: 'Manage Citizens' },
                { to: '/admin/employees', label: 'Manage Employees' },
                { to: '/admin/applications', label: 'All Applications' },
                { to: '/admin/pension', label: 'Pension Cases' },
                { to: '/admin/reports', label: 'Analytics Reports' },
              ].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block text-xs font-semibold text-slate-600 hover:text-[#1A3A6B] hover:underline py-1"
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
