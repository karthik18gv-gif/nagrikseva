import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { officerAPI } from '../../services/api'
import LoginCard from '../../components/common/LoginCard'
import toast from 'react-hot-toast'
import { FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa'

export default function OfficerLogin() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await officerAPI.login(form)
      login(data.data.user, data.data.token, 'officer')
      toast.success('Welcome, Gazetted Department Officer!')
      navigate('/officer/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Invalid officer credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginCard
      title="Gazetted Officer Approval & Adjudication"
      subtitle="Karnataka State Public Services Authority"
      badge="Gazetted Authority"
      color="orange"
      features={[
        { icon: '✅', title: 'Adjudicate Applications', desc: 'Grant official approvals for certificates' },
        { icon: '📂', title: 'Document Scrutiny', desc: 'Inspect verified citizen proofs & records' },
        { icon: '💼', title: 'Pension Sanctioning', desc: 'Authorize state pension settlement files' },
        { icon: '📊', title: 'Department Analytics', desc: 'Audit compliance with Sakala statutory limits' }
      ]}
      otherLogins={[
        { to: '/citizen/login', label: '👤 Citizen' },
        { to: '/employee/login', label: '💼 Govt. Employee' },
        { to: '/admin/login', label: '🔐 Admin' }
      ]}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
          Officer Portal Sign In
        </h2>
        <p className="text-slate-500 text-xs md:text-sm">
          Access restricted to gazetted department officers and competent authorities
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-amber-800 text-xs">
        ⚠️ Official notice: All approval transactions performed in this portal are cryptographically logged with officer credentials for statutory audit.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Officer Username / Officer ID
          </label>
          <input
            type="text"
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white transition-all font-mono"
            placeholder="e.g. officer1"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <span className="text-[11px] text-amber-700 font-semibold hover:underline cursor-pointer">
              Forgot Access?
            </span>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white transition-all pr-10"
              placeholder="Enter secure officer password"
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
            <input type="checkbox" className="accent-amber-600 rounded" />
            <span>Authorized terminal</span>
          </label>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <FaShieldAlt className="text-amber-600" /> Digital Signature Ready
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Verifying Authority...
            </>
          ) : (
            '🏢 Enter Officer Approval Suite'
          )}
        </button>
      </form>
    </LoginCard>
  )
}
