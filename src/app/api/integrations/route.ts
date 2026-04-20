import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

async function validateSalesforce(creds: Record<string, string>): Promise<string | null> {
  const { instanceUrl, clientId, clientSecret } = creds
  if (!instanceUrl || !clientId || !clientSecret) return 'Missing required fields'

  const url = `${instanceUrl.replace(/\/$/, '')}/services/oauth2/token`
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
  } catch {
    return 'Could not reach the Salesforce instance URL. Check the URL and try again.'
  }

  if (!res.ok) {
    let detail = ''
    try {
      const j = await res.json() as { error_description?: string; error?: string }
      detail = j.error_description ?? j.error ?? ''
    } catch { /* ignore */ }
    return `Salesforce rejected the credentials: ${detail || res.statusText}`
  }

  return null // success
}

async function validatePardot(creds: Record<string, string>): Promise<string | null> {
  const { businessUnitId, clientId, clientSecret } = creds
  if (!businessUnitId || !clientId || !clientSecret) return 'Missing required fields'

  // Step 1: Get a Salesforce access token using the Connected App creds
  const tokenBody = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  })

  let tokenRes: Response
  try {
    tokenRes = await fetch('https://login.salesforce.com/services/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenBody.toString(),
    })
  } catch {
    return 'Could not reach Salesforce login endpoint. Check your network and try again.'
  }

  if (!tokenRes.ok) {
    let detail = ''
    try {
      const j = await tokenRes.json() as { error_description?: string; error?: string }
      detail = j.error_description ?? j.error ?? ''
    } catch { /* ignore */ }
    return `Salesforce OAuth failed: ${detail || tokenRes.statusText}`
  }

  const tokenData = await tokenRes.json() as { access_token?: string; instance_url?: string }
  const accessToken = tokenData.access_token
  const instanceUrl = tokenData.instance_url

  if (!accessToken || !instanceUrl) {
    return 'Salesforce did not return a valid access token.'
  }

  // Step 2: Verify the business unit is accessible via the Pardot API
  const pardotApiUrl = `${instanceUrl}/services/data/v59.0/query?q=SELECT+Id+FROM+Account+LIMIT+1`
  // Actually probe the Pardot business unit specifically
  const pardotProbeUrl = `https://pi.pardot.com/api/v5/objects/lists?fields=id&limit=1`

  let pardotRes: Response
  try {
    pardotRes = await fetch(pardotProbeUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Pardot-Business-Unit-Id': businessUnitId,
      },
    })
  } catch {
    return 'Could not reach the Pardot API. The access token was valid but Pardot was unreachable.'
  }

  if (!pardotRes.ok) {
    let detail = ''
    try {
      const j = await pardotRes.json() as { message?: string; errorCode?: string }
      detail = j.message ?? j.errorCode ?? ''
    } catch { /* ignore */ }
    return `Pardot rejected the Business Unit ID: ${detail || pardotRes.statusText}. Verify the Business Unit ID is correct.`
  }

  // Discard the probe result — we just needed the 200 OK
  void pardotApiUrl // suppress unused var warning

  return null // success
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
    if (status === 'connected' && metadata) {
      let validationError: string | null = null

      if (platform === 'salesforce') {
        validationError = await validateSalesforce(metadata)
      } else if (platform === 'pardot') {
        validationError = await validatePardot(metadata)
      }

      if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 })
      }
    }

    const integration = await prisma.integration.upsert({
      where: { platform },
      update: {
        status,
        settings: metadata ?? undefined,
        lastSyncAt: status === 'connected' ? new Date() : undefined,
        syncStatus: status === 'connected' ? 'success' : undefined,
      },
      create: {
        platform,
        status,
        settings: metadata ?? undefined,
      },
    })

    return NextResponse.json(integration)
  } catch (err) {
    console.error('[PUT /api/integrations]', err)
    return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 })
  }
}
