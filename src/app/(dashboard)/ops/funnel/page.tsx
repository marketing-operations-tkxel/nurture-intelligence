import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import FunnelChart from '@/components/charts/FunnelChart'
import KpiCard from '@/components/ui/KpiCard'
import { mockFunnelData, mockExecutiveKPIs as kpi } from '@/lib/mock-data'
import { formatPercent } from '@/lib/utils'

export default async function FunnelPage() {
  const session = await auth()

  const avgTimes = [
    { label: 'Avg Time to MQL', value: '14d', sub: 'from nurture entry' },
    { label: 'Avg Time to SQL', value: '8d', sub: 'from MQL' },
    { label: 'Avg Time to Opportunity', value: '11d', sub: 'from SQL' },
    { label: 'Avg Time to Won', value: '34d', sub: 'from opportunity' },
  ]

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Funnel Analysis"
        subtitle="Stage-by-stage conversion from nurture entry to won revenue"
        userName={session?.user?.name}
        userRole={session?.user?.role!}
      />

      <div className="p-6 space-y-6">
        {/* Conversion rates */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="MQL Rate" value={formatPercent(kpi.mqls / 8420 * 100)} sub="of contacts added to nurture" />
          <KpiCard label="SQL Rate" value={formatPercent(kpi.sqls / kpi.mqls * 100)} sub="of MQLs" />
          <KpiCard label="Discovery Call Rate" value={formatPercent(kpi.discoveryCalls / kpi.sqls * 100)} sub="of SQLs" />
          <KpiCard label="Win Rate" value={formatPercent(kpi.wonOpportunities / kpi.opportunities * 100)} sub="of opportunities" accent />
        </div>

        {/* Avg times */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {avgTimes.map((t) => (
            <div key={t.label} className="bg-graphite-800 border border-white/5 rounded-xl p-5">
              <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-2">{t.label}</p>
              <p className="text-white font-bold text-2xl">{t.value}</p>
              <p className="text-white/30 text-xs mt-1">{t.sub}</p>
            </div>
          ))}
        </div>

        {/* Full funnel visual */}
        <div className="bg-graphite-800 border border-white/5 rounded-xl p-6">
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-6">Full Funnel</p>
          <FunnelChart data={mockFunnelData} />
        </div>

        {/* Stage drop-off table */}
        <div className="bg-graphite-800 border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Stage', 'Count', 'Stage Conversion', 'Drop-off'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-white/25 text-xs font-mono uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockFunnelData.map((stage, i) => {
                const dropOff = i > 0 ? 100 - stage.rate : 0
                return (
                  <tr key={stage.stage} className="hover:bg-white/2">
                    <td className="px-5 py-3 text-white">{stage.stage}</td>
                    <td className="px-5 py-3 text-white/70 font-mono">{stage.count.toLocaleString()}</td>
                    <td className="px-5 py-3 font-mono text-pulse-blue">
                      {i === 0 ? '100%' : formatPercent(stage.rate)}
                    </td>
                    <td className="px-5 py-3 font-mono text-accent-red">
                      {i === 0 ? '—' : formatPercent(dropOff)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
