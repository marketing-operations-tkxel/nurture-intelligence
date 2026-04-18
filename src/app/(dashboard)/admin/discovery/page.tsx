import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'

const CONCEPTS = [
  {
    concept: 'MQL',
    label: 'Marketing Qualified Lead',
    description: 'Contacts that became Marketing Qualified Leads',
    platform: 'Salesforce CRM',
    object: 'Lead / Contact / Campaign Member',
    status: 'pending',
    confidence: null,
    detectedLogic: null,
  },
  {
    concept: 'SQL',
    label: 'Sales Qualified Lead',
    description: 'MQLs accepted or qualified by sales',
    platform: 'Salesforce CRM',
    object: 'Lead / Contact / Opportunity',
    status: 'pending',
    confidence: null,
    detectedLogic: null,
  },
  {
    concept: 'discovery_call',
    label: 'Discovery Call',
    description: 'Contacts or accounts with a completed discovery call',
    platform: 'Salesforce CRM',
    object: 'Task / Event / Custom Object',
    status: 'pending',
    confidence: null,
    detectedLogic: null,
  },
  {
    concept: 'engaged_contact',
    label: 'Engaged Contact',
    description: 'Contacts with qualifying engagement in selected period',
    platform: 'Account Engagement (Pardot)',
    object: 'Prospect Activity / CRM Activity',
    status: 'pending',
    confidence: null,
    detectedLogic: null,
  },
  {
    concept: 'attribution',
    label: 'Nurture Attribution',
    description: 'How pipeline and revenue are attributed to nurture sequences',
    platform: 'Salesforce CRM + Pardot',
    object: 'Campaign Member / Opportunity',
    status: 'pending',
    confidence: null,
    detectedLogic: null,
  },
]

export default async function DiscoveryPage() {
  const session = await auth()

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Field Discovery"
        subtitle="Phase 0 — Detect and approve business definitions from your live environment"
        userName={session?.user?.name}
        userRole={session?.user?.role!}
      />

      <div className="p-6 space-y-5">
        {/* Explainer */}
        <div className="bg-pulse-blue/8 border border-pulse-blue/15 rounded-xl p-5 flex gap-4">
          <svg className="w-5 h-5 text-pulse-blue shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
          <div>
            <p className="text-white font-medium mb-1">How Phase 0 Discovery Works</p>
            <p className="text-white/50 text-sm leading-relaxed">
              The system will inspect your live Salesforce and Pardot environment to detect how MQL, SQL, discovery calls, engaged contacts, and attribution are currently represented. It will propose definitions with a confidence score. You review and approve each definition before it is used in production dashboards.
            </p>
          </div>
        </div>

        {/* Run discovery button */}
        <div className="flex items-center justify-between bg-graphite-800 border border-white/5 rounded-xl px-5 py-4">
          <div>
            <p className="text-white font-medium">Run Discovery Audit</p>
            <p className="text-white/40 text-sm mt-0.5">Requires both Salesforce and Pardot integrations to be connected.</p>
          </div>
          <button className="gradient-core-flow text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition whitespace-nowrap">
            Start Audit →
          </button>
        </div>

        {/* Concept cards */}
        <div className="space-y-3">
          {CONCEPTS.map((c) => (
            <div key={c.concept} className="bg-graphite-800 border border-white/5 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold">{c.label}</p>
                    <span className="text-white/20 text-xs font-mono">— {c.concept}</span>
                  </div>
                  <p className="text-white/40 text-sm mb-3">{c.description}</p>
                  <div className="flex flex-wrap gap-3 text-xs font-mono">
                    <span className="text-white/30">Platform: <span className="text-white/60">{c.platform}</span></span>
                    <span className="text-white/30">Object: <span className="text-white/60">{c.object}</span></span>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-2">
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 text-white/25">
                    ○ not yet detected
                  </span>
                  <div className="flex gap-2">
                    <button className="text-xs border border-white/10 text-white/40 px-3 py-1.5 rounded-lg hover:border-white/20 hover:text-white/60 transition" disabled>
                      Approve
                    </button>
                    <button className="text-xs border border-white/10 text-white/40 px-3 py-1.5 rounded-lg hover:border-white/20 hover:text-white/60 transition" disabled>
                      Reject
                    </button>
                  </div>
                </div>
              </div>

              {c.detectedLogic && (
                <div className="mt-4 pt-4 border-t border-white/5 bg-graphite-900/50 rounded-lg p-3">
                  <p className="text-white/30 text-xs font-mono mb-1">DETECTED LOGIC</p>
                  <p className="text-white/60 text-sm font-mono">{c.detectedLogic}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
