'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { toast } from 'sonner'
import { Sparkles, Keyboard } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SearchBar } from '@/components/search-bar'
import {
  SearchResults,
  SearchResultsSkeleton,
} from '@/components/search-results'
import { Sidebar } from '@/components/sidebar'
import { useAuth } from '@/lib/auth'
import type { Bookmark } from '@/lib/supabase'

interface SearchResult {
  title: string
  url: string
  description: string
  displayUrl: string
  favicon: string
}

const RECENTS_KEY = 'scout:recents'
const MAX_RECENTS = 10

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
  const { user, status } = useAuth()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = React.useState(initialQuery)
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = React.useState(false)
  const [hasSearched, setHasSearched] = React.useState(initialQuery !== '')
  const [recents, setRecents] = React.useState<string[]>([])
  const [durationMs, setDurationMs] = React.useState<number | null>(null)
  const [source, setSource] = React.useState<'demo' | 'google' | null>(null)

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
      return fetch(url, { headers: { 'x-user-id': user.id } }).then((r) =>
        r.json(),
      )
    },
    [user],
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
      addRecent(q)

      const started = performance.now()
      try {
        router.push(`/app?q=${encodeURIComponent(q)}`, { scroll: false })
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        const data = await response.json()
        if (!response.ok) throw new Error(data?.error || 'Search failed')
        setResults(data.results || [])
        setSource(data.source || null)
        if (data.warning) toast.message(data.warning)
        setDurationMs(Math.round(performance.now() - started))
      } catch (error) {
        console.error('[scout] search error:', error)
        setResults([])
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
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
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
    [mutateBookmarks, user],
  )

  const handleDeleteBookmark = React.useCallback(
    async (bookmarkId: string) => {
      if (!user) return
      try {
        const response = await fetch(`/api/bookmarks?id=${bookmarkId}`, {
          method: 'DELETE',
          headers: { 'x-user-id': user.id },
        })
        if (response.ok) {
          mutateBookmarks()
          toast.success('Bookmark removed')
        }
      } catch {
        toast.error('Could not delete bookmark')
      }
    },
    [mutateBookmarks, user],
  )

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
        {!hasSearched ? (
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
            isSearching={isSearching}
            durationMs={durationMs}
            source={source}
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
  const now = new Date()
  const hours = now.getHours()
  const greeting =
    hours < 5
      ? 'Still up'
      : hours < 12
        ? 'Good morning'
        : hours < 18
          ? 'Good afternoon'
          : 'Good evening'

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

      <div className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
        <Keyboard className="h-3.5 w-3.5" />
        Press
        <kbd className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground">
          <span>⌘</span>K
        </kbd>
        anywhere to focus the bar.
      </div>
    </div>
  )
}

function ResultsView({
  query,
  results,
  isSearching,
  durationMs,
  source,
  onSearch,
  recents,
  onBookmark,
  bookmarkedUrls,
}: {
  query: string
  results: SearchResult[]
  isSearching: boolean
  durationMs: number | null
  source: 'demo' | 'google' | null
  onSearch: (q: string) => void
  recents: string[]
  onBookmark: (r: SearchResult) => void
  bookmarkedUrls: Set<string>
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 md:py-10">
      <div className="sticky top-20 z-20 -mx-2 mb-6 px-2">
        <SearchBar
          onSearch={onSearch}
          initialQuery={query}
          recent={recents}
          suggestions={TRENDING}
        />
      </div>

      {!isSearching && results.length > 0 && (
        <div className="mb-4 flex items-center justify-between px-1 text-xs text-muted-foreground">
          <span>
            {results.length} results
            {durationMs != null && <> · {durationMs} ms</>}
          </span>
          {source === 'demo' && (
            <span className="rounded-full border border-dashed border-border bg-card px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Demo mode
            </span>
          )}
        </div>
      )}

      {isSearching ? (
        <SearchResultsSkeleton />
      ) : (
        <SearchResults
          results={results}
          query={query}
          onBookmark={onBookmark}
          bookmarkedUrls={bookmarkedUrls}
        />
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
