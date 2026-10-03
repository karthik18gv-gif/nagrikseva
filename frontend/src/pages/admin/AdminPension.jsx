import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { exportToCSV } from '../../utils/exportUtils'
import toast from 'react-hot-toast'
import { FaSearch, FaFileExport, FaFilter, FaMoneyBillWave } from 'react-icons/fa'

export default function AdminPension() {
  const [list, setList] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [remarksMap, setRemarksMap] = useState({})
  const [busyId, setBusyId] = useState(null)

  const fetchData = () => {
    setLoading(true)
    Promise.all([adminAPI.getPensionApplications(), adminAPI.getDepartments()])
      .then(([resPension, resDept]) => {
        setList(resPension.data.data || [])
        setDepartments(resDept.data.data || [])
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleUpdate = async (id, status) => {
    setBusyId(id)
    try {
      const { data } = await adminAPI.updatePensionStatus(id, {
        status,
        remarks: remarksMap[id] || ''
      })
      toast.success(data.message || `Pension application ${status}`)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally {
      setBusyId(null)
    }
  }

  const filteredList = list.filter(p => {
    const matchesSearch = !search ||
      p.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.application_number?.toLowerCase().includes(search.toLowerCase()) ||
      p.employee_id_no?.toLowerCase().includes(search.toLowerCase()) ||
      p.bank_name?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    const matchesDept = deptFilter === 'all' || String(p.department_id) === String(deptFilter)
    return matchesSearch && matchesStatus && matchesDept
  })

  const awaitingAdmin = filteredList.filter(p => p.status === 'officer_approved')
  const others = filteredList.filter(p => p.status !== 'officer_approved')

  const handleExport = () => {
    const exportData = filteredList.map(p => ({
      'Application No': p.application_number,
      'Employee Name': p.employee_name,
      'Employee ID': p.employee_id_no,
      'Department': p.department_name,
      'Designation': p.designation || '',
      'Service Years': p.years_of_service || '',
      'Estimated Pension (INR)': p.estimated_pension || '',
      'Bank': p.bank_name || '',
      'Status': p.status,
      'Applied Date': p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : ''
    }))
    exportToCSV(exportData, `Pension_Cases_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div>
      <PageHeader
        title="Pension Applications"
        subtitle={`${list.filter(p => p.status === 'officer_approved').length} awaiting your approval · ${list.length} total pension records`}
        actions={
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-3.5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FaFileExport className="text-emerald-600" /> Export CSV
          </button>
        }
      />

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            className="form-input w-full pl-8 text-xs py-2"
            placeholder="Search employee name, ID, or app number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Status:</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
            >
              <option value="all">All Statuses ({list.length})</option>
              <option value="officer_approved">Awaiting Admin ({list.filter(p => p.status === 'officer_approved').length})</option>
              <option value="approved">Final Approved</option>
              <option value="submitted">Submitted / Officer Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Department:</label>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="border border-slate-200 rounded-lg text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {awaitingAdmin.length > 0 && (
            <div className="space-y-4 mb-8">
              <h3 className="text-sm font-bold text-amber-900 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-lg flex items-center gap-2">
                ⚡ Priority Review: Awaiting Final Administrative Approval ({awaitingAdmin.length})
              </h3>
              {awaitingAdmin.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-amber-300 shadow-sm p-5 hover:border-amber-400 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{p.employee_name}</h3>
                      <p className="text-[#1a3a6b] font-bold text-xs">{p.application_number} • ID: {p.employee_id_no}</p>
                      <p className="text-slate-500 text-xs mt-1">{p.department_name} • {p.designation || 'Staff'}</p>
                    </div>
                    <StatusBadge status={p.status}/>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs bg-slate-50 p-3 rounded-lg">
                    {[
                      ['Years of Service', p.years_of_service ? `${p.years_of_service} yrs` : '—'],
                      ['Monthly Pension', p.estimated_pension ? `₹${Number(p.estimated_pension).toLocaleString('en-IN')}` : '—'],
                      ['Bank & IFSC', `${p.bank_name || '—'} (${p.bank_ifsc || '—'})`],
                      ['Account No.', p.bank_account || '—']
                    ].map(([l, v]) => (
                      <div key={l}>
                        <p className="text-slate-400 font-semibold">{l}</p>
                        <p className="font-bold text-slate-800 mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      className="form-input flex-1 text-xs"
                      placeholder="Administrative order remarks (optional)..."
                      value={remarksMap[p.id] || ''}
                      onChange={e => setRemarksMap({ ...remarksMap, [p.id]: e.target.value })}
                    />
                    <button
                      onClick={() => handleUpdate(p.id, 'approved')}
                      disabled={busyId === p.id}
                      className="bg-green-600 text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50 whitespace-nowrap shadow-xs"
                    >
                      ✅ Final Approve & Issue
                    </button>
                    <button
                      onClick={() => handleUpdate(p.id, 'rejected')}
                      disabled={busyId === p.id}
                      className="bg-red-50 text-red-600 border border-red-200 px-5 py-2 rounded-lg text-xs font-bold hover:bg-red-100 disabled:opacity-50 whitespace-nowrap"
                    >
                      ❌ Reject Case
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {awaitingAdmin.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center mb-6">
              <FaMoneyBillWave className="text-3xl text-emerald-500 mx-auto mb-2" />
              <h4 className="font-semibold text-slate-700 text-sm">No Pending Approvals</h4>
              <p className="text-slate-400 text-xs mt-0.5">All officer-recommended pension cases have been processed.</p>
            </div>
          )}

          {others.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Other Pension Cases ({others.length})</h3>
              <div className="space-y-2">
                {others.map(p => (
                  <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-800 text-xs">{p.employee_name} <span className="text-slate-400 font-normal">({p.employee_id_no})</span></p>
                      <p className="text-[11px] text-slate-400">{p.application_number} • {p.department_name}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {p.estimated_pension && (
                        <span className="text-xs font-bold text-slate-700">₹{Number(p.estimated_pension).toLocaleString('en-IN')}/mo</span>
                      )}
                      <StatusBadge status={p.status}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
