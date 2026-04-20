import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import { prisma } from '@/lib/prisma'
import DiscoveryClient from './DiscoveryClient'

export default async function DiscoveryPage() {
  const session = await auth()

  const [mappings, integrations] = await Promise.all([
    prisma.fieldMapping.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.integration.findMany(),
  ])

  const sfConnected = integrations.find((i) => i.platform === 'salesforce')?.status === 'connected'
  const pardotConnected = integrations.find((i) => i.platform === 'pardot')?.status === 'connected'
  const bothConnected = sfConnected && pardotConnected

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
              The system inspects your live Salesforce and Pardot environment to detect how MQL, SQL, discovery calls,
              engaged contacts, and attribution are currently represented. It proposes definitions with a confidence score.
              Review and approve each definition before it is used in production dashboards.
            </p>
          </div>
        </div>

        {!bothConnected && (
          <div className="bg-yellow-500/8 border border-yellow-500/15 rounded-xl px-5 py-4 flex items-center gap-3">
            <svg className="w-4 h-4 text-yellow-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
            <p className="text-yellow-400/80 text-sm">
              {!sfConnected && !pardotConnected
                ? 'Both Salesforce and Pardot integrations must be connected before running a discovery audit.'
                : !sfConnected
                ? 'Salesforce integration is not connected.'
                : 'Pardot integration is not connected.'}
              {' '}
              <a href="/admin/integrations" className="underline underline-offset-2 hover:text-yellow-300 transition">
                Go to Integrations →
              </a>
            </p>
          </div>
        )}

        <DiscoveryClient
          initialMappings={mappings as Parameters<typeof DiscoveryClient>[0]['initialMappings']}
          bothConnected={bothConnected}
        />
      </div>
    </div>
  )
}
