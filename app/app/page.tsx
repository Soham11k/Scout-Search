'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Sparkles, Keyboard, Globe, Search as SearchIcon } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SearchBar } from '@/components/search-bar'
import {
  SearchResults,
  SearchResultsSkeleton,
} from '@/components/search-results'
import { Sidebar } from '@/components/sidebar'
import { AiOverview } from '@/components/ai-overview'
import { BrowsePanel } from '@/components/browse-panel'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import type { Bookmark } from '@/lib/supabase'
import type { ImageStripItem, SearchResult } from '@/lib/search-types'

type AppMode = 'search' | 'browse'

const RECENTS_KEY = 'scout:recents'
const MAX_RECENTS = 10
const FIRST_SEARCH_TOAST_KEY = 'scout:first-search-toast'

const TRENDING = [
  'Slow mornings & tea pairings',
  'Best notebooks for fountain pens',
  'What to watch on a rainy Sunday',
  'Weekend trails near the coast',
  'Short stories under 20 minutes',
  'Beginner’s guide to sourdough',
]

function AppInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, status, mode: authMode } = useAuth()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = React.useState(initialQuery)
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(initialQuery !== '')
  const [recents, setRecents] = React.useState<string[]>([])
  const [durationMs, setDurationMs] = React.useState<number | null>(null)
  const [source, setSource] = React.useState<'demo' | 'bing' | 'google' | null>(null)
  const [imgSource, setImgSource] = React.useState<string | null>(null)
  const [cached, setCached] = React.useState(false)
  const [imageStrip, setImageStrip] = React.useState<ImageStripItem[]>([])

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(
        `/login?next=${encodeURIComponent(
          '/app' + (initialQuery ? `?q=${encodeURIComponent(initialQuery)}` : ''),
        )}`,
      )
    }
  }, [status, router, initialQuery])

  const recentsKey = user ? `${RECENTS_KEY}:${user.id}` : null

  React.useEffect(() => {
    if (!recentsKey) return
    try {
      const raw = localStorage.getItem(recentsKey)
      setRecents(raw ? JSON.parse(raw) : [])
    } catch {
      setRecents([])
    }
  }, [recentsKey])

  const persistRecents = React.useCallback(
    (next: string[]) => {
      setRecents(next)
      if (recentsKey) {
        try {
          localStorage.setItem(recentsKey, JSON.stringify(next))
        } catch {
          // ignore
        }
      }
    },
    [recentsKey],
  )

  const addRecent = React.useCallback(
    (q: string) => {
      const value = q.trim()
      if (!value) return
      const next = [value, ...recents.filter((r) => r !== value)].slice(
        0,
        MAX_RECENTS,
      )
      persistRecents(next)
    },
    [recents, persistRecents],
  )

  const clearRecents = React.useCallback(() => {
    persistRecents([])
    toast.success('Recent searches cleared')
  }, [persistRecents])

  const bookmarksFetcher = React.useCallback(
    (url: string) => {
      if (!user) return Promise.resolve({ bookmarks: [] })
      const headers: HeadersInit = {}
      if (authMode === 'local') {
        headers['x-user-id'] = user.id
        headers['x-user-email'] = user.email
      }
      return fetch(url, { credentials: 'same-origin', headers }).then((r) =>
        r.json(),
      )
    },
    [user, authMode],
  )

  const {
    data: bookmarksData,
    mutate: mutateBookmarks,
    isLoading: isLoadingBookmarks,
  } = useSWR(user ? '/api/bookmarks' : null, bookmarksFetcher, {
    revalidateOnFocus: false,
  })

  const bookmarks: Bookmark[] = bookmarksData?.bookmarks || []
  const bookmarkedUrls = React.useMemo(
    () => new Set(bookmarks.map((b) => b.url)),
    [bookmarks],
  )

  const handleSearch = React.useCallback(
    async (searchQuery: string) => {
      const q = searchQuery.trim()
      if (!q) return
      setQuery(q)
      setIsSearching(true)
      setHasSearched(true)
      setCached(false)
      addRecent(q)

      const started = performance.now()
      try {
        router.push(`/app?q=${encodeURIComponent(q)}`, { scroll: false })
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        const data = await response.json()
        if (!response.ok) throw new Error(data?.error || 'Search failed')
        setResults(data.results || [])
        setImageStrip(Array.isArray(data.imageStrip) ? data.imageStrip : [])
        setSource(data.source || null)
        setImgSource(data.imgSource || data.source || null)
        setCached(data.cached === true)
        if (data.warning) toast.message(data.warning)
        setDurationMs(Math.round(performance.now() - started))

        const list = data.results || []
        if (
          list.length > 0 &&
          typeof window !== 'undefined' &&
          localStorage.getItem(FIRST_SEARCH_TOAST_KEY) !== '1'
        ) {
          toast.message(
            'Tip: press / to focus search, j and k to move between results.',
          )
          try {
            localStorage.setItem(FIRST_SEARCH_TOAST_KEY, '1')
          } catch {
            // ignore
          }
        }
      } catch (error) {
        console.error('[scout] search error:', error)
        setResults([])
        setImageStrip([])
        setDurationMs(null)
        toast.error(
          error instanceof Error ? error.message : 'Something went wrong',
        )
      } finally {
        setIsSearching(false)
      }
    },
    [router, addRecent],
  )

  React.useEffect(() => {
    if (initialQuery && initialQuery.trim() && status === 'authenticated') {
      handleSearch(initialQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, status])

  const handleBookmark = React.useCallback(
    async (result: SearchResult) => {
      if (!user) return
      try {
        const postHeaders: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        if (authMode === 'local') {
          postHeaders['x-user-id'] = user.id
          postHeaders['x-user-email'] = user.email
        }
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          credentials: 'same-origin',
          headers: postHeaders,
          body: JSON.stringify({
            title: result.title,
            url: result.url,
            description: result.description,
            favicon_url: result.favicon,
          }),
        })
        if (response.ok) {
          mutateBookmarks()
          toast.success('Saved to your bookmarks')
        } else {
          toast.error('Could not save bookmark')
        }
      } catch {
        toast.error('Could not save bookmark')
      }
    },
    [mutateBookmarks, user, authMode],
  )

  const handleDeleteBookmark = React.useCallback(
    async (bookmarkId: string) => {
      if (!user) return
      try {
        const delHeaders: Record<string, string> = {}
        if (authMode === 'local') {
          delHeaders['x-user-id'] = user.id
          delHeaders['x-user-email'] = user.email
        }
        const response = await fetch(`/api/bookmarks?id=${bookmarkId}`, {
          method: 'DELETE',
          credentials: 'same-origin',
          headers: delHeaders,
        })
        if (response.ok) {
          mutateBookmarks()
          toast.success('Bookmark removed')
        }
      } catch {
        toast.error('Could not delete bookmark')
      }
    },
    [mutateBookmarks, user, authMode],
  )

  const [appMode, setAppMode] = React.useState<AppMode>('search')

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
          Loading your Scout…
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="app" />

      <Sidebar
        bookmarks={bookmarks}
        onBookmarkClick={(url) => window.open(url, '_blank')}
        onDeleteBookmark={handleDeleteBookmark}
        isLoading={isLoadingBookmarks}
        recentSearches={recents}
        onRecentClick={handleSearch}
        onClearRecents={clearRecents}
      />

      <main className="lg:pl-80">
        {/* Mode tabs */}
        <div className="sticky top-16 z-30 flex items-center gap-0.5 border-b border-border bg-background/80 px-4 py-2 backdrop-blur-md lg:px-6">
          {([
            { id: 'search', label: 'Search', icon: SearchIcon },
            { id: 'browse', label: 'Browse URL', icon: Globe },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setAppMode(id)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
                appMode === id
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {appMode === 'browse' ? (
          <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 md:py-10">
            <BrowsePanel onSearch={(q) => { setAppMode('search'); handleSearch(q) }} />
          </div>
        ) : !hasSearched ? (
          <WelcomeView
            name={user?.name?.split(' ')[0] || 'friend'}
            onSearch={handleSearch}
            query={query}
            recents={recents}
          />
        ) : (
          <ResultsView
            query={query}
            results={results}
            imageStrip={imageStrip}
            isSearching={isSearching}
            durationMs={durationMs}
            source={source}
            imgSource={imgSource}
            cached={cached}
            onSearch={handleSearch}
            recents={recents}
            onBookmark={handleBookmark}
            bookmarkedUrls={bookmarkedUrls}
          />
        )}
      </main>
    </div>
  )
}


function WelcomeView({
  name,
  onSearch,
  query,
  recents,
}: {
  name: string
  onSearch: (q: string) => void
  query: string
  recents: string[]
}) {
  // Compute greeting on the client only to avoid SSR hydration mismatch
  // (server timezone can differ from user's timezone).
  const [greeting, setGreeting] = React.useState<string>('Hello')
  React.useEffect(() => {
    const hours = new Date().getHours()
    setGreeting(
      hours < 5
        ? 'Still up'
        : hours < 12
          ? 'Good morning'
          : hours < 18
            ? 'Good afternoon'
            : 'Good evening',
    )
  }, [])

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col items-center justify-center px-6 py-16">
      <div className="w-full text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-[color:var(--accent-green)]" />
          {greeting}, {name}
        </p>
        <h1 className="mt-6 text-4xl leading-[1.05] tracking-tight md:text-5xl">
          What are we{' '}
          <span className="font-serif italic text-[color:var(--accent-green)]">
            looking up
          </span>{' '}
          today?
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[15px] text-muted-foreground">
          Type a question, a title, a curiosity. Scout will keep it calm.
        </p>
      </div>

      <div className="mt-10 w-full">
        <SearchBar
          onSearch={onSearch}
          initialQuery={query}
          recent={recents}
          suggestions={TRENDING}
          autoFocus
        />
      </div>

      <div className="mt-6 w-full">
        <div className="mb-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Perhaps
        </div>
        <div className="flex flex-wrap gap-2">
          {TRENDING.map((t) => (
            <button
              key={t}
              onClick={() => onSearch(t)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-foreground/80 transition-all hover:border-foreground/30 hover:text-foreground"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <Keyboard className="h-3.5 w-3.5" />
        <span>
          <kbd className="rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">
            /
          </kbd>{' '}
          search ·{' '}
          <kbd className="rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">
            j
          </kbd>
          /
          <kbd className="rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">
            k
          </kbd>{' '}
          results ·{' '}
          <kbd className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">
            <span>⌘</span>K
          </kbd>{' '}
          palette
        </span>
      </div>
    </div>
  )
}

function ResultsView({
  query,
  results,
  imageStrip,
  isSearching,
  durationMs,
  source,
  imgSource,
  cached,
  onSearch,
  recents,
  onBookmark,
  bookmarkedUrls,
}: {
  query: string
  results: SearchResult[]
  imageStrip: ImageStripItem[]
  isSearching: boolean
  durationMs: number | null
  source: 'demo' | 'bing' | 'google' | null
  imgSource: string | null
  cached: boolean
  onSearch: (q: string) => void
  recents: string[]
  onBookmark: (r: SearchResult) => void
  bookmarkedUrls: Set<string>
}) {
  const [focusedResultIndex, setFocusedResultIndex] = React.useState(-1)

  React.useEffect(() => {
    setFocusedResultIndex(-1)
  }, [query, results.length])

  React.useEffect(() => {
    if (focusedResultIndex < 0) return
    document
      .querySelector(`[data-result-index="${focusedResultIndex}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focusedResultIndex])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.isContentEditable)
      ) {
        return
      }
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        document.getElementById('scout-search')?.focus()
        return
      }
      if (results.length === 0 || isSearching) return
      if (e.key === 'j') {
        e.preventDefault()
        setFocusedResultIndex((i) => {
          if (i < 0) return 0
          return Math.min(i + 1, results.length - 1)
        })
      }
      if (e.key === 'k') {
        e.preventDefault()
        setFocusedResultIndex((i) => {
          if (i <= 0) return -1
          return i - 1
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [results.length, isSearching])

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 md:py-10">
      {/* Sticky search bar */}
      <div className="sticky top-16 z-20 -mx-2 mb-6 px-2 pt-2 pb-1 backdrop-blur-md">
        <SearchBar
          onSearch={onSearch}
          initialQuery={query}
          recent={recents}
          suggestions={TRENDING}
        />
        {!isSearching && results.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
            <span>{results.length} sources</span>
            {durationMs != null && <span>· {durationMs} ms</span>}
            {cached && (
              <span className="rounded-full border border-border bg-muted/70 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em]">
                Cached
              </span>
            )}
            {source === 'demo' && (
              <span className="rounded-full border border-dashed border-border bg-card px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em]">
                Demo data
              </span>
            )}
          </div>
        )}
      </div>

      {isSearching ? (
        <>
          {/* AI hero skeleton */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-[color:var(--paper-raised)]">
            <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
              <div className="h-7 w-7 animate-pulse rounded-lg bg-muted" />
              <div className="space-y-1">
                <div className="h-2.5 w-12 animate-pulse rounded bg-muted/60" />
                <div className="h-3.5 w-20 animate-pulse rounded bg-muted/80" />
              </div>
            </div>
            <div className="space-y-2.5 px-5 py-5">
              <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-[92%] animate-pulse rounded-md bg-muted" />
              <div className="h-4 w-[80%] animate-pulse rounded-md bg-muted" />
              <div className="mt-4 h-4 w-full animate-pulse rounded-md bg-muted/70" />
              <div className="h-4 w-[88%] animate-pulse rounded-md bg-muted/70" />
            </div>
          </div>
          <SearchResultsSkeleton />
        </>
      ) : (
        <>
          {/* AI answer FIRST */}
          <AiOverview
            query={query}
            snippets={results.map((r) => ({
              title: r.title,
              description: r.description,
              url: r.url,
              image: r.image,
            }))}
            active
            onFollowup={onSearch}
          />

          {/* Sources section SECOND */}
          <SearchResults
            results={results}
            query={query}
            imageStrip={imageStrip}
            source={source}
            imgSource={imgSource}
            highlightedIndex={focusedResultIndex}
            onBookmark={onBookmark}
            bookmarkedUrls={bookmarkedUrls}
          />
        </>
      )}
    </div>
  )
}

export default function AppPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
        </div>
      }
    >
      <AppInner />
    </React.Suspense>
  )
}
