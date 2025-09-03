import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { z } from 'zod'
import { getSessionFromRequest } from '@/lib/rbac'

const updateSchema = z.object({ name: z.string().min(1).optional(), isDefault: z.boolean().optional(), branchId: z.string().optional() })

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const body = await req.json();
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  const w = await prisma.warehouse.findUnique({ where: { id: params.id } })
  if (!w) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  const updated = await prisma.$transaction(async (tx) => {
    const targetBranchId = parsed.data.branchId ?? w.branchId
    const branchChanging = parsed.data.branchId !== undefined && parsed.data.branchId !== w.branchId

    // If making default explicitly OR moving a warehouse that is already default,
    // ensure uniqueness of default inside the target branch by clearing others first.
    if (parsed.data.isDefault === true || (branchChanging && w.isDefault)) {
      await tx.warehouse.updateMany({ where: { branchId: targetBranchId }, data: { isDefault: false } })
    }

    // If branch is changing and isDefault was not provided, keep current default flag as-is
    // (it will carry over to the new branch). If you want to force reset, pass isDefault explicitly.
    return tx.warehouse.update({ where: { id: params.id }, data: parsed.data })
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const w = await prisma.warehouse.findUnique({ where: { id: params.id } })
  if (!w) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  await prisma.$transaction(async (tx) => {
    await tx.stockMove.deleteMany({ where: { warehouseId: w.id } })
    await tx.inventory.deleteMany({ where: { warehouseId: w.id } })
    await tx.warehouse.delete({ where: { id: w.id } })
  })
  return NextResponse.json({ ok: true })
}
