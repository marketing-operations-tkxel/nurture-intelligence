import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const mappings = await prisma.fieldMapping.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(mappings)
  } catch (err) {
    console.error('[GET /api/discovery/mappings]', err)
    return NextResponse.json({ error: 'Failed to load mappings' }, { status: 500 })
  }
}
