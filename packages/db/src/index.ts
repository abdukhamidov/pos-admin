import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Optional logging: set PRISMA_LOG to comma-separated levels, e.g. "warn,error,query"
function getPrismaLogLevels(): any {
  const raw = process.env.PRISMA_LOG
  if (!raw) return undefined
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean)
  return parts as any
}

export const prisma = global.prisma || new PrismaClient({
  log: getPrismaLogLevels(),
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export * from '@prisma/client'

// Graceful shutdown to avoid leaking idle connections
const disconnect = async () => {
  try {
    await prisma.$disconnect()
  } catch {}
}

process.once('beforeExit', disconnect)
process.once('SIGINT', async () => {
  await disconnect()
  process.exit(0)
})
process.once('SIGTERM', async () => {
  await disconnect()
  process.exit(0)
})
