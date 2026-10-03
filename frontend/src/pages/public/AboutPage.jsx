import { Link } from 'react-router-dom'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { 
  FaLandmark, FaShieldAlt, FaUsers, FaTasks, 
  FaFileContract, FaCheckCircle, FaAward, FaBuilding, FaHandHoldingHeart 
} from 'react-icons/fa'

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f7fb]">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0f2347] via-[#1a3a6b] to-[#1e4d9b] text-white py-16 px-6 relative overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-1 rounded-full text-xs font-semibold text-amber-300 border border-white/15">
            <FaLandmark /> Karnataka e-Governance Mission
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            About NagrikSeva
          </h1>
          <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            The integrated, single-window civic platform established to eliminate physical administrative queues, 
            digitize citizen welfare records, and accelerate pension disbursement across Karnataka.
          </p>
        </div>
      </section>

      {/* Main Narrative */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 space-y-12">
        
        {/* Core Mission Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-card space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1a3a6b] flex items-center justify-center text-xl font-bold">
              🏛️
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Institutional Mandate &amp; Vision</h2>
              <p className="text-xs text-slate-500 font-medium">Under the Karnataka Sakala Services Act, 2011</p>
            </div>
          </div>

          <div className="prose text-slate-600 text-xs sm:text-sm leading-relaxed space-y-4">
            <p>
              <strong>NagrikSeva</strong> is the Government of Karnataka's flagship citizen service delivery portal. 
              Engineered as a comprehensive state digital public infrastructure (DPI), it bridges citizens directly 
              with competent municipal, revenue, and welfare authorities without reliance on third-party intermediaries.
            </p>
            <p>
              By leveraging standardized API interoperability, real-time application auditing, and 
              tamper-proof QR digital certificates, the portal ensures that every citizen can apply for and receive 
              legally valid documentation from their home, local Grama One center, or mobile device.
            </p>
            <p>
              In parallel, NagrikSeva houses a dedicated pension administration engine that empowers retired state 
              government personnel to submit their service dossiers, track verification, and receive sanction letters 
              with absolute transparency.
            </p>
          </div>
        </div>

        {/* 4 Architectural Pillars */}
        <div>
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1a3a6b]">Guiding Principles</span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">Four Pillars of State Digital Governance</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1a3a6b] flex items-center justify-center text-xl mb-4">
                <FaUsers />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base mb-2">Universal Citizen Access</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Aadhaar demographic validation and 10-digit mobile verification ensure secure, one-click access 
                for every resident of Karnataka across all 31 districts.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl mb-4">
                <FaCheckCircle />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base mb-2">Multi-Tier Scrutiny</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Separation of duties between desk verifiers and gazetted sanctioning officers prevents fraud 
                while guaranteeing adherence to statutory requirements.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl mb-4">
                <FaShieldAlt />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base mb-2">Cryptographic Integrity</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                All certificates are issued with unique reference numbers and scannable QR verification stamps, 
                making them universally accepted by banks, universities, and government bodies.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-card transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-xl mb-4">
                <FaHandHoldingHeart />
              </div>
              <h3 className="font-extrabold text-slate-900 text-base mb-2">Dignified Pension Administration</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Honoring lifetime public servants through a paperless pension review and approval pipeline that 
                eliminates bureaucratic delays.
              </p>
            </div>

          </div>
        </div>

        {/* State Information & Accountability Box */}
        <div className="bg-gradient-to-r from-[#0f2347] to-[#1a3a6b] text-white rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-card">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">Have Inquiries or Suggestions?</h3>
            <p className="text-blue-200 text-xs max-w-lg leading-relaxed">
              We welcome citizen feedback to continuously optimize Karnataka's public digital infrastructure.
            </p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <Link to="/contact" className="btn-accent text-xs px-5 py-2.5 rounded-xl font-bold shadow-md">
              Contact State Desk
            </Link>
            <Link to="/services" className="bg-white/10 text-white text-xs px-5 py-2.5 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-colors">
              Explore Services
            </Link>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  )
}
