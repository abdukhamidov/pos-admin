import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { z } from 'zod'
import { getSessionFromRequest } from '@/lib/rbac'

const updateSchema = z.object({ name: z.string().min(1).optional() })

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  const data: any = {}
  if (parsed.data.name !== undefined) data.name = parsed.data.name
  const b = await prisma.branch.update({ where: { id: params.id }, data })
  return NextResponse.json(b)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const id = params.id
  const users = await prisma.user.count({ where: { branchId: id } })
  const warehouses = await prisma.warehouse.count({ where: { branchId: id } })
  if (users > 0 || warehouses > 0) return NextResponse.json({ error: 'HAS_DEPENDENCIES' }, { status: 400 })
  await prisma.branch.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

