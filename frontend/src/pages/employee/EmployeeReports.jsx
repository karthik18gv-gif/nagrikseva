import { useState, useEffect, useCallback } from 'react'
import { employeeAPI } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { ChartCard, RadialGauge, DonutChart } from '../../components/charts/Charts'
import { ReportHero, KpiStrip, CoreCharts, ReportFooter, ReportError } from '../../components/charts/ReportShell'

export default function EmployeeReports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    setLoading(true); setError('')
    employeeAPI.getReports()
      .then(r => setData(r?.data?.data || null))
      .catch(e => setError(e?.response?.data?.message || e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <LoadingSpinner text="Compiling verification report..." />
  if (error || !data) return <ReportError message={error} onRetry={load} />

  const x = data.extra || {}

  return (
    <div className="report-page">
      <ReportHero
        title="Verification Reports"
        scope={data.scope}
        generatedAt={data.generated_at}
        onRefresh={load}
        exportRows={data.by_certificate_type}
        exportName="verification_report"
      />

      <KpiStrip summary={data.summary} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <ChartCard title="Clearance Rate" subtitle="Queue cleared and forwarded" icon="🎯">
          <div className="flex justify-center py-2">
            <RadialGauge value={x.clearance_rate || 0} label="Of total assigned" color="#1a3a6b" />
          </div>
        </ChartCard>

        <ChartCard title="Verification Speed" subtitle="Days from submission to verification" icon="⚡">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="text-5xl font-black text-[#f4a200] tabular-nums pulse-soft">
              {x.avg_verification_days ?? '—'}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-2">Days (average)</p>
            <p className="text-[10px] text-slate-400 mt-3 text-center max-w-[180px]">
              Measured across all applications you have personally verified.
            </p>
          </div>
        </ChartCard>

        <ChartCard title="My Pension Case" subtitle="Status of your own pension application" icon="💼">
          {x.pension_status?.length
            ? <DonutChart data={x.pension_status} size={160} thickness={24} centerLabel="Cases" />
            : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="text-3xl mb-2">💼</div>
                <p className="text-xs font-semibold text-slate-400">No pension application filed</p>
              </div>
            )}
        </ChartCard>
      </div>

      <CoreCharts data={data} certLabel="Workload by Certificate Type" deptLabel="Workload by Department" />

      <ReportFooter />
    </div>
  )
}
