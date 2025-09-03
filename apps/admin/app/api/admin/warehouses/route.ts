import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { z } from 'zod'
import { getSessionFromRequest } from '@/lib/rbac'

const createSchema = z.object({ name: z.string().min(1), branchId: z.string().min(1), isDefault: z.boolean().optional() })

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const list = await prisma.warehouse.findMany({ include: { branch: true }, orderBy: [{ branch: { name: 'asc' } }, { name: 'asc' }] })
  return NextResponse.json(list.map(w => ({ id: w.id, name: w.name, branchId: w.branchId, branch: { id: w.branch.id, name: w.branch.name }, isDefault: w.isDefault })))
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  const { name, branchId, isDefault = false } = parsed.data
  const created = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.warehouse.updateMany({ where: { branchId }, data: { isDefault: false } })
    }
    return tx.warehouse.create({ data: { name, branchId, isDefault } })
  })
  return NextResponse.json(created)
}

