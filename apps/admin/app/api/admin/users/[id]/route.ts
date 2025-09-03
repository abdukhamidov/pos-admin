import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getSessionFromRequest } from '@/lib/rbac'
import { audit } from '@/lib/audit'

const updateSchema = z.object({
  username: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'SELLER']).optional(),
  password: z.string().min(8).optional(),
  branchId: z.string().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })

  const data: any = {}
  if (parsed.data.username !== undefined) data.username = parsed.data.username
  if (parsed.data.name !== undefined) data.name = parsed.data.name
  if (parsed.data.role !== undefined) data.role = parsed.data.role
  if (parsed.data.branchId !== undefined) data.branchId = parsed.data.branchId
  if (parsed.data.password) data.passwordHash = await bcrypt.hash(parsed.data.password, 11)

  try {
    const user = await prisma.user.update({ where: { id }, data })
    await audit('USER_UPDATE', session.sub, { id, data: { ...data, passwordHash: data.passwordHash ? 'UPDATED' : undefined } })
    return NextResponse.json(user)
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'DUPLICATE_USERNAME' }, { status: 409 })
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = params
  const hasSales = await prisma.sale.count({ where: { sellerId: id } })
  const hasShifts = await prisma.shift.count({ where: { sellerId: id } })
  if (hasSales > 0 || hasShifts > 0) return NextResponse.json({ error: 'HAS_ACTIVITY' }, { status: 400 })
  await prisma.user.delete({ where: { id } })
  await audit('USER_DELETE', session.sub, { id })
  return NextResponse.json({ ok: true })
}
