/**
 * NagrikSeva AI Assistant — "Seva Mitra"
 *
 * Two modes (automatic):
 *  1. SMART MODE  – if ANTHROPIC_API_KEY is set in .env, questions are answered by Claude,
 *                   grounded in live data from your database (certificates, fees, FAQs).
 *  2. BUILT-IN    – no key needed. A fast intent engine answers from the same database
 *                   (documents, fees, processing time, FAQs, application tracking, how-tos).
 *
 * Privacy: only public data is used. Application tracking returns status only (no personal data).
 */
const { pool } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const HELPLINE = '1800-425-0002';
const DEFAULT_SUGGESTIONS = ['How to register?', 'Documents for Income Certificate', 'Track my application', 'Pension help', 'Contact support'];

const norm = (s = '') => s.toLowerCase().replace(/[^a-z0-9\u0900-\u097f\u0c80-\u0cff\s]/g, ' ').replace(/\s+/g, ' ').trim();
const has = (t, words) => words.some(w => t.includes(w));

let cache = { at: 0, certs: [], faqs: [] };
async function loadKnowledge() {
  if (Date.now() - cache.at < 60 * 1000 && cache.certs.length) return cache;
  try {
    const [certs] = await pool.execute(
      `SELECT ct.name, ct.code, ct.description, ct.processing_days, ct.required_documents, ct.eligibility, ct.fee, d.name AS department
       FROM certificate_types ct JOIN departments d ON ct.department_id = d.id WHERE ct.is_active = 1 ORDER BY ct.name`);
    const [faqs] = await pool.execute('SELECT question, answer FROM faqs WHERE is_active = 1 ORDER BY sort_order');
    cache = { at: Date.now(), certs, faqs };
  } catch (e) { /* DB hiccup: keep whatever we have */ }
  return cache;
}
const parseDocs = (v) => { try { const a = typeof v === 'string' ? JSON.parse(v) : v; return Array.isArray(a) ? a : []; } catch { return []; } };

function findCertificate(t, certs) {
  let best = null, score = 0;
  for (const c of certs) {
    const name = norm(c.name).replace(/certificate|certificates/g, '').trim();
    const tokens = name.split(' ').filter(w => w.length > 2);
    let s = t.includes(name) && name ? 10 : 0;
    s += tokens.filter(w => t.includes(w)).length * 2;
    if (t.includes(norm(c.code))) s += 8;
    if (s > score) { score = s; best = c; }
  }
  return score >= 2 ? best : null;
}

async function trackApplication(num) {
  const [rows] = await pool.execute(
    `SELECT a.application_number, a.status, a.submitted_at, a.completed_at, ct.name AS certificate_name
     FROM applications a JOIN certificate_types ct ON a.certificate_type_id = ct.id WHERE a.application_number = ?`, [num]);
  if (rows.length) {
    const a = rows[0];
    const steps = { submitted: 'received and waiting for an employee to verify it', under_verification: 'being verified by an employee', verified: 'verified and waiting for the officer',
      under_review: 'under review by the officer', approved: 'approved — your certificate is being generated', completed: 'completed ✅ — you can download it from My Applications',
      rejected: 'rejected ❌ — open the application to see the reason', returned: 'returned for corrections — please update and resubmit', cancelled: 'cancelled', draft: 'saved as draft' };
    return `**${a.application_number}** — ${a.certificate_name}\nStatus: **${(a.status || '').replace(/_/g, ' ')}**\nYour application is ${steps[a.status] || a.status}.\n\nFor full details, log in and open **Track Application**.`;
  }
  const [p] = await pool.execute('SELECT application_number, status FROM pension_applications WHERE application_number = ?', [num]);
  if (p.length) return `Pension application **${p[0].application_number}** is currently **${p[0].status.replace(/_/g, ' ')}**.`;
  return null;
}

async function builtInReply(message) {
  const t = norm(message);
  const { certs, faqs } = await loadKnowledge();

  // 1. Application / pension number tracking
  const m = message.match(/\b(NS\d{10,14}|PEN\d{8,14})\b/i);
  if (m) {
    const r = await trackApplication(m[1].toUpperCase());
    return { reply: r || `I couldn't find an application with number **${m[1].toUpperCase()}**. Please double-check it (format like NS202609301234).`, suggestions: ['Track another application', 'Contact support'] };
  }

  if (!t) return { reply: 'Please type your question and I will help! 🙂', suggestions: DEFAULT_SUGGESTIONS };

  if (has(t, ['hi', 'hello', 'hey', 'namaste', 'namaskara', 'good morning', 'good evening']) && t.split(' ').length <= 4)
    return { reply: '🙏 Namaste! I am **Seva Mitra**, your NagrikSeva assistant.\nI can help with registration, certificates, documents, fees, application status and pension. What would you like to know?', suggestions: DEFAULT_SUGGESTIONS };

  if (has(t, ['thank', 'thanks', 'dhanyavad', 'shukriya']))
    return { reply: "You're most welcome! 😊 Anything else I can help with?", suggestions: DEFAULT_SUGGESTIONS };

  if (has(t, ['bye', 'goodbye']))
    return { reply: 'Goodbye! Have a great day. 🙏', suggestions: [] };

  // 2. Registration / login
  if (has(t, ['register', 'registration', 'sign up', 'signup', 'create account', 'new account']))
    return { reply: '📝 **How to register**\n1. Open [Citizen Registration](/citizen/register)\n2. Fill 5 quick steps: Personal info → Contact & address → Identity (Aadhaar) → Account setup → Declaration\n3. Submit, then sign in with your username & password.\n\nKeep your **Aadhaar number** and a valid **mobile & email** ready.', suggestions: ['Documents needed?', 'I forgot my password', 'Is it free?'] };

  if (has(t, ['forgot', 'reset password', 'cant login', "can't login", 'unable to login', 'login problem', 'password']))
    return { reply: '🔐 **Login help**\n• Use the [Citizen Login](/citizen/login) page with your username and password.\n• Passwords are case-sensitive and need at least 8 characters.\n• If you cannot sign in, raise a ticket in **Support** after logging in, or call **' + HELPLINE + '**.', suggestions: ['Contact support', 'How to register?'] };

  if (has(t, ['login', 'log in', 'sign in']))
    return { reply: 'Choose your portal:\n• [Citizen Login](/citizen/login)\n• [Employee Login](/employee/login)\n• [Officer Login](/officer/login)\n• [Admin Login](/admin/login)', suggestions: ['How to register?'] };

  // 3. Specific certificate questions
  const cert = findCertificate(t, certs);
  if (cert && has(t, ['document', 'documents', 'required', 'need', 'papers', 'proof', 'fee', 'fees', 'cost', 'charge', 'price', 'time', 'days', 'long', 'eligib', 'apply', 'how', 'what', 'about', 'detail'])) {
    const docs = parseDocs(cert.required_documents);
    const fee = Number(cert.fee) > 0 ? `₹${Number(cert.fee)}` : 'Free';
    let r = `📄 **${cert.name}**\nDepartment: ${cert.department}\n`;
    if (cert.description) r += `${cert.description}\n`;
    r += `\n⏱ Processing time: **${cert.processing_days} days**\n💰 Fee: **${fee}**\n`;
    if (docs.length) r += `\n📎 Required documents:\n${docs.map(d => '• ' + d).join('\n')}\n`;
    if (cert.eligibility) r += `\n✅ Eligibility: ${cert.eligibility}\n`;
    r += '\nReady? [Apply from your dashboard](/citizen/apply).';
    return { reply: r, suggestions: ['Track my application', 'List all certificates', 'How to register?'] };
  }

  if (has(t, ['all certificate', 'list certificate', 'which certificate', 'what certificate', 'services', 'service available', 'certificates available', 'list all']))
    return { reply: certs.length ? `📚 **Available certificates (${certs.length})**\n` + certs.slice(0, 20).map(c => `• ${c.name} — ${c.processing_days} days`).join('\n') + '\n\nAsk me about any of them for documents & fees!' : 'Browse all services on the [Services page](/services).', suggestions: ['Documents for Income Certificate', 'Birth certificate', 'Caste certificate'] };

  if (has(t, ['processing time', 'how long', 'how many days', 'timeline', 'when will']))
    return { reply: '⏱ Processing time depends on the certificate:\n' + (certs.slice(0, 8).map(c => `• ${c.name}: ${c.processing_days} days`).join('\n') || '• Birth: 3 days\n• Income/Domicile: 7 days\n• Caste: 10 days') + '\n\nTrack live status anytime from **Track Application**.', suggestions: ['Track my application'] };

  if (has(t, ['fee', 'fees', 'cost', 'charge', 'free', 'price', 'payment']))
    return { reply: certs.length ? '💰 **Fees**\n' + certs.slice(0, 8).map(c => `• ${c.name}: ${Number(c.fee) > 0 ? '₹' + Number(c.fee) : 'Free'}`).join('\n') : 'Most government certificate services on NagrikSeva are free of cost.', suggestions: ['List all certificates'] };

  if (has(t, ['document', 'documents', 'papers', 'required', 'upload']))
    return { reply: '📎 Documents depend on the certificate. Tell me which one (e.g. *Income Certificate*, *Birth Certificate*) and I will list exactly what you need.\n\nCommon to most: **Aadhaar card**, address proof, and a passport photo. Uploads: PDF/JPG/PNG.', suggestions: ['Documents for Income Certificate', 'Birth certificate documents', 'Caste certificate documents'] };

  // 4. Tracking / status / download
  if (has(t, ['track', 'status', 'where is my', 'application status']))
    return { reply: '🔎 **Track your application**\nSend me your application number (like **NS202609301234**) and I will fetch the status right now.\n\nOr log in → **Track Application**.', suggestions: ['How to download certificate?'] };

  if (has(t, ['download', 'get my certificate', 'print certificate']))
    return { reply: '⬇️ **Download certificate**\nLogin → **My Applications** → find the approved/completed application → click **Download Certificate**. Each certificate has a unique certificate number you can verify on the Verify Certificate page.', suggestions: ['Verify a certificate'] };

  if (has(t, ['verify', 'authentic', 'genuine', 'fake', 'validate']))
    return { reply: '✅ You can verify any certificate on the [Verify Certificate](/verify-certificate) page using its certificate or application number — no login needed.', suggestions: ['Track my application'] };

  if (has(t, ['rejected', 'reject', 'returned', 'resubmit', 'correction']))
    return { reply: 'If an application is **returned**, open it from My Applications, read the remarks, fix the issue and press **Resubmit**. If **rejected**, the reason is shown on the application — you may apply again with correct documents.', suggestions: ['Contact support'] };

  // 5. Pension
  if (has(t, ['pension', 'retire', 'retirement']))
    return { reply: '👴 **Pension**\nPension is applied for by government **employees** from their portal (Employee → Pension). Flow: Employee submits → Officer approves → Admin issues the pension letter. You can download the letter once approved.\n\nLogin at [Employee Login](/employee/login).', suggestions: ['Contact support'] };

  // 6. Contact
  if (has(t, ['contact', 'helpline', 'support', 'phone', 'call', 'email', 'complaint', 'help desk', 'human', 'agent', 'office']))
    return { reply: `📞 **Contact NagrikSeva**\nToll-free helpline: **${HELPLINE}**\nRaise a ticket after login via **Support**, or visit the [Contact page](/contact).`, suggestions: ['How to register?', 'Track my application'] };

  // 7. FAQ fuzzy match from database
  const words = t.split(' ').filter(w => w.length > 3);
  let bestFaq = null, bestScore = 0;
  for (const f of faqs) {
    const q = norm(f.question + ' ' + f.answer);
    const sc = words.filter(w => q.includes(w)).length;
    if (sc > bestScore) { bestScore = sc; bestFaq = f; }
  }
  if (bestFaq && bestScore >= 2) return { reply: `💡 **${bestFaq.question}**\n${bestFaq.answer}`, suggestions: DEFAULT_SUGGESTIONS.slice(0, 3) };

  return { reply: `Hmm, I'm not fully sure about that yet. 🤔 Try asking about **registration, certificates, documents, fees, tracking** or **pension** — or call **${HELPLINE}**.`, suggestions: DEFAULT_SUGGESTIONS };
}

async function claudeReply(message, history) {
  const { certs, faqs } = await loadKnowledge();
  const kb = certs.map(c => `- ${c.name} (${c.department}): ${c.processing_days} days, fee ${Number(c.fee) > 0 ? '₹' + Number(c.fee) : 'free'}, docs: ${parseDocs(c.required_documents).join(', ') || 'see portal'}`).join('\n');
  const faqText = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n');
  const system = `You are "Seva Mitra", the friendly assistant of NagrikSeva, a Government of Karnataka citizen-services portal.
Answer briefly (max ~120 words), warmly, in the user's language (English/Hindi/Kannada). Use only the facts below; if unsure, say so and give helpline ${HELPLINE}.
Never ask for passwords/OTP/full Aadhaar. Useful links: /citizen/register, /citizen/login, /services, /verify-certificate, /contact.
CERTIFICATES:\n${kb}\nFAQS:\n${faqText}`;
  const msgs = [...(history || []).slice(-8).map(h => ({ role: h.role === 'user' ? 'user' : 'assistant', content: String(h.text || '').slice(0, 800) })), { role: 'user', content: message }];
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.CHATBOT_MODEL || 'claude-sonnet-5-5', max_tokens: 400, system, messages: msgs }),
  });
  if (!resp.ok) throw new Error('LLM ' + resp.status);
  const data = await resp.json();
  return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
}

exports.chat = async (req, res) => {
  try {
    const message = String(req.body.message || '').slice(0, 500).trim();
    const history = Array.isArray(req.body.history) ? req.body.history : [];
    if (!message) return errorResponse(res, 'Message is required', 400);

    // Application numbers & tracking always use the built-in engine (exact DB lookup)
    const isTracking = /\b(NS\d{10,14}|PEN\d{8,14})\b/i.test(message);
    if (process.env.ANTHROPIC_API_KEY && !isTracking) {
      try { const reply = await claudeReply(message, history); if (reply) return successResponse(res, { reply, suggestions: [], mode: 'ai' }); }
      catch (e) { /* fall through to built-in */ }
    }
    const out = await builtInReply(message);
    return successResponse(res, { ...out, mode: 'builtin' });
  } catch (e) { return errorResponse(res, 'Assistant is unavailable right now.'); }
};
