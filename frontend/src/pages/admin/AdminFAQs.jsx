import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
export default function AdminFAQs() {
  const [list, setList] = useState([]); const [loading, setLoading] = useState(true); const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ question:'', answer:'', category:'General' }); const [submitting, setSubmitting] = useState(false)
  const fetchData = () => { adminAPI.getFAQs().then(r => setList(r.data.data||[])).catch(()=>{}).finally(()=>setLoading(false)) }
  useEffect(() => { fetchData() }, [])
  const handleSubmit = async (e) => { e.preventDefault(); setSubmitting(true)
    try { await adminAPI.createFAQ(form); toast.success('FAQ added'); setShowForm(false); setForm({question:'',answer:'',category:'General'}); fetchData() } catch { toast.error('Failed') } finally { setSubmitting(false) } }
  return (
    <div>
      <PageHeader title="Manage FAQs" subtitle={list.length + ' frequently asked questions'} actions={<button onClick={()=>setShowForm(!showForm)} className="btn-primary text-sm py-2">+ Add FAQ</button>} />
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="form-label">Question</label><input className="form-input" value={form.question} onChange={e=>setForm({...form,question:e.target.value})} required /></div>
            <div><label className="form-label">Answer</label><textarea className="form-input resize-none" rows={3} value={form.answer} onChange={e=>setForm({...form,answer:e.target.value})} required /></div>
            <div><label className="form-label">Category</label><input className="form-input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})} /></div>
            <div className="flex gap-3"><button type="submit" disabled={submitting} className="btn-primary">{submitting?'Adding...':'Add'}</button><button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancel</button></div>
          </form>
        </div>
      )}
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">{list.map(f => (
          <div key={f.id} className="bg-white rounded-xl border border-slate-100 p-4">
            <p className="font-semibold text-slate-800">{f.question}</p><p className="text-slate-500 text-sm mt-1">{f.answer}</p>
            <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{f.category}</span>
          </div>
        ))}</div>
      )}
    </div>
  )
}
