import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { employeeAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'

// FIX (workflow simplification): dropped the old 5-stage pipeline
// (submitted/hr_review/finance_review/admin_review/approved) — HR review and
// finance review were removed entirely. New pipeline: employee applies ->
// officer approves -> admin approves (final, generates downloadable letter).
const STAGES = ['submitted','officer_approved','approved']
const STAGE_LABELS = { submitted: 'Submitted', officer_approved: 'Officer Approved', approved: 'Admin Approved' }

export default function EmployeePension() {
  const { user } = useAuth()
  const [applications, setApplications] = useState([]); const [loading, setLoading] = useState(true); const [showForm, setShowForm] = useState(false); const [submitting, setSubmitting] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [form, setForm] = useState({ employee_name: user?.name||'', designation: user?.designation||'', date_of_joining:'', date_of_retirement:'', years_of_service:'', basic_salary:'', estimated_pension:'', bank_name:'', bank_account:'', bank_ifsc:'' })
  const fetchApplications = () => { employeeAPI.getPensionApplications().then(r => setApplications(r.data.data||[])).catch(err=>console.error(err)).finally(()=>setLoading(false)) }
  useEffect(() => { fetchApplications() }, [])
  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true)
    try { const { data } = await employeeAPI.applyForPension(form); toast.success('Pension application submitted! ID: ' + data.data.application_number); setShowForm(false); fetchApplications() }
    catch (err) { toast.error(err.response?.data?.message || 'Submission failed') } finally { setSubmitting(false) }
  }
  const handleDownloadLetter = async (id) => {
    setDownloadingId(id)
    try {
      const { data } = await employeeAPI.downloadPensionLetter(id)
      window.open(`/uploads/pension-letters/${data.data.letter_path}`, '_blank')
    } catch (err) { toast.error(err.response?.data?.message || 'Download failed') }
    finally { setDownloadingId(null) }
  }
  return (
    <div>
      <PageHeader title="Pension Services" subtitle="Apply for retirement pension and track approval status" actions={applications.length===0 && <button onClick={()=>setShowForm(!showForm)} className="btn-primary text-sm py-2">+ Apply for Pension</button>} />
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 mb-6">
          <h3 className="font-bold text-slate-800 mb-5">Pension Application Form</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="form-label">Employee Name</label><input className="form-input" value={form.employee_name} onChange={e=>setForm({...form,employee_name:e.target.value})} required /></div>
            <div><label className="form-label">Designation</label><input className="form-input" value={form.designation} onChange={e=>setForm({...form,designation:e.target.value})} /></div>
            <div><label className="form-label">Date of Joining</label><input type="date" className="form-input" value={form.date_of_joining} onChange={e=>setForm({...form,date_of_joining:e.target.value})} /></div>
            <div><label className="form-label">Date of Retirement</label><input type="date" className="form-input" value={form.date_of_retirement} onChange={e=>setForm({...form,date_of_retirement:e.target.value})} /></div>
            <div><label className="form-label">Years of Service</label><input type="number" className="form-input" value={form.years_of_service} onChange={e=>setForm({...form,years_of_service:e.target.value})} /></div>
            <div><label className="form-label">Basic Salary (₹)</label><input type="number" className="form-input" value={form.basic_salary} onChange={e=>setForm({...form,basic_salary:e.target.value})} /></div>
            <div><label className="form-label">Estimated Pension (₹ / month)</label><input type="number" className="form-input" value={form.estimated_pension} onChange={e=>setForm({...form,estimated_pension:e.target.value})} /></div>
            <div><label className="form-label">Bank Name</label><input className="form-input" value={form.bank_name} onChange={e=>setForm({...form,bank_name:e.target.value})} /></div>
            <div><label className="form-label">Bank Account Number</label><input className="form-input" value={form.bank_account} onChange={e=>setForm({...form,bank_account:e.target.value})} /></div>
            <div><label className="form-label">IFSC Code</label><input className="form-input" value={form.bank_ifsc} onChange={e=>setForm({...form,bank_ifsc:e.target.value})} /></div>
            <div className="md:col-span-2 flex gap-3 pt-2"><button type="submit" disabled={submitting} className="btn-primary">{submitting?'Submitting...':'📤 Submit Pension Application'}</button><button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancel</button></div>
          </form>
        </div>
      )}
      {loading ? <LoadingSpinner /> : applications.length===0 ? (
        <div className="bg-white rounded-xl border border-slate-100 p-12 text-center"><div className="text-5xl mb-4">💼</div><h3 className="font-bold text-slate-700 mb-2">No Pension Applications Yet</h3><p className="text-slate-500 text-sm mb-5">Submit your pension application to begin the retirement benefit process.</p><button onClick={()=>setShowForm(true)} className="btn-primary">Apply for Pension</button></div>
      ) : (
        <div className="space-y-4">{applications.map(app => {
          const isRejected = app.status === 'rejected'
          const stageIdx = STAGES.indexOf(app.status)
          return (
            <div key={app.id} className="bg-white rounded-xl border border-slate-100 p-6">
              <div className="flex items-start justify-between mb-4"><div><h3 className="font-bold text-slate-800">{app.employee_name}</h3><p className="text-[#1a3a6b] font-semibold text-sm">{app.application_number}</p><p className="text-slate-500 text-xs mt-1">{app.department_name}</p></div><StatusBadge status={app.status}/></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 text-sm">
                {[['Years of Service',app.years_of_service?app.years_of_service+' yrs':'—'],['Basic Salary',app.basic_salary?'₹'+Number(app.basic_salary).toLocaleString('en-IN'):'—'],['Monthly Pension',app.estimated_pension?'₹'+Number(app.estimated_pension).toLocaleString('en-IN'):'—'],['Bank',app.bank_name||'—']].map(([l,v])=>(<div key={l}><p className="text-xs text-slate-400">{l}</p><p className="font-semibold text-slate-800">{v}</p></div>))}
              </div>

              {isRejected ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  ❌ This application was rejected.{app.rejection_reason ? ` Reason: ${app.rejection_reason}` : ''}
                </div>
              ) : (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-3">Approval Progress</p>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {STAGES.map((s,i) => (
                      <div key={s} className="flex items-center">
                        <div className="flex flex-col items-center min-w-[90px]">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i<stageIdx?'bg-green-500 text-white':i===stageIdx?'bg-[#f4a200] text-white':'bg-slate-200 text-slate-400'}`}>{i<stageIdx?'✓':i+1}</div>
                          <span className={`text-xs mt-1 text-center leading-tight ${i<=stageIdx?'text-slate-700 font-medium':'text-slate-400'}`}>{STAGE_LABELS[s]}</span>
                        </div>
                        {i<STAGES.length-1 && <div className={`w-10 h-0.5 flex-shrink-0 ${i<stageIdx?'bg-green-500':'bg-slate-200'}`}/>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {app.status === 'approved' && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button onClick={()=>handleDownloadLetter(app.id)} disabled={downloadingId===app.id} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                    {downloadingId===app.id ? 'Preparing...' : '⬇️ Download Pension Letter'}
                  </button>
                </div>
              )}
            </div>
          )
        })}</div>
      )}
    </div>
  )
}
