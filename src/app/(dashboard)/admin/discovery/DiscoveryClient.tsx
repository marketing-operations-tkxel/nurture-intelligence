'use client'

import { useState, useEffect } from 'react'

type FieldMapping = {
  id: string
  concept: string
  platform: string
  object: string
  fieldApiName: string | null
  detectedLogic: string | null
  confidenceScore: number | null
  status: string
  approvedAt: Date | null
}

const CONCEPT_META: Record<string, { label: string; description: string; platform: string; defaultObject: string }> = {
  MQL: {
    label: 'Marketing Qualified Lead',
    description: 'Contacts that became Marketing Qualified Leads',
    platform: 'Salesforce CRM',
    defaultObject: 'Lead / Contact',
  },
  SQL: {
    label: 'Sales Qualified Lead',
    description: 'MQLs accepted or qualified by sales',
    platform: 'Salesforce CRM',
    defaultObject: 'Lead / Contact / Opportunity',
  },
  discovery_call: {
    label: 'Discovery Call',
    description: 'Contacts or accounts with a completed discovery call',
    platform: 'Salesforce CRM',
    defaultObject: 'Task / Event',
  },
  engaged_contact: {
    label: 'Engaged Contact',
    description: 'Contacts with qualifying engagement in selected period',
    platform: 'Account Engagement (Pardot)',
    defaultObject: 'Prospect / List',
  },
  attribution: {
    label: 'Nurture Attribution',
    description: 'How pipeline and revenue are attributed to nurture sequences',
    platform: 'Salesforce CRM + Pardot',
    defaultObject: 'Campaign / CampaignMember / Opportunity',
  },
}

const CONCEPT_ORDER = ['MQL', 'SQL', 'discovery_call', 'engaged_contact', 'attribution']

function ConfidenceBar({ score }: { score: number | null }) {
  if (score === null) return null
  const pct = Math.round(score * 100)
  const color = pct >= 70 ? 'bg-accent-green' : pct >= 40 ? 'bg-yellow-500' : 'bg-white/20'
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-white/40">{pct}% confidence</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved')
    return <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-accent-green/10 text-accent-green">✓ approved</span>
  if (status === 'rejected')
    return <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-red-500/10 text-red-400">✕ rejected</span>
  return <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-pulse-blue/10 text-pulse-blue">● detected</span>
}

export default function DiscoveryClient({
  initialMappings,
  bothConnected,
}: {
  initialMappings: FieldMapping[]
  bothConnected: boolean
}) {
  const [mappings, setMappings] = useState<FieldMapping[]>(initialMappings)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  // Re-check on mount in case there's existing data
  useEffect(() => {
    if (initialMappings.length === 0) {
      fetch('/api/discovery/mappings')
        .then((r) => r.json())
        .then((data: FieldMapping[]) => { if (data.length > 0) setMappings(data) })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runAudit() {
    setRunning(true)
    setError('')
    setDone(false)

    try {
      const res = await fetch('/api/discovery/run', { method: 'POST' })
      const data = await res.json() as { findings?: FieldMapping[]; error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Audit failed. Check integration connections.')
        return
      }
      setMappings(data.findings ?? [])
      setDone(true)
    } catch {
      setError('Network error — could not reach the server.')
    } finally {
      setRunning(false)
    }
  }

  async function handleAction(id: string, action: 'approved' | 'rejected') {
    setApprovingId(id)
    try {
      const res = await fetch('/api/discovery/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const updated = await res.json() as FieldMapping
      setMappings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
    } catch {
      // ignore
    } finally {
      setApprovingId(null)
    }
  }

  // Build a lookup by concept (use latest entry per concept)
  const byConceptMap: Record<string, FieldMapping> = {}
  for (const m of mappings) {
    byConceptMap[m.concept] = m
  }

  const hasResults = mappings.length > 0
  const approvedCount = mappings.filter((m) => m.status === 'approved').length

  return (
    <div className="space-y-5">
      {/* Run Audit bar */}
      <div className={`flex items-center justify-between bg-graphite-800 border rounded-xl px-5 py-4 ${bothConnected ? 'border-white/5' : 'border-white/5'}`}>
        <div>
          <p className="text-white font-medium">Run Discovery Audit</p>
          <p className="text-white/40 text-sm mt-0.5">
            {bothConnected
              ? hasResults
                ? `${approvedCount} of ${CONCEPT_ORDER.length} definitions approved.`
                : 'Both integrations connected. Click Start Audit to inspect your live environment.'
              : 'Requires both Salesforce and Pardot integrations to be connected.'}
          </p>
        </div>
        <button
          onClick={runAudit}
          disabled={running || !bothConnected}
          className={`text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${bothConnected ? 'gradient-core-flow hover:opacity-90' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
        >
          {running ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Scanning…
            </span>
          ) : hasResults ? 'Re-run Audit →' : 'Start Audit →'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Success flash */}
      {done && !error && (
        <div className="bg-accent-green/10 border border-accent-green/20 rounded-xl px-5 py-3 text-accent-green text-sm">
          ✓ Audit complete — {mappings.length} definitions detected. Review and approve each one below.
        </div>
      )}

      {/* Running progress placeholder */}
      {running && (
        <div className="space-y-3">
          {CONCEPT_ORDER.map((c) => (
            <div key={c} className="bg-graphite-800 border border-white/5 rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-white/5 rounded w-48 mb-2" />
              <div className="h-3 bg-white/5 rounded w-72" />
            </div>
          ))}
        </div>
      )}

      {/* Concept cards */}
      {!running && (
        <div className="space-y-3">
          {CONCEPT_ORDER.map((conceptKey) => {
            const meta = CONCEPT_META[conceptKey]
            const mapping = byConceptMap[conceptKey]

            return (
              <div
                key={conceptKey}
                className={`bg-graphite-800 border rounded-xl p-5 transition ${
                  mapping?.status === 'approved'
                    ? 'border-accent-green/20'
                    : mapping?.status === 'rejected'
                    ? 'border-red-500/20'
                    : mapping
                    ? 'border-pulse-blue/20'
                    : 'border-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-semibold">{meta.label}</p>
                      <span className="text-white/20 text-xs font-mono">— {conceptKey}</span>
                    </div>
                    <p className="text-white/40 text-sm mb-3">{meta.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs font-mono">
                      <span className="text-white/30">
                        Platform: <span className="text-white/60">{mapping?.platform ?? meta.platform}</span>
                      </span>
                      <span className="text-white/30">
                        Object: <span className="text-white/60">{mapping?.object ?? meta.defaultObject}</span>
                      </span>
                      {mapping?.fieldApiName && (
                        <span className="text-white/30">
                          Field: <span className="text-pulse-blue">{mapping.fieldApiName}</span>
                        </span>
                      )}
                    </div>
                    {mapping && <ConfidenceBar score={mapping.confidenceScore} />}
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    {mapping ? (
                      <StatusBadge status={mapping.status} />
                    ) : (
                      <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 text-white/25">
                        ○ not yet detected
                      </span>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => mapping && handleAction(mapping.id, 'approved')}
                        disabled={!mapping || mapping.status === 'approved' || approvingId === mapping?.id}
                        className="text-xs border border-white/10 text-white/40 px-3 py-1.5 rounded-lg hover:border-accent-green/40 hover:text-accent-green transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {approvingId === mapping?.id ? '…' : 'Approve'}
                      </button>
                      <button
                        onClick={() => mapping && handleAction(mapping.id, 'rejected')}
                        disabled={!mapping || mapping.status === 'rejected' || approvingId === mapping?.id}
                        className="text-xs border border-white/10 text-white/40 px-3 py-1.5 rounded-lg hover:border-red-500/40 hover:text-red-400 transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detected logic box */}
                {mapping?.detectedLogic && (
                  <div className="mt-4 pt-4 border-t border-white/5 bg-graphite-900/50 rounded-lg p-3">
                    <p className="text-white/30 text-xs font-mono mb-1.5">DETECTED LOGIC</p>
                    <p className="text-white/60 text-sm leading-relaxed">{mapping.detectedLogic}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
