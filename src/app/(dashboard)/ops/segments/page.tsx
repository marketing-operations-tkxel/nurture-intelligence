import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import { formatPercent, formatCurrency, formatNumber } from '@/lib/utils'
import { getPardotCreds, getSfCreds, sfQuery, pardotGet, pardotStats, countListMembers, pct } from '@/lib/sf-api'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SEGMENT_LISTS = [
  { id: 338651, name: 'Nurture | CIOs & Tech Leaders | Non-Tech | $50–$500M' },
  { id: 338939, name: 'Nurture | CEOs & Non-Tech Leaders | Non-Tech' },
  { id: 412789, name: 'Nurture | CEOs & Non-Tech Leaders | Tech | Under $50M' },
  { id: 412798, name: 'Nurture | CTOs & Tech Leaders | Tech | Under $50M' },
  { id: 412807, name: 'Nurture | CTOs & Tech Leaders | Funded Tech Startups' },
  { id: 412810, name: 'Nurture | Managing Partners | Private Equity' },
  { id: 509437, name: 'Nurture | CIOs & Tech Leaders | Non-Tech | Under $50M new' },
]

const NEWSLETTER_LIST = { id: 619875, name: 'Nurture & Future Interest' }
const ALL_LIST_IDS = new Set([...SEGMENT_LISTS.map(l => l.id), NEWSLETTER_LIST.id])

type StatsRow = {
  name: string
  members: number
  sent: number; delivered: number; opens: number; clicks: number; bounces: number
  deliveryRate: number; openRate: number; clickRate: number; ctr: number
  unsubRate: number; mqlRate: number; sqlRate: number; wonRevenue: number
}

function emptyRow(name: string, members: number): StatsRow {
  return { name, members, sent: 0, delivered: 0, opens: 0, clicks: 0, bounces: 0, deliveryRate: 0, openRate: 0, clickRate: 0, ctr: 0, unsubRate: 0, mqlRate: 0, sqlRate: 0, wonRevenue: 0 }
}

interface ListEmail { id?: number; name?: string; subject?: string; sentAt?: string; isSent?: boolean }
interface ListEmailDetail { id?: number; recipientLists?: Array<{ id?: number }> | { values?: Array<{ id?: number }> } }
interface IndustryRecord { Normalized_Industry__c: string; expr0: number }

async function getSegmentsData() {
  try {
    const [pardotCreds, sfCreds] = await Promise.all([getPardotCreds(), getSfCreds()])

    if (!pardotCreds) {
      const industryResult = sfCreds
        ? await sfQuery<IndustryRecord>(sfCreds, 'SELECT Normalized_Industry__c, COUNT(Id) FROM Lead WHERE Marketing_nurture__c = true AND Normalized_Industry__c != null GROUP BY Normalized_Industry__c ORDER BY COUNT(Id) DESC LIMIT 20')
        : null
      return {
        segments: SEGMENT_LISTS.map(l => emptyRow(l.name, 0)),
        newsletter: emptyRow(NEWSLETTER_LIST.name, 0),
        industries: (industryResult?.records ?? []).map(r => emptyRow(r.Normalized_Industry__c, r.expr0)),
        sfConnected: !!sfCreds,
        pardotConnected: false,
      }
    }

    // Fetch sent emails
    const listEmailsData = await pardotGet<{ values?: ListEmail[] }>(
      pardotCreds, 'list-emails?fields=id,name,subject,sentAt,isSent&limit=200'
    )
    const allSent = (listEmailsData?.values ?? [])
      .filter(e => e.isSent === true && e.id != null)
      .sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''))
      .slice(0, 50)

    const details = await Promise.all(
      allSent.map(e => pardotGet<ListEmailDetail>(pardotCreds, `list-emails/${e.id}?fields=id,recipientLists.id`))
    )

    const listEmailIndices = new Map<number, number[]>()
    for (const [i, detail] of details.entries()) {
      if (!detail) continue
      const lists: Array<{ id?: number }> = Array.isArray(detail.recipientLists)
        ? detail.recipientLists
        : (detail.recipientLists as { values?: Array<{ id?: number }> })?.values ?? []
      for (const l of lists) {
        if (l.id != null && ALL_LIST_IDS.has(l.id)) {
          if (!listEmailIndices.has(l.id)) listEmailIndices.set(l.id, [])
          listEmailIndices.get(l.id)!.push(i)
        }
      }
    }

    const relevantIndices = [...new Set([...listEmailIndices.values()].flat())]
    const statsMap = new Map<number, Awaited<ReturnType<typeof pardotStats>>>()
    const statsResults = await Promise.all(relevantIndices.map(i => pardotStats(pardotCreds, allSent[i].id!)))
    for (const [j, idx] of relevantIndices.entries()) statsMap.set(idx, statsResults[j])

    function aggregateStats(emailIndices: number[], name: string, members: number): StatsRow {
      let sent = 0, delivered = 0, opens = 0, clicks = 0, bounces = 0, unsubs = 0
      for (const idx of emailIndices) {
        const s = statsMap.get(idx)
        if (!s) continue
        sent += s.sent ?? 0
        delivered += s.delivered ?? 0
        opens += s.uniqueOpens ?? 0
        clicks += s.uniqueClicks ?? 0
        bounces += (s.hardBounced ?? 0) + (s.softBounced ?? 0)
        unsubs += s.optOuts ?? 0
      }
      return {
        name, members, sent, delivered, opens, clicks, bounces,
        deliveryRate: pct(delivered, sent),
        openRate: pct(opens, delivered),
        clickRate: pct(clicks, delivered),
        ctr: pct(clicks, opens),
        unsubRate: pct(unsubs, delivered),
        mqlRate: 0, sqlRate: 0, wonRevenue: 0,
      }
    }

    const [memberCounts, industryResult] = await Promise.all([
      Promise.all([...SEGMENT_LISTS.map(l => l.id), NEWSLETTER_LIST.id].map(id => countListMembers(pardotCreds, id))),
      sfCreds
        ? sfQuery<IndustryRecord>(sfCreds, 'SELECT Normalized_Industry__c, COUNT(Id) FROM Lead WHERE Marketing_nurture__c = true AND Normalized_Industry__c != null GROUP BY Normalized_Industry__c ORDER BY COUNT(Id) DESC LIMIT 20')
        : Promise.resolve(null),
    ])

    const segments: StatsRow[] = SEGMENT_LISTS
      .map((list, i) => aggregateStats(listEmailIndices.get(list.id) ?? [], list.name, memberCounts[i]))
      .sort((a, b) => b.members - a.members)

    const newsletter: StatsRow = aggregateStats(
      listEmailIndices.get(NEWSLETTER_LIST.id) ?? [],
      NEWSLETTER_LIST.name,
      memberCounts[SEGMENT_LISTS.length]
    )

    const industries: StatsRow[] = (industryResult?.records ?? []).map(r => emptyRow(r.Normalized_Industry__c, r.expr0))

    return { segments, newsletter, industries, sfConnected: !!sfCreds, pardotConnected: true }
  } catch (e) {
    console.error('segments error:', e)
    return {
      segments: [],
      newsletter: emptyRow(NEWSLETTER_LIST.name, 0),
      industries: [],
      sfConnected: false,
      pardotConnected: false,
    }
  }
}

const PERF_COLS = ['Members', 'Sent', 'Delivered', 'Opens', 'Clicks', 'Bounces', 'Delivery %', 'Open %', 'Click %', 'CTR', 'Unsub %', 'MQL %', 'SQL %', 'Won Revenue']

function PerfRow({ row }: { row: StatsRow }) {
  return (
    <tr className="hover:bg-white/2 transition-colors">
      <td className="px-4 py-3 text-white whitespace-nowrap max-w-[240px]"><p className="truncate">{row.name}</p></td>
      <td className="px-4 py-3 text-white/70 font-mono">{row.members > 0 ? formatNumber(row.members) : '—'}</td>
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

function PerfTable({ title, subtitle, rows, emptyMsg }: { title: string; subtitle: string; rows: StatsRow[]; emptyMsg: string }) {
  return (
    <div className="bg-graphite-800 border border-white/5 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5">
        <p className="text-white font-medium">{title}</p>
        <p className="text-white/30 text-xs mt-0.5">{subtitle}</p>
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
            {rows.length === 0 && (
              <tr><td colSpan={15} className="px-4 py-8 text-center text-white/30 text-sm">{emptyMsg}</td></tr>
            )}
            {rows.map(s => <PerfRow key={s.name} row={s} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default async function SegmentsPage() {
  const session = await auth()
  const data = await getSegmentsData()
  const isLive = data.pardotConnected || data.sfConnected

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

        <PerfTable
          title="Nurture Segment Performance"
          subtitle="7 sequence lists — Members = live list count · Email stats aggregated from emails sent to each list"
          rows={data.segments}
          emptyMsg="No nurture segments found — connect Pardot to see segment performance"
        />

        <PerfTable
          title="Newsletter Performance"
          subtitle="Nurture & Future Interest list — receives newsletters, not sequences"
          rows={[data.newsletter]}
          emptyMsg="No newsletter data"
        />

        {/* Industry Performance */}
        <div className="bg-graphite-800 border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-white font-medium">Industry Performance</p>
            <p className="text-white/30 text-xs mt-0.5">Members = nurture leads in that industry via Salesforce Normalized_Industry__c</p>
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
                {data.industries.length === 0 && (
                  <tr><td colSpan={15} className="px-4 py-8 text-center text-white/30 text-sm">No data — connect Salesforce to see industry performance</td></tr>
                )}
                {data.industries.map(s => <PerfRow key={s.name} row={s} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
