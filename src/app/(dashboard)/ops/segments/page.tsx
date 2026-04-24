import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import { getPardotCreds, getSfCreds, sfQuery, pardotGet, pardotStats, countListMembers, pct } from '@/lib/sf-api'
import SegmentTables from '@/components/tables/SegmentTables'

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

const EMAIL_NAME_PATTERNS: Array<[string, number]> = [
  ['CIO_NT_MM', 338651],
  ['CIO_NT_U50', 509437],
  ['CEO_T_U50', 412789],
  ['CTO_T_U50', 412798],
  ['CEO_NT', 338939],
  ['CTO_FTS', 412807],
  ['PE_MP', 412810],
]
function emailNameToListId(name: string): number | null {
  for (const [pattern, id] of EMAIL_NAME_PATTERNS) {
    if (name.includes(pattern)) return id
  }
  return null
}

interface ListEmail { id?: number; name?: string; sentAt?: string; isSent?: boolean }
interface IndustryRecord { Industry: string; expr0: number }

type StatsRow = {
  name: string; members: number
  sent: number; delivered: number; opens: number; clicks: number; bounces: number
  deliveryRate: number; openRate: number; clickRate: number; ctr: number
  unsubRate: number; mqlRate: number; sqlRate: number; wonRevenue: number
}
function emptyRow(name: string, members: number): StatsRow {
  return { name, members, sent: 0, delivered: 0, opens: 0, clicks: 0, bounces: 0, deliveryRate: 0, openRate: 0, clickRate: 0, ctr: 0, unsubRate: 0, mqlRate: 0, sqlRate: 0, wonRevenue: 0 }
}

async function getSegmentsData() {
  try {
    const [pardotCreds, sfCreds] = await Promise.all([getPardotCreds(), getSfCreds()])

    if (!pardotCreds) {
      const industryResult = sfCreds
        ? await sfQuery<IndustryRecord>(sfCreds, 'SELECT Industry, COUNT(Id) FROM Lead WHERE Industry != null GROUP BY Industry ORDER BY COUNT(Id) DESC LIMIT 20')
        : null
      return {
        segments: SEGMENT_LISTS.map(l => emptyRow(l.name, 0)),
        newsletter: emptyRow(NEWSLETTER_LIST.name, 0),
        industries: (industryResult?.records ?? []).map(r => emptyRow(r.Industry, r.expr0)),
        sfConnected: !!sfCreds, pardotConnected: false,
      }
    }

    const listEmailsData = await pardotGet<{ values?: ListEmail[] }>(
      pardotCreds, 'list-emails?fields=id,name,sentAt,isSent&limit=200'
    )
    const allSent = (listEmailsData?.values ?? [])
      .filter(e => {
        if (e.isSent !== true || e.id == null) return false
        const n = (e.name ?? '').toLowerCase()
        return !n.includes('copy') && !n.includes('test') && !n.includes('testing')
      })
      .sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''))
      .slice(0, 100)

    const listEmailIndices = new Map<number, number[]>()
    for (const [i, email] of allSent.entries()) {
      const listId = emailNameToListId(email.name ?? '')
      if (listId != null) {
        if (!listEmailIndices.has(listId)) listEmailIndices.set(listId, [])
        listEmailIndices.get(listId)!.push(i)
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
        const emailSent = s.sent ?? 0
        if (emailSent < 10) continue
        sent += emailSent
        delivered += s.delivered ?? 0
        opens += s.uniqueOpens ?? 0
        clicks += s.uniqueClicks ?? 0
        bounces += (s.hardBounced ?? 0) + (s.softBounced ?? 0)
        unsubs += s.optOuts ?? 0
      }
      return {
        name, members, sent, delivered, opens, clicks, bounces,
        deliveryRate: pct(delivered, sent), openRate: pct(opens, delivered),
        clickRate: pct(clicks, delivered), ctr: pct(clicks, opens),
        unsubRate: pct(unsubs, delivered), mqlRate: 0, sqlRate: 0, wonRevenue: 0,
      }
    }

    const [memberCounts, industryResult] = await Promise.all([
      Promise.all([...SEGMENT_LISTS.map(l => l.id), NEWSLETTER_LIST.id].map(id => countListMembers(pardotCreds, id))),
      sfCreds
        ? sfQuery<IndustryRecord>(sfCreds, 'SELECT Industry, COUNT(Id) FROM Lead WHERE Industry != null GROUP BY Industry ORDER BY COUNT(Id) DESC LIMIT 20')
        : Promise.resolve(null),
    ])

    const segments: StatsRow[] = SEGMENT_LISTS
      .map((list, i) => aggregateStats(listEmailIndices.get(list.id) ?? [], list.name, memberCounts[i]))
      .sort((a, b) => b.members - a.members)

    const newsletter: StatsRow = emptyRow(NEWSLETTER_LIST.name, memberCounts[SEGMENT_LISTS.length])

    const industries: StatsRow[] = (industryResult?.records ?? []).map(r => emptyRow(r.Industry, r.expr0))

    return { segments, newsletter, industries, sfConnected: !!sfCreds, pardotConnected: true }
  } catch (e) {
    console.error('segments error:', e)
    return {
      segments: [], newsletter: emptyRow(NEWSLETTER_LIST.name, 0),
      industries: [], sfConnected: false, pardotConnected: false,
    }
  }
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

        <SegmentTables
          segments={data.segments}
          newsletter={data.newsletter}
          industries={data.industries}
        />
      </div>
    </div>
  )
}
