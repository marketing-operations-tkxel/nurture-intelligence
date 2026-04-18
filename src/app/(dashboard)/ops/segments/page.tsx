import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import { mockTopSegments, mockTopIndustries } from '@/lib/mock-data'
import { formatPercent, formatCurrency, formatNumber } from '@/lib/utils'

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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Segment', 'Open Rate', 'Click Rate', 'MQL Rate', 'Trend'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-white/25 text-xs font-mono uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockTopSegments.map((s) => (
                <tr key={s.name} className="hover:bg-white/2">
                  <td className="px-5 py-3 text-white">{s.name}</td>
                  <td className="px-5 py-3 font-mono text-white/70">{formatPercent(s.openRate)}</td>
                  <td className="px-5 py-3 font-mono text-white/70">{formatPercent(s.clickRate)}</td>
                  <td className="px-5 py-3 font-mono text-pulse-blue font-medium">{formatPercent(s.mqlRate)}</td>
                  <td className="px-5 py-3 text-accent-green text-xs font-mono">↑ improving</td>
                </tr>
              ))}
            </tbody>
          </table>
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
