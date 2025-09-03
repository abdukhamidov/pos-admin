import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@mini/db'
import bcrypt from 'bcryptjs'
import { signSession } from '@mini/auth'

const POS_COOKIE = process.env.POS_SESSION_COOKIE || 'mini_crm_pos'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 })

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 })

  // POS allows both SELLER and ADMIN to log in
  const token = await signSession({ sub: user.id, role: user.role, username: user.username, name: user.name })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(POS_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    // 7 days to avoid frequent re-auth during dev
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
