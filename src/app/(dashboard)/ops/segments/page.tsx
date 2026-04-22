import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import { formatPercent, formatCurrency, formatNumber } from '@/lib/utils'
import { getPardotCreds, getSfCreds, sfQuery } from '@/lib/sf-api'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NURTURE_LISTS = [
  { id: 338651, name: 'Nurture | CIOs & Tech Leaders | Non-Tech | $50–$500M', memberCount: 97 },
  { id: 338939, name: 'Nurture | CEOs & Non-Tech Leaders | Non-Tech', memberCount: 1780 },
  { id: 412789, name: 'Nurture | CEOs & Non-Tech Leaders | Tech | Under $50M', memberCount: 250 },
  { id: 412798, name: 'Nurture | CTOs & Tech Leaders | Tech | Under $50M', memberCount: 38 },
  { id: 412807, name: 'Nurture | CTOs & Tech Leaders | Funded Tech Startups', memberCount: 5 },
  { id: 412810, name: 'Nurture | Managing Partners | Private Equity', memberCount: 50 },
  { id: 509437, name: 'Nurture | CIOs & Tech Leaders | Non-Tech | Under $50M new', memberCount: 228 },
  { id: 619875, name: 'Nurture & Future Interest', memberCount: 3973 },
]

type SegmentRow = {
  name: string
  sent: number; delivered: number; opens: number; clicks: number; bounces: number
  deliveryRate: number; openRate: number; clickRate: number; ctr: number
  unsubRate: number; mqlRate: number; sqlRate: number; wonRevenue: number
}

async function getSegmentsData() {
  try {
    const [pardotCreds, sfCreds] = await Promise.all([getPardotCreds(), getSfCreds()])

    const segments: SegmentRow[] = NURTURE_LISTS.map(l => ({
      name: l.name,
      sent: 0, delivered: l.memberCount, opens: 0, clicks: 0, bounces: 0,
      deliveryRate: 0, openRate: 0, clickRate: 0, ctr: 0,
      unsubRate: 0, mqlRate: 0, sqlRate: 0, wonRevenue: 0,
    }))

    let industries: SegmentRow[] = []
    if (sfCreds) {
      const result = await sfQuery<{ Normalized_Industry__c: string; expr0: number }>(
        sfCreds,
        'SELECT Normalized_Industry__c, COUNT(Id) FROM Lead WHERE Marketing_nurture__c = true AND Normalized_Industry__c != null GROUP BY Normalized_Industry__c ORDER BY COUNT(Id) DESC LIMIT 20'
      )
      industries = (result?.records ?? []).map(r => ({
        name: r.Normalized_Industry__c,
        sent: 0, delivered: r.expr0, opens: 0, clicks: 0, bounces: 0,
        deliveryRate: 0, openRate: 0, clickRate: 0, ctr: 0,
        unsubRate: 0, mqlRate: 0, sqlRate: 0, wonRevenue: 0,
      }))
    }

    return { segments, industries, sfConnected: !!sfCreds, pardotConnected: !!pardotCreds }
  } catch (e) {
    console.error('segments error:', e)
    return { segments: [], industries: [], sfConnected: false, pardotConnected: false }
  }
}

const PERF_COLS = ['Sent', 'Delivered', 'Opens', 'Clicks', 'Bounces', 'Delivery %', 'Open %', 'Click %', 'CTR', 'Unsub %', 'MQL %', 'SQL %', 'Won Revenue']

function PerfRow({ row }: { row: SegmentRow }) {
  return (
    <tr className="hover:bg-white/2 transition-colors">
      <td className="px-4 py-3 text-white whitespace-nowrap max-w-[240px]"><p className="truncate">{row.name}</p></td>
      <td className="px-4 py-3 text-white/60 font-mono">{row.sent > 0 ? formatNumber(row.sent) : '—'}</td>
      <td className="px-4 py-3 text-white/70 font-mono">{row.delivered > 0 ? formatNumber(row.delivered) : '—'}</td>
      <td className="px-4 py-3 text-white/60 font-mono">{row.opens > 0 ? formatNumber(row.opens) : '—'}</td>
      <td className="px-4 py-3 text-white/60 font-mono">{row.clicks > 0 ? formatNumber(row.clicks) : '—'}</td>
      <td className="px-4 py-3 text-white/60 font-mono">{row.bounces > 0 ? formatNumber(row.bounces) : '—'}</td>
      <td className="px-4 py-3 text-white/50 font-mono">{row.deliveryRate > 0 ? formatPercent(row.deliveryRate) : '—'}</td>
      <td className="px-4 py-3 text-white/50 font-mono">{row.openRate > 0 ? formatPercent(row.openRate) : '—'}</td>
      <td className="px-4 py-3 text-white/50 font-mono">{row.clickRate > 0 ? formatPercent(row.clickRate) : '—'}</td>
      <td className="px-4 py-3 text-white/50 font-mono">{row.ctr > 0 ? formatPercent(row.ctr) : '—'}</td>
      <td className="px-4 py-3 text-white/50 font-mono">{row.unsubRate > 0 ? formatPercent(row.unsubRate) : '—'}</td>
      <td className="px-4 py-3 text-pulse-blue font-mono">{row.mqlRate > 0 ? formatPercent(row.mqlRate) : '—'}</td>
      <td className="px-4 py-3 text-white/50 font-mono">{row.sqlRate > 0 ? formatPercent(row.sqlRate) : '—'}</td>
      <td className="px-4 py-3 text-accent-green font-mono whitespace-nowrap">{row.wonRevenue > 0 ? formatCurrency(row.wonRevenue) : '—'}</td>
    </tr>
  )
}

export default async function SegmentsPage() {
  const session = await auth()
  const data = await getSegmentsData()
  const isLive = data.pardotConnected || data.sfConnected
  const segments = data.segments
  const industries = data.industries

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Segments & Industries"
        subtitle={isLive ? 'Live Pardot & Salesforce Data' : 'Performance breakdown by audience segment and account industry'}
        userName={session?.user?.name}
        userRole={session?.user?.role!}
      />

      <div className="p-6 space-y-6">
        {!isLive && (
          <div className="bg-yellow-500/8 border border-yellow-500/15 rounded-xl px-5 py-3 flex items-center gap-3">
            <svg className="w-4 h-4 text-yellow-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            <p className="text-yellow-400/80 text-sm">No data — <a href="/admin/integrations" className="underline">connect Salesforce &amp; Pardot to see live segment performance</a>.</p>
          </div>
        )}

        {/* Nurture Segment Performance */}
        <div className="bg-graphite-800 border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-white font-medium">Nurture Segment Performance</p>
            <p className="text-white/30 text-xs mt-0.5">Delivered = list members · Email performance populated when per-segment sends are available</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-white/25 text-xs font-mono uppercase tracking-widest whitespace-nowrap">Segment</th>
                  {PERF_COLS.map(h => (
                    <th key={h} className="text-left px-4 py-3 text-white/25 text-xs font-mono uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {segments.length === 0 && (
                  <tr><td colSpan={14} className="px-4 py-8 text-center text-white/30 text-sm">No nurture segments found — connect Pardot to see segment performance</td></tr>
                )}
                {segments.map(s => <PerfRow key={s.name} row={s} />)}
              </tbody>
            </table>
          </div>
        </div>

        {/* Industry Performance */}
        <div className="bg-graphite-800 border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-white font-medium">Industry Performance</p>
            <p className="text-white/30 text-xs mt-0.5">Delivered = nurture leads in that industry via Salesforce Normalized_Industry__c</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-4 py-3 text-white/25 text-xs font-mono uppercase tracking-widest whitespace-nowrap">Industry</th>
                  {PERF_COLS.map(h => (
                    <th key={h} className="text-left px-4 py-3 text-white/25 text-xs font-mono uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {industries.length === 0 && (
                  <tr><td colSpan={14} className="px-4 py-8 text-center text-white/30 text-sm">No data — connect Salesforce to see industry performance</td></tr>
                )}
                {industries.map(s => <PerfRow key={s.name} row={s} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
