import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaClock, 
  FaHeadset, 
  FaLandmark, 
  FaWhatsapp, 
  FaShieldAlt,
  FaCheckCircle,
  FaPaperPlane
} from 'react-icons/fa'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    mobile: '', 
    department: 'General Services', 
    subject: '', 
    message: '' 
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      setSubmitted(true)
      toast.success('Your grievance/inquiry has been logged. Ticket reference will be sent via SMS/Email.')
      setForm({ name: '', email: '', mobile: '', department: 'General Services', subject: '', message: '' })
    }, 600)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB]">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-r from-[#0F2347] via-[#1A3A6B] to-[#2457A6] text-white py-14 px-4 text-center relative overflow-hidden shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
            <FaHeadset /> Citizen Redressal & Helpdesk
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            Contact NagrikSeva Secretariat
          </h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Need assistance with your certificate application, pension disbursement, or portal login? Connect directly with our district nodal desks and 24x7 helpdesk.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-10 flex-1 w-full -mt-6">
        {/* Quick Contact Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1A3A6B] flex items-center justify-center text-lg mb-3">
              <FaPhone />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Sakala Toll-Free</h3>
            <p className="text-[#1A3A6B] font-extrabold text-lg mt-1">1902</p>
            <p className="text-[11px] text-slate-500 mt-1">Toll-free across Karnataka (Mon - Sat: 8 AM - 8 PM)</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg mb-3">
              <FaWhatsapp />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Pensioner Helpline</h3>
            <p className="text-emerald-700 font-extrabold text-lg mt-1">1800-425-4255</p>
            <p className="text-[11px] text-slate-500 mt-1">Dedicated desk for retired state government staff</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-lg mb-3">
              <FaEnvelope />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Official Email Desk</h3>
            <p className="text-slate-800 font-semibold text-xs mt-1 truncate">helpdesk@nagrikseva.karnataka.gov.in</p>
            <p className="text-[11px] text-slate-500 mt-1">Avg. turnaround time: 24 business hours</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-lg mb-3">
              <FaClock />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Working Hours</h3>
            <p className="text-slate-800 font-semibold text-xs mt-1">10:00 AM – 5:30 PM</p>
            <p className="text-[11px] text-slate-500 mt-1">Closed on 2nd/4th Saturdays & State Holidays</p>
          </div>
        </div>

        {/* 2-Column Section: State Offices & Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: State Offices & Escalation (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Secretariat Address Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#0F2347] text-white flex items-center justify-center text-lg">
                  <FaLandmark />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">State Central Secretariat</h3>
                  <p className="text-slate-400 text-xs">Department of Personnel & Administrative Reforms</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Room No. 147, 1st Floor, Vidhana Soudha, Dr. B.R. Ambedkar Veedhi, Bengaluru, Karnataka - 560001
              </p>
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Landline: 080-22253891</span>
                <span>District: Bengaluru Urban</span>
              </div>
            </div>

            {/* Grievance Escalation Matrix */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-3 flex items-center gap-2">
                <FaShieldAlt className="text-[#1A3A6B]" /> Grievance Escalation Protocol
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                If your service request or pension application is not resolved within the Sakala prescribed timeline:
              </p>
              
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-800">Level 1: Designated Public Grievance Officer</div>
                  <div className="text-slate-500 mt-0.5">Tahsildar / Sub-Divisional Officer of your Taluk</div>
                  <div className="text-[11px] text-[#1A3A6B] font-semibold mt-1">Resolution Window: 7 Days</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-800">Level 2: First Appellate Authority</div>
                  <div className="text-slate-500 mt-0.5">Deputy Commissioner (DC) of your District</div>
                  <div className="text-[11px] text-[#1A3A6B] font-semibold mt-1">Resolution Window: 15 Days</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-800">Level 3: Karnataka Information & Sakala Commission</div>
                  <div className="text-slate-500 mt-0.5">State Secretariat, Bengaluru</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">Final Statutory Authority</div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gradient-to-br from-blue-50 to-slate-100 rounded-2xl p-5 border border-blue-100">
              <h4 className="font-bold text-[#1A3A6B] text-sm mb-1">Frequently Asked Questions</h4>
              <p className="text-xs text-slate-600 mb-3">
                Most common questions regarding Aadhaar linking, certificate downloads, and pension tracking are answered in our FAQ library.
              </p>
              <Link 
                to="/faq" 
                className="text-xs font-bold text-[#1A3A6B] hover:underline inline-flex items-center gap-1"
              >
                Browse Citizen FAQs →
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Contact / Feedback Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
              <div className="mb-6">
                <h3 className="font-bold text-slate-800 text-lg">Send an Official Inquiry / Feedback</h3>
                <p className="text-slate-500 text-xs mt-1">
                  Your message is routed directly to the appropriate department desk. You will receive an acknowledgement SMS on submission.
                </p>
              </div>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center animate-fadeIn">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                    <FaCheckCircle />
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-1">Inquiry Submitted Successfully</h4>
                  <p className="text-slate-600 text-xs max-w-sm mx-auto mb-6">
                    Thank you for reaching out. Your inquiry has been forwarded to the Public Relations & Redressal Cell. Reference token generated.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-5 py-2.5 bg-[#1A3A6B] text-white text-xs font-bold rounded-xl hover:bg-[#2457A6] transition-colors"
                  >
                    Submit Another Query
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Enter your full name"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Mobile Number (10 Digits) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        pattern="[0-9]{10}"
                        required
                        value={form.mobile}
                        onChange={e => setForm({ ...form, mobile: e.target.value })}
                        placeholder="e.g. 9876543210"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] bg-slate-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        placeholder="yourname@domain.com"
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Concerned Department <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.department}
                        onChange={e => setForm({ ...form, department: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] bg-slate-50"
                      >
                        <option value="General Services">General Citizen Services</option>
                        <option value="Revenue Department">Revenue Department (Land/Income/Caste)</option>
                        <option value="Pension & Social Security">Pension & Social Security Cell</option>
                        <option value="Health & Family Welfare">Health & Family Welfare</option>
                        <option value="Food & Civil Supplies">Food & Civil Supplies (Ration Card)</option>
                        <option value="Technical Support">Portal Technical / Login Issues</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Subject / Query Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      placeholder="Brief summary of your inquiry"
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] bg-slate-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Detailed Message / Grievance <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      placeholder="Describe your issue or feedback in detail. Include Application ID if applicable."
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] bg-slate-50 resize-none"
                    />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                    🔒 By submitting this form, you acknowledge that your information will be shared with designated departmental grievance officers in accordance with the Karnataka Citizen Privacy Charter.
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#1A3A6B] hover:bg-[#2457A6] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <FaPaperPlane /> {submitting ? 'Submitting to Secretariat...' : 'Submit Inquiry'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
