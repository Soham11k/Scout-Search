import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/app'

  if (code) {
    const supabase = await createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      const dest = new URL('/login', url.origin)
      dest.searchParams.set(
        'error',
        encodeURIComponent(error.message || 'Google sign-in failed'),
      )
      return NextResponse.redirect(dest)
    }
  }

  return NextResponse.redirect(new URL(next, url.origin))
}
