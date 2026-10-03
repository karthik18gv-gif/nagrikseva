import { useState, useEffect } from 'react'
import { citizenAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
export default function CitizenSupport() {
  const [tickets, setTickets] = useState([]); const [loading, setLoading] = useState(true); const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ subject:'', description:'', priority:'medium' }); const [submitting, setSubmitting] = useState(false)
  const fetchTickets = () => { citizenAPI.getTickets().then(r => setTickets(r.data.data||[])).catch(()=>{}).finally(()=>setLoading(false)) }
  useEffect(() => { fetchTickets() }, [])
  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try { await citizenAPI.raiseTicket(form); toast.success('Support ticket raised!'); setShowForm(false); setForm({subject:'',description:'',priority:'medium'}); fetchTickets() }
    catch { toast.error('Failed') } finally { setSubmitting(false) }
  }
  return (
    <div>
      <PageHeader title="Support Center" subtitle="Raise issues or track your support tickets" actions={<button onClick={()=>setShowForm(!showForm)} className="btn-primary text-sm py-2">+ Raise Ticket</button>} />
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="form-label">Subject</label><input className="form-input" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} required /></div>
            <div><label className="form-label">Description</label><textarea className="form-input resize-none" rows={4} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required /></div>
            <div><label className="form-label">Priority</label><select className="form-input" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
            <div className="flex gap-3"><button type="submit" disabled={submitting} className="btn-primary">{submitting?'Submitting...':'Submit Ticket'}</button><button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancel</button></div>
          </form>
        </div>
      )}
      {loading ? <LoadingSpinner /> : tickets.length === 0 ? <div className="text-center py-12"><div className="text-5xl mb-3">🎫</div><p className="text-slate-500">No support tickets yet</p></div> : (
        <div className="space-y-3">
          {tickets.map(t => (
            <div key={t.id} className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-800">{t.subject}</p><p className="text-slate-500 text-xs mt-0.5">{t.ticket_number} • {new Date(t.created_at).toLocaleDateString('en-IN')}</p></div><StatusBadge status={t.status}/></div>
              <p className="text-slate-600 text-sm mt-2">{t.description}</p>
              {t.response && <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3"><p className="text-green-700 text-xs font-semibold mb-1">Response:</p><p className="text-green-800 text-xs">{t.response}</p></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
