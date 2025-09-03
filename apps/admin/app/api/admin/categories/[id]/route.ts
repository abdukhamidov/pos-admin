import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { z } from 'zod'
import { getSessionFromRequest } from '@/lib/rbac'
import { audit } from '@/lib/audit'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  const data: any = {}
  if (parsed.data.name !== undefined) data.name = parsed.data.name
  if (parsed.data.description !== undefined) data.description = parsed.data.description
  try {
    const cat = await prisma.category.update({ where: { id }, data })
    await audit('CATEGORY_UPDATE', session.sub, { id, data })
    return NextResponse.json(cat)
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'DUPLICATE_NAME' }, { status: 409 })
    }
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { id } = params
  // Удаляем зависимые данные продуктов этой категории и саму категорию
  await prisma.$transaction(async (tx) => {
    const productIds = (await tx.product.findMany({ where: { categoryId: id }, select: { id: true } })).map(p => p.id)
    if (productIds.length > 0) {
      // удаляем связанные записи продаж и движений склада по товарам
      await tx.saleItem.deleteMany({ where: { productId: { in: productIds } } })
      await tx.stockMove.deleteMany({ where: { productId: { in: productIds } } })
      await tx.inventory.deleteMany({ where: { productId: { in: productIds } } })
      await tx.product.deleteMany({ where: { id: { in: productIds } } })
    }
    await tx.category.delete({ where: { id } })
  })
  await audit('CATEGORY_DELETE', session.sub, { id })
  return NextResponse.json({ ok: true })
}
