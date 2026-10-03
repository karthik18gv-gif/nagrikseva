import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { publicAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { 
  FaSearch, 
  FaFileAlt, 
  FaClock, 
  FaRupeeSign, 
  FaCheckCircle, 
  FaLandmark, 
  FaArrowRight, 
  FaFilter,
  FaShieldAlt,
  FaFileInvoice
} from 'react-icons/fa'

export default function ServicesPage() {
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('ALL')
  const [feeFilter, setFeeFilter] = useState('ALL') // ALL, FREE, PAID
  const [sortBy, setSortBy] = useState('name') // name, days, fee

  useEffect(() => {
    publicAPI.getCertificateTypes()
      .then(r => setTypes(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Extract unique departments
  const departments = useMemo(() => {
    const depts = new Set()
    types.forEach(t => {
      if (t.department_name) depts.add(t.department_name)
    })
    return ['ALL', ...Array.from(depts)]
  }, [types])

  // Filter and sort
  const filteredServices = useMemo(() => {
    return types
      .filter(t => {
        // Active check if present
        if (t.is_active === 0 || t.is_active === false) return false

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase()
          const matchName = t.name?.toLowerCase().includes(q)
          const matchCode = t.code?.toLowerCase().includes(q)
          const matchDept = t.department_name?.toLowerCase().includes(q)
          const matchDesc = t.description?.toLowerCase().includes(q)
          if (!matchName && !matchCode && !matchDept && !matchDesc) return false
        }

        // Department filter
        if (selectedDept !== 'ALL' && t.department_name !== selectedDept) {
          return false
        }

        // Fee filter
        if (feeFilter === 'FREE' && Number(t.fee) > 0) return false
        if (feeFilter === 'PAID' && Number(t.fee) === 0) return false

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'days') return (a.processing_days || 0) - (b.processing_days || 0)
        if (sortBy === 'fee') return (a.fee || 0) - (b.fee || 0)
        return (a.name || '').localeCompare(b.name || '')
      })
  }, [types, search, selectedDept, feeFilter, sortBy])

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB]">
      <Navbar />

      {/* Hero Banner */}
      <section className="relative bg-gradient-to-r from-[#0F2347] via-[#1A3A6B] to-[#2457A6] text-white py-14 px-4 overflow-hidden shadow-md">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
            <FaLandmark /> Karnataka Sakala Digital Services Portal
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            Citizen Services Directory
          </h1>
          <p className="text-blue-100 max-w-2xl mx-auto text-sm md:text-base leading-relaxed mb-8">
            Access over 25+ guaranteed government certificates, revenue records, and welfare services. Apply online with guaranteed timelines under the Sakala Act.
          </p>

          {/* Search bar inside Hero */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-2 shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-white/20">
            <div className="relative flex-1 w-full">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search certificate name (e.g., Caste, Income, Birth, Land)..."
                className="w-full pl-11 pr-4 py-3 text-slate-800 text-sm rounded-xl focus:outline-none placeholder-slate-400"
              />
            </div>
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto mt-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl py-2 px-3 border border-white/10">
              <div className="text-xl font-bold text-white">{types.length || '25+'}</div>
              <div className="text-[11px] text-blue-200">Active Services</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl py-2 px-3 border border-white/10">
              <div className="text-xl font-bold text-amber-300">100%</div>
              <div className="text-[11px] text-blue-200">Digital Processing</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl py-2 px-3 border border-white/10">
              <div className="text-xl font-bold text-emerald-400">7-15 Days</div>
              <div className="text-[11px] text-blue-200">Guaranteed Sakala SLA</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl py-2 px-3 border border-white/10">
              <div className="text-xl font-bold text-white">₹0 - ₹50</div>
              <div className="text-[11px] text-blue-200">Statutory Govt Fee</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Department Filter Tabs */}
        <div className="mb-6 overflow-x-auto pb-2 scrollbar-thin">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1 flex-shrink-0">
              <FaFilter className="text-[#1A3A6B]" /> Department:
            </span>
            {departments.map(dept => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                  selectedDept === dept
                    ? 'bg-[#1A3A6B] text-white shadow-sm ring-2 ring-[#1A3A6B]/30'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {dept === 'ALL' ? 'All Departments' : dept}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-500">Fee Filter:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              {['ALL', 'FREE', 'PAID'].map(f => (
                <button
                  key={f}
                  onClick={() => setFeeFilter(f)}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    feeFilter === f
                      ? 'bg-white text-[#1A3A6B] font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {f === 'ALL' ? 'All Fees' : f === 'FREE' ? 'Free (₹0)' : 'Paid'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-500">Sort By:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#1A3A6B]"
            >
              <option value="name">Service Name (A-Z)</option>
              <option value="days">Processing Time (Fastest)</option>
              <option value="fee">Statutory Fee (Lowest)</option>
            </select>
          </div>

          <div className="text-slate-400 font-medium ml-auto">
            Showing <strong className="text-slate-700">{filteredServices.length}</strong> of {types.length} services
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-20">
            <LoadingSpinner text="Loading government services directory..." />
          </div>
        ) : filteredServices.length === 0 ? (
          /* Empty Search State */
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm max-w-md mx-auto my-8">
            <div className="w-14 h-14 bg-blue-50 text-[#1A3A6B] rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
              <FaFileInvoice />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Services Found</h3>
            <p className="text-slate-500 text-xs mb-5">
              We couldn't find any services matching <strong>"{search || selectedDept}"</strong>. Try resetting your search filters.
            </p>
            <button
              onClick={() => {
                setSearch('')
                setSelectedDept('ALL')
                setFeeFilter('ALL')
              }}
              className="px-4 py-2 bg-[#1A3A6B] text-white text-xs font-semibold rounded-lg hover:bg-[#2457A6] transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          /* Services Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredServices.map(service => {
              const isFree = Number(service.fee) === 0
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-[#2457A6]/40 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Department Tag & Code */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-[#1A3A6B] border border-blue-100 truncate max-w-[180px]">
                        {service.department_name || 'Government Service'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold">
                        {service.code || `SVC-${service.id}`}
                      </span>
                    </div>

                    {/* Service Name */}
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-[#1A3A6B] transition-colors line-clamp-2 mb-2">
                      {service.name}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed">
                      {service.description || 'Statutory digital certificate service authorized under the Karnataka Sakala Digital Portal.'}
                    </p>
                  </div>

                  <div>
                    {/* Key Attributes Strip */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs mb-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <FaClock className="text-amber-500 text-xs" />
                        <span><strong>{service.processing_days || 7}</strong> Days SLA</span>
                      </div>
                      <div className="flex items-center justify-end gap-1 font-semibold">
                        {isFree ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] font-bold border border-emerald-200">
                            FREE
                          </span>
                        ) : (
                          <span className="text-[#1A3A6B] bg-blue-50 px-2 py-0.5 rounded-md text-[11px] font-bold border border-blue-200">
                            ₹{service.fee}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Link
                        to="/citizen/apply"
                        className="flex-1 py-2.5 px-4 bg-[#1A3A6B] hover:bg-[#2457A6] text-white text-xs font-bold rounded-xl text-center transition-all flex items-center justify-center gap-1.5 shadow-sm group-hover:shadow"
                      >
                        Apply Now <FaArrowRight className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                      <Link
                        to="/citizen/track"
                        title="Track existing application"
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors text-xs flex items-center justify-center"
                      >
                        <FaSearch />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Assistance / Sakala Guarantee Strip */}
        <section className="mt-12 bg-gradient-to-r from-blue-900 to-[#1A3A6B] text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center text-2xl flex-shrink-0 border border-amber-400/30">
              <FaShieldAlt />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Karnataka Sakala Guaranteed Services</h4>
              <p className="text-blue-200 text-xs mt-0.5 max-w-xl">
                All certificates issued via NagrikSeva are digitally signed and legally recognized under the IT Act 2000. If your application exceeds the SLA, you are entitled to statutory compensatory relief.
              </p>
            </div>
          </div>
          <Link
            to="/faq"
            className="px-5 py-2.5 bg-white text-[#1A3A6B] font-bold text-xs rounded-xl hover:bg-blue-50 transition-colors whitespace-nowrap shadow-sm"
          >
            Read Sakala FAQs →
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  )
}
