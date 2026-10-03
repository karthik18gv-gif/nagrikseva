import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
export default function AdminSupport() {
  const [tickets, setTickets] = useState([]); const [loading, setLoading] = useState(true); const [responseMap, setResponseMap] = useState({})
  const fetchData = () => { adminAPI.getSupportTickets().then(r => setTickets(r.data.data||[])).catch(()=>{}).finally(()=>setLoading(false)) }
  useEffect(() => { fetchData() }, [])
  const handleResolve = async (id) => { if (!responseMap[id]) { toast.error('Enter a response'); return }
    try { await adminAPI.resolveTicket(id, { response: responseMap[id] }); toast.success('Resolved'); fetchData() } catch { toast.error('Failed') } }
  return (
    <div>
      <PageHeader title="Support Tickets" subtitle={tickets.length + ' citizen support requests'} />
      {loading ? <LoadingSpinner /> : (
        <div className="space-y-4">{tickets.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-start justify-between mb-2"><div><p className="font-semibold text-slate-800">{t.subject}</p><p className="text-slate-500 text-xs">{t.ticket_number} • {t.first_name} {t.last_name} ({t.email})</p></div><StatusBadge status={t.status}/></div>
            <p className="text-slate-600 text-sm my-2">{t.description}</p>
            {t.response ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2"><p className="text-green-700 text-xs font-semibold">Response:</p><p className="text-green-800 text-xs">{t.response}</p></div>
            ) : (
              <div className="flex gap-3 mt-3"><input className="form-input flex-1" placeholder="Type your response..." value={responseMap[t.id]||''} onChange={e=>setResponseMap({...responseMap,[t.id]:e.target.value})} /><button onClick={()=>handleResolve(t.id)} className="bg-[#1a3a6b] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#253f7a] whitespace-nowrap">Resolve</button></div>
            )}
          </div>
        ))}</div>
      )}
    </div>
  )
}
