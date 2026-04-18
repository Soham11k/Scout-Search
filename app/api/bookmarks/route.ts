import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSql, hasNeon } from '@/lib/db'

type BookmarkRow = {
  id: string
  user_id: string
  title: string
  url: string
  description?: string
  favicon_url?: string
  created_at: string
}

// ---------------------------------------------------------------------------
// In-memory fallback (dev only — wiped on restart)
// ---------------------------------------------------------------------------
declare global {
  // eslint-disable-next-line no-var
  var __scoutMemoryBookmarks: BookmarkRow[] | undefined
}
function memoryStore(): BookmarkRow[] {
  if (!globalThis.__scoutMemoryBookmarks) globalThis.__scoutMemoryBookmarks = []
  return globalThis.__scoutMemoryBookmarks
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------
function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}

function getLegacyClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

type AuthResult =
  | { kind: 'supabase'; userId: string; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> }
  | { kind: 'neon'; userEmail: string }
  | { kind: 'legacy'; userId: string }
  | { kind: 'memory'; userId: string }
  | { kind: 'unauthorized' }

async function authenticate(request: NextRequest): Promise<AuthResult> {
  // 1. Supabase (most secure — cookie-based, server-verified)
  if (hasSupabaseEnv()) {
    try {
      const supabase = await createSupabaseServerClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return { kind: 'unauthorized' }
      return { kind: 'supabase', userId: user.id, supabase }
    } catch {
      return { kind: 'unauthorized' }
    }
  }

  // 2. Neon — keyed by email sent from the local auth client
  if (hasNeon()) {
    const email = request.headers.get('x-user-email')?.trim().toLowerCase()
    if (!email || !email.includes('@')) return { kind: 'unauthorized' }
    return { kind: 'neon', userEmail: email }
  }

  // 3. Legacy Supabase anon (fallback for partial config)
  const headerId = request.headers.get('x-user-id')
  if (!headerId) return { kind: 'unauthorized' }

  const legacyClient = getLegacyClient()
  if (legacyClient) return { kind: 'legacy', userId: headerId }

  // 4. Pure in-memory
  return { kind: 'memory', userId: headerId }
}

// ---------------------------------------------------------------------------
// GET /api/bookmarks
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const auth = await authenticate(request)
  if (auth.kind === 'unauthorized') {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  }

  // Supabase
  if (auth.kind === 'supabase') {
    try {
      const { data, error } = await auth.supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', auth.userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return NextResponse.json({ bookmarks: data ?? [] })
    } catch (e) {
      console.error('[scout] bookmarks GET supabase:', e)
      return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 })
    }
  }

  // Neon
  if (auth.kind === 'neon') {
    const sql = getSql()!
    try {
      const rows = await sql`
        SELECT id, user_id, title, url, description, favicon_url, created_at
        FROM bookmarks
        WHERE user_email = ${auth.userEmail}
        ORDER BY created_at DESC
      `
      return NextResponse.json({ bookmarks: rows })
    } catch (e) {
      console.error('[scout] bookmarks GET neon:', e)
      return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 })
    }
  }

  // Legacy Supabase client
  if (auth.kind === 'legacy') {
    const supabase = getLegacyClient()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', auth.userId)
          .order('created_at', { ascending: false })
        if (error) throw error
        return NextResponse.json({ bookmarks: data ?? [] })
      } catch (e) {
        console.error('[scout] bookmarks GET legacy:', e)
        return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 })
      }
    }
  }

  // Memory
  const store = memoryStore().filter((b) => b.user_id === (auth as { userId: string }).userId)
  return NextResponse.json({ bookmarks: store })
}

// ---------------------------------------------------------------------------
// POST /api/bookmarks
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const auth = await authenticate(request)
  if (auth.kind === 'unauthorized') {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  }

  let body: { title?: string; url?: string; description?: string; favicon_url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const { title, url, description, favicon_url } = body
  if (!title || !url) {
    return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 })
  }

  // Supabase
  if (auth.kind === 'supabase') {
    try {
      const { data, error } = await auth.supabase
        .from('bookmarks')
        .insert([{ user_id: auth.userId, title, url, description, favicon_url }])
        .select()
      if (error) throw error
      return NextResponse.json({ bookmark: data?.[0] }, { status: 201 })
    } catch (e) {
      console.error('[scout] bookmarks POST supabase:', e)
      return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 })
    }
  }

  // Neon
  if (auth.kind === 'neon') {
    const sql = getSql()!
    try {
      const rows = await sql`
        INSERT INTO bookmarks (user_email, title, url, description, favicon_url)
        VALUES (${auth.userEmail}, ${title}, ${url}, ${description ?? null}, ${favicon_url ?? null})
        RETURNING id, user_email AS user_id, title, url, description, favicon_url, created_at
      `
      return NextResponse.json({ bookmark: rows[0] }, { status: 201 })
    } catch (e) {
      console.error('[scout] bookmarks POST neon:', e)
      return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 })
    }
  }

  // Legacy Supabase client
  if (auth.kind === 'legacy') {
    const supabase = getLegacyClient()
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .insert([{ user_id: auth.userId, title, url, description, favicon_url }])
          .select()
        if (error) throw error
        return NextResponse.json({ bookmark: data?.[0] }, { status: 201 })
      } catch (e) {
        console.error('[scout] bookmarks POST legacy:', e)
        return NextResponse.json({ error: 'Failed to create bookmark' }, { status: 500 })
      }
    }
  }

  // Memory
  const store = memoryStore()
  const bookmark: BookmarkRow = {
    id: typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `b_${Math.random().toString(36).slice(2)}`,
    user_id: (auth as { userId: string }).userId,
    title,
    url,
    description,
    favicon_url,
    created_at: new Date().toISOString(),
  }
  store.unshift(bookmark)
  return NextResponse.json({ bookmark }, { status: 201 })
}

// ---------------------------------------------------------------------------
// DELETE /api/bookmarks?id=...
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  const auth = await authenticate(request)
  if (auth.kind === 'unauthorized') {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  }

  const bookmarkId = request.nextUrl.searchParams.get('id')
  if (!bookmarkId) {
    return NextResponse.json({ error: 'Bookmark id is required' }, { status: 400 })
  }

  // Supabase
  if (auth.kind === 'supabase') {
    try {
      const { error } = await auth.supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', auth.userId)
      if (error) throw error
      return NextResponse.json({ success: true })
    } catch (e) {
      console.error('[scout] bookmarks DELETE supabase:', e)
      return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 })
    }
  }

  // Neon
  if (auth.kind === 'neon') {
    const sql = getSql()!
    try {
      await sql`
        DELETE FROM bookmarks
        WHERE id = ${bookmarkId} AND user_email = ${auth.userEmail}
      `
      return NextResponse.json({ success: true })
    } catch (e) {
      console.error('[scout] bookmarks DELETE neon:', e)
      return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 })
    }
  }

  // Legacy Supabase client
  if (auth.kind === 'legacy') {
    const supabase = getLegacyClient()
    if (supabase) {
      try {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('id', bookmarkId)
          .eq('user_id', auth.userId)
        if (error) throw error
        return NextResponse.json({ success: true })
      } catch (e) {
        console.error('[scout] bookmarks DELETE legacy:', e)
        return NextResponse.json({ error: 'Failed to delete bookmark' }, { status: 500 })
      }
    }
  }

  // Memory
  const store = memoryStore()
  const idx = store.findIndex(
    (b) => b.id === bookmarkId && b.user_id === (auth as { userId: string }).userId,
  )
  if (idx >= 0) store.splice(idx, 1)
  return NextResponse.json({ success: true })
}
