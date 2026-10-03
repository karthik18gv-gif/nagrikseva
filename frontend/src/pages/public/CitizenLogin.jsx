import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { citizenAPI } from '../../services/api'
import LoginCard from '../../components/common/LoginCard'
import toast from 'react-hot-toast'
import { FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa'

export default function CitizenLogin() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await citizenAPI.login(form)
      login(data.data.citizen, data.data.token, 'citizen')
      toast.success('Welcome back to NagrikSeva!')
      navigate('/citizen/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginCard
      title="Access Government Services Online"
      subtitle="Karnataka Citizen Digital Services Portal"
      badge="Citizen Access"
      color="blue"
      features={[
        { icon: '📄', title: 'Apply for Certificates', desc: 'Birth, Income, Caste, Domicile & more' },
        { icon: '🔍', title: 'Track Applications', desc: 'Real-time multi-stage status tracking' },
        { icon: '⬇️', title: 'Download Certificates', desc: 'Legally valid QR-coded digital documents' },
        { icon: '🔔', title: 'SMS & Portal Alerts', desc: 'Immediate statutory milestone updates' }
      ]}
      otherLogins={[
        { to: '/employee/login', label: '💼 Govt. Employee' },
        { to: '/officer/login', label: '🏢 Dept. Officer' },
        { to: '/admin/login', label: '🔐 Admin' }
      ]}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
          Citizen Sign In
        </h2>
        <p className="text-slate-500 text-xs md:text-sm">
          Access your personalized state citizen services dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Username / Aadhaar / Mobile
          </label>
          <input
            type="text"
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] focus:bg-white transition-all"
            placeholder="Enter username, 12-digit Aadhaar, or 10-digit mobile"
            value={form.username}
            onChange={e => setForm({ ...form, username: e.target.value })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <span className="text-[11px] text-[#1A3A6B] font-semibold hover:underline cursor-pointer">
              Forgot password?
            </span>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A3A6B] focus:bg-white transition-all pr-10"
              placeholder="Enter your account password"
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
            <input type="checkbox" className="accent-[#1A3A6B] rounded" />
            <span>Remember this browser</span>
          </label>
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <FaShieldAlt className="text-emerald-600" /> SSL Secured
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#1A3A6B] hover:bg-[#2457A6] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Authenticating Citizen...
            </>
          ) : (
            '🔐 Sign In to Citizen Portal'
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-slate-500">
        New citizen user on NagrikSeva?{' '}
        <Link to="/citizen/register" className="text-[#1A3A6B] font-bold hover:underline">
          Register new account →
        </Link>
      </div>
    </LoginCard>
  )
}
