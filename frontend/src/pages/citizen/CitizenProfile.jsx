import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { citizenAPI } from '../../services/api'
import PageHeader from '../../components/common/PageHeader'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import toast from 'react-hot-toast'
export default function CitizenProfile() {
  const { updateUser } = useAuth()
  const [profile, setProfile] = useState(null); const [loading, setLoading] = useState(true); const [editing, setEditing] = useState(false); const [form, setForm] = useState({}); const [savingProfile, setSavingProfile] = useState(false)
  const [pwForm, setPwForm] = useState({current_password:'',new_password:'',confirm_password:''}); const [savingPw, setSavingPw] = useState(false)
  useEffect(() => { citizenAPI.getProfile().then(r => { setProfile(r.data.data); setForm(r.data.data) }).catch(()=>{}).finally(()=>setLoading(false)) }, [])
  const handleSave = async (e) => {
    e.preventDefault(); setSavingProfile(true)
    try {
      const fd = new FormData(); Object.entries(form).forEach(([k,v]) => { if(v != null) fd.append(k, v) })
      await citizenAPI.updateProfile(fd); toast.success('Profile updated'); setEditing(false)
      const r = await citizenAPI.getProfile(); setProfile(r.data.data); updateUser(r.data.data)
    } catch { toast.error('Update failed') } finally { setSavingProfile(false) }
  }
  const handlePwChange = async (e) => {
    e.preventDefault(); if(pwForm.new_password !== pwForm.confirm_password) { toast.error('Passwords do not match'); return }
    setSavingPw(true)
    try { await citizenAPI.changePassword({current_password:pwForm.current_password,new_password:pwForm.new_password}); toast.success('Password changed'); setPwForm({current_password:'',new_password:'',confirm_password:''}) }
    catch(err) { toast.error(err.response?.data?.message || 'Failed') } finally { setSavingPw(false) }
  }
  if (loading) return <LoadingSpinner />
  const FIELDS = [['First Name','first_name'],['Last Name','last_name'],['Mobile','mobile'],['Email','email'],['Occupation','occupation'],['Blood Group','blood_group']]
  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your personal information" actions={<button onClick={()=>setEditing(!editing)} className={editing?'btn-secondary text-sm py-2':'btn-primary text-sm py-2'}>{editing?'Cancel':'✏️ Edit'}</button>} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="w-16 h-16 bg-[#1a3a6b] rounded-full flex items-center justify-center text-white text-2xl font-bold">{profile?.first_name?.[0]}{profile?.last_name?.[0]}</div>
            <div><h2 className="font-bold text-slate-800 text-lg">{profile?.first_name} {profile?.last_name}</h2><p className="text-slate-500 text-sm">{profile?.email}</p></div>
          </div>
          {editing ? (
            <form onSubmit={handleSave}><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">{FIELDS.map(([l,k]) => (<div key={k}><label className="form-label">{l}</label><input className="form-input" value={form[k]||''} onChange={e=>setForm({...form,[k]:e.target.value})} /></div>))}</div><button type="submit" disabled={savingProfile} className="btn-primary">{savingProfile?'Saving...':'Save Changes'}</button></form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[['Full Name',`${profile?.first_name} ${profile?.last_name}`],['Gender',profile?.gender],['Date of Birth',profile?.dob],['Category',profile?.category],['Mobile',profile?.mobile],['Email',profile?.email],['Aadhaar',profile?.aadhaar_number],['District',profile?.district_name||'—']].map(([l,v]) => (
                <div key={l}><p className="text-xs text-slate-400 font-medium">{l}</p><p className="text-sm font-semibold text-slate-800 mt-0.5">{v}</p></div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4">Change Password</h3>
          <form onSubmit={handlePwChange} className="space-y-4">
            <div><label className="form-label">Current Password</label><input type="password" className="form-input" value={pwForm.current_password} onChange={e=>setPwForm({...pwForm,current_password:e.target.value})} placeholder="Current password" required /></div>
            <div><label className="form-label">New Password</label><input type="password" className="form-input" value={pwForm.new_password} onChange={e=>setPwForm({...pwForm,new_password:e.target.value})} placeholder="New password" required /></div>
            <div><label className="form-label">Confirm Password</label><input type="password" className="form-input" value={pwForm.confirm_password} onChange={e=>setPwForm({...pwForm,confirm_password:e.target.value})} placeholder="Confirm new password" required /></div>
            <button type="submit" disabled={savingPw} className="btn-primary w-full">{savingPw?'Changing...':'Change Password'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
