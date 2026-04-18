import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import KpiCard from '@/components/ui/KpiCard'
import FunnelChart from '@/components/charts/FunnelChart'
import TrendChart from '@/components/charts/TrendChart'
import {
  mockExecutiveKPIs as kpi,
  mockTopSequences,
  mockWorstSequences,
  mockTopSegments,
  mockTopIndustries,
  mockFunnelData,
  mockTrendData,
  mockAiInsight,
} from '@/lib/mock-data'
import { formatNumber, formatCurrency, formatPercent } from '@/lib/utils'

export default async function ExecutivePage() {
  const session = await auth()

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Executive Overview"
        subtitle={kpi.period}
        userName={session?.user?.name}
        userRole={session?.user?.role!}
      />

      <div className="flex-1 p-6 space-y-6">

        {/* AI Insight Banner */}
        <div className="bg-pulse-blue/8 border border-pulse-blue/15 rounded-xl p-5 flex gap-4">
          <div className="w-8 h-8 gradient-core-flow rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </div>
          <div>
            <p className="text-pulse-blue text-xs font-mono uppercase tracking-widest mb-2">AI Executive Summary</p>
            <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{mockAiInsight}</p>
          </div>
        </div>

        {/* Revenue KPIs */}
        <div>
          <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-3">Pipeline &amp; Revenue</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Won Revenue" value={formatCurrency(kpi.wonRevenue)} change={kpi.wonRevenueChange} accent large />
            <KpiCard label="Pipeline Value" value={formatCurrency(kpi.pipelineValue)} change={kpi.pipelineValueChange} />
            <KpiCard label="Won Opportunities" value={formatNumber(kpi.wonOpportunities)} change={kpi.wonOpportunitiesChange} />
            <KpiCard label="Opportunities Created" value={formatNumber(kpi.opportunities)} change={kpi.opportunitiesChange} />
          </div>
        </div>

        {/* Funnel KPIs */}
        <div>
          <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-3">Funnel</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="MQLs" value={formatNumber(kpi.mqls)} change={kpi.mqlsChange} />
            <KpiCard label="SQLs" value={formatNumber(kpi.sqls)} change={kpi.sqlsChange} />
            <KpiCard label="Discovery Calls" value={formatNumber(kpi.discoveryCalls)} change={kpi.discoveryCallsChange} />
            <KpiCard label="Engaged Audience" value={formatNumber(kpi.engagedAudience)} change={kpi.engagedAudienceChange} sub={`${kpi.engagedRate}% of total`} />
          </div>
        </div>

        {/* Email KPIs */}
        <div>
          <p className="text-white/30 text-xs font-mono uppercase tracking-widest mb-3">Email Health</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Emails Sent" value={formatNumber(kpi.emailsSent)} change={kpi.emailsSentChange} />
            <KpiCard label="Delivery Rate" value={formatPercent(kpi.deliveryRate)} change={kpi.deliveryRateChange} />
            <KpiCard label="Unique Open Rate" value={formatPercent(kpi.uniqueOpenRate)} change={kpi.uniqueOpenRateChange} />
            <KpiCard label="Unique Click Rate" value={formatPercent(kpi.uniqueClickRate)} change={kpi.uniqueClickRateChange} />
            <KpiCard label="Bounce Rate" value={formatPercent(kpi.bounceRate)} change={-kpi.bounceRateChange} />
            <KpiCard label="Unsub Rate" value={formatPercent(kpi.unsubscribeRate)} change={-kpi.unsubscribeRateChange} />
          </div>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-graphite-800 border border-white/5 rounded-xl p-5">
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-4">Funnel Progression</p>
            <FunnelChart data={mockFunnelData} />
          </div>
          <div className="bg-graphite-800 border border-white/5 rounded-xl p-5">
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-4">12-Month Trend — Open Rate &amp; MQLs</p>
            <TrendChart data={mockTrendData} />
          </div>
        </div>

        {/* Best / Worst Sequences */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-graphite-800 border border-white/5 rounded-xl p-5">
            <p className="text-accent-green text-xs font-mono uppercase tracking-widest mb-4">Top Performing Sequences</p>
            <div className="space-y-3">
              {mockTopSequences.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{s.name}</p>
                    <p className="text-white/30 text-xs font-mono mt-0.5">
                      MQL {s.mqlRate}% · SQL {s.sqlRate}%
                    </p>
                  </div>
                  <p className="text-accent-green text-sm font-mono font-medium">{formatCurrency(s.wonRevenue)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-graphite-800 border border-white/5 rounded-xl p-5">
            <p className="text-accent-red text-xs font-mono uppercase tracking-widest mb-4">Underperforming Sequences</p>
            <div className="space-y-3">
              {mockWorstSequences.map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{s.name}</p>
                    <p className="text-white/30 text-xs font-mono mt-0.5">
                      MQL {s.mqlRate}% · SQL {s.sqlRate}%
                    </p>
                  </div>
                  <p className="text-accent-red text-sm font-mono font-medium">{formatCurrency(s.wonRevenue)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Segments & Industries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-graphite-800 border border-white/5 rounded-xl p-5">
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-4">Top Segments</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/25 text-xs font-mono">
                  <th className="text-left pb-3">Segment</th>
                  <th className="text-right pb-3">Open Rate</th>
                  <th className="text-right pb-3">Click Rate</th>
                  <th className="text-right pb-3">MQL Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mockTopSegments.map((s) => (
                  <tr key={s.name} className="text-white/70">
                    <td className="py-2.5">{s.name}</td>
                    <td className="text-right py-2.5 font-mono">{formatPercent(s.openRate)}</td>
                    <td className="text-right py-2.5 font-mono">{formatPercent(s.clickRate)}</td>
                    <td className="text-right py-2.5 font-mono text-pulse-blue">{formatPercent(s.mqlRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-graphite-800 border border-white/5 rounded-xl p-5">
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest mb-4">Top Industries by MQLs</p>
            <div className="space-y-3">
              {mockTopIndustries.map((ind, i) => (
                <div key={ind.name} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded bg-graphite-700 flex items-center justify-center text-white/30 text-xs font-mono">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-sm">{ind.name}</p>
                      <p className="text-white/50 text-xs font-mono">{ind.mqls} MQLs · {formatCurrency(ind.revenue)}</p>
                    </div>
                    <div className="h-1 bg-graphite-700 rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-core-flow rounded-full"
                        style={{ width: `${(ind.mqls / mockTopIndustries[0].mqls) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
