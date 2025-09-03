import { prisma } from '../src'
import bcrypt from 'bcryptjs'

async function main() {
  // Branch + default warehouse
  const branch = await prisma.branch.upsert({
    where: { name: 'Main' },
    update: {},
    create: { name: 'Main' },
  })
  const warehouse = await prisma.warehouse.findFirst({ where: { branchId: branch.id, isDefault: true } })
    ?? await prisma.warehouse.create({ data: { name: 'Main Warehouse', branchId: branch.id, isDefault: true } })

  // Users
  const adminPassword = await bcrypt.hash('admin123', 11)
  const sellerPassword = await bcrypt.hash('seller123', 11)

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', passwordHash: adminPassword, name: 'Administrator', role: 'ADMIN', branchId: null },
  })

  const seller = await prisma.user.upsert({
    where: { username: 'seller' },
    update: { branchId: branch.id },
    create: { username: 'seller', passwordHash: sellerPassword, name: 'Default Seller', role: 'SELLER', branchId: branch.id },
  })

  // Categories
  const drinks = await prisma.category.upsert({ where: { name: 'Drinks' }, update: {}, create: { name: 'Drinks', description: 'Beverages' } })
  const snacks = await prisma.category.upsert({ where: { name: 'Snacks' }, update: {}, create: { name: 'Snacks', description: 'Snack foods' } })

  // Products
  const cola = await prisma.product.upsert({ where: { sku: 'COLA-05L' }, update: {}, create: { name: 'Cola 0.5L', sku: 'COLA-05L', price: 12000, categoryId: drinks.id, isActive: true } })
  const chips = await prisma.product.upsert({ where: { sku: 'CHIPS-90G' }, update: {}, create: { name: 'Chips 90g', sku: 'CHIPS-90G', price: 15000, categoryId: snacks.id, isActive: true } })

  await prisma.inventory.upsert({ where: { productId_warehouseId: { productId: cola.id, warehouseId: warehouse.id } }, update: { qty: 50 }, create: { productId: cola.id, warehouseId: warehouse.id, qty: 50 } })
  await prisma.inventory.upsert({ where: { productId_warehouseId: { productId: chips.id, warehouseId: warehouse.id } }, update: { qty: 30 }, create: { productId: chips.id, warehouseId: warehouse.id, qty: 30 } })

  console.log('Seed complete:', { admin: admin.username, seller: seller.username, branch: branch.name })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

