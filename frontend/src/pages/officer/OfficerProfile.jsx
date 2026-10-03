import { useEffect, useState } from 'react'
import { officerAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { FaUser, FaEnvelope, FaPhone, FaBuilding, FaIdBadge, FaMapMarkerAlt, FaShieldAlt, FaStar } from 'react-icons/fa'

export default function OfficerProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    officerAPI.getProfile()
      .then(r => setProfile(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner text="Loading officer record..." />

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Officer Service Record"
        subtitle="Gazetted Department Officer Information"
      />

      <div className="max-w-2xl space-y-5">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {/* Avatar & Header */}
          <div className="flex items-center gap-5 pb-5 mb-5 border-b border-slate-100">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-700 to-orange-600 flex items-center justify-center text-white text-2xl font-black shadow-md flex-shrink-0">
              {profile?.name?.[0]?.toUpperCase() || 'O'}
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">{profile?.name}</h2>
              <p className="text-slate-500 text-sm">{profile?.designation}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <FaStar className="text-[8px]" /> Gazetted Officer
                </span>
                <span className="text-[10px] font-mono text-slate-400">{profile?.officer_id_no}</span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: FaEnvelope, label: 'Official Email', value: profile?.email },
              { icon: FaPhone, label: 'Contact Number', value: profile?.phone || '—' },
              { icon: FaBuilding, label: 'Assigned Department', value: profile?.department_name },
              { icon: FaIdBadge, label: 'Officer ID No.', value: profile?.officer_id_no },
              { icon: FaUser, label: 'Designation / Gazetted Post', value: profile?.designation },
              { icon: FaMapMarkerAlt, label: 'Jurisdiction / District', value: profile?.district || '—' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 text-xs">
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

        {/* Authority Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <FaShieldAlt className="text-amber-700 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-amber-900 text-xs">Gazetted Officer Notice</p>
            <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
              As a gazetted officer, your digital approvals carry statutory authority under the Karnataka Sakala Services Act. All orders placed via this portal are cryptographically sealed and legally binding. For profile change requests, contact the Head of Department (HoD) or District Collector's office.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
