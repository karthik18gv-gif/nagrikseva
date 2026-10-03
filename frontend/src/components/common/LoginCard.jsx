import { FaLandmark, FaShieldAlt, FaLock, FaUserShield, FaArrowLeft, FaCheckCircle } from 'react-icons/fa'
import { Link } from 'react-router-dom'

export default function LoginCard({ title, subtitle, badge, color = 'blue', children, features, otherLogins = [] }) {
  const themes = {
    blue: {
      gradient: 'from-[#0f2347] via-[#1a3a6b] to-[#2457a6]',
      badge: 'bg-blue-100 text-blue-900 border-blue-200',
      dot: 'bg-blue-600',
      roleAccent: 'text-blue-600',
      portalTitle: 'Citizen Portal',
      iconBg: 'bg-white/10 text-amber-300',
      tag: 'Public Services Gateway'
    },
    green: {
      gradient: 'from-[#064e3b] via-[#047857] to-[#059669]',
      badge: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      dot: 'bg-emerald-600',
      roleAccent: 'text-emerald-700',
      portalTitle: 'Staff & Employee Desk',
      iconBg: 'bg-white/10 text-emerald-300',
      tag: 'Operational Verification System'
    },
    orange: {
      gradient: 'from-[#78350f] via-[#92400e] to-[#b45309]',
      badge: 'bg-amber-100 text-amber-900 border-amber-200',
      dot: 'bg-amber-600',
      roleAccent: 'text-amber-700',
      portalTitle: 'Gazetted Officer Desk',
      iconBg: 'bg-white/10 text-amber-300',
      tag: 'Sanctioning & Review Authority'
    },
    dark: {
      gradient: 'from-[#0a1628] via-[#0f2347] to-[#1e293b]',
      badge: 'bg-slate-100 text-slate-900 border-slate-300',
      dot: 'bg-slate-800',
      roleAccent: 'text-slate-800',
      portalTitle: 'State Admin Console',
      iconBg: 'bg-white/10 text-[#f4a200]',
      tag: 'Master Governance & Security'
    },
  }

  const t = themes[color] || themes.blue

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fb]">
      
      {/* Tricolor ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-[#ff9933] via-white to-[#138808]" />

      {/* Top official banner */}
      <div className="bg-[#0a1628] text-slate-300 text-xs py-2 px-4 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-white">Government of Karnataka</span>
            <span className="text-slate-500">·</span>
            <span>NagrikSeva Single Sign-On Access</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Toll-Free: <strong>1800-425-0002</strong></span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">Security: <strong>SSL-256 Bit</strong></span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#f4a200] to-[#d97706] flex items-center justify-center shadow-sm">
              <FaLandmark className="text-white text-base" />
            </div>
            <div>
              <div className="font-extrabold text-[#0f2347] text-base leading-tight group-hover:text-amber-600 transition-colors">
                Nagrik<span className="text-[#f4a200]">Seva</span>
              </div>
              <div className="text-slate-400 text-[10px] font-medium">Citizen &amp; Staff Service Portal</div>
            </div>
          </Link>
          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-xs text-[#1a3a6b] font-bold hover:underline py-1.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <FaArrowLeft className="text-[10px]" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Split-Screen Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="flex flex-col md:flex-row bg-white rounded-3xl shadow-elevated border border-slate-200/90 overflow-hidden w-full max-w-4xl animate-scale-in">
          
          {/* Left Visual Panel */}
          <div className={`md:flex flex-col bg-gradient-to-br ${t.gradient} p-8 sm:p-10 md:w-84 lg:w-96 text-white flex-shrink-0 relative overflow-hidden`}>
            
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20"></div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-wider text-amber-300 border border-white/10 mb-6">
                <FaShieldAlt /> {t.tag}
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-2xl ${t.iconBg} flex items-center justify-center text-2xl font-bold shadow-md`}>
                  <FaLandmark />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white leading-tight">{t.portalTitle}</h3>
                  <p className="text-white/70 text-xs font-medium">{subtitle}</p>
                </div>
              </div>

              <h2 className="text-xl lg:text-2xl font-black leading-snug mb-3 text-white">
                {title}
              </h2>
              <p className="text-white/80 text-xs leading-relaxed mb-8 font-normal">
                Adhering to National e-Governance and Karnataka Sakala Services standards. Protected by end-to-end tokenized sessions.
              </p>

              {/* Feature Highlights */}
              <div className="space-y-4">
                {features?.map(f => (
                  <div key={f.title} className="flex items-start gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm flex-shrink-0 text-amber-300">
                      {f.icon}
                    </div>
                    <div>
                      <div className="text-white text-xs font-bold">{f.title}</div>
                      <div className="text-white/70 text-[11px] leading-tight mt-0.5">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Security Assurance */}
            <div className="relative z-10 mt-auto pt-8 border-t border-white/10 flex items-center gap-2 text-[10px] text-white/60">
              <FaLock className="text-amber-300 text-xs flex-shrink-0" />
              <span>Certified ISO 27001 Secure Government Infrastructure</span>
            </div>
          </div>

          {/* Right Form Card Panel */}
          <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center bg-white">
            
            {/* Role Indicator Pill */}
            <div className={`inline-flex items-center gap-2 border text-xs font-bold px-3 py-1 rounded-full mb-6 w-fit shadow-xs ${t.badge}`}>
              <span className={`w-2 h-2 rounded-full ${t.dot}`}></span>
              <span>{badge}</span>
            </div>

            {/* Injected Form Controls */}
            {children}

            {/* Switch Role Portals Footer */}
            {otherLogins.length > 0 && (
              <div className="mt-8 pt-5 border-t border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
                  Sign in through another portal
                </p>
                <div className="flex gap-2 flex-wrap justify-center">
                  {otherLogins.map(({ to, label }) => (
                    <Link 
                      key={to} 
                      to={to} 
                      className="text-xs text-slate-600 font-semibold border border-slate-200 bg-slate-50 px-3 py-1.5 rounded-lg hover:border-[#1a3a6b] hover:text-[#1a3a6b] hover:bg-white transition-all shadow-xs"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0a1628] text-slate-400 text-xs text-center py-3 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <span>© {new Date().getFullYear()} NagrikSeva. Government of Karnataka. All Rights Reserved.</span>
          <span className="text-amber-400 font-medium">Developed by Karthik G V | CIMS, Bengaluru</span>
        </div>
      </footer>

    </div>
  )
}
