import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { officerAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

export default function OfficerApplicationDetail() {
  const { id } = useParams(); const navigate = useNavigate()
  const [app, setApp] = useState(null); const [documents, setDocuments] = useState([]); const [loading, setLoading] = useState(true)
  const [remarks, setRemarks] = useState(''); const [rejReason, setRejReason] = useState(''); const [processing, setProcessing] = useState(false)

  useEffect(() => {
    setLoading(true)
    officerAPI.getApplicationDetail(id)
      .then(r => { setApp(r.data.data.application); setDocuments(r.data.data.documents || []) })
      .catch(() => setApp(null))
      .finally(() => setLoading(false))
  }, [id])

  // FIX (root cause of "Application must be verified first (current status: approved)"):
  // The previous handler tried to read `data.data.certificate_number` from
  // the approve response — a leftover from an older workflow where the
  // officer generated the certificate directly. In the current (correct)
  // workflow the officer only forwards the application to admin, and the
  // backend returns `data: null`, so accessing `.certificate_number` threw
  // a TypeError. That crash fell into the catch block, the success
  // navigation never ran, and clicking again produced the "must be verified
  // first" error because the DB had already flipped to 'approved' on the
  // first (successful) call. Now we just use the message the backend
  // actually returns and navigate cleanly.
  const handleApprove = async () => {
    setProcessing(true)
    try {
      const { data } = await officerAPI.approveApplication(id, { officer_remarks: remarks })
      toast.success(data?.message || 'Approved and forwarded to admin for final approval')
      navigate('/officer/applications')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejReason) { toast.error('Please provide a rejection reason'); return }
    setProcessing(true)
    try {
      await officerAPI.rejectApplication(id, { rejection_reason: rejReason, officer_remarks: remarks })
      toast.success('Application rejected')
      navigate('/officer/applications')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!app) return <div className="text-center py-12 text-slate-500">Application not found in your queue</div>

  return (
    <div>
      <PageHeader title="Application Review & Approval" subtitle={app.application_number} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-slate-800">Application Summary</h3><StatusBadge status={app.status}/></div>
            <div className="grid grid-cols-2 gap-4 text-sm">{[['Certificate',app.certificate_name],['Applicant',`${app.first_name} ${app.last_name}`],['Mobile',app.mobile],['Aadhaar',app.aadhaar_number],['Verified By',app.verified_by||'—'],['Submitted',new Date(app.submitted_at).toLocaleDateString('en-IN')]].map(([l,v])=>(<div key={l}><p className="text-xs text-slate-400">{l}</p><p className="font-semibold text-slate-800 mt-0.5">{v}</p></div>))}</div>
          </div>
          {documents?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <h3 className="font-bold text-slate-800 mb-3">Uploaded Documents ({documents.length})</h3>
              <div className="space-y-2">{documents.map(d => (<div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"><div className="flex items-center gap-2"><span>📄</span><span className="text-sm text-slate-700">{d.document_name}</span></div><a href={`/uploads/documents/${d.file_path}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-medium hover:underline">View</a></div>))}</div>
            </div>
          )}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4"><p className="text-blue-800 text-sm font-semibold">ℹ️ This application has been verified and is ready for your final approval. Once you approve, it will be forwarded to admin for certificate issuance.</p></div>
        </div>
        {app.status === 'verified' ? (
          <div className="bg-white rounded-xl border border-slate-100 p-5 h-fit space-y-4">
            <h3 className="font-bold text-slate-800">Approve / Reject</h3>
            <div><label className="form-label">Officer Remarks</label><textarea className="form-input resize-none" rows={3} value={remarks} onChange={e=>setRemarks(e.target.value)} /></div>
            <button onClick={handleApprove} disabled={processing} className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50">
              {processing ? 'Processing…' : '✅ Approve & Forward to Admin'}
            </button>
            <div className="border-t border-slate-100 pt-4">
              <label className="form-label text-red-700">Rejection Reason</label><textarea className="form-input resize-none border-red-200" rows={2} value={rejReason} onChange={e=>setRejReason(e.target.value)} />
              <button onClick={handleReject} disabled={processing||!rejReason} className="w-full mt-3 bg-red-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-red-700 disabled:opacity-50">❌ Reject Application</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 p-5 h-fit">
            <p className="text-slate-500 text-sm">This application is already <strong>{app.status}</strong> — no further action is available here.</p>
          </div>
        )}
      </div>
    </div>
  )
}