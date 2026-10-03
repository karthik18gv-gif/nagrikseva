import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { exportToCSV } from '../../utils/exportUtils'
import toast from 'react-hot-toast'
import { FaSearch, FaFileExport, FaUserCheck, FaUserSlash, FaEye, FaIdCard } from 'react-icons/fa'

export default function AdminCitizens() {
  const [citizens, setCitizens] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedCitizen, setSelectedCitizen] = useState(null)

  const fetchData = () => {
    setLoading(true)
    adminAPI.getCitizens({ search: search || undefined })
      .then(r => setCitizens(r.data.data.citizens || []))
      .catch(() => toast.error('Failed to load citizens'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const t = setTimeout(fetchData, 400)
    return () => clearTimeout(t)
  }, [search])

  const toggle = async (id) => {
    try {
      await adminAPI.toggleCitizenStatus(id)
      toast.success('Citizen status updated')
      fetchData()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const filteredCitizens = citizens.filter(c => {
    if (statusFilter === 'active') return c.is_active
    if (statusFilter === 'inactive') return !c.is_active
    return true
  })

  const handleExport = () => {
    const exportData = filteredCitizens.map(c => ({
      'ID': c.id,
      'Name': `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      'Username': c.username,
      'Mobile': c.mobile,
      'Email': c.email || '',
      'Aadhaar': c.aadhaar_number || '',
      'Status': c.is_active ? 'Active' : 'Inactive',
      'Registered Date': c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : ''
    }))
    exportToCSV(exportData, `Citizens_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div>
      <PageHeader
        title="Manage Citizens"
        subtitle={`${citizens.length} registered citizens in the system`}
        actions={
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FaFileExport className="text-emerald-600" /> Export CSV
          </button>
        }
      />

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            className="form-input w-full pl-8 text-xs py-2"
            placeholder="Search by name, mobile, email or Aadhaar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Status:</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
          >
            <option value="all">All Citizens ({citizens.length})</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filteredCitizens.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FaIdCard className="text-4xl text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 text-sm">No citizens found</h3>
          <p className="text-slate-400 text-xs mt-1">Try adjusting your search query or filter</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[750px]">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Name & Profile','Username','Contact','Aadhaar','Joined','Status','Actions'].map(h => (
                    <th key={h} className="text-left text-xs font-bold text-slate-600 px-4 py-3 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCitizens.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center">
                          {c.first_name?.[0] || 'C'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{c.first_name} {c.last_name}</p>
                          <p className="text-[11px] text-slate-400 capitalize">{c.gender || 'Citizen'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs font-mono">{c.username}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800 text-xs font-medium">{c.mobile}</p>
                      <p className="text-slate-400 text-[11px]">{c.email || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs font-mono">{c.aadhaar_number}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        c.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedCitizen(c)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="View Profile Details"
                        >
                          <FaEye className="text-xs" />
                        </button>
                        <button
                          onClick={() => toggle(c.id)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded transition-colors ${
                            c.is_active
                              ? 'text-red-600 hover:bg-red-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {c.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW CITIZEN MODAL */}
      {selectedCitizen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn" onClick={() => setSelectedCitizen(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-[#1a3a6b] font-bold text-lg flex items-center justify-center">
                  {selectedCitizen.first_name?.[0] || 'C'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{selectedCitizen.first_name} {selectedCitizen.last_name}</h3>
                  <p className="text-xs text-slate-400 font-mono">@{selectedCitizen.username}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                selectedCitizen.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {selectedCitizen.is_active ? 'Active Account' : 'Deactivated'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl mb-4">
              {[
                ['Mobile Number', selectedCitizen.mobile],
                ['Email Address', selectedCitizen.email || '—'],
                ['Aadhaar Number', selectedCitizen.aadhaar_number || '—'],
                ['Date of Birth', selectedCitizen.dob ? new Date(selectedCitizen.dob).toLocaleDateString('en-IN') : '—'],
                ['Gender', selectedCitizen.gender || '—'],
                ['Category', selectedCitizen.category || '—'],
                ['Father\'s Name', selectedCitizen.father_name || '—'],
                ['Mother\'s Name', selectedCitizen.mother_name || '—'],
                ['PAN Number', selectedCitizen.pan_number || '—'],
                ['Registered Date', selectedCitizen.created_at ? new Date(selectedCitizen.created_at).toLocaleDateString('en-IN') : '—']
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-slate-400 font-semibold">{l}</p>
                  <p className="font-bold text-slate-800 mt-0.5 capitalize">{v}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedCitizen(null)}
                className="btn-secondary text-xs py-2 px-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
