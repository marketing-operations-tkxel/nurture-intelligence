import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import { formatNumber, formatPercent, formatCurrency, cn } from '@/lib/utils'
import { getPardotCreds, pardotGet, pardotStats, pct } from '@/lib/sf-api'

type ListEmail = { id?: number; subject?: string; name?: string; sentAt?: string; isSent?: boolean }

async function fetchSequences() {
  try {
    const creds = await getPardotCreds()
    if (!creds) return null

    const data = await pardotGet<{ values?: ListEmail[] }>(
      creds,
      'list-emails?fields=id,name,subject,sentAt,isSent&limit=200'
    )

    const sentEmails = (data?.values ?? [])
      .filter(e => e.isSent === true && e.id != null)
      .sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''))
      .slice(0, 50)

    if (!sentEmails.length) return null

    const statsResults = await Promise.all(sentEmails.map(e => pardotStats(creds, e.id!)))

    const sequences = sentEmails
      .map((e, i) => {
        const s = statsResults[i]
        if (!s) return null
        const sent = s.sent ?? 0
        const delivered = s.delivered ?? 0
        const opens = s.uniqueOpens ?? 0
        const clicks = s.uniqueClicks ?? 0
        const bounces = (s.hardBounced ?? 0) + (s.softBounced ?? 0)
        const unsubs = s.optOuts ?? 0
        const deliveryRate = pct(delivered, sent)
        const openRate = pct(opens, delivered)
        const clickRate = pct(clicks, delivered)
        const ctor = pct(clicks, opens)
        const bounceRate = pct(bounces, sent)
        const unsubRate = pct(unsubs, delivered)
        return {
          name: e.subject ?? e.name ?? `Email ${e.id}`,
          segment: 'All Prospects',
          status: 'active',
          sent, delivered, opens, clicks, bounces, unsubs,
          wonRevenue: 0, mqlRate: 0, sqlRate: 0,
          deliveryRate, openRate, clickRate, ctor, bounceRate, unsubRate,
          signal: openRate >= 25 ? 'Hot' : openRate >= 15 ? 'Warm' : 'Cold',
        }
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => b.sent - a.sent)

    if (!sequences.length) return null

    const subjectLines = sequences.slice(0, 20).map(s => ({
      subject: s.name,
      delivered: s.delivered, opens: s.opens,
      openRate: s.openRate, clicks: s.clicks,
      clickRate: s.clickRate, unsubs: s.unsubs, bounces: s.bounces,
    }))

    return { sequences, subjectLines }
  } catch { return null }
}

export default async function SequencesPage() {
  const session = await auth()
  const live = await fetchSequences()
  const sequences = live?.sequences ?? []
  const subjectLines = live?.subjectLines ?? []
  const isLive = !!live

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Sequence Performance"
        subtitle={isLive ? 'Live Pardot Data' : 'Email engagement, deliverability, and funnel conversion by sequence'}
        userName={session?.user?.name}
        userRole={session?.user?.role!}
      />

      <div className="p-6 space-y-8">
        {!isLive && (
          <div className="bg-yellow-500/8 border border-yellow-500/15 rounded-xl px-5 py-3 flex items-center gap-3">
            <svg className="w-4 h-4 text-yellow-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            <p className="text-yellow-400/80 text-sm">No data — <a href="/admin/integrations" className="underline">connect Salesforce to see sequence performance</a>.</p>
          </div>
        )}

        {/* Main sequences table */}
        <div className="bg-graphite-800 border border-white/5 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Sequence','Segment','Status','Sent','Delivered','Opens','Clicks','Bounces','Delivery %','Open %','Click %','CTOR','Unsub %','MQL %','SQL %','Won Revenue','Signal'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-white/25 text-xs font-mono uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sequences.length === 0 && (
                  <tr><td colSpan={17} className="px-4 py-8 text-center text-white/30 text-sm">No data — connect Salesforce to see sequence performance</td></tr>
                )}
                {sequences.map((s) => (
                  <tr key={s.name} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap max-w-[200px]"><p className="truncate">{s.name}</p></td>
                    <td className="px-4 py-3 text-white/50 whitespace-nowrap">{s.segment}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={cn('text-xs font-mono px-2 py-0.5 rounded-full', s.status === 'active' ? 'bg-accent-green/10 text-accent-green' : 'bg-white/5 text-white/30')}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-white/70 font-mono">{formatNumber(s.sent)}</td>
                    <td className="px-4 py-3 text-white/70 font-mono">{formatNumber(s.delivered)}</td>
                    <td className="px-4 py-3 text-white/70 font-mono">{formatNumber(s.opens)}</td>
                    <td className="px-4 py-3 text-white/70 font-mono">{formatNumber(s.clicks)}</td>
                    <td className="px-4 py-3 text-white/70 font-mono">{formatNumber(s.bounces)}</td>
                    <td className="px-4 py-3 font-mono"><MetricCell value={s.deliveryRate} warn={95} bad={92} invert={false} /></td>
                    <td className="px-4 py-3 font-mono"><MetricCell value={s.openRate} warn={20} bad={15} invert={false} /></td>
                    <td className="px-4 py-3 font-mono"><MetricCell value={s.clickRate} warn={3} bad={2} invert={false} /></td>
                    <td className="px-4 py-3 text-white/50 font-mono">{formatPercent(s.ctor)}</td>
                    <td className="px-4 py-3 font-mono"><MetricCell value={s.unsubRate} warn={0.5} bad={1} invert={true} /></td>
                    <td className="px-4 py-3 font-mono"><MetricCell value={s.mqlRate} warn={10} bad={5} invert={false} /></td>
                    <td className="px-4 py-3 font-mono"><MetricCell value={s.sqlRate} warn={6} bad={3} invert={false} /></td>
                    <td className="px-4 py-3 text-white font-mono font-medium whitespace-nowrap">{s.wonRevenue ? formatCurrency(s.wonRevenue) : '—'}</td>
                    <td className="px-4 py-3"><SignalBadge signal={s.signal} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subject Line Performance */}
        <div className="bg-graphite-800 border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Subject Line Performance</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Subject Line','Delivered','Opens','Open %','Clicks','Click %','Unsub','Bounce'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-white/25 text-xs font-mono uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subjectLines.map((row) => (
                  <tr key={row.subject} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-white/80 max-w-[260px]"><p className="truncate">{row.subject}</p></td>
                    <td className="px-4 py-3 text-white/70 font-mono">{formatNumber(row.delivered)}</td>
                    <td className="px-4 py-3 text-white/70 font-mono">{formatNumber(row.opens)}</td>
                    <td className="px-4 py-3 font-mono"><MetricCell value={row.openRate} warn={20} bad={15} invert={false} /></td>
                    <td className="px-4 py-3 text-white/70 font-mono">{formatNumber(row.clicks)}</td>
                    <td className="px-4 py-3 font-mono"><MetricCell value={row.clickRate} warn={3} bad={2} invert={false} /></td>
                    <td className="px-4 py-3 text-white/70 font-mono">{formatNumber(row.unsubs)}</td>
                    <td className="px-4 py-3 text-white/70 font-mono">{formatNumber(row.bounces)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance by Prospect Title */}
        <div className="bg-graphite-800 border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Performance by Prospect Title</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Title','Delivered','Opens','Open %','Clicks','Click %','Unsub','Bounce'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-white/25 text-xs font-mono uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr><td colSpan={8} className="px-4 py-8 text-center text-white/30 text-sm">No data — connect Salesforce to see performance by prospect title</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCell({ value, warn, bad, invert }: { value: number; warn: number; bad: number; invert: boolean }) {
  const isGood = invert ? value < warn : value >= warn
  const isBad = invert ? value >= bad : value < bad
  return (
    <span className={cn(isBad ? 'text-accent-red' : isGood ? 'text-accent-green' : 'text-accent-yellow')}>
      {formatPercent(value)}
    </span>
  )
}

function SignalBadge({ signal }: { signal: string }) {
  const styles: Record<string, { background: string; color: string }> = {
    Hot: { background: '#0f2a18', color: '#4ade80' },
    Warm: { background: '#2a1a0a', color: '#fb923c' },
    Neutral: { background: '#1a1a2a', color: '#c084fc' },
    Cold: { background: '#0f1e38', color: '#38bdf8' },
    'At Risk': { background: '#2a0f0f', color: '#f87171' },
  }
  const s = styles[signal] ?? styles.Neutral
  return <span className="text-xs font-mono px-2 py-0.5 rounded-full whitespace-nowrap" style={s}>{signal}</span>
}
