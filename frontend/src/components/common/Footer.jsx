import { Link } from 'react-router-dom'
import { 
  FaLandmark, FaPhone, FaEnvelope, FaMapMarkerAlt, 
  FaShieldAlt, FaExternalLinkAlt, FaCheckCircle, FaLock, FaCertificate 
} from 'react-icons/fa'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#0a1628] text-white border-t border-slate-800">
      {/* Citizen Trust & Helpline Banner */}
      <div className="bg-[#0f2347] border-b border-white/5 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6 flex-wrap justify-center md:justify-start">
            <span className="flex items-center gap-2 text-slate-300">
              <FaShieldAlt className="text-emerald-400 text-sm" />
              <span>256-Bit SSL Encrypted Government Cloud</span>
            </span>
            <span className="flex items-center gap-2 text-slate-300">
              <FaLock className="text-amber-400 text-sm" />
              <span>Aadhaar Compliant & Tamper-Proof QR Certificates</span>
            </span>
            <span className="flex items-center gap-2 text-slate-300">
              <FaCertificate className="text-blue-400 text-sm" />
              <span>Officially Recognized Across India</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Citizen Helpline:</span>
            <a href="tel:18004250002" className="text-[#f4a200] font-bold text-sm hover:underline">
              1800-425-0002 (Toll Free)
            </a>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-gradient-to-br from-[#f4a200] to-[#d97706] rounded-xl flex items-center justify-center shadow-goldGlow flex-shrink-0">
                <FaLandmark className="text-white text-xl" />
              </div>
              <div>
                <div className="font-extrabold text-xl text-white tracking-tight">
                  Nagrik<span className="text-[#f4a200]">Seva</span>
                </div>
                <div className="text-blue-300 text-xs font-medium">Government of Karnataka Digital Portal</div>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-6 max-w-sm">
              An integrated, citizen-first civic services platform enabling seamless certificate issuance, 
              real-time application lifecycle tracking, and retired government personnel pension processing.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-slate-300">
                State Data Centre, Bengaluru
              </span>
              <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Services Operational
              </span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="font-bold text-sm text-[#f4a200] uppercase tracking-wider mb-4">Quick Navigation</h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              {[
                ['/', 'Portal Home'],
                ['/services', 'All Services Catalog'],
                ['/verify-certificate', 'Verify Certificate'],
                ['/faq', 'Frequently Asked Questions'],
                ['/about', 'About NagrikSeva'],
                ['/contact', 'Contact & Grievances']
              ].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Certificate Services */}
          <div>
            <h4 className="font-bold text-sm text-[#f4a200] uppercase tracking-wider mb-4">Popular Services</h4>
            <ul className="space-y-2.5 text-xs text-slate-300">
              {[
                'Income Certificate',
                'Caste Certificate',
                'Domicile / Residence',
                'Birth & Death Records',
                'Senior Citizen Card',
                'Disability Pension'
              ].map(service => (
                <li key={service}>
                  <Link to="/services" className="hover:text-white hover:translate-x-1 inline-block transition-all duration-200">
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Secretariat */}
          <div>
            <h4 className="font-bold text-sm text-[#f4a200] uppercase tracking-wider mb-4">Government Desk</h4>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <FaMapMarkerAlt className="text-[#f4a200] mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">Room 304, Vidhana Soudha, Dr. Ambedkar Veedhi, Bengaluru – 560001</span>
              </li>
              <li className="flex items-center gap-2.5">
                <FaPhone className="text-[#f4a200] flex-shrink-0" />
                <a href="tel:08022251000" className="hover:underline">080-22251000 / 080-22252000</a>
              </li>
              <li className="flex items-center gap-2.5">
                <FaEnvelope className="text-[#f4a200] flex-shrink-0" />
                <a href="mailto:support@nagrikseva.karnataka.gov.in" className="hover:underline">helpdesk@nagrikseva.gov.in</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Attribution & Legal Bar */}
        <div className="border-t border-slate-800/80 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <div>
            <p>© {currentYear} <strong>NagrikSeva</strong>. Government of Karnataka. Content owned by Dept. of Personnel and Administrative Reforms (e-Governance).</p>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="text-amber-400/90 font-medium">Developed by Karthik G V | CIMS, Bengaluru</span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="text-slate-500 text-[11px]">v2.4 Production Release</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
