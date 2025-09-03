import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(categories)
}

