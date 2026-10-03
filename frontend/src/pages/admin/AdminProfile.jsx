import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
import { FaUserCheck, FaKey, FaShieldAlt, FaSave } from 'react-icons/fa'

export default function AdminProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details') // 'details' | 'security'

  // Profile edit form state
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' })
  const [savingProfile, setSavingProfile] = useState(false)

  // Password change form state
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [savingPwd, setSavingPwd] = useState(false)

  const fetchProfile = () => {
    adminAPI.getProfile()
      .then(r => {
        const data = r.data.data
        setProfile(data)
        setProfileForm({ name: data?.name || '', email: data?.email || '', phone: data?.phone || '' })
      })
      .catch(() => toast.error('Failed to load profile details'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProfile() }, [])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    if (!profileForm.name.trim()) { toast.error('Name cannot be empty'); return }
    if (!profileForm.email.trim()) { toast.error('Email cannot be empty'); return }

    setSavingProfile(true)
    try {
      await adminAPI.updateProfile(profileForm)
      toast.success('Admin profile updated successfully!')
      fetchProfile()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!pwdForm.current_password) { toast.error('Please enter your current password'); return }
    if (pwdForm.new_password.length < 8) { toast.error('New password must be at least 8 characters'); return }
    if (pwdForm.new_password !== pwdForm.confirm_password) { toast.error('New passwords do not match'); return }

    setSavingPwd(true)
    try {
      await adminAPI.changePassword({
        current_password: pwdForm.current_password,
        new_password: pwdForm.new_password
      })
      toast.success('Password changed successfully!')
      setPwdForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSavingPwd(false)
    }
  }

  if (loading) return <LoadingSpinner text="Loading admin profile..." />

  return (
    <div className="max-w-4xl">
      <PageHeader title="Admin Profile & Security" subtitle="Manage your administrator credentials and security settings" />

      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 bg-amber-500 rounded-2xl flex items-center justify-center text-slate-900 text-3xl font-extrabold shadow-lg">
            {profile?.name?.[0] || 'A'}
          </div>
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-bold">{profile?.name}</h2>
              <span className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-semibold">Super Admin</span>
            </div>
            <p className="text-slate-300 text-sm mt-1">Username: <span className="font-mono text-amber-300">{profile?.username}</span></p>
            <p className="text-slate-400 text-xs mt-0.5">Last Login: {profile?.last_login ? new Date(profile.last_login).toLocaleString('en-IN') : 'Recent'}</p>
          </div>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex gap-3 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'details' ? 'border-[#1a3a6b] text-[#1a3a6b]' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FaUserCheck /> Edit Profile Details
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'security' ? 'border-[#1a3a6b] text-[#1a3a6b]' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FaKey /> Change Password & Security
        </button>
      </div>

      {/* Profile Details Tab */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
            <FaUserCheck className="text-slate-600" /> Update Account Information
          </h3>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Full Name *</label>
                <input
                  className="form-input"
                  value={profileForm.name}
                  onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Administrator Name"
                  required
                />
              </div>
              <div>
                <label className="form-label">Username (Read-only)</label>
                <input
                  className="form-input bg-slate-50 text-slate-500 cursor-not-allowed"
                  value={profile?.username || ''}
                  disabled
                />
                <span className="text-xs text-slate-400 mt-1 block">Username cannot be changed.</span>
              </div>
              <div>
                <label className="form-label">Official Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  value={profileForm.email}
                  onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="admin@gov.in"
                  required
                />
              </div>
              <div>
                <label className="form-label">Contact Phone Number</label>
                <input
                  type="tel"
                  className="form-input"
                  value={profileForm.phone}
                  onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                />
              </div>
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="btn-primary flex items-center gap-2 px-6 py-2.5"
              >
                <FaSave /> {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security & Change Password Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
            <FaShieldAlt className="text-amber-600" /> Change Administrator Password
          </h3>
          <p className="text-slate-500 text-xs mb-5">
            For security, please enter your current administrator password before choosing a strong new password (minimum 8 characters).
          </p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="form-label">Current Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter current password"
                value={pwdForm.current_password}
                onChange={e => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label">New Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter new strong password"
                value={pwdForm.new_password}
                onChange={e => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                required
              />
              <span className="text-xs text-slate-400 mt-1 block">Must be at least 8 characters long.</span>
            </div>
            <div>
              <label className="form-label">Confirm New Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="Re-enter new password"
                value={pwdForm.confirm_password}
                onChange={e => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
                required
              />
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={savingPwd}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <FaKey /> {savingPwd ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
