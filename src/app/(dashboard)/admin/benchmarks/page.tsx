import { auth } from '@/lib/auth'
import Header from '@/components/layout/Header'
import { prisma } from '@/lib/prisma'
import BenchmarksForm from './BenchmarksForm'

async function getBenchmarks() {
  try {
    return await prisma.benchmark.findMany({ orderBy: { metric: 'asc' } })
  } catch {
    return []
  }
}

export default async function BenchmarksPage() {
  const session = await auth()
  const benchmarks = await getBenchmarks()

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Benchmarks & Thresholds"
        subtitle="Configure alert thresholds for email health, inactivity, suppression, and recycle rules"
        userName={session?.user?.name}
        userRole={session?.user?.role!}
      />
      <div className="p-6">
        <BenchmarksForm initialBenchmarks={benchmarks} />
      </div>
    </div>
  )
}
