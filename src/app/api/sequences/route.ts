import { NextResponse } from 'next/server'
import { getPardotCreds, pardotGet, pct } from '@/lib/sf-api'

interface PardotEmail {
  id?: number
  name?: string
  scheduledAt?: string
  totalSentCount?: number
  deliveredCount?: number
  uniqueOpenCount?: number
  totalOpenCount?: number
  uniqueClickCount?: number
  totalClickCount?: number
  hardBounceCount?: number
  softBounceCount?: number
  optOutCount?: number
  spamComplaintCount?: number
  listIds?: number[]
}

interface PardotEmailList {
  values?: PardotEmail[]
}

interface PardotList {
  id?: number
  name?: string
  title?: string
  memberCount?: number
}

interface PardotListResponse {
  values?: PardotList[]
}

function signal(openRate: number, clickRate: number, bounceRate: number): string {
  if (openRate >= 25 && clickRate >= 5) return 'Hot'
  if (openRate >= 15 || clickRate >= 3) return 'Warm'
  if (bounceRate >= 5) return 'At Risk'
  return 'Cold'
}

export async function GET() {
  const pardotCreds = await getPardotCreds()
  if (!pardotCreds) {
    return NextResponse.json({ sequences: [], connected: false })
  }

  const [emailData, listData] = await Promise.all([
    pardotGet<PardotEmailList>(
      pardotCreds,
      'emails?fields=id,name,scheduledAt,totalSentCount,deliveredCount,uniqueOpenCount,uniqueClickCount,hardBounceCount,softBounceCount,optOutCount,spamComplaintCount&limit=200'
    ),
    pardotGet<PardotListResponse>(
      pardotCreds,
      'lists?fields=id,name,title,memberCount&limit=200'
    ),
  ])

  const emails = emailData?.values ?? []
  const lists = listData?.values ?? []

  // Build a list name lookup
  const listMap = new Map(lists.map(l => [l.id, l.name ?? l.title ?? `List ${l.id}`]))

  const sequences = emails
    .filter(e => (e.totalSentCount ?? 0) > 0)
    .map(e => {
      const sent = e.totalSentCount ?? 0
      const delivered = e.deliveredCount ?? 0
      const opens = e.uniqueOpenCount ?? 0
      const clicks = e.uniqueClickCount ?? 0
      const hardBounces = e.hardBounceCount ?? 0
      const softBounces = e.softBounceCount ?? 0
      const bounces = hardBounces + softBounces
      const unsubs = e.optOutCount ?? 0
      const spam = e.spamComplaintCount ?? 0

      const deliveryRate = pct(delivered, sent)
      const openRate = pct(opens, delivered)
      const clickRate = pct(clicks, delivered)
      const ctor = pct(clicks, opens)
      const bounceRate = pct(bounces, sent)
      const unsubRate = pct(unsubs, delivered)

      return {
        id: e.id,
        name: e.name ?? `Email ${e.id}`,
        segment: e.listIds?.map(id => listMap.get(id)).filter(Boolean)[0] ?? 'All Prospects',
        status: 'active',
        sent,
        delivered,
        opens,
        clicks,
        bounces,
        unsubs,
        spam,
        deliveryRate,
        openRate,
        clickRate,
        ctor,
        bounceRate,
        unsubRate,
        signal: signal(openRate, clickRate, bounceRate),
        scheduledAt: e.scheduledAt,
      }
    })
    .sort((a, b) => b.openRate - a.openRate)

  // Subject line performance = same emails sorted differently
  const subjectLines = [...sequences]
    .sort((a, b) => b.sent - a.sent)
    .slice(0, 20)
    .map(s => ({
      subject: s.name,
      delivered: s.delivered,
      opens: s.opens,
      openRate: s.openRate,
      clicks: s.clicks,
      clickRate: s.clickRate,
      unsubs: s.unsubs,
      bounces: s.bounces,
    }))

  return NextResponse.json({
    sequences,
    subjectLines,
    connected: true,
  })
}
