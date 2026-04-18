import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import { mockOpsSequences } from '@/lib/mock-data'
import { formatNumber, formatPercent, formatCurrency, cn } from '@/lib/utils'

export default async function SequencesPage() {
  const session = await auth()

  const sorted = [...mockOpsSequences].sort((a, b) => b.wonRevenue - a.wonRevenue)

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Sequence Performance"
        subtitle="Email engagement, deliverability, and funnel conversion by sequence"
        userName={session?.user?.name}
        userRole={session?.user?.role!}
      />

      <div className="p-6">
        <div className="bg-graphite-800 border border-white/5 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {[
                    'Sequence', 'Segment', 'Status', 'Sent', 'Delivery %',
                    'Open %', 'Click %', 'CTOR', 'Unsub %', 'MQL %', 'SQL %', 'Won Revenue',
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-white/25 text-xs font-mono uppercase tracking-widest whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sorted.map((s) => (
                  <tr key={s.name} className="hover:bg-white/2 transition-colors group">
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap max-w-[200px]">
                      <p className="truncate">{s.name}</p>
                    </td>
                    <td className="px-4 py-3 text-white/50 whitespace-nowrap">{s.segment}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={cn(
                          'text-xs font-mono px-2 py-0.5 rounded-full',
                          s.status === 'active'
                            ? 'bg-accent-green/10 text-accent-green'
                            : 'bg-white/5 text-white/30'
                        )}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/70 font-mono">{formatNumber(s.sent)}</td>
                    <td className="px-4 py-3 font-mono">
                      <MetricCell value={s.deliveryRate} warn={95} bad={92} invert={false} />
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <MetricCell value={s.openRate} warn={20} bad={15} invert={false} />
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <MetricCell value={s.clickRate} warn={3} bad={2} invert={false} />
                    </td>
                    <td className="px-4 py-3 text-white/50 font-mono">{formatPercent(s.ctor)}</td>
                    <td className="px-4 py-3 font-mono">
                      <MetricCell value={s.unsubRate} warn={0.5} bad={1} invert={true} />
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <MetricCell value={s.mqlRate} warn={10} bad={5} invert={false} />
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <MetricCell value={s.sqlRate} warn={6} bad={3} invert={false} />
                    </td>
                    <td className="px-4 py-3 text-white font-mono font-medium whitespace-nowrap">
                      {formatCurrency(s.wonRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCell({
  value,
  warn,
  bad,
  invert,
}: {
  value: number
  warn: number
  bad: number
  invert: boolean
}) {
  const isGood = invert ? value < warn : value >= warn
  const isBad = invert ? value >= bad : value < bad

  return (
    <span
      className={cn(
        isBad
          ? 'text-accent-red'
          : isGood
          ? 'text-accent-green'
          : 'text-accent-yellow'
      )}
    >
      {formatPercent(value)}
    </span>
  )
}
