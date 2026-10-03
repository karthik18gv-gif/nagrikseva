import { useState, useEffect, useCallback } from 'react'
import { officerAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { ChartCard, RadialGauge, DonutChart, HorizontalBars } from '../../components/charts/Charts'
import { ReportHero, KpiStrip, CoreCharts, ReportFooter, ReportError } from '../../components/charts/ReportShell'

export default function OfficerReports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true); setError('')
    officerAPI.getReports()
      .then(r => setData(r?.data?.data || null))
      .catch(e => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <LoadingSpinner text="Compiling departmental report..." />
  if (error || !data) return <ReportError message={error} onRetry={load} />

  const x = data.extra || {}

  return (
    <div className="report-page">
      <ReportHero
        title="Departmental Reports"
        scope={data.scope}
        generatedAt={data.generated_at}
        onRefresh={load}
        exportRows={data.by_certificate_type}
        exportName="departmental_report"
      />

      <KpiStrip summary={data.summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <ChartCard title="Approval Rate" subtitle="Approved share of all applications" icon="🎯">
          <div className="flex justify-center py-2">
            <RadialGauge value={x.approval_rate || 0} label="Department wide" color="#16a34a" />
          </div>
        </ChartCard>

        <ChartCard title="Service Delivery Time" subtitle="Submission to certificate issue" icon="⚡">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="text-5xl font-black text-[#1a3a6b] tabular-nums pulse-soft">
              {x.avg_processing_days ?? '—'}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-2">Days (average)</p>
            <p className="text-[10px] text-slate-400 mt-3 text-center max-w-[190px]">
              Citizen-facing turnaround for your department.
            </p>
          </div>
        </ChartCard>

        <ChartCard title="Pension Cases" subtitle="Department pension pipeline" icon="💰">
          {x.pension_status?.length
            ? <DonutChart data={x.pension_status} size={160} thickness={24} centerLabel="Cases" />
            : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="text-3xl mb-2">💰</div>
                <p className="text-xs font-semibold text-slate-400">No pension cases yet</p>
              </div>
            )}
        </ChartCard>
      </div>

      <CoreCharts data={data} certLabel="By Certificate Type" deptLabel="Applications by District" />

      <div className="grid grid-cols-1 gap-5 mb-5">
        <ChartCard title="Staff Performance" subtitle="Applications handled by each verification employee" icon="🏅">
          <HorizontalBars data={x.staff_performance} secondKey="completed" secondLabel="cleared" />
        </ChartCard>
      </div>

      <ReportFooter />
    </div>
  )
}
