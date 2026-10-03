import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { citizenAPI, publicAPI } from '../../services/api'
import { FaLandmark, FaArrowRight, FaArrowLeft, FaCheckCircle, FaShieldAlt, FaBolt, FaFileAlt } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Footer from '../../components/common/Footer'   // FIX: was used below but never imported -> blank page

const STEPS = ['Personal Info','Contact & Address','Identity Docs','Account Setup','Declaration']

const inputCls = 'reg-input w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a6b] focus:bg-white bg-slate-50'
const labelCls = 'block text-xs font-semibold text-slate-700 mb-1'
const Req = () => <span className="text-red-500">*</span>

export default function CitizenRegister() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [states, setStates] = useState([]); const [districts, setDistricts] = useState([]); const [taluks, setTaluks] = useState([])
  const [photo, setPhoto] = useState(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    first_name:'',middle_name:'',last_name:'',gender:'male',dob:'',father_name:'',mother_name:'',religion:'',category:'general',
    occupation:'',marital_status:'single',blood_group:'',mobile:'',alternate_mobile:'',email:'',
    emergency_contact:'',emergency_contact_number:'',house_number:'',street:'',area:'',village:'',
    taluk_id:'',district_id:'',state_id:'',pin_code:'',aadhaar_number:'',pan_number:'',voter_id:'',
    driving_license:'',passport_number:'',ration_card:'',username:'',password:'',confirm_password:'',
    security_question:'',security_answer:'', terms:false, declaration:false
  })

  useEffect(() => { publicAPI.getStates().then(r => setStates(r.data.data||[])).catch(()=>{}) }, [])

  // Single source of truth for updating any field — was previously called
  // inconsistently as both `updateForm` and the undefined `set`.
  const updateForm = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleStateChange = async (e) => {
    const sid = e.target.value
    updateForm('state_id', sid)
    updateForm('district_id', '')
    updateForm('taluk_id', '')
    setDistricts([]); setTaluks([])
    if (sid) {
      try { const r = await publicAPI.getDistrictsByState(sid); setDistricts(r.data.data||[]) }
      catch { toast.error('Could not load districts. Is the backend running?') }
    }
  }
  const handleDistrictChange = async (e) => {
    const did = e.target.value
    updateForm('district_id', did)
    updateForm('taluk_id', '')
    setTaluks([])
    if (did) {
      try { const r = await publicAPI.getTaluksByDistrict(did); setTaluks(r.data.data||[]) }
      catch { toast.error('Could not load taluks.') }
    }
  }

  // Per-step validation (mirrors backend rules) so users get instant feedback
  const validateStep = (i) => {
    const f = form
    if (i === 0) {
      if (!f.first_name.trim()) return 'First name is required'
      if (!f.last_name.trim()) return 'Last name is required'
      if (!f.dob) return 'Date of birth is required'
      if (new Date(f.dob) > new Date()) return 'Date of birth cannot be in the future'
    }
    if (i === 1) {
      if (!/^[6-9]\d{9}$/.test(f.mobile.trim())) return 'Enter a valid 10-digit Indian mobile number'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return 'Enter a valid email address'
      if (!f.state_id) return 'Please select your state'
      if (!f.district_id) return 'Please select your district'
      if (!/^\d{6}$/.test(f.pin_code.trim())) return 'PIN code must be 6 digits'
    }
    if (i === 2) {
      if (!/^\d{12}$/.test(f.aadhaar_number.replace(/\s+/g,''))) return 'Aadhaar must be exactly 12 digits'
    }
    if (i === 3) {
      if (!f.username.trim()) return 'Username is required'
      if (f.password.length < 8) return 'Password must be at least 8 characters'
      if (f.password !== f.confirm_password) return 'Passwords do not match'
      if (!f.security_question) return 'Select a security question'
      if (!f.security_answer.trim()) return 'Security answer is required'
    }
    return null
  }
  const goNext = () => {
    const err = validateStep(step)
    if (err) { toast.error(err); return }
    setStep(s => s + 1)
  }
  const fmtAadhaar = (v) => v.replace(/\D/g,'').slice(0,12).replace(/(\d{4})(?=\d)/g,'$1 ')

  const handleSubmit = async () => {
    for (let i = 0; i < 4; i++) {
      const err = validateStep(i)
      if (err) { toast.error(err); setStep(i); return }
    }
    if (!form.terms || !form.declaration) { toast.error('Please accept terms and declaration'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k,v]) => { if (!['confirm_password','terms','declaration'].includes(k)) fd.append(k,v) })
      if (photo) fd.append('photo', photo)
      const { data } = await citizenAPI.register(fd)
      if (data.success) {
        toast.success('Registration successful! Please login.')
        setSuccess(true)
        setTimeout(() => navigate('/citizen/login'), 2600)
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed') }
    finally { setLoading(false) }
  }

  // ---------------------------------------------------------------
  // IMPORTANT: these used to be defined as Step0()...Step4() function
  // components *inside* CitizenRegister's body. That meant a brand new
  // function (a new component type, as far as React is concerned) was
  // created on every render. Every keystroke triggers a re-render of
  // the parent, so React saw "a different component" each time and
  // unmounted + remounted the whole step's DOM — wiping input focus
  // after every single character.
  //
  // Fix: render the steps as plain JSX from one function (or move
  // them outside the component, as done below) so their identity
  // stays stable across renders and focus is preserved while typing.
  // ---------------------------------------------------------------
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelCls}>First Name <Req/></label><input className={inputCls} value={form.first_name} onChange={e=>updateForm('first_name',e.target.value)} required /></div>
            <div><label className={labelCls}>Middle Name</label><input className={inputCls} value={form.middle_name} onChange={e=>updateForm('middle_name',e.target.value)} /></div>
            <div><label className={labelCls}>Last Name <Req/></label><input className={inputCls} value={form.last_name} onChange={e=>updateForm('last_name',e.target.value)} required /></div>
            <div><label className={labelCls}>Gender <Req/></label><select className={inputCls} value={form.gender} onChange={e=>updateForm('gender',e.target.value)}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
            <div><label className={labelCls}>Date of Birth <Req/></label><input type="date" className={inputCls} value={form.dob} onChange={e=>updateForm('dob',e.target.value)} required /></div>
            <div><label className={labelCls}>Category <Req/></label><select className={inputCls} value={form.category} onChange={e=>updateForm('category',e.target.value)}><option value="general">General</option><option value="obc">OBC</option><option value="sc">SC</option><option value="st">ST</option><option value="other">Other</option></select></div>
            <div><label className={labelCls}>Father's Name</label><input className={inputCls} value={form.father_name} onChange={e=>updateForm('father_name',e.target.value)} /></div>
            <div><label className={labelCls}>Mother's Name</label><input className={inputCls} value={form.mother_name} onChange={e=>updateForm('mother_name',e.target.value)} /></div>
            <div><label className={labelCls}>Religion</label><select className={inputCls} value={form.religion} onChange={e=>updateForm('religion',e.target.value)}><option value="">Select</option><option>Hindu</option><option>Muslim</option><option>Christian</option><option>Sikh</option><option>Buddhist</option><option>Jain</option><option>Other</option></select></div>
            <div><label className={labelCls}>Occupation</label><input className={inputCls} value={form.occupation} onChange={e=>updateForm('occupation',e.target.value)} /></div>
            <div><label className={labelCls}>Marital Status</label><select className={inputCls} value={form.marital_status} onChange={e=>updateForm('marital_status',e.target.value)}><option value="single">Single</option><option value="married">Married</option><option value="divorced">Divorced</option><option value="widowed">Widowed</option></select></div>
            <div><label className={labelCls}>Blood Group</label><select className={inputCls} value={form.blood_group} onChange={e=>updateForm('blood_group',e.target.value)}><option value="">Select</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select></div>
            <div className="md:col-span-2"><label className={labelCls}>Citizen Photo</label><input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files[0])} className="w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#1a3a6b] file:text-white file:text-xs file:font-semibold cursor-pointer" /></div>
          </div>
        )
      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelCls}>Mobile Number <Req/></label><input className={inputCls} value={form.mobile} inputMode="numeric" maxLength={10} placeholder="10-digit mobile" onChange={e=>updateForm('mobile',e.target.value.replace(/\D/g,''))} required /></div>
            <div><label className={labelCls}>Alternate Mobile</label><input className={inputCls} value={form.alternate_mobile} onChange={e=>updateForm('alternate_mobile',e.target.value)} /></div>
            <div><label className={labelCls}>Email Address <Req/></label><input type="email" className={inputCls} value={form.email} onChange={e=>updateForm('email',e.target.value)} required /></div>
            <div><label className={labelCls}>Emergency Contact Name</label><input className={inputCls} value={form.emergency_contact} onChange={e=>updateForm('emergency_contact',e.target.value)} /></div>
            <div><label className={labelCls}>Emergency Contact Number</label><input className={inputCls} value={form.emergency_contact_number} onChange={e=>updateForm('emergency_contact_number',e.target.value)} /></div>
            <div className="md:col-span-2"><label className={labelCls}>House No. / Street</label><input className={inputCls} value={form.house_number} onChange={e=>updateForm('house_number',e.target.value)} /></div>
            <div><label className={labelCls}>Area / Locality</label><input className={inputCls} value={form.area} onChange={e=>updateForm('area',e.target.value)} /></div>
            <div><label className={labelCls}>Village / Town</label><input className={inputCls} value={form.village} onChange={e=>updateForm('village',e.target.value)} /></div>
            <div><label className={labelCls}>State <Req/></label><select className={inputCls} value={form.state_id} onChange={handleStateChange} required><option value="">Select State</option>{states.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div><label className={labelCls}>District <Req/></label><select className={inputCls} value={form.district_id} onChange={handleDistrictChange} required><option value="">Select District</option>{districts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div><label className={labelCls}>Taluk</label><select className={inputCls} value={form.taluk_id} onChange={e=>updateForm('taluk_id',e.target.value)}><option value="">Select Taluk</option>{taluks.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div><label className={labelCls}>PIN Code <Req/></label><input className={inputCls} value={form.pin_code} inputMode="numeric" onChange={e=>updateForm('pin_code',e.target.value.replace(/\D/g,''))} maxLength={6} required /></div>
          </div>
        )
      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelCls}>Aadhaar Number <Req/></label><input className={inputCls} value={form.aadhaar_number} inputMode="numeric" placeholder="XXXX XXXX XXXX" onChange={e=>updateForm('aadhaar_number',fmtAadhaar(e.target.value))} maxLength={14} required /></div>
            <div><label className={labelCls}>PAN Number</label><input className={inputCls} value={form.pan_number} onChange={e=>updateForm('pan_number',e.target.value)} /></div>
            <div><label className={labelCls}>Voter ID</label><input className={inputCls} value={form.voter_id} onChange={e=>updateForm('voter_id',e.target.value)} /></div>
            <div><label className={labelCls}>Driving License</label><input className={inputCls} value={form.driving_license} onChange={e=>updateForm('driving_license',e.target.value)} /></div>
            <div><label className={labelCls}>Passport Number</label><input className={inputCls} value={form.passport_number} onChange={e=>updateForm('passport_number',e.target.value)} /></div>
            <div><label className={labelCls}>Ration Card Number</label><input className={inputCls} value={form.ration_card} onChange={e=>updateForm('ration_card',e.target.value)} /></div>
            <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-xl p-4"><p className="text-blue-800 text-sm font-semibold mb-1">📌 Note</p><p className="text-blue-700 text-xs">Upload supporting documents when applying for specific certificates. Aadhaar is mandatory now.</p></div>
          </div>
        )
      case 3: {
        const getStrength = (p) => {
          if (!p) return { score: 0, label: '', bar: 'w-0 bg-slate-200' }
          let s = 0
          if (p.length >= 8) s++
          if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
          if (/[0-9]/.test(p)) s++
          if (/[^A-Za-z0-9]/.test(p)) s++
          if (s <= 1) return { score: 1, label: 'Weak (min 8 chars required)', bar: 'w-1/3 bg-red-500 text-red-600' }
          if (s <= 3) return { score: 2, label: 'Moderate', bar: 'w-2/3 bg-amber-500 text-amber-600' }
          return { score: 4, label: 'Strong password', bar: 'w-full bg-green-600 text-green-600' }
        }
        const strength = getStrength(form.password)
        const isMatch = form.confirm_password && form.password === form.confirm_password
        const isMismatch = form.confirm_password && form.password !== form.confirm_password

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Username <Req/></label>
              <input className={inputCls} placeholder="Choose a unique username" value={form.username} onChange={e=>updateForm('username',e.target.value)} required />
            </div>
            <div className="hidden md:block"></div>
            <div>
              <label className={labelCls}>Password <Req/></label>
              <input type="password" className={inputCls} placeholder="Min. 8 characters" value={form.password} onChange={e=>updateForm('password',e.target.value)} required />
              {form.password && (
                <div className="mt-1.5">
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${strength.bar.split(' ')[1]}`} style={{ width: strength.score === 1 ? '33%' : strength.score === 2 ? '66%' : '100%' }}></div>
                  </div>
                  <p className={`text-[11px] font-semibold mt-1 ${strength.bar.split(' ')[2]}`}>
                    Strength: {strength.label}
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Confirm Password <Req/></label>
              <input type="password" className={`${inputCls} ${isMismatch ? 'border-red-400 bg-red-50/50' : isMatch ? 'border-green-400 bg-green-50/50' : ''}`} placeholder="Re-enter password" value={form.confirm_password} onChange={e=>updateForm('confirm_password',e.target.value)} required />
              {isMatch && <p className="text-[11px] text-green-600 font-semibold mt-1">✓ Passwords match</p>}
              {isMismatch && <p className="text-[11px] text-red-500 font-semibold mt-1">✕ Passwords do not match</p>}
            </div>
            <div><label className={labelCls}>Security Question <Req/></label><select className={inputCls} value={form.security_question} onChange={e=>updateForm('security_question',e.target.value)} required><option value="">Select</option><option>What is your mother's maiden name?</option><option>What was the name of your first school?</option><option>What is your favourite city?</option><option>What is your pet's name?</option></select></div>
            <div><label className={labelCls}>Security Answer <Req/></label><input className={inputCls} value={form.security_answer} onChange={e=>updateForm('security_answer',e.target.value)} required /></div>
          </div>
        )
      }
      case 4:
        return (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
              <h3 className="font-bold text-slate-800 mb-3">Registration Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[['Full Name',`${form.first_name} ${form.last_name}`],['Gender',form.gender],['Mobile',form.mobile],['Email',form.email],['Aadhaar',form.aadhaar_number],['Username',form.username]].map(([l,v])=>(
                  <div key={l}><span className="text-slate-500 text-xs">{l}</span><div className="font-semibold text-slate-800">{v||'—'}</div></div>
                ))}
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <input type="checkbox" id="terms" checked={form.terms} onChange={e=>updateForm('terms',e.target.checked)} className="mt-0.5 accent-[#1a3a6b] w-4 h-4 flex-shrink-0" />
              <label htmlFor="terms" className="text-slate-700 text-sm cursor-pointer">I agree to the Terms & Conditions and Privacy Policy of NagrikSeva Portal.</label>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <input type="checkbox" id="declaration" checked={form.declaration} onChange={e=>updateForm('declaration',e.target.checked)} className="mt-0.5 accent-[#1a3a6b] w-4 h-4 flex-shrink-0" />
              <label htmlFor="declaration" className="text-slate-700 text-sm cursor-pointer">I declare all information provided is true and accurate. False information may lead to cancellation and legal action.</label>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB] relative overflow-hidden">
      {success && (
        <div className="reg-success-overlay">
          <div className="reg-success-card">
            <div className="reg-check"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" fill="none"/><path fill="none" d="M14 27l8 8 16-17"/></svg></div>
            <h2>Welcome to NagrikSeva!</h2>
            <p>Your account has been created. Redirecting you to sign in…</p>
            <div className="reg-confetti">{Array.from({length:28}).map((_,i)=><i key={i} style={{'--i':i}} />)}</div>
          </div>
        </div>
      )}
      <div className="aurora-bg" aria-hidden="true"><span className="orb orb-1"/><span className="orb orb-2"/><span className="orb orb-3"/></div>
      {/* Tricolor Ribbon */}
      <div className="h-1 flex w-full">
        <div className="flex-1 bg-[#FF9933]" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-[#128807]" />
      </div>

      {/* Top Gov Header */}
      <header className="glass-header border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0F2347] flex items-center justify-center text-white shadow-sm border border-slate-700">
            <FaLandmark className="text-amber-400 text-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-[#0F2347] text-base tracking-tight">NagrikSeva</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-[#1A3A6B] border border-blue-100">
                Citizen Registration
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Government of Karnataka • Digital Public Services</p>
          </div>
        </Link>
        <Link 
          to="/citizen/login" 
          className="text-xs text-[#1A3A6B] font-bold hover:underline px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Already have an account? Sign In
        </Link>
      </header>

      {/* Stepper Body */}
      <div className="flex-1 py-8 px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8 reg-rise">
            <h1 className="text-2xl md:text-4xl font-black mb-2 tracking-tight gradient-text">
              Create Citizen Portal Account
            </h1>
            <p className="text-slate-500 text-xs md:text-sm max-w-lg mx-auto">
              Register once to access 25+ government certificates, revenue records, and welfare schemes with single sign-on.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              {[[FaBolt,'2-minute signup'],[FaShieldAlt,'Bank-grade security'],[FaFileAlt,'25+ services']].map(([I,t],i)=>(
                <span key={t} className="reg-chip" style={{animationDelay:`${.15*i+.2}s`}}><I className="text-[#f4a200]"/> {t}</span>
              ))}
            </div>
          </div>

          {/* Stepper Bar */}
          <div className="glass-card rounded-2xl p-4 mb-6 overflow-x-auto scrollbar-thin reg-rise" style={{animationDelay:'.1s'}}>
            <div className="h-1.5 rounded-full bg-slate-100 mb-4 overflow-hidden"><div className="reg-progress" style={{width:`${((step+1)/STEPS.length)*100}%`}} /></div>
            <div className="flex items-center justify-between min-w-[500px]">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center flex-1 last:flex-none">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      i < step 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : i === step 
                          ? 'bg-[#1A3A6B] text-white shadow-md ring-4 ring-[#1A3A6B]/20 scale-105' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {i < step ? <FaCheckCircle className="text-sm" /> : i + 1}
                    </div>
                    <div className="hidden sm:block">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Step {i+1}</span>
                      <span className={`text-xs font-semibold whitespace-nowrap ${i === step ? 'text-[#1A3A6B]' : i < step ? 'text-slate-800' : 'text-slate-400'}`}>
                        {s}
                      </span>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-3 transition-colors duration-300 ${i < step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className="glass-card rounded-2xl p-6 md:p-8 reg-rise" style={{animationDelay:'.2s'}}>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-[#1A3A6B] uppercase tracking-wider">Step {step + 1} of {STEPS.length}</span>
                <h2 className="text-lg font-bold text-slate-800 mt-0.5">{STEPS[step]}</h2>
              </div>
              <span className="text-xs text-slate-400 font-medium">Fields with <span className="text-red-500">*</span> are mandatory</span>
            </div>

            <div key={step} className="step-enter">{renderStep()}</div>

            <div className="flex justify-between items-center mt-8 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-semibold text-xs disabled:opacity-30 hover:bg-slate-50 transition-colors"
              >
                <FaArrowLeft className="text-[10px]" /> Back
              </button>

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="btn-glow flex items-center gap-2 bg-[#1A3A6B] hover:bg-[#2457A6] text-white px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm"
                >
                  Next Step <FaArrowRight className="text-[10px]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-glow flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? 'Submitting Registration...' : '✅ Complete Registration'}
                </button>
              )}
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 mt-6">
            Protected by Karnataka State Cyber Security & Data Privacy Framework
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}