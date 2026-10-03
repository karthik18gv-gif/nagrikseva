import { useState, useEffect, useCallback } from 'react'
import { adminAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { ChartCard, DonutChart, HorizontalBars, AreaChart, RadialGauge, StatCard } from '../../components/charts/Charts'
import { ReportHero, KpiStrip, CoreCharts, ReportFooter, ReportError } from '../../components/charts/ReportShell'

export default function AdminReports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true); setError('')
    adminAPI.getReports()
      .then(r => setData(r?.data?.data || null))
      .catch(e => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <LoadingSpinner text="Compiling system analytics..." />
  if (error || !data) return <ReportError message={error} onRetry={load} />

  const x = data.extra || {}
  const sc = x.staff_counts || {}

  const resourceTiles = [
    { label: 'Employees', value: sc.employees, icon: '💼' },
    { label: 'Officers', value: sc.officers, icon: '🛡️' },
    { label: 'Departments', value: sc.departments, icon: '🏢' },
    { label: 'Service Types', value: sc.cert_types, icon: '📜' },
    { label: 'Pension Cases', value: sc.pensions, icon: '💰' },
    { label: 'Open Tickets', value: sc.open_tickets, icon: '🎫' },
  ]

  return (
    <div className="report-page">
      <ReportHero
        title="System Analytics & Reports"
        scope={data.scope}
        generatedAt={data.generated_at}
        onRefresh={load}
        exportRows={data.by_department}
        exportName="system_analytics"
      />

      <KpiStrip summary={data.summary} />

      {/* Resource tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {resourceTiles.map((t, i) => (
          <div key={t.label} className="resource-tile" style={{ animationDelay: `${i * 70}ms` }}>
            <span className="resource-tile-icon">{t.icon}</span>
            <span className="text-xl font-black text-slate-800 tabular-nums">{t.value ?? 0}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 text-center">{t.label}</span>
          </div>
        ))}
      </div>

      <CoreCharts data={data} certLabel="Most Requested Services" deptLabel="Departmental Load" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <ChartCard title="Citizens by Gender" subtitle="Demographic split of registered users" icon="👥">
          <DonutChart data={x.gender_split} size={170} thickness={26} centerLabel="Citizens" />
        </ChartCard>

        <ChartCard title="Citizens by Category" subtitle="Social category distribution" icon="🗂️">
          <DonutChart data={x.category_split} size={170} thickness={26} centerLabel="Citizens" />
        </ChartCard>

        <ChartCard title="Pension Pipeline" subtitle="Status of all pension applications" icon="💰">
          {x.pension_status?.length
            ? <DonutChart data={x.pension_status} size={170} thickness={26} centerLabel="Cases" />
            : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-3xl mb-2">💰</div>
                <p className="text-xs font-semibold text-slate-400">No pension cases recorded</p>
              </div>
            )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <ChartCard title="Citizen Registration Growth" subtitle="New accounts created per month" icon="📈">
          <AreaChart
            data={x.citizen_growth}
            series={[{ key: 'total', label: 'New Citizens', color: '#7c3aed' }]}
            height={220}
          />
        </ChartCard>

        <ChartCard title="Citizens by District" subtitle="Geographic reach of the platform" icon="📍">
          <HorizontalBars data={x.citizens_by_district} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 mb-5">
        <ChartCard title="Avg Turnaround" subtitle="Platform-wide" icon="⚡">
          <div className="flex flex-col items-center justify-center py-5">
            <div className="text-4xl font-black text-[#1a3a6b] tabular-nums pulse-soft">
              {x.avg_processing_days ?? '—'}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-2">Days</p>
          </div>
        </ChartCard>

        <ChartCard className="lg:col-span-3" title="Support Desk Health" subtitle="Ticket volume and resolution" icon="🎫">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center py-2">
            <div className="flex justify-center">
              <RadialGauge
                value={sc.tickets ? Math.round(((sc.tickets - sc.open_tickets) / sc.tickets) * 100) : 0}
                label="Resolution rate" color="#0891b2" size={130}
              />
            </div>
            <div className="sm:col-span-2 space-y-3">
              <div className="mini-metric"><span className="mini-metric-label">Total Tickets</span><span className="mini-metric-value">{sc.tickets ?? 0}</span></div>
              <div className="mini-metric"><span className="mini-metric-label">Still Open</span><span className="mini-metric-value text-amber-600">{sc.open_tickets ?? 0}</span></div>
              <div className="mini-metric"><span className="mini-metric-label">Resolved / Closed</span><span className="mini-metric-value text-emerald-600">{Math.max((sc.tickets ?? 0) - (sc.open_tickets ?? 0), 0)}</span></div>
            </div>
          </div>
        </ChartCard>
      </div>

      <ReportFooter />
    </div>
  )
}
