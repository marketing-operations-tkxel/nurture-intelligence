import { NextResponse } from 'next/server'
import { getSfCreds, getPardotCreds, sfQuery, sfCount, pardotGet, pct } from '@/lib/sf-api'

interface OppRecord { Amount: number; StageName: string }
interface AggRecord { expr0: number }
interface PardotEmailStats {
  values?: Array<{
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
  }>
}
interface PardotProspectList {
  values?: Array<{ score?: number; lastActivityAt?: string; emailBounced?: boolean; isDoNotEmail?: boolean }>
  nextPageToken?: string
}

export async function GET() {
  const [sfCreds, pardotCreds] = await Promise.all([getSfCreds(), getPardotCreds()])

  // ── Salesforce queries ──────────────────────────────────────────────────────
  const [mqlCount, sqlCount, discoveryCount, oppResult, wonAgg, pipelineAgg, newOpps] =
    await Promise.all([
      sfCreds ? sfCount(sfCreds, 'SELECT COUNT() FROM Lead WHERE Non_MQL_Date__c != null') : Promise.resolve(0),
      sfCreds ? sfCount(sfCreds, 'SELECT COUNT() FROM Lead WHERE Not_Accepted__c = false') : Promise.resolve(0),
      sfCreds ? sfCount(sfCreds, 'SELECT COUNT() FROM Task WHERE CallType != null AND Status = \'Completed\'') : Promise.resolve(0),
      sfCreds ? sfQuery<OppRecord>(sfCreds, 'SELECT StageName, Amount FROM Opportunity WHERE IsClosed = false AND Amount != null') : Promise.resolve(null),
      sfCreds ? sfQuery<AggRecord>(sfCreds, 'SELECT SUM(Amount) FROM Opportunity WHERE StageName = \'Closed Won\' AND CloseDate = THIS_FISCAL_YEAR') : Promise.resolve(null),
      sfCreds ? sfQuery<AggRecord>(sfCreds, 'SELECT SUM(Amount) FROM Opportunity WHERE IsClosed = false') : Promise.resolve(null),
      sfCreds ? sfCount(sfCreds, 'SELECT COUNT() FROM Opportunity WHERE CreatedDate = THIS_MONTH') : Promise.resolve(0),
    ])

  const wonRevenue = wonAgg?.records?.[0]?.expr0 ?? 0
  const pipelineValue = pipelineAgg?.records?.[0]?.expr0 ?? 0
  const wonOpportunities = (oppResult?.records ?? []).filter(r => r.StageName === 'Closed Won').length
  const opportunities = oppResult?.totalSize ?? 0

  // ── Pardot email aggregate ──────────────────────────────────────────────────
  const emailStats = pardotCreds
    ? await pardotGet<PardotEmailStats>(
        pardotCreds,
        'emails?fields=totalSentCount,deliveredCount,uniqueOpenCount,totalOpenCount,uniqueClickCount,hardBounceCount,softBounceCount,optOutCount,spamComplaintCount&limit=200'
      )
    : null

  const emails = emailStats?.values ?? []
  const totalSent = emails.reduce((s, e) => s + (e.totalSentCount ?? 0), 0)
  const totalDelivered = emails.reduce((s, e) => s + (e.deliveredCount ?? 0), 0)
  const totalUniqueOpens = emails.reduce((s, e) => s + (e.uniqueOpenCount ?? 0), 0)
  const totalUniqueClicks = emails.reduce((s, e) => s + (e.uniqueClickCount ?? 0), 0)
  const totalHardBounces = emails.reduce((s, e) => s + (e.hardBounceCount ?? 0), 0)
  const totalSoftBounces = emails.reduce((s, e) => s + (e.softBounceCount ?? 0), 0)
  const totalBounces = totalHardBounces + totalSoftBounces
  const totalUnsubs = emails.reduce((s, e) => s + (e.optOutCount ?? 0), 0)
  const totalSpam = emails.reduce((s, e) => s + (e.spamComplaintCount ?? 0), 0)

  // ── Pardot prospects ────────────────────────────────────────────────────────
  const prospects = pardotCreds
    ? await pardotGet<PardotProspectList>(
        pardotCreds,
        'prospects?fields=id,score,lastActivityAt,emailBounced,isDoNotEmail&limit=500'
      )
    : null

  const prospectList = prospects?.values ?? []
  const totalProspects = prospectList.length
  const now = Date.now()
  const thirtyDays = 30 * 24 * 60 * 60 * 1000
  const prospectsOpenedAny = prospectList.filter(p => {
    if (!p.lastActivityAt) return false
    return (now - new Date(p.lastActivityAt).getTime()) < thirtyDays
  }).length
  const prospectsNoEngagement = totalProspects - prospectsOpenedAny

  return NextResponse.json({
    // period
    period: 'Last 30 Days',

    // Funnel
    mqls: mqlCount,
    sqls: sqlCount,
    discoveryCalls: discoveryCount,
    opportunities,
    wonOpportunities,

    // Revenue
    wonRevenue,
    pipelineValue,
    opportunitiesCreated: newOpps,

    // Email health
    emailsSent: totalSent,
    deliveryRate: pct(totalDelivered, totalSent),
    uniqueOpenRate: pct(totalUniqueOpens, totalDelivered),
    uniqueClickRate: pct(totalUniqueClicks, totalDelivered),
    bounceRate: pct(totalBounces, totalSent),
    unsubscribeRate: pct(totalUnsubs, totalDelivered),
    spamRate: pct(totalSpam, totalDelivered),

    // Raw counts
    opensCount: totalUniqueOpens,
    clicksCount: totalUniqueClicks,
    unsubscribesCount: totalUnsubs,
    bouncesCount: totalBounces,
    spamCount: totalSpam,

    // Audience
    totalAudience: totalProspects,
    engagedAudience: prospectsOpenedAny,
    engagedRate: pct(prospectsOpenedAny, totalProspects),
    prospectsOpenedAny,
    prospectsClickedAny: Math.round(prospectsOpenedAny * pct(totalUniqueClicks, totalUniqueOpens) / 100),
    prospectsNoEngagement,

    // Connected status
    sfConnected: !!sfCreds,
    pardotConnected: !!pardotCreds,
  })
}
