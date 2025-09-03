import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { z } from 'zod'
import { getSessionFromRequest } from '@/lib/rbac'

const createSchema = z.object({ name: z.string().min(1) })

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const branches = await prisma.branch.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { users: true, warehouses: true } } } })
  return NextResponse.json(branches.map((b) => ({ id: b.id, name: b.name, users: b._count.users, warehouses: b._count.warehouses })))
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  const b = await prisma.branch.create({ data: { name: parsed.data.name } })
  return NextResponse.json(b)
}

