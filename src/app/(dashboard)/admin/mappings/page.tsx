import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import { prisma } from '@/lib/prisma'

async function getMappings() {
  try {
    return await prisma.fieldMapping.findMany({ orderBy: { createdAt: 'asc' } })
  } catch {
    return []
  }
}

const statusStyle: Record<string, string> = {
  pending: 'bg-accent-yellow/10 text-accent-yellow',
  approved: 'bg-accent-green/10 text-accent-green',
  rejected: 'bg-accent-red/10 text-accent-red',
}

export default async function MappingsPage() {
  const session = await auth()
  const mappings = await getMappings()

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Field Mappings"
        subtitle="Review and approve detected field definitions for production dashboards"
        userName={session?.user?.name}
        userRole={session?.user?.role!}
      />

      <div className="p-6">
        {mappings.length === 0 ? (
          <div className="bg-graphite-800 border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center text-center">
            <svg className="w-10 h-10 text-white/10 mb-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <p className="text-white/50 font-medium mb-1">No mappings detected yet</p>
            <p className="text-white/25 text-sm mb-4">Run Phase 0 Discovery to detect field definitions from your live Salesforce and Pardot environment.</p>
            <a href="/admin/discovery" className="gradient-core-flow text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition">
              Go to Field Discovery →
            </a>
          </div>
        ) : (
          <div className="bg-graphite-800 border border-white/5 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Concept', 'Platform', 'Object', 'Field', 'Confidence', 'Status', 'Version', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-white/25 text-xs font-mono uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mappings.map((m) => (
                  <tr key={m.id} className="hover:bg-white/2">
                    <td className="px-4 py-3 text-white font-medium">{m.concept}</td>
                    <td className="px-4 py-3 text-white/50 font-mono text-xs">{m.platform}</td>
                    <td className="px-4 py-3 text-white/50">{m.object}</td>
                    <td className="px-4 py-3 text-white/50 font-mono text-xs">{m.fieldApiName || '—'}</td>
                    <td className="px-4 py-3">
                      {m.confidenceScore != null ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-graphite-700 rounded-full overflow-hidden">
                            <div
                              className="h-full gradient-core-flow rounded-full"
                              style={{ width: `${m.confidenceScore * 100}%` }}
                            />
                          </div>
                          <span className="text-white/50 text-xs font-mono">
                            {(m.confidenceScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${statusStyle[m.status] || 'text-white/30'}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/30 font-mono text-xs">v{m.version}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-xs text-accent-green hover:text-white transition px-2 py-1 rounded bg-accent-green/10 hover:bg-accent-green/20">
                          Approve
                        </button>
                        <button className="text-xs text-white/30 hover:text-accent-red transition px-2 py-1 rounded hover:bg-accent-red/10">
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
