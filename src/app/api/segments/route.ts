import { NextRequest, NextResponse } from 'next/server'
import { getPardotCreds, getSfCreds, pardotGet, sfQuery } from '@/lib/sf-api'

interface PardotList {
  id?: number
  name?: string
  title?: string
  isDynamic?: boolean
  memberCount?: number
  totalMembers?: number
  description?: string
}

interface IndustryRecord {
  Normalized_Industry__c: string
  expr0: number
}

type SegmentRow = {
  name: string
  sent: number; delivered: number; opens: number; clicks: number; bounces: number
  deliveryRate: number; openRate: number; clickRate: number; ctr: number
  unsubRate: number; mqlRate: number; sqlRate: number; wonRevenue: number
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const [sfCreds, pardotCreds] = await Promise.all([getSfCreds(), getPardotCreds()])

  const makeEmptyRow = (name: string, delivered: number): SegmentRow => ({
    name, delivered,
    sent: 0, opens: 0, clicks: 0, bounces: 0,
    deliveryRate: 0, openRate: 0, clickRate: 0, ctr: 0,
    unsubRate: 0, mqlRate: 0, sqlRate: 0, wonRevenue: 0,
  })

  // ── Pardot lists — only dynamic lists starting with "Nurture" ─────────────────
  const listData = pardotCreds
    ? await pardotGet<{ values?: PardotList[] }>(
        pardotCreds,
        'lists?fields=id,name,title,isDynamic,memberCount,totalMembers,description&limit=200'
      )
    : null

  const allLists = listData?.values ?? []

  const nurtureLists = allLists.filter(
    l => l.isDynamic === true && (l.name ?? l.title ?? '').startsWith('Nurture')
  )

  const segments: SegmentRow[] = nurtureLists.length
    ? nurtureLists
        .map(l => makeEmptyRow(
          l.name ?? l.title ?? `List ${l.id}`,
          l.memberCount ?? l.totalMembers ?? 0
        ))
        .sort((a, b) => b.delivered - a.delivered)
    : []

  // ── Salesforce industry breakdown from nurture leads ──────────────────────────
  const industryResult = sfCreds
    ? await sfQuery<IndustryRecord>(
        sfCreds,
        'SELECT Normalized_Industry__c, COUNT(Id) FROM Lead WHERE Marketing_nurture__c = true AND Normalized_Industry__c != null GROUP BY Normalized_Industry__c ORDER BY COUNT(Id) DESC LIMIT 20'
      )
    : null

  const industries: SegmentRow[] = (industryResult?.records ?? []).map(r =>
    makeEmptyRow(r.Normalized_Industry__c, r.expr0)
  )

  return NextResponse.json({
    segments,
    industries,
    sfConnected: !!sfCreds,
    pardotConnected: !!pardotCreds,
  })
}
