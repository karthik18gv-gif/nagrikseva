import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { exportToCSV } from '../../utils/exportUtils'
import toast from 'react-hot-toast'
import { FaSearch, FaFileExport, FaPlus, FaEdit, FaTrash, FaCertificate, FaExclamationTriangle } from 'react-icons/fa'

export default function AdminCertificateTypes() {
  const [list, setList] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Create form modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    department_id: '', name: '', code: '', description: '', processing_days: 7, fee: 0, eligibility: '', instructions: ''
  })
  const [creating, setCreating] = useState(false)

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingCert, setEditingCert] = useState(null)
  const [editForm, setEditForm] = useState({
    department_id: '', name: '', code: '', description: '', processing_days: 7, fee: 0, eligibility: '', instructions: '', is_active: 1
  })
  const [updating, setUpdating] = useState(false)

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [certToDelete, setCertToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = () => {
    setLoading(true)
    Promise.all([adminAPI.getCertificateTypes(), adminAPI.getDepartments()])
      .then(([resCert, resDept]) => {
        setList(resCert.data.data || [])
        setDepartments(resDept.data.data || [])
      })
      .catch(() => toast.error('Failed to load certificate types'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredList = list.filter(c => {
    const matchesSearch = !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.code?.toLowerCase().includes(search.toLowerCase()) ||
      c.department_name?.toLowerCase().includes(search.toLowerCase())
    const matchesDept = deptFilter === 'all' || String(c.department_id) === String(deptFilter)
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && Boolean(c.is_active)) ||
      (statusFilter === 'inactive' && !c.is_active)
    return matchesSearch && matchesDept && matchesStatus
  })

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!createForm.name.trim() || !createForm.code.trim() || !createForm.department_id) {
      toast.error('Certificate Name, Code, and Department are required')
      return
    }
    setCreating(true)
    try {
      await adminAPI.createCertificateType(createForm)
      toast.success('Certificate type created successfully!')
      setShowCreateModal(false)
      setCreateForm({
        department_id: '', name: '', code: '', description: '', processing_days: 7, fee: 0, eligibility: '', instructions: ''
      })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create certificate type')
    } finally {
      setCreating(false)
    }
  }

  const openEditModal = (c) => {
    setEditingCert(c)
    setEditForm({
      department_id: c.department_id || '',
      name: c.name || '',
      code: c.code || '',
      description: c.description || '',
      processing_days: c.processing_days || 7,
      fee: c.fee || 0,
      eligibility: c.eligibility || '',
      instructions: c.instructions || '',
      is_active: c.is_active ? 1 : 0
    })
    setEditModalOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingCert) return
    setUpdating(true)
    try {
      await adminAPI.updateCertificateType(editingCert.id, editForm)
      toast.success('Certificate type updated successfully!')
      setEditModalOpen(false)
      setEditingCert(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update certificate type')
    } finally {
      setUpdating(false)
    }
  }

  const openDeleteModal = (c) => {
    setCertToDelete(c)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!certToDelete) return
    setDeleting(true)
    try {
      await adminAPI.deleteCertificateType(certToDelete.id)
      toast.success('Certificate type deleted successfully!')
      setDeleteModalOpen(false)
      setCertToDelete(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete certificate type')
    } finally {
      setDeleting(false)
    }
  }

  const handleExport = () => {
    const exportData = filteredList.map(c => ({
      'ID': c.id,
      'Certificate Name': c.name,
      'Code': c.code,
      'Department': c.department_name,
      'Processing Days': c.processing_days,
      'Fee (INR)': c.fee,
      'Status': c.is_active ? 'Active' : 'Inactive',
      'Description': c.description || ''
    }))
    exportToCSV(exportData, `Certificate_Types_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div>
      <PageHeader
        title="Certificate Types"
        subtitle={`${list.length} certificate services configured across departments`}
        actions={
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-white text-slate-700 border border-slate-200 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
              title="Export to CSV"
            >
              <FaFileExport className="text-emerald-600" /> Export CSV
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary text-sm py-2 flex items-center gap-2"
            >
              <FaPlus /> Add Certificate Type
            </button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
            placeholder="Search certificate name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Department:</label>
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Status:</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FaCertificate className="text-4xl text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700">No certificate types found</h3>
          <p className="text-slate-400 text-xs mt-1">Try changing your filters or add a new certificate type</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map(c => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-800 text-base leading-snug">{c.name}</h3>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      c.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-blue-600 text-xs font-semibold mb-2">{c.department_name}</p>
                <p className="text-slate-500 text-xs line-clamp-2 mb-4">
                  {c.description || 'No detailed description available.'}
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5 mb-3">
                  <span>⏱️ <strong>{c.processing_days}</strong> days processing</span>
                  <span className="font-bold text-emerald-600">{Number(c.fee) > 0 ? `₹${c.fee}` : 'FREE'}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                    {c.code}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Certificate Type"
                    >
                      <FaEdit className="text-sm" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(c)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Certificate Type"
                    >
                      <FaTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FaCertificate className="text-[#1a3a6b]" /> Add New Certificate Type
            </h3>
            <form onSubmit={handleCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                  Certificate Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="form-input w-full"
                  placeholder="e.g. Income Certificate"
                  value={createForm.name}
                  onChange={e => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                  Unique Code <span className="text-red-500">*</span>
                </label>
                <input
                  className="form-input w-full uppercase"
                  placeholder="e.g. INC, CAS, DOM"
                  value={createForm.code}
                  onChange={e => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div>
                <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  className="form-input w-full"
                  value={createForm.department_id}
                  onChange={e => setCreateForm({ ...createForm, department_id: e.target.value })}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                    Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input w-full"
                    value={createForm.processing_days}
                    onChange={e => setCreateForm({ ...createForm, processing_days: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                    Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="form-input w-full"
                    value={createForm.fee}
                    onChange={e => setCreateForm({ ...createForm, fee: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                  Description
                </label>
                <textarea
                  className="form-input w-full resize-none"
                  rows={2}
                  placeholder="Brief summary of what this certificate certifies..."
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                  Eligibility Criteria
                </label>
                <textarea
                  className="form-input w-full resize-none"
                  rows={2}
                  placeholder="Who is eligible to apply for this certificate..."
                  value={createForm.eligibility}
                  onChange={e => setCreateForm({ ...createForm, eligibility: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                  Instructions for Citizens
                </label>
                <textarea
                  className="form-input w-full resize-none"
                  rows={2}
                  placeholder="Required documents or prerequisites..."
                  value={createForm.instructions}
                  onChange={e => setCreateForm({ ...createForm, instructions: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  {creating ? 'Creating...' : 'Create Certificate Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FaEdit className="text-blue-600" /> Edit Certificate Type: {editingCert?.name}
            </h3>
            <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                  Certificate Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="form-input w-full"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                  Unique Code <span className="text-red-500">*</span>
                </label>
                <input
                  className="form-input w-full uppercase"
                  value={editForm.code}
                  onChange={e => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div>
                <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  className="form-input w-full"
                  value={editForm.department_id}
                  onChange={e => setEditForm({ ...editForm, department_id: e.target.value })}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                    Days
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input w-full"
                    value={editForm.processing_days}
                    onChange={e => setEditForm({ ...editForm, processing_days: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                    Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="form-input w-full"
                    value={editForm.fee}
                    onChange={e => setEditForm({ ...editForm, fee: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                  Status
                </label>
                <select
                  className="form-input w-full"
                  value={editForm.is_active}
                  onChange={e => setEditForm({ ...editForm, is_active: Number(e.target.value) })}
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                  Description
                </label>
                <textarea
                  className="form-input w-full resize-none"
                  rows={2}
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                  Eligibility Criteria
                </label>
                <textarea
                  className="form-input w-full resize-none"
                  rows={2}
                  value={editForm.eligibility}
                  onChange={e => setEditForm({ ...editForm, eligibility: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                  Instructions for Citizens
                </label>
                <textarea
                  className="form-input w-full resize-none"
                  rows={2}
                  value={editForm.instructions}
                  onChange={e => setEditForm({ ...editForm, instructions: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteModalOpen && certToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
              <FaExclamationTriangle />
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Delete Certificate Type?</h3>
            <p className="text-slate-600 text-sm text-center mb-4">
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{certToDelete.name}"</span>?
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-6">
              ⚠️ <strong>Safe Deletion Check:</strong> If any citizen applications have been submitted for this certificate type, deletion will be safely rejected and you will be prompted to deactivate it instead to maintain historical records.
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="btn-secondary flex-1 text-sm py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold flex-1 rounded-lg text-sm py-2 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
