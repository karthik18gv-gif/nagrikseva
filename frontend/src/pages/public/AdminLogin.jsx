import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { adminAPI } from '../../services/api'
import LoginCard from '../../components/common/LoginCard'
import toast from 'react-hot-toast'
import { FaEye, FaEyeSlash, FaShieldAlt, FaKey, FaServer, FaUserShield } from 'react-icons/fa'

export default function AdminLogin() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await adminAPI.login(form)
      login(data.data.user, data.data.token, 'admin')
      toast.success('Administrator Access Granted.')
      navigate('/admin/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication rejected. Administrative security alert logged.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginCard
      title="State Secretariat Master Control Suite"
      subtitle="NagrikSeva Administrative Operations"
      badge="Root Governance"
      color="dark"
      features={[
        { icon: '👥', title: 'Personnel & Citizen RBAC', desc: 'Manage departments, officers & citizens' },
        { icon: '🏛️', title: 'Department Infrastructure', desc: 'Configure services, SLAs & statutory rules' },
        { icon: '📊', title: 'Statewide Visual Analytics', desc: 'Real-time performance across Karnataka' },
        { icon: '🛡️', title: 'Security Audit & Compliance', desc: 'Tamper-evident logs & forensic tracking' }
      ]}
      otherLogins={[
        { to: '/citizen/login', label: '👤 Citizen' },
        { to: '/employee/login', label: '💼 Govt. Employee' },
        { to: '/officer/login', label: '🏢 Dept. Officer' }
      ]}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
          Super Admin Console
        </h2>
        <p className="text-slate-500 text-xs md:text-sm">
          High-privilege console for state system administrators
        </p>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-5">
        <div className="bg-slate-100/80 rounded-xl p-2 text-center text-[10px] font-bold text-slate-700 flex flex-col items-center gap-1">
          <FaKey className="text-slate-500" />
          <span>256-bit AES</span>
        </div>
        <div className="bg-slate-100/80 rounded-xl p-2 text-center text-[10px] font-bold text-slate-700 flex flex-col items-center gap-1">
          <FaUserShield className="text-slate-500" />
          <span>RBAC Guard</span>
        </div>
        <div className="bg-slate-100/80 rounded-xl p-2 text-center text-[10px] font-bold text-slate-700 flex flex-col items-center gap-1">
          <FaServer className="text-slate-500" />
          <span>State DC</span>
        </div>
        <div className="bg-slate-100/80 rounded-xl p-2 text-center text-[10px] font-bold text-slate-700 flex flex-col items-center gap-1">
          <FaShieldAlt className="text-slate-500" />
          <span>Audit Logged</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Admin Master Username
          </label>
          <input
            type="text"
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all font-mono"
            placeholder="e.g. admin"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Master Password
            </label>
            <span className="text-[11px] text-slate-500 font-semibold hover:underline cursor-pointer">
              Hardware Token
            </span>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all pr-10"
              placeholder="Enter master password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
            <input type="checkbox" className="accent-slate-900 rounded" />
            <span>Secure workstation</span>
          </label>
          <span className="text-[11px] text-rose-600 font-medium">
            IP Monitored
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#0F2347] hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Establishing Secure Tunnel...
            </>
          ) : (
            '🔐 Authenticate & Enter Secretariat Console'
          )}
        </button>
      </form>

      <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 leading-relaxed text-center">
        Restricted to Government of Karnataka Secretariat Admins. Unauthorized access attempts violate Section 43 of the IT Act.
      </div>
    </LoginCard>
  )
}
