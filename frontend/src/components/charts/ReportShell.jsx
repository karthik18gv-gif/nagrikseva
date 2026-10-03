/**
 * ReportShell.jsx
 * Shared chrome for every role's Reports page: gradient hero header,
 * KPI strip, print / CSV export actions, and the standard chart grid.
 */
import { StatCard, ChartCard, DonutChart, AreaChart, BarChart, HorizontalBars } from './Charts'
import { FaPrint, FaFileCsv, FaSyncAlt } from 'react-icons/fa'

const TONE_CYCLE = ['blue', 'green', 'amber', 'red', 'violet']

function downloadCSV(name, rows) {
  if (!rows || !rows.length) { alert('No data available to export.'); return }
  const cols = Object.keys(rows[0])
  const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [cols.map(esc).join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${name}_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function ReportHero({ title, scope, generatedAt, onRefresh, exportRows, exportName = 'nagrikseva_report' }) {
  return (
    <div className="report-hero">
      <div className="report-hero-glow" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="report-hero-pill">Analytics</span>
            <span className="report-hero-pill-ghost">Live Data</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">{title}</h1>
          <p className="text-white/60 text-xs mt-1 font-medium">{scope}</p>
          {generatedAt && (
            <p className="text-white/40 text-[10px] mt-2 font-semibold uppercase tracking-wider">
              Generated · {new Date(generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 no-print">
          <button onClick={onRefresh} className="report-action" title="Refresh data">
            <FaSyncAlt className="text-[11px]" /> Refresh
          </button>
          <button onClick={() => downloadCSV(exportName, exportRows)} className="report-action" title="Export as CSV">
            <FaFileCsv className="text-[11px]" /> Export
          </button>
          <button onClick={() => window.print()} className="report-action is-solid" title="Print report">
            <FaPrint className="text-[11px]" /> Print
          </button>
        </div>
      </div>
    </div>
  )
}

export function KpiStrip({ summary = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {summary.map((s, i) => (
        <StatCard
          key={s.label}
          label={s.label}
          value={s.value}
          sub={s.sub}
          prefix={s.prefix || ''}
          tone={s.tone || TONE_CYCLE[i % TONE_CYCLE.length]}
          icon={['📥', '✅', '⏳', '⚠️'][i % 4]}
          delay={i * 90}
        />
      ))}
    </div>
  )
}

/** The three charts every role shares. */
export function CoreCharts({ data, certLabel = 'By Certificate Type', deptLabel = 'By Department' }) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
        <ChartCard
          className="lg:col-span-2"
          title="Status Distribution"
          subtitle="Share of applications by current stage"
          icon="🥧"
        >
          <DonutChart data={data.status_distribution} centerLabel="Applications" />
        </ChartCard>

        <ChartCard
          className="lg:col-span-3"
          title="Monthly Trend"
          subtitle="Volume, completions and rejections over the last 12 months"
          icon="📈"
        >
          <AreaChart
            data={data.monthly_trend}
            series={[
              { key: 'total', label: 'Received', color: '#1a3a6b' },
              { key: 'completed', label: 'Completed', color: '#16a34a' },
              { key: 'rejected', label: 'Rejected', color: '#dc2626' },
            ]}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title={certLabel} subtitle="Requested vs issued per service" icon="📊">
          <BarChart
            data={data.by_certificate_type}
            keys={[
              { key: 'total', label: 'Requested', color: '#1a3a6b' },
              { key: 'completed', label: 'Issued', color: '#f4a200' },
            ]}
          />
        </ChartCard>

        <ChartCard title={deptLabel} subtitle="Ranked by application volume" icon="🏢">
          <HorizontalBars data={data.by_department} secondKey="completed" secondLabel="issued" />
        </ChartCard>
      </div>
    </>
  )
}

export function ReportFooter() {
  return (
    <div className="report-footer">
      <span className="font-bold text-[#1a3a6b]">NagrikSeva</span> · Government of Karnataka e-Governance Platform ·
      Report generated automatically from live transactional data. For official use only.
    </div>
  )
}

export function ReportError({ message, onRetry }) {
  return (
    <div className="bg-white rounded-2xl border border-red-100 p-12 text-center shadow-sm">
      <div className="text-4xl mb-3">📡</div>
      <h3 className="font-bold text-slate-700 text-sm">Unable to load report data</h3>
      <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
        {message || 'The reporting service did not respond. Make sure the backend server is running on port 5000.'}
      </p>
      <button onClick={onRetry} className="btn-primary mt-5 text-xs">Try Again</button>
    </div>
  )
}

export { downloadCSV }
