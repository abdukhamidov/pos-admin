import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSessionFromRequest } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const user = searchParams.get('user')

  const where: any = {}
  if (from || to) where.createdAt = {
    gte: from ? new Date(from) : undefined,
    lte: to ? new Date(to) : undefined,
  }
  if (user) where.userId = user

  const logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 })
  return NextResponse.json(logs)
}

