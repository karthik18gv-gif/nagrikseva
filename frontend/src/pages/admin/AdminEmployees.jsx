import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { FaSearch, FaFilter, FaFileCsv, FaEdit, FaTrash, FaUserPlus, FaTimes } from 'react-icons/fa'
import { exportToCSV } from '../../utils/exportUtils'

export default function AdminEmployees() {
  const [list, setList] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Create Form State
  const [form, setForm] = useState({
    name: '', username: '', email: '', password: '', phone: '',
    designation: '', department_id: '', district_id: 1, employee_id_no: ''
  })

  // Edit Modal State
  const [editingEmp, setEditingEmp] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', designation: '', department_id: '',
    employee_id_no: '', is_active: 1
  })
  const [updating, setUpdating] = useState(false)

  // Delete State
  const [deletingId, setDeletingId] = useState(null)

  const fetchData = () => {
    setLoading(true)
    adminAPI.getEmployees({
      search: search || undefined,
      department_id: deptFilter || undefined,
      is_active: statusFilter !== '' ? statusFilter : undefined
    })
      .then(r => setList(r.data.data || []))
      .catch(() => toast.error('Failed to load employees'))
      .finally(() => setLoading(false))

    adminAPI.getDepartments()
      .then(r => setDepartments(r.data.data || []))
      .catch(() => {})
  }

  useEffect(() => {
    const t = setTimeout(fetchData, 300)
    return () => clearTimeout(t)
  }, [search, deptFilter, statusFilter])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await adminAPI.createEmployee(form)
      toast.success('Employee created successfully')
      setShowForm(false)
      setForm({ name:'', username:'', email:'', password:'', phone:'', designation:'', department_id:'', district_id:1, employee_id_no:'' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create employee')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (emp) => {
    setEditingEmp(emp)
    setEditForm({
      name: emp.name || '',
      email: emp.email || '',
      phone: emp.phone || '',
      designation: emp.designation || '',
      department_id: emp.department_id || '',
      employee_id_no: emp.employee_id_no || '',
      is_active: emp.is_active !== undefined ? emp.is_active : 1
    })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingEmp) return
    setUpdating(true)
    try {
      await adminAPI.updateEmployee(editingEmp.id, editForm)
      toast.success('Employee details updated successfully')
      setEditingEmp(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update employee')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete employee "${name}"? If they have handled citizen applications, deletion will be blocked and deactivation advised.`)) {
      return
    }
    setDeletingId(id)
    try {
      await adminAPI.deleteEmployee(id)
      toast.success('Employee removed successfully')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete employee')
    } finally {
      setDeletingId(null)
    }
  }

  const handleExportCSV = () => {
    const cols = [
      { key: 'name', label: 'Full Name' },
      { key: 'employee_id_no', label: 'Employee ID' },
      { key: 'department_name', label: 'Department' },
      { key: 'designation', label: 'Designation' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'is_active', label: 'Status', format: val => val ? 'Active' : 'Inactive' },
      { key: 'created_at', label: 'Created At', format: val => val ? new Date(val).toLocaleDateString('en-IN') : '' }
    ]
    exportToCSV('nagrikseva_employees', cols, list)
  }

  const clearFilters = () => {
    setSearch('')
    setDeptFilter('')
    setStatusFilter('')
  }

  return (
    <div>
      <PageHeader
        title="Manage Employees"
        subtitle={`${list.length} government employees registered`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Export employees list to CSV"
            >
              <FaFileCsv className="text-sm text-green-700" /> Export CSV
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5"
            >
              <FaUserPlus /> {showForm ? 'Close Form' : '+ Add Employee'}
            </button>
          </div>
        }
      />

      {/* Add Employee Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-base">Register New Government Employee</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><FaTimes /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Ramesh Kumar" required />
            </div>
            <div>
              <label className="form-label">Employee ID No. *</label>
              <input className="form-input uppercase" value={form.employee_id_no} onChange={e=>setForm({...form,employee_id_no:e.target.value})} placeholder="e.g. EMP1029" required />
            </div>
            <div>
              <label className="form-label">Designation</label>
              <input className="form-input" value={form.designation} onChange={e=>setForm({...form,designation:e.target.value})} placeholder="e.g. Verification Officer" />
            </div>
            <div>
              <label className="form-label">Username *</label>
              <input className="form-input" value={form.username} onChange={e=>setForm({...form,username:e.target.value})} placeholder="e.g. ramesh.emp" required />
            </div>
            <div>
              <label className="form-label">Official Email *</label>
              <input type="email" className="form-input" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="e.g. ramesh@gov.in" required />
            </div>
            <div>
              <label className="form-label">Password *</label>
              <input type="password" className="form-input" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Min 6 characters" required />
            </div>
            <div>
              <label className="form-label">Contact Phone</label>
              <input className="form-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="10-digit mobile" />
            </div>
            <div>
              <label className="form-label">Department *</label>
              <select className="form-input" value={form.department_id} onChange={e=>setForm({...form,department_id:e.target.value})} required>
                <option value="">Select Department</option>
                {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-3 flex gap-3 pt-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Creating...' : 'Create Employee Account'}
              </button>
              <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-slate-400 text-xs" />
            <input
              className="form-input pl-8 text-xs"
              placeholder="Search by name, ID, email, designation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div>
            <select
              className="form-input text-xs"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              className="form-input text-xs"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="1">Active Only</option>
              <option value="0">Inactive Only</option>
            </select>
          </div>
          <div className="flex gap-2">
            {(search || deptFilter || statusFilter !== '') && (
              <button
                onClick={clearFilters}
                className="text-xs text-slate-500 hover:text-red-600 font-semibold px-3 py-2 rounded-lg border border-slate-200 hover:border-red-200 transition-colors"
              >
                Reset Filters
              </button>
            )}
            <span className="text-xs text-slate-400 self-center ml-auto font-medium">
              Found: <strong className="text-slate-700">{list.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      {loading ? (
        <LoadingSpinner text="Loading employees..." />
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="text-4xl mb-3">💼</div>
          <h3 className="font-bold text-slate-700">No Employees Found</h3>
          <p className="text-slate-500 text-xs mt-1">Try refining your search terms or filter selection.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Name & ID', 'Department', 'Designation', 'Contact Details', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-600 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(e => (
                <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{e.name}</p>
                    <p className="text-xs text-[#1a3a6b] font-mono mt-0.5">ID: {e.employee_id_no}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700 text-xs font-medium">{e.department_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{e.designation || 'Staff'}</td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700 text-xs">{e.email}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{e.phone || 'No phone'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      e.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {e.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(e)}
                        className="text-slate-600 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition-colors text-xs font-semibold flex items-center gap-1"
                        title="Edit Employee"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(e.id, e.name)}
                        disabled={deletingId === e.id}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                        title="Delete Employee"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editingEmp && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Edit Employee Details</h3>
                <p className="text-xs text-slate-400 mt-0.5">ID: {editingEmp.employee_id_no}</p>
              </div>
              <button onClick={() => setEditingEmp(null)} className="text-slate-400 hover:text-slate-600"><FaTimes /></button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input
                    className="form-input"
                    value={editForm.name}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Employee ID No. *</label>
                  <input
                    className="form-input uppercase"
                    value={editForm.employee_id_no}
                    onChange={e => setEditForm({...editForm, employee_id_no: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Official Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editForm.email}
                    onChange={e => setEditForm({...editForm, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">Contact Phone</label>
                  <input
                    className="form-input"
                    value={editForm.phone}
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">Designation</label>
                  <input
                    className="form-input"
                    value={editForm.designation}
                    onChange={e => setEditForm({...editForm, designation: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label">Department *</label>
                  <select
                    className="form-input"
                    value={editForm.department_id}
                    onChange={e => setEditForm({...editForm, department_id: e.target.value})}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="form-label">Account Status</label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="is_active"
                        checked={editForm.is_active === 1 || editForm.is_active === true}
                        onChange={() => setEditForm({...editForm, is_active: 1})}
                      /> Active Account
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="is_active"
                        checked={editForm.is_active === 0 || editForm.is_active === false}
                        onChange={() => setEditForm({...editForm, is_active: 0})}
                      /> Inactive (Disabled)
                    </label>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingEmp(null)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={updating} className="btn-primary text-xs">
                  {updating ? 'Saving Changes...' : 'Save Employee Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
