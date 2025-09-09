import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSessionFromRequest } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const warehouseId = searchParams.get('warehouseId') || undefined
  const productId = searchParams.get('productId') || undefined
  const userId = searchParams.get('userId') || undefined
  const branchId = searchParams.get('branchId') || undefined
  const query = searchParams.get('query') || undefined

  const where: any = { type: 'RECEIPT' as const }
  if (from || to) where.createdAt = { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined }
  if (warehouseId) where.warehouseId = warehouseId
  if (productId) where.productId = productId
  if (userId) where.userId = userId
  if (branchId) where.warehouse = { branchId }
  if (query) {
    where.product = {
      OR: [
        { name: { contains: query } },
        { sku: { contains: query } },
      ],
    }
  }

  const moves = await prisma.stockMove.findMany({
    where,
    include: { product: true, warehouse: true, user: true },
    orderBy: { createdAt: 'desc' },
    take: 1000,
  })

  const rows = moves.map((m) => ({
    id: m.id,
    createdAt: m.createdAt,
    productId: m.productId,
    productName: m.product?.name ?? '',
    sku: m.product?.sku ?? null,
    warehouseId: m.warehouseId,
    warehouseName: m.warehouse?.name ?? '',
    qty: m.delta,
    userId: m.userId,
    userName: m.user?.name ?? null,
    note: m.note ?? null,
  }))
  return NextResponse.json(rows)
}
