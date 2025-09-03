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
  await prisma.$transaction(async (tx) => {
    // Удаляем продажи и их позиции по филиалу
    await tx.saleItem.deleteMany({ where: { sale: { is: { branchId: id } } } })
    await tx.sale.deleteMany({ where: { branchId: id } })
    // Удаляем смены по филиалу
    await tx.shift.deleteMany({ where: { branchId: id } })
    // Движения склада и остатки через склады этого филиала
    const whs = await tx.warehouse.findMany({ where: { branchId: id }, select: { id: true } })
    const whIds = whs.map(w => w.id)
    if (whIds.length > 0) {
      await tx.stockMove.deleteMany({ where: { warehouseId: { in: whIds } } })
      await tx.inventory.deleteMany({ where: { warehouseId: { in: whIds } } })
      await tx.warehouse.deleteMany({ where: { id: { in: whIds } } })
    }
    // Пользователи будут отвязаны автоматически (branchId nullable with onDelete SetNull)
    await tx.branch.delete({ where: { id } })
  })
  return NextResponse.json({ ok: true })
}
