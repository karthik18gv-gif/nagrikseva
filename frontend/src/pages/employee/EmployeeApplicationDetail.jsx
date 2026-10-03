import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { employeeAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
export default function EmployeeApplicationDetail() {
  const { id } = useParams(); const navigate = useNavigate()
  const [data, setData] = useState(null); const [loading, setLoading] = useState(true)
  const [remarks, setRemarks] = useState(''); const [returnReason, setReturnReason] = useState(''); const [rejReason, setRejReason] = useState(''); const [processing, setProcessing] = useState(false)
  useEffect(() => { employeeAPI.getApplicationDetail(id).then(r => setData(r.data.data)).catch(()=>{}).finally(()=>setLoading(false)) }, [id])
  const handleAction = async (type) => {
    setProcessing(true)
    try {
      if (type==='verify') await employeeAPI.verifyApplication(id, { remarks })
      else if (type==='return') await employeeAPI.returnApplication(id, { return_reason: returnReason })
      else await employeeAPI.rejectApplication(id, { rejection_reason: rejReason })
      toast.success('Application ' + type + 'ed'); navigate('/employee/applications')
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed') } finally { setProcessing(false) }
  }
  if (loading) return <LoadingSpinner />
  if (!data) return <div className="text-center py-12 text-slate-500">Application not found</div>
  const { application: app, documents } = data
  const canAct = ['submitted','under_verification'].includes(app.status)
  return (
    <div>
      <PageHeader title="Application Review" subtitle={app.application_number} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-slate-800">Application Details</h3><StatusBadge status={app.status}/></div>
            <div className="grid grid-cols-2 gap-4 text-sm">{[['Certificate',app.certificate_name],['Department',app.department_name],['Applied On',new Date(app.submitted_at).toLocaleDateString('en-IN')],['Purpose',app.purpose||'—']].map(([l,v])=>(<div key={l}><p className="text-xs text-slate-400">{l}</p><p className="font-semibold text-slate-800 mt-0.5">{v}</p></div>))}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h3 className="font-bold text-slate-800 mb-4">Citizen Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">{[['Full Name',`${app.first_name} ${app.last_name}`],['Mobile',app.mobile],['Email',app.email],['Aadhaar',app.aadhaar_number],['Father Name',app.father_name||'—'],['DOB',app.dob],['Gender',app.gender],['Category',app.category],['District',app.district_name]].map(([l,v])=>(<div key={l}><p className="text-xs text-slate-400">{l}</p><p className="font-semibold text-slate-800 mt-0.5">{v}</p></div>))}</div>
          </div>
          {documents?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-800 mb-3">Uploaded Documents ({documents.length})</h3>
              <div className="space-y-2">{documents.map(d => (<div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"><div className="flex items-center gap-2"><span>📄</span><span className="text-sm text-slate-700">{d.document_name}</span></div><a href={`/uploads/documents/${d.file_path}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-medium hover:underline">View</a></div>))}</div>
            </div>
          )}
        </div>
        {canAct && (
          <div className="bg-white rounded-xl border border-slate-100 p-5 h-fit space-y-4">
            <h3 className="font-bold text-slate-800">Take Action</h3>
            <div><label className="form-label">Remarks (optional)</label><textarea className="form-input resize-none" rows={3} value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Add verification remarks..." /></div>
            <button onClick={()=>handleAction('verify')} disabled={processing} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50">✅ Verify & Forward to Officer</button>
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div><label className="form-label text-amber-700">Return Reason</label><textarea className="form-input resize-none border-amber-200" rows={2} value={returnReason} onChange={e=>setReturnReason(e.target.value)} placeholder="Why returning?" /></div>
              <button onClick={()=>handleAction('return')} disabled={processing||!returnReason} className="w-full bg-amber-500 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-600 disabled:opacity-50">↩️ Return to Citizen</button>
              <div><label className="form-label text-red-700">Rejection Reason</label><textarea className="form-input resize-none border-red-200" rows={2} value={rejReason} onChange={e=>setRejReason(e.target.value)} placeholder="Why rejecting?" /></div>
              <button onClick={()=>handleAction('reject')} disabled={processing||!rejReason} className="w-full bg-red-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 disabled:opacity-50">❌ Reject Application</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
