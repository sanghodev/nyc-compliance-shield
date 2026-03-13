
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Define obfuscated admin path
  const ADMIN_PATH = '/shield-admin-dash'

  // Protect Admin Dashboard
  if (req.nextUrl.pathname.startsWith(ADMIN_PATH)) {
    if (!session) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Role check via user metadata (quick check, server client should verify via DB)
    const role = session.user.user_metadata?.role
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Protect Admin API routes
  if (req.nextUrl.pathname.startsWith('/api/admin')) {
    if (!session || session.user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  }

  return res
}

// Ensure middleware runs on relevant paths
export const config = {
  matcher: [
    '/shield-admin-dash/:path*',
    '/api/admin/:path*',
  ],
}
