import { useState, useEffect, useCallback } from 'react'
import { citizenAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { ChartCard, RadialGauge, HorizontalBars, DonutChart } from '../../components/charts/Charts'
import { ReportHero, KpiStrip, CoreCharts, ReportFooter, ReportError } from '../../components/charts/ReportShell'

export default function CitizenReports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true); setError('')
    citizenAPI.getReports()
      .then(r => setData(r?.data?.data || null))
      .catch(e => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <LoadingSpinner text="Compiling your service report..." />
  if (error || !data) return <ReportError message={error} onRetry={load} />

  const x = data.extra || {}

  return (
    <div className="report-page">
      <ReportHero
        title="My Reports & Analytics"
        scope={data.scope}
        generatedAt={data.generated_at}
        onRefresh={load}
        exportRows={data.by_certificate_type}
        exportName="my_service_report"
      />

      <KpiStrip summary={data.summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <ChartCard title="Success Rate" subtitle="Applications successfully issued" icon="🎯">
          <div className="flex justify-center py-2">
            <RadialGauge value={x.success_rate || 0} label="Approved of total" color="#16a34a" />
          </div>
        </ChartCard>

        <ChartCard title="Average Turnaround" subtitle="Days from submission to certificate" icon="⚡">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="text-5xl font-black text-[#1a3a6b] tabular-nums pulse-soft">
              {x.avg_processing_days ?? '—'}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-2">Working Days (avg)</p>
            {x.fastest_days != null && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-3 bg-emerald-50 px-3 py-1 rounded-full">
                Fastest ever: {x.fastest_days} days
              </p>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Fees & Support" subtitle="Payments made and tickets raised" icon="💳">
          <div className="space-y-3 py-2">
            <div className="mini-metric">
              <span className="mini-metric-label">Total Fees Paid</span>
              <span className="mini-metric-value text-[#1a3a6b]">₹{Number(x.fees_paid || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="mini-metric">
              <span className="mini-metric-label">Support Tickets</span>
              <span className="mini-metric-value">{x.tickets_total || 0}</span>
            </div>
            <div className="mini-metric">
              <span className="mini-metric-label">Open Tickets</span>
              <span className="mini-metric-value text-amber-600">{x.tickets_open || 0}</span>
            </div>
            <div className="mini-metric">
              <span className="mini-metric-label">Resolved</span>
              <span className="mini-metric-value text-emerald-600">{x.tickets_closed || 0}</span>
            </div>
          </div>
        </ChartCard>
      </div>

      <CoreCharts data={data} certLabel="My Services Used" deptLabel="Departments I Applied To" />

      <ReportFooter />
    </div>
  )
}
