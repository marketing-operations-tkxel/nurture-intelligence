import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import { prisma } from '@/lib/prisma'
import { ROLE_LABELS } from '@/lib/utils'

async function getUsers() {
  try {
    return await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })
  } catch {
    return []
  }
}

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-pulse-blue/15 text-pulse-blue',
  ADMIN: 'bg-pulse-blue/10 text-pulse-300',
  EXECUTIVE: 'bg-accent-yellow/10 text-accent-yellow',
  NURTURE_OPS: 'bg-accent-green/10 text-accent-green',
  SALES_LEADERSHIP: 'bg-accent-red/10 text-accent-red',
}

export default async function UsersPage() {
  const session = await auth()
  const users = await getUsers()

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="User Management"
        subtitle="Manage access, roles and permissions"
        userName={session?.user?.name}
        userRole={session?.user?.role!}
      />

      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <button className="gradient-core-flow text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition">
            + Invite User
          </button>
        </div>

        <div className="bg-graphite-800 border border-white/5 rounded-xl overflow-hidden">
          {users.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-white/40 text-sm">No users found. Invite team members to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-white/25 text-xs font-mono uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/2">
                    <td className="px-5 py-3 text-white font-medium">{u.name || '—'}</td>
                    <td className="px-5 py-3 text-white/50 font-mono text-xs">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${roleColors[u.role] || 'bg-white/5 text-white/30'}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-mono ${u.active ? 'text-accent-green' : 'text-white/20'}`}>
                        {u.active ? '● active' : '○ inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-white/30 font-mono text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <button className="text-xs text-white/30 hover:text-white transition px-2 py-1 rounded hover:bg-white/5">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
