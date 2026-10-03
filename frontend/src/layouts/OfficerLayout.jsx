import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  FaBars, FaTimes, FaSignOutAlt, FaLandmark, FaChevronRight, 
  FaChartPie, FaTasks, FaMoneyBillWave, FaChartLine, FaUserShield, FaAward
} from 'react-icons/fa'

const NAV = [
  { to: '/officer/dashboard', label: 'Sanctioning Desk', icon: <FaChartPie /> },
  { to: '/officer/applications', label: 'Approval Queue', icon: <FaTasks /> },
  { to: '/officer/pension', label: 'Pension Sanctions', icon: <FaMoneyBillWave /> },
  { to: '/officer/reports', label: 'Department Analytics', icon: <FaChartLine /> },
  { to: '/officer/profile', label: 'Officer Profile', icon: <FaUserShield /> },
]

export default function OfficerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#78350f] text-amber-100 border-r border-amber-800/40 select-none">
      
      {/* Brand Header */}
      <div className="p-4 border-b border-amber-800/40">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#f4a200] to-[#d97706] rounded-xl flex items-center justify-center text-white shadow-goldGlow flex-shrink-0">
            <FaLandmark className="text-lg" />
          </div>
          <div className="min-w-0">
            <div className="text-white font-extrabold text-base tracking-tight leading-tight flex items-center gap-1.5">
              <span>Nagrik<span className="text-[#f4a200]">Seva</span></span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                Officer
              </span>
            </div>
            <div className="text-amber-200/70 text-[10px] font-medium truncate">Department Sanctioning Desk</div>
          </div>
        </Link>
      </div>

      {/* Officer User Profile Card */}
      <div className="p-3 mx-3 my-3 rounded-xl bg-white/5 border border-amber-600/40 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-800 flex items-center justify-center text-white font-black text-sm shadow-xs flex-shrink-0">
          {(user?.first_name?.[0] || user?.name?.[0] || 'O').toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-white text-xs font-bold truncate">
            {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.name || 'Sanctioning Officer')}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-amber-300 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="truncate">Gazetted Authority · {user?.designation || 'Officer'}</span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="p-3 flex-1 overflow-y-auto space-y-1 nice-scroll">
        <div className="px-3 text-[10px] font-black uppercase tracking-wider text-amber-300/60 mb-2">
          Sanction &amp; Approval
        </div>
        {NAV.map(({ to, label, icon }) => {
          const isActive = location.pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 relative group ${
                isActive
                  ? 'bg-amber-900/90 text-white font-bold shadow-sm'
                  : 'text-amber-200/80 hover:text-white hover:bg-amber-800/40'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#f4a200] rounded-r-full" />
              )}
              <span className={`text-sm ${isActive ? 'text-amber-300' : 'text-amber-200/60 group-hover:text-amber-200'} transition-colors`}>
                {icon}
              </span>
              <span className="truncate">{label}</span>
              {isActive && <FaChevronRight className="ml-auto text-[10px] text-amber-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-3 border-t border-amber-800/40 bg-[#78350f]/90">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-red-200 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 w-full transition-all duration-200 shadow-xs"
        >
          <FaSignOutAlt />
          <span>Exit Officer Desk</span>
        </button>
      </div>

    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#78350f] fixed top-0 left-0 h-full z-40 shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-[#78350f] flex flex-col h-full shadow-2xl animate-slide-right">
            <SidebarContent />
          </div>
          <div 
            className="flex-1 bg-black/60 backdrop-blur-xs animate-fade-in" 
            onClick={() => setOpen(false)} 
          />
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1 lg:ml-64 flex flex-col min-w-0">
        
        {/* Mobile Header */}
        <header className="bg-[#78350f] border-b border-amber-800 px-4 py-3 flex items-center justify-between lg:hidden sticky top-0 z-30 shadow-md">
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
            <span className="font-extrabold text-white text-sm">NagrikSeva Officer</span>
          </div>

          <button 
            onClick={handleLogout} 
            className="text-red-300 p-2 rounded-lg hover:bg-white/10 transition-colors"
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
