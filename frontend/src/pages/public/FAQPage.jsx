import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { publicAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { 
  FaSearch, 
  FaChevronDown, 
  FaChevronUp, 
  FaQuestionCircle, 
  FaHeadset, 
  FaCheckCircle, 
  FaBookOpen,
  FaShieldAlt,
  FaFileAlt
} from 'react-icons/fa'

// Curated fallback FAQs to ensure the page always looks enterprise-grade
const CURATED_FAQS = [
  {
    id: 'f1',
    category: 'General & Account',
    question: 'What is NagrikSeva and how does it benefit Karnataka citizens?',
    answer: 'NagrikSeva is the integrated digital public services and pension administration portal of the Government of Karnataka. It empowers citizens to apply for revenue, caste, income, birth, and educational certificates online with statutory delivery timelines guaranteed under the Sakala Services Act, without visiting government offices.'
  },
  {
    id: 'f2',
    category: 'General & Account',
    question: 'How do I register on the NagrikSeva portal?',
    answer: 'Click on the "Citizen Login" or "Register" button in the top navigation bar. Fill in your demographic details across the 5 structured steps: Personal Information, Address & Contact Details, Identity Documents (Aadhaar is required for identity verification), Password Setup, and Declaration. Once registered, your account is immediately active.'
  },
  {
    id: 'f3',
    category: 'Certificates & Applications',
    question: 'What is the processing timeline for government certificates?',
    answer: 'Processing timelines vary between 7 to 15 working days depending on the certificate type and statutory verification requirements. Each certificate card displays its exact Sakala turnaround SLA. You can monitor the real-time stage of your application via the "Track Application" feature.'
  },
  {
    id: 'f4',
    category: 'Certificates & Applications',
    question: 'How do I download my approved certificate?',
    answer: 'Once your application is approved by the designated Department Officer, a digital certificate with a verifiable QR code and official state digital seal is generated. Go to "My Applications" in your Citizen Dashboard and click "Download Certificate" to obtain the signed PDF.'
  },
  {
    id: 'f5',
    category: 'Verification & Validity',
    question: 'How can third parties (employers, banks, universities) verify my certificate?',
    answer: 'Anyone can verify the authenticity of a certificate through our public "Verify Certificate" portal (/verify-certificate). Enter the Certificate Number or scan the embedded QR code. The system will display the verified beneficiary name, issuing department, issuance date, and validity status directly from the state registry.'
  },
  {
    id: 'f6',
    category: 'Pension Scheme',
    question: 'Who is eligible to apply for government employee pension on this portal?',
    answer: 'All retired state government employees whose service records are mapped to participating Karnataka government departments can submit their pension settlement applications through the Employee Portal. Supporting service books, bank passbooks, and retirement orders must be uploaded.'
  },
  {
    id: 'f7',
    category: 'Security & Privacy',
    question: 'Is my personal information and Aadhaar number secure on NagrikSeva?',
    answer: 'Yes. NagrikSeva adheres to the Government of India Digital Personal Data Protection (DPDP) Act standards. Sensitive demographic data is encrypted using AES-256 bit encryption in transit and at rest. Aadhaar numbers are stored securely with masked display, and are never shared with unauthorized third parties.'
  },
  {
    id: 'f8',
    category: 'Certificates & Applications',
    question: 'What should I do if my application is returned by the verifying officer?',
    answer: 'If an employee marks your application as "Returned", it means additional documentation or clarification is needed. Check the officer remarks in your Citizen Dashboard, update the required documents, and click "Resubmit" to resume processing without paying additional fees.'
  }
]

const CATEGORIES = [
  'All Topics',
  'General & Account',
  'Certificates & Applications',
  'Verification & Validity',
  'Pension Scheme',
  'Security & Privacy'
]

export default function FAQPage() {
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Topics')

  useEffect(() => {
    publicAPI.getFAQs()
      .then(r => {
        const apiFaqs = r.data.data || []
        // Merge API FAQs with curated FAQs, tagging API items if category is missing
        const formattedApiFaqs = apiFaqs.map((f, idx) => ({
          id: f.id || `api-${idx}`,
          category: f.category || 'General & Account',
          question: f.question,
          answer: f.answer
        }))

        // Combine while avoiding duplicate questions
        const combined = [...formattedApiFaqs]
        CURATED_FAQS.forEach(cf => {
          if (!combined.some(item => item.question.toLowerCase() === cf.question.toLowerCase())) {
            combined.push(cf)
          }
        })

        setFaqs(combined)
        if (combined.length > 0) {
          setOpen(combined[0].id) // Default open first item
        }
      })
      .catch(() => {
        setFaqs(CURATED_FAQS)
        setOpen(CURATED_FAQS[0].id)
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredFaqs = useMemo(() => {
    return faqs.filter(f => {
      // Category filter
      if (selectedCategory !== 'All Topics' && f.category !== selectedCategory) {
        return false
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchQ = f.question?.toLowerCase().includes(q)
        const matchA = f.answer?.toLowerCase().includes(q)
        if (!matchQ && !matchA) return false
      }

      return true
    })
  }, [faqs, selectedCategory, search])

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB]">
      <Navbar />

      {/* Hero Header */}
      <section className="bg-gradient-to-r from-[#0F2347] via-[#1A3A6B] to-[#2457A6] text-white py-14 px-4 text-center relative overflow-hidden shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
            <FaBookOpen /> Knowledge Base & Assistance
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-sm md:text-base leading-relaxed mb-8">
            Find immediate answers regarding certificate applications, statutory fees, Sakala timelines, document verification, and pensioner benefits.
          </p>

          {/* Search Input */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-2 shadow-2xl flex items-center gap-2 border border-white/20">
            <div className="relative flex-1">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search question or keyword (e.g. download certificate, Aadhaar, pension)..."
                className="w-full pl-11 pr-4 py-3 text-slate-800 text-sm rounded-xl focus:outline-none placeholder-slate-400"
              />
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-3 py-1 font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-10 flex-1 w-full -mt-6">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? 'bg-[#1A3A6B] text-white shadow-sm ring-2 ring-[#1A3A6B]/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        {loading ? (
          <div className="py-16">
            <LoadingSpinner text="Loading FAQs..." />
          </div>
        ) : filteredFaqs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-12 h-12 bg-blue-50 text-[#1A3A6B] rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
              <FaQuestionCircle />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">No FAQs Found</h3>
            <p className="text-slate-500 text-xs mb-4">
              We couldn't find any questions matching your query.
            </p>
            <button
              onClick={() => {
                setSearch('')
                setSelectedCategory('All Topics')
              }}
              className="px-4 py-2 bg-[#1A3A6B] text-white text-xs font-bold rounded-lg hover:bg-[#2457A6] transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map(item => {
              const isOpen = open === item.id
              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isOpen 
                      ? 'border-[#1A3A6B]/30 shadow-md ring-1 ring-[#1A3A6B]/10' 
                      : 'border-slate-200 shadow-xs hover:border-slate-300'
                  }`}
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : item.id)}
                    className="w-full flex items-center justify-between p-5 text-left transition-colors focus:outline-none"
                  >
                    <div className="pr-4 flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        isOpen ? 'bg-[#1A3A6B] text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        Q
                      </div>
                      <div>
                        {item.category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full inline-block mb-1">
                            {item.category}
                          </span>
                        )}
                        <h3 className="font-bold text-slate-800 text-sm md:text-base leading-snug">
                          {item.question}
                        </h3>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-slate-400">
                      {isOpen ? (
                        <FaChevronUp className="text-[#1A3A6B]" />
                      ) : (
                        <FaChevronDown className="hover:text-slate-600" />
                      )}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-slate-600 text-xs md:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/50 animate-fadeIn">
                      <div className="flex items-start gap-3 mt-2">
                        <span className="font-bold text-emerald-700 text-xs mt-0.5">Ans:</span>
                        <div className="flex-1">{item.answer}</div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Bottom Help Desk Card */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1A3A6B] flex items-center justify-center text-2xl flex-shrink-0">
              <FaHeadset />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base">Still Have Unanswered Questions?</h4>
              <p className="text-slate-500 text-xs mt-0.5">
                Our citizen grievance desks and departmental nodal officers are here to help.
              </p>
            </div>
          </div>
          <Link
            to="/contact"
            className="px-6 py-2.5 bg-[#1A3A6B] hover:bg-[#2457A6] text-white font-bold text-xs rounded-xl transition-colors whitespace-nowrap shadow-sm"
          >
            Contact Helpdesk Desk →
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
