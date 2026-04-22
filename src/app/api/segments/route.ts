import { NextRequest, NextResponse } from 'next/server'
import { getPardotCreds, getSfCreds, pardotGet, pardotStats, countListMembers, sfQuery, pct } from '@/lib/sf-api'

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

interface ListEmail {
  id?: number
  name?: string
  subject?: string
  sentAt?: string
  isSent?: boolean
}

interface ListEmailDetail {
  id?: number
  recipientLists?: Array<{ id?: number }> | { values?: Array<{ id?: number }> }
}

interface IndustryRecord { Normalized_Industry__c: string; expr0: number }

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

export async function GET(_req: NextRequest) {
  const [sfCreds, pardotCreds] = await Promise.all([getSfCreds(), getPardotCreds()])

  if (!pardotCreds) {
    const industryResult = sfCreds
      ? await sfQuery<IndustryRecord>(sfCreds, 'SELECT Normalized_Industry__c, COUNT(Id) FROM Lead WHERE Marketing_nurture__c = true AND Normalized_Industry__c != null GROUP BY Normalized_Industry__c ORDER BY COUNT(Id) DESC LIMIT 20')
      : null
    const industries = (industryResult?.records ?? []).map(r => emptyRow(r.Normalized_Industry__c, r.expr0))
    return NextResponse.json({
      segments: SEGMENT_LISTS.map(l => emptyRow(l.name, 0)),
      newsletter: emptyRow(NEWSLETTER_LIST.name, 0),
      industries,
      sfConnected: !!sfCreds,
      pardotConnected: false,
    })
  }

  // Fetch all sent list-emails (up to 50 most recent)
  const listEmailsData = await pardotGet<{ values?: ListEmail[] }>(
    pardotCreds,
    'list-emails?fields=id,name,subject,sentAt,isSent&limit=200'
  )
  const allSent = (listEmailsData?.values ?? [])
    .filter(e => e.isSent === true && e.id != null)
    .sort((a, b) => (b.sentAt ?? '').localeCompare(a.sentAt ?? ''))
    .slice(0, 50)

  // Fetch detail for each email to get recipientLists
  const details = await Promise.all(
    allSent.map(e => pardotGet<ListEmailDetail>(pardotCreds, `list-emails/${e.id}?fields=id,recipientLists.id`))
  )

  // Build map: listId -> list of email indices sent to that list
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

  // Fetch stats for all relevant emails (deduplicated)
  const relevantIndices = [...new Set([...listEmailIndices.values()].flat())]
  const statsMap = new Map<number, Awaited<ReturnType<typeof pardotStats>>>()
  const statsResults = await Promise.all(relevantIndices.map(i => pardotStats(pardotCreds, allSent[i].id!)))
  for (const [j, idx] of relevantIndices.entries()) {
    statsMap.set(idx, statsResults[j])
  }

  // Aggregate stats per list
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

  // Count members and aggregate stats in parallel
  const [memberCounts, industryResult] = await Promise.all([
    Promise.all([...SEGMENT_LISTS.map(l => l.id), NEWSLETTER_LIST.id].map(id => countListMembers(pardotCreds, id))),
    sfCreds
      ? sfQuery<IndustryRecord>(sfCreds, 'SELECT Normalized_Industry__c, COUNT(Id) FROM Lead WHERE Marketing_nurture__c = true AND Normalized_Industry__c != null GROUP BY Normalized_Industry__c ORDER BY COUNT(Id) DESC LIMIT 20')
      : Promise.resolve(null),
  ])

  const segments: StatsRow[] = SEGMENT_LISTS.map((list, i) =>
    aggregateStats(listEmailIndices.get(list.id) ?? [], list.name, memberCounts[i])
  ).sort((a, b) => b.members - a.members)

  const newsletter: StatsRow = aggregateStats(
    listEmailIndices.get(NEWSLETTER_LIST.id) ?? [],
    NEWSLETTER_LIST.name,
    memberCounts[SEGMENT_LISTS.length]
  )

  const industries: StatsRow[] = (industryResult?.records ?? []).map(r =>
    emptyRow(r.Normalized_Industry__c, r.expr0)
  )

  return NextResponse.json({ segments, newsletter, industries, sfConnected: !!sfCreds, pardotConnected: true })
}
