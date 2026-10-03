import { useState, useEffect } from 'react'
import { adminAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]); const [loading, setLoading] = useState(true)
  useEffect(() => { adminAPI.getAuditLogs().then(r => setLogs(r.data.data||[])).catch(()=>{}).finally(()=>setLoading(false)) }, [])
  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="System activity and changes log" />
      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]"><thead className="bg-slate-50 border-b border-slate-100"><tr>{['User Type','Action','Table','IP Address','Date'].map(h=><th key={h} className="text-left text-xs font-semibold text-slate-500 px-4 py-3">{h}</th>)}</tr></thead>
            <tbody>{logs.map(l => (<tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50"><td className="px-4 py-3 text-slate-700 text-xs capitalize">{l.user_type}</td><td className="px-4 py-3 text-slate-600 text-xs">{l.action}</td><td className="px-4 py-3 text-slate-500 text-xs">{l.table_name||'—'}</td><td className="px-4 py-3 text-slate-400 text-xs">{l.ip_address||'—'}</td><td className="px-4 py-3 text-slate-400 text-xs">{new Date(l.created_at).toLocaleString('en-IN')}</td></tr>))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
