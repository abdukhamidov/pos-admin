import { NextResponse } from 'next/server'

const ADMIN_COOKIE = process.env.ADMIN_SESSION_COOKIE || 'mini_crm_admin'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(ADMIN_COOKIE, '', { path: '/', httpOnly: true, maxAge: 0 })
  return res
}
