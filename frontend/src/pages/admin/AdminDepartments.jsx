import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { exportToCSV } from '../../utils/exportUtils'
import toast from 'react-hot-toast'
import { FaSearch, FaFileExport, FaPlus, FaEdit, FaTrash, FaBuilding, FaExclamationTriangle } from 'react-icons/fa'

export default function AdminDepartments() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', code: '', description: '' })
  const [creating, setCreating] = useState(false)

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', code: '', description: '', is_active: 1 })
  const [updating, setUpdating] = useState(false)

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deptToDelete, setDeptToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = () => {
    setLoading(true)
    adminAPI.getDepartments()
      .then(r => setList(r.data.data || []))
      .catch(() => toast.error('Failed to load departments'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredList = list.filter(d => {
    const matchesSearch = !search ||
      d.name?.toLowerCase().includes(search.toLowerCase()) ||
      d.code?.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && Boolean(d.is_active)) ||
      (statusFilter === 'inactive' && !d.is_active)
    return matchesSearch && matchesStatus
  })

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!createForm.name.trim() || !createForm.code.trim()) {
      toast.error('Name and Code are required')
      return
    }
    setCreating(true)
    try {
      await adminAPI.createDepartment(createForm)
      toast.success('Department created successfully!')
      setShowCreateModal(false)
      setCreateForm({ name: '', code: '', description: '' })
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department')
    } finally {
      setCreating(false)
    }
  }

  const openEditModal = (d) => {
    setEditingDept(d)
    setEditForm({
      name: d.name || '',
      code: d.code || '',
      description: d.description || '',
      is_active: d.is_active ? 1 : 0
    })
    setEditModalOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editingDept) return
    setUpdating(true)
    try {
      await adminAPI.updateDepartment(editingDept.id, editForm)
      toast.success('Department updated successfully!')
      setEditModalOpen(false)
      setEditingDept(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update department')
    } finally {
      setUpdating(false)
    }
  }

  const openDeleteModal = (d) => {
    setDeptToDelete(d)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deptToDelete) return
    setDeleting(true)
    try {
      await adminAPI.deleteDepartment(deptToDelete.id)
      toast.success('Department deleted successfully!')
      setDeleteModalOpen(false)
      setDeptToDelete(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete department')
    } finally {
      setDeleting(false)
    }
  }

  const handleExport = () => {
    const exportData = filteredList.map(d => ({
      'ID': d.id,
      'Department Name': d.name,
      'Code': d.code,
      'Description': d.description || '',
      'Status': d.is_active ? 'Active' : 'Inactive',
      'Created At': d.created_at ? new Date(d.created_at).toLocaleDateString('en-IN') : ''
    }))
    exportToCSV(exportData, `Departments_${new Date().toISOString().slice(0, 10)}.csv`)
  }

  return (
    <div>
      <PageHeader
        title="Manage Departments"
        subtitle={`${list.length} government departments configured`}
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
              <FaPlus /> Add Department
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200/80 p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
            placeholder="Search departments or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Status:</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]"
          >
            <option value="all">All Departments ({list.length})</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filteredList.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FaBuilding className="text-4xl text-slate-300 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700">No departments found</h3>
          <p className="text-slate-400 text-xs mt-1">Try adjusting your search criteria or add a new department</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map(d => (
            <div
              key={d.id}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-800 text-base leading-snug">{d.name}</h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                    {d.code}
                  </span>
                </div>
                <p className="text-slate-500 text-xs line-clamp-3 min-h-[3rem] mb-4">
                  {d.description || 'No detailed description provided for this department.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    d.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {d.is_active ? '● Active' : '○ Inactive'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(d)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Department"
                  >
                    <FaEdit className="text-sm" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(d)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Department"
                  >
                    <FaTrash className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FaBuilding className="text-[#1a3a6b]" /> Add New Department
            </h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  className="form-input w-full"
                  placeholder="e.g. Revenue Department"
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
                  placeholder="e.g. REV, EDU, AGRI"
                  value={createForm.code}
                  onChange={e => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
              <div>
                <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                  Description
                </label>
                <textarea
                  className="form-input w-full resize-none"
                  rows={3}
                  placeholder="Scope of work and responsibilities..."
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
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
                  {creating ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FaEdit className="text-blue-600" /> Edit Department: {editingDept?.name}
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="form-label text-xs font-semibold text-slate-700 mb-1 block">
                  Department Name <span className="text-red-500">*</span>
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
                  Code <span className="text-red-500">*</span>
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
                  Description
                </label>
                <textarea
                  className="form-input w-full resize-none"
                  rows={3}
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
              <div>
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
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
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

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && deptToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">
              <FaExclamationTriangle />
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Delete Department?</h3>
            <p className="text-slate-600 text-sm text-center mb-4">
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{deptToDelete.name}"</span>?
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-6">
              ⚠️ <strong>Safe Deletion Check:</strong> The system will verify if any staff, certificate types, or citizen applications are associated with this department. If active records exist, deletion will be blocked and you will be advised to mark it inactive instead.
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
