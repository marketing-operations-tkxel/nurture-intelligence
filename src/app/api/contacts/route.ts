import { NextResponse } from 'next/server'
import { getPardotCreds, pardotGet } from '@/lib/sf-api'

interface Prospect {
  id?: number
  email?: string
  firstName?: string
  lastName?: string
  jobTitle?: string
  score?: number
  grade?: string
  lastActivityAt?: string
  emailBounced?: boolean
  isDoNotEmail?: boolean
  emailsSent?: number
  emailsOpened?: number
  emailsClicked?: number
  emailsOptedOut?: boolean
}

interface PardotProspectList {
  values?: Prospect[]
}

function bucket(p: Prospect): string {
  const score = p.score ?? 0
  const bounced = p.emailBounced === true
  const optOut = p.isDoNotEmail === true || p.emailsOptedOut === true

  if (optOut) return 'suppression'
  if (bounced) return 'suppression'
  if (score >= 150) return 'hot'
  if (score >= 75) return 'warm'
  if (score >= 25) return 'cold'

  // Inactive: no activity in 90 days
  if (p.lastActivityAt) {
    const daysSince = (Date.now() - new Date(p.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSince > 90) return 'inactive'
    if (daysSince > 30) return 'cold'
  }

  return 'inactive'
}

function status(p: Prospect): string {
  const score = p.score ?? 0
  if (p.emailBounced) return 'Bounced'
  if (p.isDoNotEmail) return 'Unsub'
  if (score >= 150) return 'Engaged'
  if (score >= 75) return 'Warm'
  if (score >= 25) return 'Low Click'
  return 'Dark'
}

export async function GET() {
  const pardotCreds = await getPardotCreds()
  if (!pardotCreds) {
    return NextResponse.json({ buckets: null, prospects: [], connected: false })
  }

  const data = await pardotGet<PardotProspectList>(
    pardotCreds,
    'prospects?fields=id,email,firstName,lastName,jobTitle,score,grade,lastActivityAt,emailBounced,isDoNotEmail&limit=500'
  )

  const prospects = data?.values ?? []

  // Buckets
  const buckets = { hot: 0, warm: 0, cold: 0, inactive: 0, suppression: 0, recycle: 0 }
  for (const p of prospects) {
    const b = bucket(p)
    if (b in buckets) buckets[b as keyof typeof buckets]++
  }

  // Recycle = cold + inactive with score > 0 (have some history)
  buckets.recycle = prospects.filter(p => {
    const b = bucket(p)
    return (b === 'cold' || b === 'inactive') && (p.score ?? 0) > 0
  }).length

  // Top prospect detail (first 50 by score desc)
  const prospectDetail = [...prospects]
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 50)
    .map((p, i) => ({
      id: i + 1,
      name: [p.firstName, p.lastName].filter(Boolean).join(' ') || p.email || `Prospect ${p.id}`,
      title: p.jobTitle ?? '—',
      score: p.score ?? 0,
      grade: p.grade ?? '—',
      status: status(p),
      lastActivity: p.lastActivityAt ?? null,
    }))

  return NextResponse.json({
    buckets,
    prospects: prospectDetail,
    total: prospects.length,
    connected: true,
  })
}
