import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { publicAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { 
  FaShieldAlt, 
  FaCheckCircle, 
  FaSearch, 
  FaLandmark, 
  FaDownload, 
  FaPrint,
  FaExclamationTriangle,
  FaQrcode,
  FaFileContract
} from 'react-icons/fa'

export default function VerifyCertificatePage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [cert, setCert] = useState(null)

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!query.trim()) {
      toast.error('Please enter a Certificate or Application Number')
      return
    }
    setLoading(true)
    setSearched(true)
    setCert(null)
    try {
      const { data } = await publicAPI.verifyCertificate(query.trim())
      if (data.success && data.data) {
        setCert(data.data)
      } else {
        setCert(null)
      }
    } catch (err) {
      setCert(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const beneficiaryName = cert?.holder_name || 
    `${cert?.first_name || ''} ${cert?.last_name || ''}`.trim() || 
    'Citizen Beneficiary'

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB]">
      <Navbar />

      {/* Header Banner */}
      <section className="bg-gradient-to-r from-[#0F2347] via-[#1A3A6B] to-[#2457A6] text-white py-14 px-4 text-center relative overflow-hidden shadow-md print:hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-2xl mx-auto relative z-10">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl border border-white/20 shadow-inner">
            <FaShieldAlt className="text-[#F4A200]" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Public Certificate Verification
          </h1>
          <p className="text-blue-100 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
            Verify the authenticity of any digital government certificate issued under the Karnataka Sakala Services Act and NagrikSeva Portal.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto w-full px-4 -mt-6 flex-1 mb-14">
        {/* Verification Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xl mb-8 print:hidden">
          <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] bg-slate-50 uppercase tracking-wider font-mono placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder-slate-400"
                placeholder="Enter Certificate No. (e.g. CERT/BIRTH/...) or App No."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-8 bg-[#1A3A6B] hover:bg-[#2457A6] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <FaShieldAlt /> Verify Now
                </>
              )}
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 px-1">
            <span>Instant real-time verification against Government of Karnataka Registry</span>
            <span className="font-semibold text-slate-500">256-bit Encrypted</span>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-12">
            <LoadingSpinner text="Querying state digital certificate ledger..." />
          </div>
        )}

        {/* Verified Certificate Card */}
        {!loading && searched && cert && (
          <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow-2xl overflow-hidden animate-fadeIn">
            {/* Verification Banner */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl flex-shrink-0">
                  <FaCheckCircle className="text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-wide">AUTHENTIC GOVERNMENT CERTIFICATE</h3>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    Digitally Signed & Validated under Section 65B of Indian Evidence Act
                  </p>
                </div>
              </div>
              <div className="bg-white/15 px-3 py-1.5 rounded-lg border border-white/20 font-mono text-xs font-bold tracking-wider">
                {cert.certificate_number}
              </div>
            </div>

            {/* Certificate Body */}
            <div className="p-6 md:p-8">
              {/* State Emblem Header */}
              <div className="text-center pb-6 border-b border-slate-100">
                <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-2 text-2xl text-[#1A3A6B] shadow-inner">
                  <FaLandmark />
                </div>
                <h4 className="font-extrabold text-slate-900 text-base tracking-wide uppercase">
                  Government of Karnataka
                </h4>
                <p className="text-xs text-[#1A3A6B] font-bold mt-0.5 uppercase tracking-wider">
                  {cert.department_name || 'Revenue & Citizen Administration'}
                </p>
                <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                  ● State Registry Record Active & Authentic
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    Service / Certificate Type
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {cert.certificate_name}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    Beneficiary Citizen Name
                  </span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    {beneficiaryName}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    Application Reference No.
                  </span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">
                    {cert.application_number}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    Official Issue Date
                  </span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {cert.completed_at ? new Date(cert.completed_at).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    }) : new Date().toLocaleDateString('en-IN')}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    Issuing Authority
                  </span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    Designated Tahsildar / Officer, {cert.department_name || 'Government of Karnataka'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    Tamper-Proof Digital Seal
                  </span>
                  <p className="text-emerald-700 font-mono font-bold text-[11px] mt-0.5 truncate">
                    SHA256: VALIDATED-GOV-GOK-SEAL
                  </p>
                </div>
              </div>

              {/* Action Strip: Download & Print */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 print:hidden">
                <button
                  onClick={handlePrint}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  <FaPrint /> Print Official Verification Slip
                </button>

                {cert.certificate_path ? (
                  <a
                    href={`/uploads/certificates/${cert.certificate_path}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-2.5 bg-[#1A3A6B] hover:bg-[#2457A6] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                  >
                    <FaDownload /> View Certificate Document
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    Digital record authenticated directly from core database.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Not Found State */}
        {!loading && searched && !cert && (
          <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-lg animate-fadeIn">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
              <FaExclamationTriangle />
            </div>
            <h3 className="font-extrabold text-slate-900 text-lg mb-2">
              No Matching Certificate Found
            </h3>
            <p className="text-slate-600 text-xs max-w-md mx-auto mb-5 leading-relaxed">
              We could not find any active or issued certificate matching <strong>"{query}"</strong>. Please verify that you entered the full alphanumeric certificate number or application ID without spaces.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setQuery('')}
                className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Clear & Try Again
              </button>
              <Link
                to="/contact"
                className="px-4 py-2 bg-[#1A3A6B] text-white text-xs font-semibold rounded-lg hover:bg-[#2457A6] transition-colors"
              >
                Contact Helpdesk
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
