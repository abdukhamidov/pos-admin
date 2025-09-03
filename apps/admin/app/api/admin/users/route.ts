import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { getSessionFromRequest } from '@/lib/rbac'
import { audit } from '@/lib/audit'

const createSchema = z.object({
  username: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'SELLER']),
  password: z.string().min(8),
  branchId: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  // Include branch and its default warehouse (isDefault=true) to expose warehouse name
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      branch: {
        include: {
          warehouses: {
            where: { isDefault: true },
            take: 1,
          },
        },
      },
    },
  })
  const mapped = users.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt,
    branchId: u.branchId ?? null,
    branchName: u.branch?.name ?? null,
    warehouseName: u.branch?.warehouses?.[0]?.name ?? null,
  }))
  return NextResponse.json(mapped)
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  const { username, name, role, password, branchId } = parsed.data
  try {
    const passwordHash = await bcrypt.hash(password, 11)
    if (role === 'SELLER' && !branchId) {
      return NextResponse.json({ error: 'BRANCH_REQUIRED' }, { status: 400 })
    }
    const user = await prisma.user.create({ data: { username, name, role, passwordHash, branchId: branchId ?? null } })
    await audit('USER_CREATE', session.sub, { id: user.id, username })
    return NextResponse.json(user)
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'DUPLICATE_USERNAME' }, { status: 409 })
    throw e
  }
}
