import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { employeeAPI } from '../../services/api'
import LoginCard from '../../components/common/LoginCard'
import toast from 'react-hot-toast'
import { FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa'

export default function EmployeeLogin() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await employeeAPI.login(form)
      login(data.data.user, data.data.token, 'employee')
      toast.success('Welcome to Government Employee Portal!')
      navigate('/employee/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please verify staff credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginCard
      title="Government Personnel & Verification Desk"
      subtitle="Karnataka State Employee Operations"
      badge="Staff Authentication"
      color="green"
      features={[
        { icon: '📋', title: 'Verify Applications', desc: 'Screen citizen document submissions' },
        { icon: '📊', title: 'Track Assignments', desc: 'Manage your active verification queue' },
        { icon: '💼', title: 'Pension Settlement', desc: 'Track retirement service claims' },
        { icon: '📈', title: 'Daily Output Ledger', desc: 'Monitor personal turnaround efficiency' }
      ]}
      otherLogins={[
        { to: '/citizen/login', label: '👤 Citizen' },
        { to: '/officer/login', label: '🏢 Dept. Officer' },
        { to: '/admin/login', label: '🔐 Admin' }
      ]}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
          Employee Staff Login
        </h2>
        <p className="text-slate-500 text-xs md:text-sm">
          Authorized personnel authentication for verification desks
        </p>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-5 text-emerald-800 text-xs">
        ℹ️ Please use your official <strong>Employee Username / Staff ID</strong> registered with your department administrative desk.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Employee Username / Staff ID
          </label>
          <input
            type="text"
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all font-mono"
            placeholder="e.g. employee1"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <span className="text-[11px] text-emerald-700 font-semibold hover:underline cursor-pointer">
              Contact Department Admin
            </span>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all pr-10"
              placeholder="Enter secure employee password"
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
            <input type="checkbox" className="accent-emerald-700 rounded" />
            <span>Keep session active</span>
          </label>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <FaShieldAlt className="text-emerald-700" /> Internal Intranet
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Authenticating Staff...
            </>
          ) : (
            '💼 Sign In to Verification Desk'
          )}
        </button>
      </form>
    </LoginCard>
  )
}
