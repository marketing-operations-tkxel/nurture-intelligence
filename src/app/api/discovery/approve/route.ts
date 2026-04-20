import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { id, action } = await req.json() as { id: string; action: 'approved' | 'rejected' }

    if (!id || !['approved', 'rejected'].includes(action)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const mapping = await prisma.fieldMapping.update({
      where: { id },
      data: {
        status: action,
        approvedAt: action === 'approved' ? new Date() : null,
      },
    })

    return NextResponse.json(mapping)
  } catch (err) {
    console.error('[POST /api/discovery/approve]', err)
    return NextResponse.json({ error: 'Failed to update mapping' }, { status: 500 })
  }
}
