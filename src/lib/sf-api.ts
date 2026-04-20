// Shared Salesforce REST API + Pardot API helpers
// Uses stored credentials from the Integration table — no OAuth refresh

import { prisma } from '@/lib/prisma'

const SF_API_VERSION = 'v59.0'

export interface SfCreds {
  accessToken: string
  instanceUrl: string
}

export interface PardotCreds {
  accessToken: string
  businessUnitId: string
}

// ─── Load credentials from DB ─────────────────────────────────────────────────

export async function getSfCreds(): Promise<SfCreds | null> {
  const integration = await prisma.integration.findUnique({ where: { platform: 'salesforce' } })
  if (integration?.status !== 'connected') return null
  const s = integration.settings as Record<string, string> | null
  if (!s?.accessToken || !s?.instanceUrl) return null
  return { accessToken: s.accessToken, instanceUrl: s.instanceUrl }
}

export async function getPardotCreds(): Promise<PardotCreds | null> {
  const [sf, pardot] = await Promise.all([
    prisma.integration.findUnique({ where: { platform: 'salesforce' } }),
    prisma.integration.findUnique({ where: { platform: 'pardot' } }),
  ])
  if (pardot?.status !== 'connected') return null
  const sfSettings = sf?.settings as Record<string, string> | null
  const pardotSettings = pardot.settings as Record<string, string> | null
  const accessToken = sfSettings?.accessToken
  const businessUnitId = pardotSettings?.businessUnitId
  if (!accessToken || !businessUnitId) return null
  return { accessToken, businessUnitId }
}

// ─── Salesforce SOQL ──────────────────────────────────────────────────────────

export async function sfQuery<T = unknown>(
  creds: SfCreds,
  soql: string
): Promise<{ records: T[]; totalSize: number } | null> {
  try {
    const url = `${creds.instanceUrl}/services/data/${SF_API_VERSION}/query?q=${encodeURIComponent(soql)}`
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${creds.accessToken}`, Accept: 'application/json' },
    })
    if (!res.ok) return null
    return await res.json() as { records: T[]; totalSize: number }
  } catch {
    return null
  }
}

export async function sfCount(creds: SfCreds, soql: string): Promise<number> {
  const result = await sfQuery<{ expr0: number }>(creds, soql)
  return result?.records?.[0]?.expr0 ?? 0
}

// ─── Pardot API v5 ────────────────────────────────────────────────────────────

export async function pardotGet<T = unknown>(
  creds: PardotCreds,
  path: string
): Promise<T | null> {
  try {
    const res = await fetch(`https://pi.pardot.com/api/v5/objects/${path}`, {
      headers: {
        Authorization: `Bearer ${creds.accessToken}`,
        'Pardot-Business-Unit-Id': creds.businessUnitId,
        Accept: 'application/json',
      },
    })
    if (!res.ok) return null
    return await res.json() as T
  } catch {
    return null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function pct(numerator: number, denominator: number, decimals = 1): number {
  if (!denominator) return 0
  return parseFloat(((numerator / denominator) * 100).toFixed(decimals))
}
