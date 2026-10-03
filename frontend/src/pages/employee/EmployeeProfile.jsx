import { useEffect, useState } from 'react'
import { employeeAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaIdBadge, FaMapMarkerAlt, FaShieldAlt } from 'react-icons/fa'

export default function EmployeeProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    employeeAPI.getProfile()
      .then(r => setProfile(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading staff profile..." />

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="My Staff Profile"
        subtitle="Government Employee Service Record"
      />

      <div className="max-w-2xl space-y-5">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {/* Avatar & Header */}
          <div className="flex items-center gap-5 pb-5 mb-5 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-600 flex items-center justify-center text-white text-2xl font-black shadow-md flex-shrink-0">
              {profile?.name?.[0]?.toUpperCase() || 'E'}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">{profile?.name}</h2>
              <p className="text-slate-500 text-sm">{profile?.designation}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Staff Verified
                </span>
                <span className="text-[10px] font-mono text-slate-400">{profile?.employee_id_no}</span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: FaEnvelope, label: 'Official Email', value: profile?.email },
              { icon: FaPhone, label: 'Contact Number', value: profile?.phone || '—' },
              { icon: FaBuilding, label: 'Assigned Department', value: profile?.department_name },
              { icon: FaIdBadge, label: 'Employee ID No.', value: profile?.employee_id_no },
              { icon: FaUser, label: 'Designation / Post', value: profile?.designation },
              { icon: FaMapMarkerAlt, label: 'District / Zone', value: profile?.district || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 text-xs">
                  <Icon />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{value || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
          <FaShieldAlt className="text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-slate-700 text-xs">Profile Information Notice</p>
            <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
              Your service record data is maintained by the Department HR System. To request changes to your official designation, email, or phone number, please contact your department administrative desk or Head of Department (HoD).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
