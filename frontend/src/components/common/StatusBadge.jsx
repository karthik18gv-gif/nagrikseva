const MAP = {
  submitted:          'badge-processing', draft: 'bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-0.5 rounded-full',
  under_verification: 'badge-processing', verified: 'badge-processing', under_review: 'badge-pending',
  approved:           'badge-approved',   completed: 'badge-completed', rejected: 'badge-rejected',
  returned:           'badge-returned',   cancelled: 'bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-0.5 rounded-full',
  officer_approved:   'badge-pending',
  // Legacy values kept only so old records created before the pension
  // workflow simplification (HR Review / Finance Review / Admin Review
  // stages removed) still render something sensible instead of blank.
  hr_review:          'badge-processing', finance_review: 'badge-pending', admin_review: 'badge-pending',
  open:               'badge-processing', in_progress: 'badge-pending', resolved: 'badge-approved',
  closed:             'bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-0.5 rounded-full',
}
const LABELS = {
  submitted:'Submitted', draft:'Draft', under_verification:'Under Verification', verified:'Verified',
  under_review:'Under Review', approved:'Approved', completed:'Completed', rejected:'Rejected',
  returned:'Returned', cancelled:'Cancelled', officer_approved:'Officer Approved',
  hr_review:'HR Review', finance_review:'Finance Review',
  admin_review:'Admin Review', open:'Open', in_progress:'In Progress', resolved:'Resolved', closed:'Closed',
}
export default function StatusBadge({ status }) {
  const cls = MAP[status] || 'badge-processing'
  const label = LABELS[status] || status
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{label}</span>
}
