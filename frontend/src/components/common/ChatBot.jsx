import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FaRobot, FaPaperPlane, FaTimes, FaRedo } from 'react-icons/fa'
import { publicAPI } from '../../services/api'

const WELCOME = {
  role: 'bot',
  text: '🙏 Namaste! I am **Seva Mitra**, your NagrikSeva AI assistant.\nAsk me about registration, certificates, documents, fees, pension or track an application.',
}
const START_CHIPS = ['How to register?', 'Documents for Income Certificate', 'Track my application', 'Pension help', 'Contact support']

// Offline fallback so the widget still feels alive if the API is unreachable
const offlineReply = (q) => {
  const t = q.toLowerCase()
  if (/regist|sign ?up/.test(t)) return 'Open [Citizen Registration](/citizen/register) and complete the 5 quick steps. Keep your **Aadhaar**, mobile and email ready.'
  if (/track|status/.test(t)) return 'Log in and open **Track Application**, or send me your application number once the server is back.'
  if (/contact|help|support/.test(t)) return 'Call our toll-free helpline **1800-425-0002** or visit the [Contact page](/contact).'
  return "I can't reach the server right now. 🔌 Please check that the backend is running, or call **1800-425-0002**."
}

// Tiny markdown: **bold**, [text](/link), newlines
function renderRich(text) {
  const out = []
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\((?:\/|https?:)[^)]+\))/g
  text.split('\n').forEach((line, li, arr) => {
    let last = 0, m, k = 0
    while ((m = re.exec(line))) {
      if (m.index > last) out.push(line.slice(last, m.index))
      const tok = m[0]
      if (tok.startsWith('**')) out.push(<b key={`${li}-${k++}`}>{tok.slice(2, -2)}</b>)
      else {
        const [, label, href] = tok.match(/\[([^\]]+)\]\(([^)]+)\)/)
        out.push(href.startsWith('/')
          ? <Link key={`${li}-${k++}`} to={href}>{label}</Link>
          : <a key={`${li}-${k++}`} href={href} target="_blank" rel="noreferrer">{label}</a>)
      }
      last = m.index + tok.length
    }
    if (last < line.length) out.push(line.slice(last))
    if (li < arr.length - 1) out.push(<br key={`br-${li}`} />)
  })
  return out
}

export default function ChatBot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME])
  const [chips, setChips] = useState(START_CHIPS)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [teaser, setTeaser] = useState(false)
  const [unread, setUnread] = useState(1)
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const { pathname } = useLocation()

  useEffect(() => { const t1 = setTimeout(() => setTeaser(true), 2500); const t2 = setTimeout(() => setTeaser(false), 11000); return () => { clearTimeout(t1); clearTimeout(t2) } }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, typing, open])
  useEffect(() => { if (open) { setUnread(0); setTeaser(false); setTimeout(() => inputRef.current?.focus(), 350) } }, [open])
  useEffect(() => { setOpen(false) }, [pathname])   // close on navigation (links inside chat navigate)

  const send = async (raw) => {
    const text = (raw ?? input).trim()
    if (!text || typing) return
    const history = messages.slice(-8)
    setMessages(m => [...m, { role: 'user', text }])
    setInput(''); setChips([]); setTyping(true)
    const started = Date.now()
    let reply, suggestions = []
    try {
      const { data } = await publicAPI.chat(text, history)
      reply = data?.data?.reply || 'Sorry, I did not get that.'
      suggestions = data?.data?.suggestions || []
    } catch { reply = offlineReply(text) }
    // small human-like delay so the typing animation is visible
    const wait = Math.max(0, 650 - (Date.now() - started))
    setTimeout(() => { setTyping(false); setMessages(m => [...m, { role: 'bot', text: reply }]); setChips(suggestions) }, wait)
  }

  const reset = () => { setMessages([WELCOME]); setChips(START_CHIPS); setInput('') }

  return (
    <>
      {!open && teaser && <div className="chat-teaser"><span className="wave">👋</span> Need help? Ask <b>Seva Mitra</b>!</div>}

      {open && (
        <div className="chat-window" role="dialog" aria-label="NagrikSeva AI assistant">
          <div className="chat-head">
            <div className="chat-avatar"><FaRobot /></div>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Seva Mitra</div>
              <div style={{ fontSize: 11, opacity: .8 }}>NagrikSeva AI Assistant • Online</div>
            </div>
            <button onClick={reset} title="New chat" aria-label="New chat" style={{ color: '#fff', opacity: .8, background: 'none', border: 0, cursor: 'pointer', marginRight: 10, position: 'relative' }}><FaRedo size={13} /></button>
            <button onClick={() => setOpen(false)} aria-label="Close chat" style={{ color: '#fff', background: 'none', border: 0, cursor: 'pointer', position: 'relative' }}><FaTimes size={17} /></button>
          </div>

          <div className="chat-body">
            {messages.map((m, i) => <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'bot'}`}>{renderRich(m.text)}</div>)}
            {typing && <div className="typing"><i /><i /><i /></div>}
            {!typing && chips.length > 0 && (
              <div className="quick-wrap">
                {chips.map((c, i) => <button key={c} className="quick" style={{ animationDelay: `${i * 70}ms` }} onClick={() => send(c)}>{c}</button>)}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form className="chat-input-row" onSubmit={e => { e.preventDefault(); send() }}>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} placeholder="Type your question…" maxLength={500} aria-label="Message" />
            <button type="submit" className="chat-send" disabled={!input.trim() || typing} aria-label="Send"><FaPaperPlane size={15} /></button>
          </form>
          <div className="chat-foot">AI can make mistakes. Never share passwords or OTP.</div>
        </div>
      )}

      <button className="chat-fab" onClick={() => setOpen(o => !o)} aria-label={open ? 'Close assistant' : 'Open AI assistant'}>
        {open ? <FaTimes /> : <FaRobot />}
        {!open && unread > 0 && <span className="fab-badge">{unread}</span>}
      </button>
    </>
  )
}
