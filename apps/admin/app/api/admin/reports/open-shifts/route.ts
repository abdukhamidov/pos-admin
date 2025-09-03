import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSessionFromRequest } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const branchId = searchParams.get('branchId') || undefined
  const seller = searchParams.get('seller') || undefined

  const where: any = { endedAt: null }
  if (branchId) where.branchId = branchId
  if (seller) where.sellerId = seller

  const rows = await prisma.shift.findMany({
    where,
    include: { seller: true, branch: true },
    orderBy: { startedAt: 'desc' },
    take: 200,
  })

  return NextResponse.json(rows.map(sh => ({
    id: sh.id,
    seller: sh.seller?.name || sh.seller?.username,
    branch: sh.branch?.name,
    startedAt: sh.startedAt,
  })))
}

