import { Link } from 'react-router-dom'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { FaLandmark, FaHome, FaSearch, FaFileAlt, FaShieldAlt } from 'react-icons/fa'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          {/* Emblem Icon */}
          <div className="w-20 h-20 bg-blue-50 text-[#1A3A6B] rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm border border-blue-100">
            <FaLandmark />
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-200">
            Error 404 • Resource Not Found
          </div>

          <h1 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
            Page Not Available
          </h1>

          <p className="text-slate-600 text-sm mb-8 leading-relaxed">
            The portal page or citizen service link you requested could not be found or may have been relocated under the revised Karnataka Sakala services directory.
          </p>

          <div className="space-y-3 mb-8">
            <Link
              to="/"
              className="w-full py-3 px-6 bg-[#1A3A6B] hover:bg-[#2457A6] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <FaHome /> Return to Government Portal Home
            </Link>

            <Link
              to="/services"
              className="w-full py-3 px-6 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <FaFileAlt className="text-[#1A3A6B]" /> Browse All Citizen Services
            </Link>

            <Link
              to="/verify-certificate"
              className="w-full py-2.5 px-6 text-slate-600 hover:text-[#1A3A6B] text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <FaShieldAlt className="text-emerald-600" /> Verify Issued Certificate
            </Link>
          </div>

          <div className="pt-6 border-t border-slate-200 text-xs text-slate-400">
            Karnataka State Electronics & Citizen Digital Portal • NagrikSeva
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
