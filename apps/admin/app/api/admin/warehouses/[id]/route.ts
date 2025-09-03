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
  const url = new URL(req.url)
  const targetWarehouseId = url.searchParams.get('targetWarehouseId') || undefined

  const w = await prisma.warehouse.findUnique({ where: { id: params.id } })
  if (!w) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const invCount = await prisma.inventory.count({ where: { warehouseId: params.id } })
  if (invCount > 0) {
    // If there is stock, allow deletion only when a target warehouse in the same branch is provided (or can be inferred)
    let targetId = targetWarehouseId
    if (!targetId) {
      // pick a default or any other warehouse in the same branch automatically
      const candidate = await prisma.warehouse.findFirst({ where: { branchId: w.branchId, NOT: { id: w.id }, OR: [{ isDefault: true }, {}] }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }] as any })
      if (candidate) targetId = candidate.id
    }
    if (!targetId) {
      return NextResponse.json({ error: 'HAS_STOCK', message: 'Move stock to another warehouse first or pass targetWarehouseId' }, { status: 400 })
    }
    const target = await prisma.warehouse.findUnique({ where: { id: targetId } })
    if (!target || target.branchId !== w.branchId) {
      return NextResponse.json({ error: 'INVALID_TARGET', message: 'Target warehouse must be in the same branch' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      const rows = await tx.inventory.findMany({ where: { warehouseId: w.id } })
      for (const r of rows) {
        await tx.inventory.upsert({
          where: { productId_warehouseId: { productId: r.productId, warehouseId: target.id } },
          update: { qty: { increment: r.qty } },
          create: { productId: r.productId, warehouseId: target.id, qty: r.qty },
        })
      }
      await tx.inventory.deleteMany({ where: { warehouseId: w.id } })
      await tx.warehouse.delete({ where: { id: w.id } })
    })
    return NextResponse.json({ ok: true, movedTo: targetId })
  }

  await prisma.warehouse.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
