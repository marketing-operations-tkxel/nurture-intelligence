import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding Nurture Intelligence database...')

  // Users
  const password = await bcrypt.hash('Admin@NI2026', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@tkxel.com' },
    update: {},
    create: {
      name: 'NI Admin',
      email: 'admin@tkxel.com',
      password,
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { email: 'exec@tkxel.com' },
    update: {},
    create: {
      name: 'C-Level User',
      email: 'exec@tkxel.com',
      password,
      role: 'EXECUTIVE',
    },
  })

  await prisma.user.upsert({
    where: { email: 'ops@tkxel.com' },
    update: {},
    create: {
      name: 'Nurture Ops',
      email: 'ops@tkxel.com',
      password,
      role: 'NURTURE_OPS',
    },
  })

  await prisma.user.upsert({
    where: { email: 'sales@tkxel.com' },
    update: {},
    create: {
      name: 'Sales Lead',
      email: 'sales@tkxel.com',
      password,
      role: 'SALES_LEADERSHIP',
    },
  })

  // Benchmark defaults
  const benchmarks = [
    { metric: 'open_rate', warningThreshold: 20, criticalThreshold: 15, inactivityDays: null },
    { metric: 'bounce_rate', warningThreshold: 3, criticalThreshold: 5, inactivityDays: null },
    { metric: 'spam_rate', warningThreshold: 0.1, criticalThreshold: 0.3, inactivityDays: null },
    { metric: 'unsub_rate', warningThreshold: 0.5, criticalThreshold: 1.0, inactivityDays: null },
    { metric: 'click_rate', warningThreshold: 2, criticalThreshold: 1, inactivityDays: null },
    { metric: 'inactivity_days', warningThreshold: null, criticalThreshold: null, inactivityDays: 90 },
  ]

  for (const b of benchmarks) {
    await prisma.benchmark.upsert({
      where: { metric: b.metric },
      update: {},
      create: b,
    })
  }

  // Integrations (disconnected by default)
  for (const platform of ['salesforce', 'pardot']) {
    const existing = await prisma.integration.findFirst({ where: { platform } })
    if (!existing) {
      await prisma.integration.create({
        data: { platform, status: 'disconnected' },
      })
    }
  }

  // Discovery report placeholder
  const existingReport = await prisma.discoveryReport.findFirst()
  if (!existingReport) {
    await prisma.discoveryReport.create({
      data: { status: 'pending' },
    })
  }

  console.log('✅ Seed complete')
  console.log('')
  console.log('Test credentials:')
  console.log('  Admin:      admin@tkxel.com / Admin@NI2026')
  console.log('  Executive:  exec@tkxel.com  / Admin@NI2026')
  console.log('  Ops:        ops@tkxel.com   / Admin@NI2026')
  console.log('  Sales:      sales@tkxel.com / Admin@NI2026')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
