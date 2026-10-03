import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { citizenAPI, publicAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { FaFileAlt, FaClock, FaArrowRight, FaUpload, FaTimes, FaSearch, FaFilter } from 'react-icons/fa'

export default function CitizenApply() {
  const navigate = useNavigate()
  const [types, setTypes] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState({ purpose: '' })
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('all')
  const [feeFilter, setFeeFilter] = useState('all')

  const [loadError, setLoadError] = useState('')

  const loadServices = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      // NOTE: allSettled (not all) so that one failing endpoint can never
      // take the whole page down with an unhandled rejection.
      const [typesRes, deptsRes] = await Promise.allSettled([
        publicAPI.getCertificateTypes(),
        publicAPI.getDepartments(),
      ])

      const list = typesRes.status === 'fulfilled' ? (typesRes.value?.data?.data || []) : []
      setTypes(list)

      if (deptsRes.status === 'fulfilled' && Array.isArray(deptsRes.value?.data?.data)) {
        setDepartments(deptsRes.value.data.data)
      } else {
        // Fallback: derive the department filter list from the certificate
        // types we already have, so the filters still work offline.
        const seen = new Map()
        list.forEach(t => {
          if (t.department_id && !seen.has(String(t.department_id))) {
            seen.set(String(t.department_id), { id: t.department_id, name: t.department_name || 'Department' })
          }
        })
        setDepartments(Array.from(seen.values()))
      }

      if (typesRes.status === 'rejected') {
        setLoadError(typesRes.reason?.response?.data?.message || 'Could not reach the server. Make sure the backend is running on port 5000.')
      }
    } catch (err) {
      setLoadError(err?.message || 'Unexpected error while loading services.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadServices() }, [loadServices])

  /** Safely read the required_documents JSON column in any shape. */
  const parseDocs = (raw) => {
    if (!raw) return []
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : [String(parsed)]
      } catch {
        return raw.split(',').map(d => d.trim()).filter(Boolean)
      }
    }
    if (typeof raw === 'object') return Object.values(raw).map(String)
    return []
  }

  const handleFileChange = e => setFiles(prev => [...prev, ...Array.from(e.target.files)])
  const removeFile = idx => setFiles(prev => prev.filter((_, i) => i !== idx))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selected) {
      toast.error('Please select a certificate type')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('certificate_type_id', selected.id)
      fd.append('purpose', form.purpose)
      files.forEach(f => fd.append('documents', f))
      const { data } = await citizenAPI.applyForCertificate(fd)
      if (data.success) {
        toast.success('Application submitted! ID: ' + data.data.application_number)
        navigate('/citizen/applications')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  // Filtered services
  const filteredServices = types.filter(ct => {
    const matchesSearch = !search ||
      ct.name?.toLowerCase().includes(search.toLowerCase()) ||
      ct.department_name?.toLowerCase().includes(search.toLowerCase()) ||
      ct.code?.toLowerCase().includes(search.toLowerCase())
    const matchesDept = selectedDept === 'all' || String(ct.department_id) === String(selectedDept)
    const matchesFee = feeFilter === 'all' ||
      (feeFilter === 'free' && Number(ct.fee) === 0) ||
      (feeFilter === 'paid' && Number(ct.fee) > 0)
    return matchesSearch && matchesDept && matchesFee
  })

  if (loading) return <LoadingSpinner text="Loading services..." />

  if (loadError) {
    return (
      <div>
        <PageHeader title="Apply for Certificate" subtitle="Select a government certificate service and submit your digital application" />
        <div className="bg-white rounded-2xl border border-red-100 p-12 text-center shadow-sm">
          <div className="text-4xl mb-3">📡</div>
          <h3 className="font-bold text-slate-700 text-sm">Unable to load certificate services</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">{loadError}</p>
          <button onClick={loadServices} className="btn-primary mt-5 text-xs">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-fade">
      <PageHeader
        title="Apply for Certificate"
        subtitle="Select a government certificate service and submit your digital application"
      />

      {!selected ? (
        <>
          {/* Search and Filters Toolbar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
              <div className="relative w-full md:w-96">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  className="form-input w-full pl-8 text-xs py-2"
                  placeholder="Search certificate services (e.g., Income, Caste, Domicile)..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Fee:</span>
                {['all', 'free', 'paid'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFeeFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      feeFilter === f
                        ? 'bg-[#1a3a6b] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'free' ? 'Free (₹0)' : 'Paid'}
                  </button>
                ))}
              </div>
            </div>

            {/* Department Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
              <button
                onClick={() => setSelectedDept('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedDept === 'all'
                    ? 'bg-blue-50 text-[#1a3a6b] border border-blue-200'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                All Departments ({types.length})
              </button>
              {departments.map(d => {
                const count = types.filter(t => String(t.department_id) === String(d.id)).length
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDept(String(d.id))}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedDept === String(d.id)
                        ? 'bg-blue-50 text-[#1a3a6b] border border-blue-200'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {d.name} ({count})
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <p className="text-slate-500 text-xs font-medium">
              Showing <strong>{filteredServices.length}</strong> available citizen services:
            </p>
          </div>

          {filteredServices.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-semibold text-slate-700 text-sm">No services found</h3>
              <p className="text-slate-400 text-xs mt-1">Try clearing your search query or selecting another department</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredServices.map(ct => (
                <div
                  key={ct.id}
                  onClick={() => setSelected(ct)}
                  className="service-card group flex flex-col justify-between"
                  style={{ animationDelay: `${(filteredServices.indexOf(ct) % 12) * 55}ms` }}
                >
                  <div>
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#1a3a6b] flex items-center justify-center text-xl mb-3 group-hover:bg-[#1a3a6b] group-hover:text-white transition-colors">
                      📄
                    </div>
                    <h3 className="font-bold text-slate-800 mb-1 text-base group-hover:text-[#1a3a6b] transition-colors leading-snug">
                      {ct.name}
                    </h3>
                    <p className="text-blue-600 text-xs font-semibold mb-2">{ct.department_name}</p>
                    <p className="text-slate-500 text-xs line-clamp-2 mb-4">
                      {ct.description || 'Government certified service issued under state regulatory authority.'}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 mb-3">
                      <div className="flex items-center gap-1">
                        <FaClock className="text-slate-400" /> {ct.processing_days} working days
                      </div>
                      <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                        {Number(ct.fee) > 0 ? `₹${ct.fee}` : 'FREE'}
                      </span>
                    </div>
                    <button className="apply-btn">
                      Apply Now <FaArrowRight className="text-[10px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="max-w-2xl">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-[#1a3a6b] text-xs font-bold mb-5 hover:underline"
          >
            ← Back to All Services
          </button>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5 flex items-center gap-4">
            <div className="text-4xl">📄</div>
            <div>
              <h3 className="font-bold text-[#1a3a6b] text-lg">{selected.name}</h3>
              <p className="text-blue-700 text-xs mt-0.5">
                Department: <strong>{selected.department_name}</strong> • Estimated: <strong>{selected.processing_days} working days</strong> • Fee: <strong>{selected.fee > 0 ? `₹${selected.fee}` : 'FREE'}</strong>
              </p>
            </div>
          </div>

          {selected.eligibility && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
              <h4 className="font-bold text-emerald-900 text-xs mb-1">✅ Eligibility Requirements</h4>
              <p className="text-emerald-800 text-xs leading-relaxed">{selected.eligibility}</p>
            </div>
          )}

          {parseDocs(selected.required_documents).length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-xs">
              <h4 className="font-bold text-slate-800 text-xs mb-2">📁 Supporting Documents Required</h4>
              <ul className="space-y-1.5">
                {parseDocs(selected.required_documents).map(d => (
                  <li key={d} className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 bg-[#1a3a6b] rounded-full flex-shrink-0"></span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-sm">
            <div>
              <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                Purpose of Application <span className="text-red-500">*</span>
              </label>
              <textarea
                className="form-input w-full resize-none text-xs"
                rows={3}
                placeholder="Briefly state where and why you require this certificate (e.g. college admissions, employment, scheme benefits)..."
                value={form.purpose}
                onChange={e => setForm({ ...form, purpose: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                Upload Supporting Documents
              </label>
              <div
                className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-[#1a3a6b] hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('doc-upload').click()}
              >
                <FaUpload className="text-2xl text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-semibold">Click or drag documents to upload</p>
                <p className="text-[11px] text-slate-400 mt-1">Accepted: PDF, JPG, PNG (Max 5MB each)</p>
                <input
                  id="doc-upload"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <FaFileAlt className="text-[#1a3a6b] text-xs" />
                        <span className="text-xs text-slate-700 truncate max-w-xs font-medium">{f.name}</span>
                        <span className="text-[10px] text-slate-400">({(f.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <FaTimes className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary py-3 text-sm font-bold shadow-md disabled:opacity-50"
            >
              {submitting ? 'Submitting Application...' : '📤 Submit Application'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
