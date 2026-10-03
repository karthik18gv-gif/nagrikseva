import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
export default function AdminAnnouncements() {
  const [list, setList] = useState([]); const [loading, setLoading] = useState(true); const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title:'', content:'', type:'general' }); const [submitting, setSubmitting] = useState(false)
  const fetchData = () => { adminAPI.getAnnouncements().then(r => setList(r.data.data||[])).catch(()=>{}).finally(()=>setLoading(false)) }
  useEffect(() => { fetchData() }, [])
  const handleSubmit = async (e) => { e.preventDefault(); setSubmitting(true)
    try { await adminAPI.createAnnouncement(form); toast.success('Posted'); setShowForm(false); setForm({title:'',content:'',type:'general'}); fetchData() } catch { toast.error('Failed') } finally { setSubmitting(false) } }
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; try { await adminAPI.deleteAnnouncement(id); toast.success('Deleted'); fetchData() } catch { toast.error('Failed') } }
  return (
    <div>
      <PageHeader title="Manage Announcements" subtitle={list.length + ' announcements'} actions={<button onClick={()=>setShowForm(!showForm)} className="btn-primary text-sm py-2">+ New Announcement</button>} />
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required /></div>
            <div><label className="form-label">Content</label><textarea className="form-input resize-none" rows={3} value={form.content} onChange={e=>setForm({...form,content:e.target.value})} required /></div>
            <div><label className="form-label">Type</label><select className="form-input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="general">General</option><option value="update">Update</option><option value="maintenance">Maintenance</option><option value="alert">Alert</option></select></div>
            <div className="flex gap-3"><button type="submit" disabled={submitting} className="btn-primary">{submitting?'Posting...':'Post'}</button><button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancel</button></div>
          </form>
        </div>
      )}
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">{list.map(a => (
          <div key={a.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-start justify-between gap-3">
            <div><p className="font-semibold text-slate-800">{a.title}</p><p className="text-slate-500 text-sm mt-1">{a.content}</p><p className="text-xs text-slate-400 mt-2">{new Date(a.created_at).toLocaleDateString('en-IN')} • {a.type}</p></div>
            <button onClick={()=>handleDelete(a.id)} className="text-xs text-red-500 font-semibold hover:underline whitespace-nowrap">Delete</button>
          </div>
        ))}</div>
      )}
    </div>
  )
}
