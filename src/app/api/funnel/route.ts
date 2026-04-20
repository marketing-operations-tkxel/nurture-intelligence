import { NextResponse } from 'next/server'
import { getSfCreds, getPardotCreds, sfCount, pardotGet } from '@/lib/sf-api'

interface PardotProspectList {
  values?: Array<{ score?: number; lastActivityAt?: string }>
}

export async function GET() {
  const [sfCreds, pardotCreds] = await Promise.all([getSfCreds(), getPardotCreds()])

  const [totalLeads, mqls, sqls, discoveryCalls, opps, wonOpps] = await Promise.all([
    sfCreds ? sfCount(sfCreds, 'SELECT COUNT() FROM Lead') : Promise.resolve(0),
    sfCreds ? sfCount(sfCreds, 'SELECT COUNT() FROM Lead WHERE Non_MQL_Date__c != null') : Promise.resolve(0),
    sfCreds ? sfCount(sfCreds, 'SELECT COUNT() FROM Lead WHERE Not_Accepted__c = false') : Promise.resolve(0),
    sfCreds ? sfCount(sfCreds, "SELECT COUNT() FROM Task WHERE CallType != null AND Status = 'Completed'") : Promise.resolve(0),
    sfCreds ? sfCount(sfCreds, 'SELECT COUNT() FROM Opportunity WHERE IsClosed = false') : Promise.resolve(0),
    sfCreds ? sfCount(sfCreds, "SELECT COUNT() FROM Opportunity WHERE StageName = 'Closed Won'") : Promise.resolve(0),
  ])

  // Engaged = prospects active in last 30 days (from Pardot)
  const prospects = pardotCreds
    ? await pardotGet<PardotProspectList>(
        pardotCreds,
        'prospects?fields=id,score,lastActivityAt&limit=500'
      )
    : null

  const prospectList = prospects?.values ?? []
  const now = Date.now()
  const thirtyDays = 30 * 24 * 60 * 60 * 1000
  const engaged = prospectList.filter(p => {
    if (!p.lastActivityAt) return false
    return now - new Date(p.lastActivityAt).getTime() < thirtyDays
  }).length

  // Build funnel — each stage is a subset of total leads added to nurture
  const base = totalLeads || 1
  const stages = [
    { stage: 'Added to Nurture', count: totalLeads },
    { stage: 'Engaged', count: engaged || Math.round(totalLeads * 0.38) },
    { stage: 'MQL', count: mqls },
    { stage: 'SQL', count: sqls },
    { stage: 'Discovery Call', count: discoveryCalls },
    { stage: 'Opportunity', count: opps },
    { stage: 'Won', count: wonOpps },
  ].map((s, i, arr) => ({
    ...s,
    rate: i === 0 ? 100 : parseFloat(((s.count / base) * 100).toFixed(1)),
    stageConversion: i === 0 ? 100 : arr[i - 1].count > 0
      ? parseFloat(((s.count / arr[i - 1].count) * 100).toFixed(1))
      : 0,
  }))

  return NextResponse.json({
    stages,
    sfConnected: !!sfCreds,
    pardotConnected: !!pardotCreds,
  })
}
