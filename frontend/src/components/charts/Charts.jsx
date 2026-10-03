/**
 * Charts.jsx — NagrikSeva analytics chart library
 * ------------------------------------------------------------------
 * 100% hand-written SVG + CSS. No chart library, no extra npm install.
 * Everything animates on mount and reacts to hover.
 *
 * Exports: ChartCard, StatCard, DonutChart, BarChart, AreaChart,
 *          HorizontalBars, RadialGauge, MiniSparkline, Legend
 * ------------------------------------------------------------------
 */
import { useEffect, useRef, useState } from 'react'

/* ------------------------------------------------------------------ */
/* Palette                                                             */
/* ------------------------------------------------------------------ */
export const PALETTE = [
  '#1a3a6b', '#f4a200', '#16a34a', '#dc2626', '#7c3aed',
  '#0891b2', '#db2777', '#ca8a04', '#0f766e', '#64748b',
]

const TONES = {
  blue:   { bg: 'from-[#1a3a6b] to-[#2d5490]', ring: 'ring-blue-200',   text: 'text-blue-700',   soft: 'bg-blue-50' },
  green:  { bg: 'from-emerald-600 to-emerald-500', ring: 'ring-emerald-200', text: 'text-emerald-700', soft: 'bg-emerald-50' },
  amber:  { bg: 'from-[#f4a200] to-[#f7b733]', ring: 'ring-amber-200',  text: 'text-amber-700',  soft: 'bg-amber-50' },
  red:    { bg: 'from-red-600 to-red-500',     ring: 'ring-red-200',    text: 'text-red-700',    soft: 'bg-red-50' },
  violet: { bg: 'from-violet-600 to-violet-500', ring: 'ring-violet-200', text: 'text-violet-700', soft: 'bg-violet-50' },
}

/* ------------------------------------------------------------------ */
/* Hook: reveal on scroll-into-view (drives the entry animations)      */
/* ------------------------------------------------------------------ */
function useReveal() {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } },
      { threshold: 0.15 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, shown]
}

/* Count-up number animation */
function useCountUp(target, shown, duration = 1100) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!shown) return
    const end = Number(target) || 0
    if (end === 0) { setVal(0); return }
    let raf, start
    const tick = (t) => {
      if (!start) start = t
      const p = Math.min((t - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(end * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, shown, duration])
  return val
}

const fmt = (v) => {
  const num = Number(v) || 0
  if (Math.abs(num) >= 10000000) return (num / 10000000).toFixed(2) + ' Cr'
  if (Math.abs(num) >= 100000) return (num / 100000).toFixed(2) + ' L'
  if (Math.abs(num) >= 1000) return (num / 1000).toFixed(1) + 'K'
  return Math.round(num).toLocaleString('en-IN')
}

/* ------------------------------------------------------------------ */
/* ChartCard — the frosted panel every chart sits in                   */
/* ------------------------------------------------------------------ */
export function ChartCard({ title, subtitle, icon, children, className = '', action }) {
  const [ref, shown] = useReveal()
  return (
    <div
      ref={ref}
      className={`chart-card group ${shown ? 'is-revealed' : ''} ${className}`}
    >
      <div className="flex items-start justify-between mb-5 gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {icon && (
            <div className="chart-card-icon">{icon}</div>
          )}
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight truncate">{title}</h3>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5 font-medium truncate">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* StatCard — KPI tile                                                 */
/* ------------------------------------------------------------------ */
export function StatCard({ label, value, sub, tone = 'blue', icon, prefix = '', delay = 0 }) {
  const [ref, shown] = useReveal()
  const animated = useCountUp(value, shown)
  const t = TONES[tone] || TONES.blue
  return (
    <div
      ref={ref}
      className={`stat-card ${shown ? 'is-revealed' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`stat-card-glow bg-gradient-to-br ${t.bg}`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-400">{label}</span>
          <div className={`stat-card-icon bg-gradient-to-br ${t.bg}`}>{icon || '📊'}</div>
        </div>
        <div className="text-[28px] leading-none font-black text-slate-800 tabular-nums">
          {prefix}{fmt(animated)}
        </div>
        {sub && <p className="text-[11px] text-slate-400 mt-2 font-medium">{sub}</p>}
      </div>
      <div className={`stat-card-bar bg-gradient-to-r ${t.bg}`} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* DonutChart — animated pie / donut with interactive legend           */
/* ------------------------------------------------------------------ */
export function DonutChart({ data = [], size = 200, thickness = 30, centerLabel = 'Total' }) {
  const [ref, shown] = useReveal()
  const [active, setActive] = useState(null)
  const items = (data || []).filter(d => Number(d.value) > 0)
  const total = items.reduce((s, d) => s + Number(d.value), 0)

  if (!total) return <EmptyChart label="No data to plot yet" />

  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let offset = 0

  const activeItem = active != null ? items[active] : null

  return (
    <div ref={ref} className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={thickness} />
          {items.map((d, i) => {
            const frac = Number(d.value) / total
            const len = c * frac
            const dash = shown ? `${len} ${c - len}` : `0 ${c}`
            const seg = (
              <circle
                key={i}
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={active === i ? thickness + 7 : thickness}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                className="donut-seg"
                style={{ transitionDelay: `${i * 110}ms`, opacity: active == null || active === i ? 1 : 0.32 }}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              />
            )
            offset += len
            return seg
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
          <span className="text-[26px] font-black text-slate-800 leading-none tabular-nums donut-center">
            {fmt(activeItem ? activeItem.value : total)}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1 leading-tight">
            {activeItem ? activeItem.label : centerLabel}
          </span>
          {activeItem && (
            <span className="text-[11px] font-bold text-[#1a3a6b] mt-0.5">
              {((activeItem.value / total) * 100).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 w-full space-y-1.5 max-h-[220px] overflow-y-auto pr-1 nice-scroll">
        {items.map((d, i) => (
          <div
            key={i}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className={`legend-row ${active === i ? 'is-active' : ''}`}
            style={{ transitionDelay: `${i * 45}ms` }}
          >
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0 legend-dot"
                  style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="text-[11px] font-semibold text-slate-600 flex-1 truncate">{d.label}</span>
            <span className="text-[11px] font-black text-slate-800 tabular-nums">{fmt(d.value)}</span>
            <span className="text-[10px] font-bold text-slate-400 w-10 text-right tabular-nums">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* BarChart — grouped vertical bars                                    */
/* ------------------------------------------------------------------ */
export function BarChart({ data = [], keys = [{ key: 'total', label: 'Total', color: '#1a3a6b' }], labelKey = 'name', height = 230 }) {
  const [ref, shown] = useReveal()
  const [hover, setHover] = useState(null)
  const rows = data || []
  if (!rows.length) return <EmptyChart label="No data to plot yet" />

  const max = Math.max(1, ...rows.flatMap(r => keys.map(k => Number(r[k.key]) || 0)))
  const ticks = 4

  return (
    <div ref={ref}>
      <div className="flex gap-4 mb-4 flex-wrap">
        {keys.map(k => (
          <div key={k.key} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: k.color }} />
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{k.label}</span>
          </div>
        ))}
      </div>

      <div className="relative" style={{ height }}>
        {/* grid lines */}
        {Array.from({ length: ticks + 1 }).map((_, i) => (
          <div key={i} className="absolute left-0 right-0 flex items-center gap-2"
               style={{ bottom: `${(i / ticks) * 100}%` }}>
            <span className="text-[9px] text-slate-300 font-bold w-7 text-right tabular-nums">
              {fmt((max * i) / ticks)}
            </span>
            <div className="flex-1 border-t border-dashed border-slate-100" />
          </div>
        ))}

        {/* bars */}
        <div className="absolute inset-0 pl-9 flex items-end justify-around gap-2">
          {rows.map((row, ri) => (
            <div
              key={ri}
              className="flex-1 flex items-end justify-center gap-[3px] h-full relative group/bar"
              onMouseEnter={() => setHover(ri)}
              onMouseLeave={() => setHover(null)}
            >
              {keys.map((k, ki) => {
                const v = Number(row[k.key]) || 0
                const pct = (v / max) * 100
                return (
                  <div
                    key={k.key}
                    className="bar-col"
                    style={{
                      background: `linear-gradient(180deg, ${k.color}, ${k.color}bb)`,
                      height: shown ? `${Math.max(pct, v > 0 ? 2 : 0)}%` : '0%',
                      transitionDelay: `${ri * 70 + ki * 45}ms`,
                      opacity: hover == null || hover === ri ? 1 : 0.35,
                    }}
                  />
                )
              })}
              {hover === ri && (
                <div className="bar-tooltip">
                  <div className="font-black mb-1 text-[11px]">{row[labelKey]}</div>
                  {keys.map(k => (
                    <div key={k.key} className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: k.color }} />
                      <span className="opacity-70">{k.label}:</span>
                      <span className="font-bold">{fmt(row[k.key])}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* x labels */}
      <div className="pl-9 flex justify-around gap-2 mt-2">
        {rows.map((row, ri) => (
          <div key={ri} className="flex-1 text-center">
            <span className={`text-[9px] font-bold leading-tight block truncate transition-colors ${hover === ri ? 'text-[#1a3a6b]' : 'text-slate-400'}`}
                  title={row[labelKey]}>
              {String(row[labelKey] || '').length > 12 ? String(row[labelKey]).slice(0, 11) + '…' : row[labelKey]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* AreaChart — smooth animated line + gradient fill                    */
/* ------------------------------------------------------------------ */
export function AreaChart({ data = [], series = [{ key: 'total', label: 'Total', color: '#1a3a6b' }], labelKey = 'label', height = 240 }) {
  const [ref, shown] = useReveal()
  const [hover, setHover] = useState(null)
  const rows = data || []
  if (rows.length < 1) return <EmptyChart label="No trend data yet" />

  const W = 640, H = height, PAD = { t: 16, r: 14, b: 26, l: 34 }
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b
  const max = Math.max(1, ...rows.flatMap(r => series.map(s => Number(r[s.key]) || 0)))
  const stepX = rows.length > 1 ? iw / (rows.length - 1) : 0
  const px = i => PAD.l + i * stepX + (rows.length === 1 ? iw / 2 : 0)
  const py = v => PAD.t + ih - ((Number(v) || 0) / max) * ih

  const buildPath = (key) => rows.map((r, i) => `${i === 0 ? 'M' : 'L'} ${px(i).toFixed(1)} ${py(r[key]).toFixed(1)}`).join(' ')
  const buildArea = (key) =>
    `${buildPath(key)} L ${px(rows.length - 1).toFixed(1)} ${(PAD.t + ih).toFixed(1)} L ${px(0).toFixed(1)} ${(PAD.t + ih).toFixed(1)} Z`

  return (
    <div ref={ref}>
      <div className="flex gap-4 mb-3 flex-wrap">
        {series.map(s => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="w-4 h-[3px] rounded-full" style={{ background: s.color }} />
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="relative w-full">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none"
             onMouseLeave={() => setHover(null)}>
          <defs>
            {series.map(s => (
              <linearGradient key={s.key} id={`grad-${s.key}-${s.color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.34" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
              </linearGradient>
            ))}
          </defs>

          {/* grid */}
          {[0, 1, 2, 3, 4].map(i => {
            const y = PAD.t + (ih * i) / 4
            return (
              <g key={i}>
                <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <text x={PAD.l - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#cbd5e1" fontWeight="700">
                  {fmt((max * (4 - i)) / 4)}
                </text>
              </g>
            )
          })}

          {series.map((s, si) => (
            <g key={s.key}>
              <path d={buildArea(s.key)} fill={`url(#grad-${s.key}-${s.color.replace('#', '')})`}
                    className="area-fill" style={{ opacity: shown ? 1 : 0, transitionDelay: `${350 + si * 120}ms` }} />
              <path d={buildPath(s.key)} fill="none" stroke={s.color} strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    className={`area-line ${shown ? 'is-drawn' : ''}`}
                    style={{ transitionDelay: `${si * 160}ms` }} />
              {rows.map((r, i) => (
                <circle key={i} cx={px(i)} cy={py(r[s.key])} r={hover === i ? 5 : 3}
                        fill="#fff" stroke={s.color} strokeWidth="2.5"
                        className="area-dot"
                        style={{ opacity: shown ? 1 : 0, transitionDelay: `${600 + i * 40}ms` }} />
              ))}
            </g>
          ))}

          {/* hover hit-zones */}
          {rows.map((r, i) => (
            <rect key={i} x={px(i) - stepX / 2} y={PAD.t} width={stepX || iw} height={ih}
                  fill="transparent" onMouseEnter={() => setHover(i)} style={{ cursor: 'crosshair' }} />
          ))}
          {hover != null && (
            <line x1={px(hover)} y1={PAD.t} x2={px(hover)} y2={PAD.t + ih}
                  stroke="#1a3a6b" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
          )}
        </svg>

        {hover != null && (
          <div className="area-tooltip" style={{ left: `${(px(hover) / W) * 100}%` }}>
            <div className="font-black text-[11px] mb-1">{rows[hover][labelKey]}</div>
            {series.map(s => (
              <div key={s.key} className="flex items-center gap-1.5 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                <span className="opacity-70">{s.label}:</span>
                <span className="font-bold">{fmt(rows[hover][s.key])}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-1 px-1">
        {rows.map((r, i) => (
          <span key={i} className={`text-[9px] font-bold transition-colors ${hover === i ? 'text-[#1a3a6b]' : 'text-slate-400'}`}>
            {r[labelKey]}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* HorizontalBars — ranked list with animated fill                     */
/* ------------------------------------------------------------------ */
export function HorizontalBars({ data = [], labelKey = 'name', valueKey = 'total', secondKey = null, secondLabel = 'Completed', colorful = true }) {
  const [ref, shown] = useReveal()
  const rows = (data || []).filter(r => Number(r[valueKey]) >= 0)
  if (!rows.length) return <EmptyChart label="No records available" />
  const max = Math.max(1, ...rows.map(r => Number(r[valueKey]) || 0))

  return (
    <div ref={ref} className="space-y-3.5">
      {rows.map((r, i) => {
        const v = Number(r[valueKey]) || 0
        const s = secondKey ? Number(r[secondKey]) || 0 : 0
        const color = colorful ? PALETTE[i % PALETTE.length] : '#1a3a6b'
        return (
          <div key={i} className="hbar-row">
            <div className="flex justify-between items-baseline mb-1.5 gap-2">
              <span className="text-[11px] font-bold text-slate-700 truncate flex items-center gap-2">
                <span className="hbar-rank" style={{ background: color }}>{i + 1}</span>
                {r[labelKey]}
              </span>
              <span className="text-[11px] font-black text-slate-800 tabular-nums flex-shrink-0">
                {fmt(v)}
                {secondKey && <span className="text-slate-400 font-semibold"> · {fmt(s)} {secondLabel.toLowerCase()}</span>}
              </span>
            </div>
            <div className="hbar-track">
              <div className="hbar-fill"
                   style={{
                     width: shown ? `${(v / max) * 100}%` : '0%',
                     background: `linear-gradient(90deg, ${color}, ${color}aa)`,
                     transitionDelay: `${i * 85}ms`,
                   }} />
              {secondKey && (
                <div className="hbar-fill-inner"
                     style={{ width: shown ? `${(s / max) * 100}%` : '0%', transitionDelay: `${i * 85 + 200}ms` }} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* RadialGauge — single percentage ring                                */
/* ------------------------------------------------------------------ */
export function RadialGauge({ value = 0, max = 100, label = '', suffix = '%', color = '#16a34a', size = 150 }) {
  const [ref, shown] = useReveal()
  const animated = useCountUp(value, shown)
  const pct = Math.min(Math.max((Number(value) || 0) / (max || 1), 0), 1)
  const r = size / 2 - 14
  const c = 2 * Math.PI * r

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="12" />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={shown ? c * (1 - pct) : c}
            className="gauge-ring"
            style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-800 tabular-nums">
            {animated.toFixed(animated % 1 === 0 ? 0 : 1)}<span className="text-sm">{suffix}</span>
          </span>
        </div>
      </div>
      {label && <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2 text-center">{label}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* MiniSparkline                                                       */
/* ------------------------------------------------------------------ */
export function MiniSparkline({ data = [], valueKey = 'total', color = '#1a3a6b', height = 42 }) {
  const rows = data || []
  if (rows.length < 2) return null
  const W = 120, H = height
  const max = Math.max(1, ...rows.map(r => Number(r[valueKey]) || 0))
  const pts = rows.map((r, i) => `${(i / (rows.length - 1)) * W},${H - ((Number(r[valueKey]) || 0) / max) * (H - 4) - 2}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="spark-line" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Empty state                                                         */
/* ------------------------------------------------------------------ */
export function EmptyChart({ label = 'No data available' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-3xl mb-2 empty-float">📉</div>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="text-[10px] text-slate-300 mt-1">Charts will populate once records exist</p>
    </div>
  )
}

export { fmt as formatNumber }
