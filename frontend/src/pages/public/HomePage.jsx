import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { publicAPI } from '../../services/api'
import { 
  FaArrowRight, FaChevronDown, FaChevronUp, FaCheckCircle, 
  FaClock, FaShieldAlt, FaFileAlt, FaLandmark, FaStar, 
  FaSearch, FaQrcode, FaLock, FaUserCheck, FaAward, 
  FaBullhorn, FaCertificate, FaUserFriends, FaBuilding, FaHandHoldingHeart
} from 'react-icons/fa'

const SERVICES = [
  { icon: '📄', name: 'Birth Certificate', dept: 'Revenue & Statistics', days: '3–5 working days', fee: 'Free', code: 'CRT-BRT' },
  { icon: '💰', name: 'Income Certificate', dept: 'Revenue Department', days: '5–7 working days', fee: 'Free', code: 'CRT-INC' },
  { icon: '🪪', name: 'Caste Certificate', dept: 'Social Welfare', days: '7–10 working days', fee: 'Free', code: 'CRT-CST' },
  { icon: '🏠', name: 'Domicile Certificate', dept: 'Revenue Department', days: '5–7 working days', fee: 'Free', code: 'CRT-DOM' },
  { icon: '📋', name: 'Residence Certificate', dept: 'Municipal Admin', days: '3–5 working days', fee: 'Free', code: 'CRT-RES' },
  { icon: '🕊️', name: 'Death Certificate', dept: 'Civil Registration', days: '3–5 working days', fee: 'Free', code: 'CRT-DTH' },
  { icon: '👴', name: 'Senior Citizen Card', dept: 'Social Welfare', days: '5–7 working days', fee: 'Free', code: 'CRT-SNR' },
  { icon: '♿', name: 'Disability Certificate', dept: 'Health & Family', days: '10–15 working days', fee: 'Free', code: 'CRT-DIS' },
  { icon: '💼', name: 'Pension Processing', dept: 'Finance & Treasury', days: 'Retired Staff Only', fee: 'Govt. Plan', code: 'PEN-GOV' },
]

const STEPS = [
  { n: '01', title: 'Register Account', desc: 'Verify your Aadhaar and 10-digit mobile number in under 2 minutes.' },
  { n: '02', title: 'Select Service', desc: 'Choose from 25+ government certificates across departments.' },
  { n: '03', title: 'Upload & Apply', desc: 'Attach digital supporting proofs and submit your application.' },
  { n: '04', title: 'Desk Verification', desc: 'Government Employee inspects eligibility and documents.' },
  { n: '05', title: 'Gazetted Approval', desc: 'Competent Department Officer sanctions the digital certificate.' },
  { n: '06', title: 'Instant Download', desc: 'Download official certificate with tamper-proof QR code.' },
]

const WHY = [
  { icon: <FaClock className="text-2xl text-blue-600" />, title: 'Accelerated Processing', desc: 'Legally mandated turnaround with proactive SMS and portal alerts.' },
  { icon: <FaShieldAlt className="text-2xl text-emerald-600" />, title: 'Tamper-Proof QR Seals', desc: 'Cryptographically verifiable digital signatures on every document.' },
  { icon: <FaCheckCircle className="text-2xl text-indigo-600" />, title: 'Real-Time Audit Trail', desc: 'Transparent step-by-step progress tracking for complete citizen peace of mind.' },
  { icon: <FaFileAlt className="text-2xl text-amber-600" />, title: '100% Paperless Workflow', desc: 'Zero physical queues or office visits required for eligible citizens.' },
  { icon: <FaLandmark className="text-2xl text-[#1a3a6b]" />, title: 'Legal State Validity', desc: 'Recognized by all central and state departments under IT Act 2000.' },
  { icon: <FaStar className="text-2xl text-yellow-500" />, title: 'Transparent & Free', desc: 'Citizen welfare certificates are processed completely free of any hidden charges.' },
]

const ROLES = [
  { 
    role: 'Citizen', 
    title: 'Citizen Portal', 
    desc: 'Apply for certificates, upload documents, track status, and download authenticated records.', 
    to: '/citizen/login', 
    badge: 'Civic Services',
    theme: 'border-blue-200 hover:border-blue-500 hover:shadow-glow',
    btn: 'bg-[#1a3a6b] hover:bg-[#253f7a]',
    icon: <FaUserFriends className="text-3xl text-blue-600" />
  },
  { 
    role: 'Employee', 
    title: 'Desk Verification Desk', 
    desc: 'Desk scrutiny, document checklist validation, and pension application initiation.', 
    to: '/employee/login', 
    badge: 'Operations & Verification',
    theme: 'border-emerald-200 hover:border-emerald-500 hover:shadow-lg',
    btn: 'bg-emerald-700 hover:bg-emerald-800',
    icon: <FaUserCheck className="text-3xl text-emerald-600" />
  },
  { 
    role: 'Officer', 
    title: 'Sanctioning Officer', 
    desc: 'Gazetted approval authority, final sanctioning, rejection reviews, and pension authorizations.', 
    to: '/officer/login', 
    badge: 'Approval Authority',
    theme: 'border-amber-200 hover:border-amber-500 hover:shadow-goldGlow',
    btn: 'bg-amber-700 hover:bg-amber-800',
    icon: <FaAward className="text-3xl text-amber-600" />
  },
  { 
    role: 'Admin', 
    title: 'Enterprise Control', 
    desc: 'Master directory management, staff provisioning, service configurations, and full audit logs.', 
    to: '/admin/login', 
    badge: 'System Governance',
    theme: 'border-slate-300 hover:border-slate-700 hover:shadow-elevated',
    btn: 'bg-slate-900 hover:bg-slate-800',
    icon: <FaBuilding className="text-3xl text-slate-700" />
  },
]

export default function HomePage() {
  const [stats, setStats] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [faqs, setFaqs] = useState([])
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    publicAPI.getStats().then(r => setStats(r.data?.data || null)).catch(() => {})
    publicAPI.getAnnouncements().then(r => setAnnouncements(r.data?.data || [])).catch(() => {})
    publicAPI.getFAQs().then(r => setFaqs(r.data?.data || [])).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fb]">
      <Navbar />

      {/* Official Government Announcement Banner */}
      {announcements.length > 0 && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white py-2.5 px-4 text-xs font-semibold shadow-inner border-b border-amber-400/30">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="px-2 py-0.5 rounded bg-white/20 uppercase text-[10px] font-black tracking-wider flex-shrink-0 flex items-center gap-1">
                <FaBullhorn className="text-white text-[10px]" /> State Notice
              </span>
              <span className="truncate">
                <strong>{announcements[0]?.title}</strong>: {announcements[0]?.content}
              </span>
            </div>
            <Link to="/services" className="text-white underline font-bold whitespace-nowrap hidden sm:inline text-[11px] hover:text-amber-100">
              View All Services →
            </Link>
          </div>
        </div>
      )}

      {/* ===================== HERO SECTION ===================== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f2347] via-[#1a3a6b] to-[#1e4d9b] text-white pt-16 pb-24 px-6">
        
        {/* Subtle Decorative Geometric Background */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-400 blur-3xl"></div>
          <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-[#f4a200] blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading and CTAs */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Government Seal Badge */}
            <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-medium text-blue-100 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-white">Government of Karnataka</span>
              <span className="text-blue-300">|</span>
              <span className="text-amber-300 font-semibold">Unified Citizen Services Portal</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black leading-tight tracking-tight text-white">
              Civic Services &amp; <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f4a200] via-amber-300 to-yellow-400">
                Pension Governance,
              </span>
              <br />
              Digitally Reimagined.
            </h1>

            {/* Subtitle */}
            <p className="text-blue-100/90 text-base sm:text-lg leading-relaxed max-w-2xl font-normal">
              Official single-window state platform for digital certificate issuance, real-time application 
              tracking, and retired government employees' pension administration. Fast, paperless, and 100% verified.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link 
                to="/citizen/register" 
                className="btn-accent px-6 py-3.5 rounded-xl font-extrabold text-sm flex items-center gap-2 shadow-goldGlow hover:gap-3 transition-all"
              >
                <FaFileAlt /> Apply for Certificate <FaArrowRight className="text-xs" />
              </Link>

              <Link 
                to="/verify-certificate" 
                className="bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md hover:-translate-y-0.5"
              >
                <FaShieldAlt className="text-amber-300" /> Verify Authenticity
              </Link>

              <Link 
                to="/citizen/login" 
                className="bg-white/10 text-white border border-white/20 px-5 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <FaSearch className="text-xs text-blue-200" /> Track Application
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-4 text-xs text-blue-200 border-t border-white/10">
              <span className="flex items-center gap-1.5"><FaCheckCircle className="text-emerald-400 text-sm" /> 100% Official Digital Record</span>
              <span className="flex items-center gap-1.5"><FaLock className="text-amber-400 text-sm" /> 256-Bit SSL Encrypted</span>
              <span className="flex items-center gap-1.5"><FaQrcode className="text-blue-300 text-sm" /> Instant QR Verification</span>
            </div>
          </div>

          {/* Right Column: Holographic Certificate Showcase */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-elevated border border-slate-200 p-6 text-slate-800 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
              
              {/* Karnataka State Watermark Ribbon */}
              <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase px-4 py-1 rounded-bl-xl shadow-sm tracking-wider flex items-center gap-1">
                <FaShieldAlt className="text-xs" /> Verified Document
              </div>

              {/* Certificate Header Header */}
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#0f2347] text-[#f4a200] flex items-center justify-center text-2xl font-bold flex-shrink-0 shadow-sm">
                  <FaLandmark />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0f2347] text-base leading-snug">Government of Karnataka</h3>
                  <p className="text-slate-500 text-xs font-semibold">State e-Governance Citizen Portal</p>
                </div>
              </div>

              {/* Sample Certificate Details */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3 mb-4 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Certificate Type:</span>
                  <span className="font-bold text-[#1a3a6b]">Income &amp; Caste Certificate</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Certificate Number:</span>
                  <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    KA-2025-INC-08492
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Beneficiary Name:</span>
                  <span className="font-bold text-slate-800">Ramesh Kumar B.</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Status &amp; Validity:</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full text-[11px]">
                    <FaCheckCircle className="text-[10px]" /> Valid &amp; Authentic
                  </span>
                </div>
              </div>

              {/* Simulated QR Code & Barcode */}
              <div className="flex items-center justify-between gap-4 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                <div className="w-14 h-14 bg-white border border-blue-200 rounded-lg flex items-center justify-center p-1 shadow-xs flex-shrink-0">
                  <FaQrcode className="text-3xl text-[#1a3a6b]" />
                </div>
                <div className="text-[11px] text-slate-600 leading-snug">
                  <p className="font-bold text-[#1a3a6b]">Scannable Digital Verification</p>
                  <p className="text-slate-500 text-[10px]">Tamper-proof SHA-256 cryptographically sealed certificate.</p>
                </div>
              </div>

              {/* Action Button inside card */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                <Link
                  to="/verify-certificate"
                  className="w-full text-center py-2.5 rounded-lg bg-[#0f2347] text-white text-xs font-bold hover:bg-[#1a3a6b] transition-colors"
                >
                  Verify Any Certificate Now →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== LIVE METRICS STRIP ===================== */}
      <section className="bg-[#0a1628] py-10 px-6 border-y border-white/10 shadow-inner">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-colors">
              <div className="text-2xl sm:text-3xl font-black text-[#f4a200] tabular-nums">
                {stats?.registered_citizens ? `${stats.registered_citizens.toLocaleString()}+` : '15,400+'}
              </div>
              <div className="text-slate-300 text-xs font-medium mt-1">Registered Citizens</div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-colors">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                {stats?.applications_processed ? `${stats.applications_processed.toLocaleString()}+` : '12,850+'}
              </div>
              <div className="text-slate-300 text-xs font-medium mt-1">Applications Processed</div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-colors">
              <div className="text-2xl sm:text-3xl font-black text-blue-400 tabular-nums">
                {stats?.certificates_issued ? `${stats.certificates_issued.toLocaleString()}+` : '9,920+'}
              </div>
              <div className="text-slate-300 text-xs font-medium mt-1">Certificates Issued</div>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-amber-400/40 transition-colors">
              <div className="text-2xl sm:text-3xl font-black text-amber-300 tabular-nums">
                {stats?.departments_connected ? `${stats.departments_connected}` : '8'}
              </div>
              <div className="text-slate-300 text-xs font-medium mt-1">Government Departments</div>
            </div>

          </div>
        </div>
      </section>

      {/* ===================== AVAILABLE SERVICES ===================== */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-[#1a3a6b] text-xs font-extrabold uppercase tracking-wider inline-block mb-3">
              Citizen Certificate Directory
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Apply Online for Official Services
            </h2>
            <p className="text-slate-500 text-sm sm:text-base mt-3">
              Direct access to legally valid government certificates without visiting taluk or district offices.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map(s => (
              <div 
                key={s.name}
                className="service-card group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1a3a6b] flex items-center justify-center text-2xl group-hover:bg-[#1a3a6b] group-hover:text-white transition-colors duration-300 shadow-xs">
                      {s.icon}
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {s.code}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-800 text-base group-hover:text-[#1a3a6b] transition-colors mb-1">
                    {s.name}
                  </h3>
                  <p className="text-xs font-semibold text-blue-600 mb-2">{s.dept}</p>
                  <p className="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">
                    Official state certificate issued under Karnataka Sakala and Public Services Act.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3 font-medium">
                    <span className="flex items-center gap-1 text-slate-500">
                      <FaClock className="text-slate-400" /> {s.days}
                    </span>
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      {s.fee}
                    </span>
                  </div>

                  <Link 
                    to="/citizen/login"
                    className="apply-btn"
                  >
                    <span>Apply Online</span>
                    <FaArrowRight className="text-[10px]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link 
              to="/services" 
              className="inline-flex items-center gap-2 btn-secondary px-6 py-3 rounded-xl font-bold text-xs"
            >
              Browse Complete Service Directory (25+ Services) <FaArrowRight />
            </Link>
          </div>

        </div>
      </section>

      {/* ===================== HOW IT WORKS (6-STEP TIMELINE) ===================== */}
      <section className="py-20 px-6 bg-[#f5f7fb] border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold uppercase tracking-wider inline-block mb-3">
              Streamlined Lifecycle
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How NagrikSeva Works
            </h2>
            <p className="text-slate-500 text-sm mt-3">
              A transparent, 6-stage digitized procedure ensuring prompt document issuance without intermediaries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 relative">
            {STEPS.map((step, idx) => (
              <div 
                key={step.n} 
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-card transition-all duration-300 hover:-translate-y-1 relative flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#0f2347] text-[#f4a200] font-black text-sm flex items-center justify-center mb-4 shadow-sm">
                    {step.n}
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm mb-2 leading-snug">
                    {step.title}
                  </h4>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold">
                  <FaCheckCircle className="text-emerald-500" />
                  <span>Stage {idx + 1} of 6</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/citizen/register" 
              className="inline-flex items-center gap-2 btn-primary px-8 py-3.5 rounded-xl font-bold text-sm shadow-card"
            >
              Start Your Application Today <FaArrowRight />
            </Link>
          </div>

        </div>
      </section>

      {/* ===================== MULTI-ROLE PORTAL ACCESS ===================== */}
      <section className="py-20 px-6 bg-[#0f2347] text-white">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold uppercase tracking-wider inline-block mb-3 border border-white/15">
              Secure Role-Based Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Single Gateway, Four Specialized Portals
            </h2>
            <p className="text-blue-200 text-sm mt-3">
              Tailored workspaces engineered for citizens, desk verifiers, sanctioning officers, and state administrators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ROLES.map(r => (
              <div 
                key={r.role}
                className="bg-white rounded-2xl p-6 text-slate-800 flex flex-col justify-between shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1.5 border border-slate-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      {r.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-[#1a3a6b] border border-blue-100">
                      {r.badge}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-lg mb-2">
                    {r.title}
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed mb-6">
                    {r.desc}
                  </p>
                </div>

                <div>
                  <Link 
                    to={r.to}
                    className={`w-full py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 transition-all ${r.btn}`}
                  >
                    <span>Login as {r.role}</span>
                    <FaArrowRight className="text-[10px]" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ===================== WHY CHOOSE NAGRIKSEVA ===================== */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider inline-block mb-3">
              Karnataka Digital Standards
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Why Citizens Trust NagrikSeva
            </h2>
            <p className="text-slate-500 text-sm mt-3">
              Engineered adhering to state e-governance guidelines, ensuring reliability and universal document acceptance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {WHY.map((w, i) => (
              <div 
                key={w.title}
                className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-card hover:border-[#1a3a6b]/30 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center mb-4">
                  {w.icon}
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-2">
                  {w.title}
                </h4>
                <p className="text-slate-500 text-xs leading-relaxed">
                  {w.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ===================== FAQs SECTION ===================== */}
      {faqs.length > 0 && (
        <section className="py-20 px-6 bg-[#f5f7fb] border-t border-slate-200">
          <div className="max-w-3xl mx-auto">
            
            <div className="text-center mb-12">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-[#1a3a6b] text-xs font-bold uppercase tracking-wider inline-block mb-2">
                Help &amp; Clarifications
              </span>
              <h2 className="text-3xl font-black text-slate-900">Frequently Asked Questions</h2>
              <p className="text-slate-500 text-xs mt-2">Get quick answers regarding requirements, fees, and certificate validity.</p>
            </div>

            <div className="space-y-3">
              {faqs.slice(0, 6).map(f => {
                const isOpen = openFaq === f.id
                return (
                  <div 
                    key={f.id} 
                    className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs transition-all duration-200"
                  >
                    <button 
                      onClick={() => setOpenFaq(isOpen ? null : f.id)} 
                      className="w-full flex items-center justify-between p-4 text-left font-bold text-slate-800 hover:bg-slate-50 transition-colors text-sm"
                    >
                      <span className="pr-4">{f.question}</span>
                      {isOpen ? (
                        <FaChevronUp className="text-[#1a3a6b] flex-shrink-0 text-xs" />
                      ) : (
                        <FaChevronDown className="text-slate-400 flex-shrink-0 text-xs" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-slate-600 text-xs leading-relaxed border-t border-slate-100 pt-3 bg-slate-50/50">
                        {f.answer}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-8 text-center text-xs text-slate-500">
              Have more questions? Check our comprehensive{' '}
              <Link to="/faq" className="text-[#1a3a6b] font-bold underline hover:text-blue-700">
                FAQ Center
              </Link>{' '}
              or reach out to our{' '}
              <Link to="/contact" className="text-[#1a3a6b] font-bold underline hover:text-blue-700">
                Helpdesk Support Desk
              </Link>.
            </div>

          </div>
        </section>
      )}

      {/* ===================== FINAL HIGH-CONVERSION CTA ===================== */}
      <section className="relative overflow-hidden py-16 px-6 bg-gradient-to-r from-[#0f2347] via-[#1a3a6b] to-[#2457a6] text-white text-center">
        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#f4a200] text-slate-950 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
            Official Citizen Welfare Initiative
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Ready to Avail Government Services Digitally?
          </h2>
          <p className="text-blue-100 text-sm max-w-xl mx-auto leading-relaxed">
            Create your authenticated citizen account today to apply for certificates, monitor verification, and download certified records anytime.
          </p>
          <div className="flex flex-wrap gap-3.5 justify-center pt-2">
            <Link 
              to="/citizen/register" 
              className="btn-accent px-8 py-3.5 rounded-xl font-extrabold text-sm shadow-goldGlow"
            >
              Register Citizen Account
            </Link>
            <Link 
              to="/verify-certificate" 
              className="bg-white/10 text-white border border-white/30 px-7 py-3.5 rounded-xl font-bold text-sm hover:bg-white/20 transition-all"
            >
              Public Certificate Verification
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
