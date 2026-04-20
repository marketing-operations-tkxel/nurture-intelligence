import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import { mockTopSegments, mockTopIndustries } from '@/lib/mock-data'
import { formatPercent, formatCurrency, formatNumber } from '@/lib/utils'

const segmentExtData: Record<string, { delivered: number; opens: number; clicks: number; unsubs: number; bounces: number; action: string }> = {
  'SaaS / Technology': { delivered: 27012, opens: 8428, clicks: 1837, unsubs: 81, bounces: 1351, action: 'Scale Up' },
  'Financial Services': { delivered: 11495, opens: 3299, clicks: 679, unsubs: 57, bounces: 460, action: 'Optimize' },
  'Professional Services': { delivered: 9499, opens: 2508, clicks: 485, unsubs: 38, bounces: 285, action: 'Optimize' },
}

export default async function SegmentsPage() {
  const session = await auth()

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Segments & Industries"
        subtitle="Performance breakdown by audience segment and account industry"
        userName={session?.user?.name}
        userRole={session?.user?.role!}
      />

      <div className="p-6 space-y-6">
        <div className="bg-graphite-800 border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-white font-medium">Segment Performance</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Segment', 'Delivered', 'Open Rate', 'Opens', 'Click Rate', 'Clicks', 'MQL Rate', 'Unsub', 'Bounce', 'Trend', 'Action'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-white/25 text-xs font-mono uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mockTopSegments.map((s) => {
                  const ext = segmentExtData[s.name]
                  return (
                    <tr key={s.name} className="hover:bg-white/2">
                      <td className="px-5 py-3 text-white whitespace-nowrap">{s.name}</td>
                      <td className="px-5 py-3 font-mono text-white/70">{ext ? formatNumber(ext.delivered) : '—'}</td>
                      <td className="px-5 py-3 font-mono text-white/70">{formatPercent(s.openRate)}</td>
                      <td className="px-5 py-3 font-mono text-white/70">{ext ? formatNumber(ext.opens) : '—'}</td>
                      <td className="px-5 py-3 font-mono text-white/70">{formatPercent(s.clickRate)}</td>
                      <td className="px-5 py-3 font-mono text-white/70">{ext ? formatNumber(ext.clicks) : '—'}</td>
                      <td className="px-5 py-3 font-mono text-pulse-blue font-medium">{formatPercent(s.mqlRate)}</td>
                      <td className="px-5 py-3 font-mono text-white/70">{ext ? formatNumber(ext.unsubs) : '—'}</td>
                      <td className="px-5 py-3 font-mono text-white/70">{ext ? formatNumber(ext.bounces) : '—'}</td>
                      <td className="px-5 py-3 text-accent-green text-xs font-mono">↑ improving</td>
                      <td className="px-5 py-3">{ext ? <ActionBadge action={ext.action} /> : null}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-graphite-800 border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-white font-medium">Industry Performance</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Industry', 'MQLs', 'Won Revenue'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-white/25 text-xs font-mono uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockTopIndustries.map((ind) => (
                <tr key={ind.name} className="hover:bg-white/2">
                  <td className="px-5 py-3 text-white">{ind.name}</td>
                  <td className="px-5 py-3 font-mono text-white/70">{formatNumber(ind.mqls)}</td>
                  <td className="px-5 py-3 font-mono text-accent-green">{formatCurrency(ind.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, { background: string; color: string }> = {
    'Scale Up': { background: '#0f2a18', color: '#4ade80' },
    Optimize: { background: '#2a1a0a', color: '#fb923c' },
    Review: { background: '#0f1e38', color: '#38bdf8' },
    Rewrite: { background: '#2a0f0f', color: '#f87171' },
  }
  const s = styles[action] ?? styles.Review
  return (
    <span
      className="text-xs font-mono px-2 py-0.5 rounded-full whitespace-nowrap"
      style={s}
    >
      {action}
    </span>
  )
}
