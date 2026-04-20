import { NextResponse } from 'next/server'
import { getPardotCreds, getSfCreds, pardotGet, sfQuery, pct } from '@/lib/sf-api'

interface PardotList {
  id?: number
  name?: string
  title?: string
  memberCount?: number
}
interface PardotListResponse { values?: PardotList[] }

interface CampaignRecord {
  Type?: string
  Name?: string
  NumberOfLeads?: number
  NumberOfOpportunities?: number
  AmountAllOpportunities?: number
}

export async function GET() {
  const [sfCreds, pardotCreds] = await Promise.all([getSfCreds(), getPardotCreds()])

  // Pardot lists as segments
  const listData = pardotCreds
    ? await pardotGet<PardotListResponse>(pardotCreds, 'lists?fields=id,name,title,memberCount&limit=200')
    : null

  const lists = (listData?.values ?? [])
    .filter(l => (l.memberCount ?? 0) > 0)
    .sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0))
    .slice(0, 20)
    .map(l => ({
      name: l.name ?? l.title ?? `List ${l.id}`,
      memberCount: l.memberCount ?? 0,
    }))

  // SF Campaign type breakdown for industry/attribution view
  const campResult = sfCreds
    ? await sfQuery<CampaignRecord>(
        sfCreds,
        'SELECT Type, Name, NumberOfLeads, NumberOfOpportunities, AmountAllOpportunities FROM Campaign WHERE IsActive = true ORDER BY NumberOfLeads DESC LIMIT 50'
      )
    : null

  const campaigns = (campResult?.records ?? []).map(c => ({
    name: c.Name ?? 'Unnamed',
    type: c.Type ?? 'Other',
    leads: c.NumberOfLeads ?? 0,
    opportunities: c.NumberOfOpportunities ?? 0,
    revenue: c.AmountAllOpportunities ?? 0,
  }))

  // Aggregate by type for "industry" view
  const byType: Record<string, { leads: number; revenue: number; count: number }> = {}
  for (const c of campaigns) {
    if (!byType[c.type]) byType[c.type] = { leads: 0, revenue: 0, count: 0 }
    byType[c.type].leads += c.leads
    byType[c.type].revenue += c.revenue
    byType[c.type].count++
  }
  const industries = Object.entries(byType)
    .map(([name, v]) => ({ name, mqls: v.leads, revenue: v.revenue }))
    .sort((a, b) => b.mqls - a.mqls)
    .slice(0, 10)

  return NextResponse.json({
    segments: lists,
    campaigns,
    industries,
    sfConnected: !!sfCreds,
    pardotConnected: !!pardotCreds,
  })
}
