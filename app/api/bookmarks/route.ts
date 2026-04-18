import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type MemoryBookmark = {
  id: string
  user_id: string
  title: string
  url: string
  description?: string
  favicon_url?: string
  created_at: string
}

declare global {
  // eslint-disable-next-line no-var
  var __scoutMemoryBookmarks: MemoryBookmark[] | undefined
}

function memoryStore(): MemoryBookmark[] {
  if (!globalThis.__scoutMemoryBookmarks) {
    globalThis.__scoutMemoryBookmarks = []
  }
  return globalThis.__scoutMemoryBookmarks
}

function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function requireUser(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return {
      error: NextResponse.json(
        { error: 'Please sign in.' },
        { status: 401 },
      ),
    }
  }
  return { userId }
}

export async function GET(request: NextRequest) {
  const auth = requireUser(request)
  if ('error' in auth) return auth.error

  const supabase = getSupabaseClient()
  if (!supabase) {
    const store = memoryStore().filter((b) => b.user_id === auth.userId)
    return NextResponse.json({ bookmarks: store })
  }

  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ bookmarks: data || [] })
  } catch (error) {
    console.error('[scout] bookmarks GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = requireUser(request)
  if ('error' in auth) return auth.error

  let body: {
    title?: string
    url?: string
    description?: string
    favicon_url?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const { title, url, description, favicon_url } = body
  if (!title || !url) {
    return NextResponse.json(
      { error: 'Title and URL are required' },
      { status: 400 },
    )
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    const store = memoryStore()
    const bookmark: MemoryBookmark = {
      id:
        typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `b_${Math.random().toString(36).slice(2)}`,
      user_id: auth.userId,
      title,
      url,
      description,
      favicon_url,
      created_at: new Date().toISOString(),
    }
    store.unshift(bookmark)
    return NextResponse.json({ bookmark }, { status: 201 })
  }

  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert([
        {
          user_id: auth.userId,
          title,
          url,
          description,
          favicon_url,
        },
      ])
      .select()
    if (error) throw error
    return NextResponse.json({ bookmark: data?.[0] }, { status: 201 })
  } catch (error) {
    console.error('[scout] bookmarks POST:', error)
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireUser(request)
  if ('error' in auth) return auth.error

  const bookmarkId = request.nextUrl.searchParams.get('id')
  if (!bookmarkId) {
    return NextResponse.json(
      { error: 'Bookmark id is required' },
      { status: 400 },
    )
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    const store = memoryStore()
    const idx = store.findIndex(
      (b) => b.id === bookmarkId && b.user_id === auth.userId,
    )
    if (idx >= 0) store.splice(idx, 1)
    return NextResponse.json({ success: true })
  }

  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', bookmarkId)
      .eq('user_id', auth.userId)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[scout] bookmarks DELETE:', error)
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 },
    )
  }
}
