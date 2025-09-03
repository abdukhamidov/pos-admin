import { NextResponse } from 'next/server'

const POS_COOKIE = process.env.POS_SESSION_COOKIE || 'mini_crm_pos'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(POS_COOKIE, '', { path: '/', httpOnly: true, maxAge: 0 })
  return res
}

