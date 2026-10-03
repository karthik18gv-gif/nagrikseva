import { useState, useEffect } from 'react'
import { officerAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

// FIX: this page used to pull only a 5-item slice from the dashboard
// (officerAPI.getDashboard().pension_queue) with a single generic "Approve
// Stage" button that stepped through 5 stages. Now uses a real list endpoint
// and clear Approve / Reject actions for the simplified 2-stage workflow.
export default function OfficerPension() {
  const [list, setList] = useState([]); const [loading, setLoading] = useState(true)
  const [remarksMap, setRemarksMap] = useState({}); const [reasonMap, setReasonMap] = useState({}); const [busyId, setBusyId] = useState(null)

  const fetchData = () => { setLoading(true); officerAPI.getPensionApplications().then(r => setList(r.data.data||[])).catch(err=>console.error(err)).finally(()=>setLoading(false)) }
  useEffect(() => { fetchData() }, [])

  const handleApprove = async (id) => {
    setBusyId(id)
    try { await officerAPI.approvePension(id, { remarks: remarksMap[id]||'' }); toast.success('Approved and forwarded to admin'); fetchData() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBusyId(null) }
  }
  const handleReject = async (id) => {
    if (!reasonMap[id]) { toast.error('Please enter a rejection reason'); return }
    setBusyId(id)
    try { await officerAPI.rejectPension(id, { rejection_reason: reasonMap[id] }); toast.success('Pension application rejected'); fetchData() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setBusyId(null) }
  }

  const pending = list.filter(p => p.status === 'submitted')
  const decided = list.filter(p => p.status !== 'submitted')

  return (
    <div>
      <PageHeader title="Pension Case Review" subtitle={`${pending.length} pending · ${list.length} total government employee pension cases`} />
      {loading ? <LoadingSpinner /> : (
        <>
          {pending.length===0 ? (
            <div className="text-center py-12"><div className="text-4xl mb-3">💼</div><p className="text-slate-500">No pension cases pending your review</p></div>
          ) : (
            <div className="space-y-4 mb-8">
              {pending.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-slate-100 p-5">
                  <div className="flex items-start justify-between mb-4"><div><h3 className="font-bold text-slate-800">{p.employee_name}</h3><p className="text-[#1a3a6b] font-semibold text-sm">{p.application_number}</p><p className="text-slate-500 text-xs mt-1">{p.department_name} · {p.designation||'—'}</p></div><StatusBadge status={p.status}/></div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4 text-sm">
                    {[['Years of Service',p.years_of_service?p.years_of_service+' yrs':'—'],['Monthly Pension',p.estimated_pension?'₹'+Number(p.estimated_pension).toLocaleString('en-IN'):'—'],['Bank',p.bank_name||'—']].map(([l,v])=>(<div key={l}><p className="text-xs text-slate-400">{l}</p><p className="font-semibold text-slate-800">{v}</p></div>))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input className="form-input flex-1" placeholder="Approval remarks (optional)..." value={remarksMap[p.id]||''} onChange={e=>setRemarksMap({...remarksMap,[p.id]:e.target.value})} />
                    <button onClick={()=>handleApprove(p.id)} disabled={busyId===p.id} className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 whitespace-nowrap">✅ Approve</button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mt-2">
                    <input className="form-input flex-1 border-red-200" placeholder="Rejection reason (required to reject)..." value={reasonMap[p.id]||''} onChange={e=>setReasonMap({...reasonMap,[p.id]:e.target.value})} />
                    <button onClick={()=>handleReject(p.id)} disabled={busyId===p.id} className="bg-red-50 text-red-600 border border-red-200 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 disabled:opacity-50 whitespace-nowrap">❌ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {decided.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-500 mb-3">Previously Reviewed</h3>
              <div className="space-y-2">
                {decided.map(p => (
                  <div key={p.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center justify-between">
                    <div><p className="font-semibold text-slate-800 text-sm">{p.employee_name}</p><p className="text-xs text-slate-400">{p.application_number}</p></div>
                    <StatusBadge status={p.status}/>
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
