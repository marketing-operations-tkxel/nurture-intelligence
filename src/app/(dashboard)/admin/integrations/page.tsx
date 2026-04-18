import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import { prisma } from '@/lib/prisma'
import IntegrationsClient from './IntegrationsClient'

async function getIntegrations() {
  try {
    return await prisma.integration.findMany()
  } catch {
    return []
  }
}

export default async function IntegrationsPage() {
  const session = await auth()
  const integrations = await getIntegrations()

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Integrations"
        subtitle="Manage Salesforce and Account Engagement connections"
        userName={session?.user?.name}
        userRole={session?.user?.role!}
      />
      <div className="p-6">
        <IntegrationsClient integrations={integrations} />
      </div>
    </div>
  )
}
