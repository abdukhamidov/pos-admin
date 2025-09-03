import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { getSessionFromRequest } from '@/lib/rbac'

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const threshold = Number(searchParams.get('threshold') ?? 5)
  const branchId = searchParams.get('branchId') || undefined
  const includeInventory = branchId
    ? { where: { warehouse: { branchId } } }
    : {}
  const activeProducts = await prisma.product.findMany({ where: { isActive: true }, include: { inventory: { ...(includeInventory as any) } }, orderBy: { name: 'asc' } })
  const items = activeProducts
    .map((p) => ({ ...p, stock: p.inventory.map((i) => i.qty).reduce((s, q) => s + q, 0) }))
    .filter((p) => p.stock <= (isFinite(threshold) ? threshold : 5))
    .slice(0, 50)
    .map((p) => ({ id: p.id, name: p.name, sku: p.sku, price: p.price, stock: p.stock }))
  return NextResponse.json(items)
}
