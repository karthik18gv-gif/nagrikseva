import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  FaBars, FaTimes, FaSignOutAlt, FaLandmark, FaChevronRight, 
  FaChartPie, FaUsers, FaUserTie, FaUserShield, FaBuilding, 
  FaCertificate, FaTasks, FaMoneyBillWave, FaBullhorn, 
  FaQuestionCircle, FaTicketAlt, FaHistory, FaUserCog, FaShieldAlt,
  FaFileAlt
} from 'react-icons/fa'

const NAV_GROUPS = [
  {
    group: 'Executive Overview',
    items: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: <FaChartPie /> },
      { to: '/admin/reports', label: 'System Analytics', icon: <FaChartPie /> },
    ]
  },
  {
    group: 'Citizen & Personnel',
    items: [
      { to: '/admin/citizens', label: 'Citizens Registry', icon: <FaUsers /> },
      { to: '/admin/employees', label: 'Desk Employees', icon: <FaUserTie /> },
      { to: '/admin/officers', label: 'Sanctioning Officers', icon: <FaUserShield /> },
    ]
  },
  {
    group: 'Departments & Services',
    items: [
      { to: '/admin/departments', label: 'Departments', icon: <FaBuilding /> },
      { to: '/admin/certificate-types', label: 'Certificate Services', icon: <FaCertificate /> },
    ]
  },
  {
    group: 'Workflow Queues',
    items: [
      { to: '/admin/applications', label: 'All Applications', icon: <FaTasks /> },
      { to: '/admin/pension', label: 'Pension Cases', icon: <FaMoneyBillWave /> },
    ]
  },
  {
    group: 'Content & Support',
    items: [
      { to: '/admin/announcements', label: 'Announcements', icon: <FaBullhorn /> },
      { to: '/admin/faqs', label: 'FAQs CMS', icon: <FaQuestionCircle /> },
      { to: '/admin/support', label: 'Support Tickets', icon: <FaTicketAlt /> },
    ]
  },
  {
    group: 'Governance & Security',
    items: [
      { to: '/admin/audit-logs', label: 'Audit Trail Logs', icon: <FaHistory /> },
      { to: '/admin/profile', label: 'Admin Security', icon: <FaUserCog /> },
    ]
  }
]

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0a1628] text-slate-300 border-r border-white/10 select-none">
      
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#f4a200] to-[#d97706] rounded-xl flex items-center justify-center text-white shadow-goldGlow flex-shrink-0">
            <FaLandmark className="text-lg" />
          </div>
          <div className="min-w-0">
            <div className="text-white font-extrabold text-base tracking-tight leading-tight flex items-center gap-1.5">
              <span>Nagrik<span className="text-[#f4a200]">Seva</span></span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-black border border-amber-400/30">
                Admin
              </span>
            </div>
            <div className="text-slate-400 text-[10px] font-medium truncate">State Master Administration</div>
          </div>
        </Link>
      </div>

      {/* Admin User Profile Pill */}
      <div className="p-3 mx-3 my-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-sm shadow-xs flex-shrink-0">
          {(user?.first_name?.[0] || user?.name?.[0] || 'A').toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-white text-xs font-bold truncate">
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.name || 'Super Admin')}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Online · {user?.designation || 'Master Admin'}</span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="p-3 flex-1 overflow-y-auto space-y-4 nice-scroll">
        {NAV_GROUPS.map(grp => (
          <div key={grp.group} className="space-y-0.5">
            <div className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
              {grp.group}
            </div>
            {grp.items.map(({ to, label, icon }) => {
              const isActive = location.pathname.startsWith(to)
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 relative group ${
                    isActive
                      ? 'bg-[#1a3a6b] text-white font-bold shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {/* Left Active Indicator Bar */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#f4a200] rounded-r-full" />
                  )}
                  <span className={`text-sm ${isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-300'} transition-colors`}>
                    {icon}
                  </span>
                  <span className="truncate">{label}</span>
                  {isActive && <FaChevronRight className="ml-auto text-[10px] text-amber-400" />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Logout Footer */}
      <div className="p-3 border-t border-white/10 bg-[#0a1628]/80">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-300 bg-red-950/30 hover:bg-red-900/50 border border-red-800/40 w-full transition-all duration-200 shadow-xs"
        >
          <FaSignOutAlt />
          <span>Exit Admin Session</span>
        </button>
      </div>

    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0a1628] fixed top-0 left-0 h-full z-40 shadow-2xl">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-[#0a1628] flex flex-col h-full shadow-2xl animate-slide-right">
            <SidebarContent />
          </div>
          <div 
            className="flex-1 bg-black/60 backdrop-blur-xs animate-fade-in" 
            onClick={() => setOpen(false)} 
          />
        </div>
      )}

      {/* Main Administrative Viewport */}
      <main className="flex-1 lg:ml-64 flex flex-col min-w-0">
        
        {/* Mobile Header */}
        <header className="bg-[#0f2347] border-b border-white/10 px-4 py-3 flex items-center justify-between lg:hidden sticky top-0 z-30 shadow-md">
          <button 
            onClick={() => setOpen(true)} 
            className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Open Sidebar"
          >
            <FaBars size={18} />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#f4a200] rounded-lg flex items-center justify-center text-white text-xs font-bold">
              <FaLandmark />
            </div>
            <span className="font-extrabold text-white text-sm">NagrikSeva Admin</span>
          </div>

          <button 
            onClick={handleLogout} 
            className="text-red-400 p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Logout"
          >
            <FaSignOutAlt size={16} />
          </button>
        </header>

        {/* Content Container */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </div>

      </main>
    </div>
  )
}
