import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jsforce from 'jsforce'

export async function GET() {
  try {
    const integrations = await prisma.integration.findMany()
    return NextResponse.json(integrations)
  } catch (err) {
    console.error('[GET /api/integrations]', err)
    return NextResponse.json({ error: 'Failed to load integrations' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// Credential validators — actually hit the OAuth endpoint before saving
// ---------------------------------------------------------------------------

async function validateSalesforce(creds: Record<string, string>): Promise<{ error: string | null; accessToken?: string; instanceUrl?: string }> {
  const { instanceUrl, clientId, clientSecret, username, passwordWithToken } = creds
  if (!instanceUrl || !clientId || !clientSecret || !username || !passwordWithToken) {
    return { error: 'Missing required fields' }
  }

  try {
    const conn = new jsforce.Connection({
      loginUrl: 'https://login.salesforce.com',
    })
    await conn.login(username, passwordWithToken)
    return { error: null, accessToken: conn.accessToken ?? undefined, instanceUrl: conn.instanceUrl }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return { error: `Salesforce login failed: ${msg}` }
  }
}

async function validatePardot(settings: Record<string, string>) {
  const { businessUnitId, clientId, clientSecret } = settings

  if (!businessUnitId || !clientId || !clientSecret) {
    return { error: 'Missing required fields' }
  }

  const tokenBody = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })

  // Try production then sandbox — sandbox orgs use test.salesforce.com
  const loginUrls = [
    'https://login.salesforce.com/services/oauth2/token',
    'https://test.salesforce.com/services/oauth2/token',
  ]

  let accessToken: string | null = null
  let lastError = ''

  for (const loginUrl of loginUrls) {
    try {
      const tokenRes = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: tokenBody.toString(),
      })
      const tokenData = await tokenRes.json() as {
        access_token?: string
        error?: string
        error_description?: string
      }

      if (tokenData.access_token) {
        accessToken = tokenData.access_token
        break
      }
      lastError = tokenData.error_description ?? tokenData.error ?? tokenRes.statusText
    } catch {
      lastError = 'Network error reaching Salesforce login.'
    }
  }

  if (!accessToken) {
    return {
      error: `Salesforce OAuth failed: ${lastError}. To fix: in Salesforce Setup → Connected Apps → [your app] → OAuth Policies, set IP Relaxation to "Relax IP restrictions" and enable "Client Credentials Flow".`,
    }
  }

  // Step 2: Probe Pardot API with the business unit ID
  try {
    const pardotRes = await fetch('https://pi.pardot.com/api/v5/objects/emails?limit=1', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Pardot-Business-Unit-Id': businessUnitId,
      },
    })

    if (!pardotRes.ok) {
      const errText = await pardotRes.text().catch(() => pardotRes.statusText)
      return { error: `Pardot API error (${pardotRes.status}): ${errText}. Verify your Business Unit ID is correct.` }
    }
  } catch {
    return { error: 'Could not reach pi.pardot.com. OAuth token was valid but Pardot was unreachable.' }
  }

  return { error: null, accessToken }
}

// ---------------------------------------------------------------------------
// PUT — validate then save
// ---------------------------------------------------------------------------

export async function PUT(req: NextRequest) {
  try {
    const { platform, status, metadata } = await req.json() as {
      platform: string
      status: string
      metadata?: Record<string, string>
    }

    // Only validate when actively connecting (not on disconnect)
    let settingsToStore: Record<string, string> | undefined = metadata
    if (status === 'connected' && metadata) {
      if (platform === 'salesforce') {
        const result = await validateSalesforce(metadata)
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 400 })
        }
        settingsToStore = {
          ...metadata,
          ...(result.accessToken ? { accessToken: result.accessToken } : {}),
          ...(result.instanceUrl ? { instanceUrl: result.instanceUrl } : {}),
        }
      } else if (platform === 'pardot') {
        const result = await validatePardot(metadata)
        if (result.error) {
          return NextResponse.json({ error: result.error }, { status: 400 })
        }
        settingsToStore = {
          ...metadata,
          ...(result.accessToken ? { accessToken: result.accessToken } : {}),
        }
      }
    }

    const integration = await prisma.integration.upsert({
      where: { platform },
      update: {
        status,
        settings: settingsToStore ?? undefined,
        lastSyncAt: status === 'connected' ? new Date() : undefined,
        syncStatus: status === 'connected' ? 'success' : undefined,
      },
      create: {
        platform,
        status,
        settings: settingsToStore ?? undefined,
      },
    })

    return NextResponse.json(integration)
  } catch (err) {
    console.error('[PUT /api/integrations]', err)
    return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 })
  }
}
