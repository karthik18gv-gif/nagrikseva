import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  FaBars, FaTimes, FaLandmark, FaShieldAlt, FaUser, 
  FaBriefcase, FaUserShield, FaLock, FaCheckCircle, FaSearch 
} from 'react-icons/fa'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/services', label: 'Services' },
    { to: '/verify-certificate', label: 'Verify Certificate', highlight: true },
    { to: '/faq', label: 'FAQs' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ]

  const roles = [
    { to: '/citizen/login', label: 'Citizen', icon: <FaUser className="text-[10px]" />, badge: 'bg-white text-[#0f2347] hover:bg-blue-50 shadow-sm border border-white/80' },
    { to: '/employee/login', label: 'Employee', icon: <FaBriefcase className="text-[10px]" />, badge: 'bg-emerald-950/40 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-800/40' },
    { to: '/officer/login', label: 'Officer', icon: <FaUserShield className="text-[10px]" />, badge: 'bg-amber-950/40 text-amber-200 border border-amber-500/30 hover:bg-amber-800/40' },
    { to: '/admin/login', label: 'Admin', icon: <FaLock className="text-[10px]" />, badge: 'bg-[#f4a200] text-slate-950 hover:bg-[#d97706] font-bold shadow-goldGlow' },
  ]

  return (
    <>
      {/* Tricolor Government Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-[#ff9933] via-white to-[#138808] sticky top-0 z-50 shadow-sm" />

      {/* Top micro-bar */}
      <div className="bg-[#0a1628] text-slate-300 text-[11px] py-1 px-4 border-b border-white/5 hidden sm:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 font-semibold text-white">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Government of Karnataka — Official Citizen Services Portal
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">ಸರ್ಕಾರಿ ಸೇವೆಗಳ ಪೋರ್ಟಲ್</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300 font-medium">
            <span>Toll Free: <strong>1800-425-0002</strong></span>
            <span>Language: <strong>English / ಕನ್ನಡ</strong></span>
          </div>
        </div>
      </div>

      <nav className={`sticky top-1 z-40 transition-all duration-300 ${scrolled ? 'bg-[#0f2347]/95 backdrop-blur-md shadow-xl py-0' : 'bg-[#0f2347] py-0.5'} border-b border-white/10 text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & State Emblem */}
            <Link to="/" className="flex items-center gap-3 group focus:outline-none">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f4a200] to-[#d97706] flex items-center justify-center shadow-goldGlow group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                <FaLandmark className="text-white text-lg drop-shadow" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-extrabold text-xl tracking-tight leading-tight group-hover:text-amber-300 transition-colors">
                    Nagrik<span className="text-[#f4a200]">Seva</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-white/10 text-amber-300 border border-amber-400/20">
                    GovTech 2.0
                  </span>
                </div>
                <span className="text-blue-200/70 text-[10px] tracking-wide font-medium">
                  State Citizen Services & Pension Management
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              {navLinks.map(({ to, label, highlight }) => {
                const isActive = location.pathname === to
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                      highlight
                        ? 'text-amber-300 bg-amber-500/10 border border-amber-400/30 hover:bg-amber-500/20'
                        : isActive
                        ? 'text-white bg-white/10'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {highlight && <FaShieldAlt className="text-[10px] text-[#f4a200]" />}
                    {label}
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#f4a200] rounded-full" />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Role Access Switches */}
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden xl:inline">Portal:</span>
              {roles.map(r => (
                <Link
                  key={r.to}
                  to={r.to}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${r.badge}`}
                >
                  {r.icon}
                  <span>{r.label}</span>
                </Link>
              ))}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center gap-2">
              <Link
                to="/verify-certificate"
                className="p-2 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-400/30"
                title="Verify Certificate"
              >
                <FaShieldAlt />
              </Link>
              <button
                type="button"
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
                onClick={() => setOpen(!open)}
                aria-label="Toggle Navigation Menu"
              >
                {open ? <FaTimes size={22} /> : <FaBars size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile Animated Drawer Menu */}
          {open && (
            <div className="md:hidden py-4 border-t border-white/10 animate-fade-down space-y-3">
              <div className="grid grid-cols-2 gap-1.5">
                {navLinks.map(({ to, label, highlight }) => {
                  const isActive = location.pathname === to
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setOpen(false)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                        highlight 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold' 
                          : isActive 
                          ? 'bg-white/15 text-white font-bold' 
                          : 'text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <span>{label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#f4a200]"></span>}
                    </Link>
                  )
                })}
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Select Portal Login</p>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map(r => (
                    <Link
                      key={r.to}
                      to={r.to}
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold ${r.badge}`}
                    >
                      {r.icon}
                      <span>{r.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}
