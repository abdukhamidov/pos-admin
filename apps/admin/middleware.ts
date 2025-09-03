import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@mini/auth'

const ADMIN_COOKIE = process.env.ADMIN_SESSION_COOKIE || 'mini_crm_admin'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname.startsWith('/login') || pathname.startsWith('/api/login')) {
    return NextResponse.next()
  }

  const token = req.cookies.get(ADMIN_COOKIE)?.value
  const session = token ? await verifySession(token) : null

  if (!session) {
    const url = new URL('/login', req.url)
    return NextResponse.redirect(url)
  }

  // Admin-only pages under '/'; allow everything if ADMIN.
  if (session.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|assets|images).*)'],
}
