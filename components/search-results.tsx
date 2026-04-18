'use client'

import * as React from 'react'
import Image from 'next/image'
import {
  Bookmark as BookmarkIcon,
  BookmarkCheck,
  ExternalLink,
  ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ImageStripItem, SearchResult } from '@/lib/search-types'

export type { SearchResult, ImageStripItem }

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  onBookmark: (result: SearchResult) => void
  bookmarkedUrls?: Set<string>
  imageStrip?: ImageStripItem[]
  source?: 'demo' | 'bing' | 'google' | null
  /** Specific image source: 'pexels' | 'unsplash' | 'bing' | 'google' | 'placeholder' */
  imgSource?: string | null
  highlightedIndex?: number
}

const BOOKMARK_HINT_KEY = 'scout:dismiss-bookmark-hint'

export function SearchResults({
  results,
  query,
  onBookmark,
  bookmarkedUrls = new Set(),
  imageStrip = [],
  source = null,
  imgSource = null,
  highlightedIndex = -1,
}: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-[color:var(--paper-raised)] px-8 py-12 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-muted text-[color:var(--accent-green)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <h2 className="font-serif text-[22px]">
          Nothing found for &ldquo;{query}&rdquo;
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Try different words, or loosen the spelling.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {imageStrip.length > 0 && (
        <ImageStripRibbon items={imageStrip} query={query} imgSource={imgSource ?? source} />
      )}

      {/* Sources section */}
      <div>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="font-serif text-[16px] text-foreground">Sources</h2>
          <div className="flex items-center gap-1.5">
            {source === 'demo' && (
              <span className="rounded-full border border-dashed border-border bg-card px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                Demo
              </span>
            )}
            {source && source !== 'demo' && (
              <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {source === 'brave'
                  ? 'Brave'
                  : source === 'serper'
                    ? 'Google'
                    : source === 'bing'
                      ? 'Bing'
                      : source === 'google'
                        ? 'Google'
                        : source === 'tavily'
                          ? 'Tavily'
                          : source}
              </span>
            )}
            <span className="text-[12px] text-muted-foreground">{results.length} results</span>
          </div>
        </div>

        {/* Compact source list */}
        <div className="overflow-hidden rounded-2xl border border-border bg-[color:var(--paper-raised)]">
          {results.map((result, index) => (
            <SourceRow
              key={`${result.url}-${index}`}
              result={result}
              index={index}
              citationNumber={index + 1}
              highlighted={highlightedIndex === index}
              onBookmark={onBookmark}
              isBookmarked={bookmarkedUrls.has(result.url)}
              isLast={index === results.length - 1}
            />
          ))}
        </div>

        <BookmarkHintBanner />
      </div>
    </div>
  )
}

function BookmarkHintBanner() {
  const [hidden, setHidden] = React.useState(true)

  React.useEffect(() => {
    try {
      setHidden(localStorage.getItem(BOOKMARK_HINT_KEY) === '1')
    } catch {
      setHidden(false)
    }
  }, [])

  if (hidden) return null

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
      <p className="min-w-0 flex-1">
        <span className="font-medium text-foreground">Bookmark any source</span>{' '}
        — tap the bookmark icon on a row to save it to your left rail.
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            localStorage.setItem(BOOKMARK_HINT_KEY, '1')
          } catch {
            // ignore
          }
          setHidden(true)
        }}
        className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] underline-offset-4 hover:underline"
      >
        Got it
      </button>
    </div>
  )
}

function SourceRow({
  result,
  index,
  citationNumber,
  highlighted,
  onBookmark,
  isBookmarked,
  isLast,
}: {
  result: SearchResult
  index: number
  citationNumber: number
  highlighted: boolean
  onBookmark: (r: SearchResult) => void
  isBookmarked: boolean
  isLast: boolean
}) {
  const [favFailed, setFavFailed] = React.useState(false)

  const host = React.useMemo(() => {
    try {
      return new URL(result.url).hostname.replace(/^www\./, '')
    } catch {
      return result.displayUrl
    }
  }, [result.url, result.displayUrl])

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isBookmarked) {
      toast.info('Already bookmarked')
      return
    }
    onBookmark(result)
  }

  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      data-citation={String(citationNumber)}
      data-result-index={index}
      className={cn(
        'group flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40',
        !isLast && 'border-b border-border',
        highlighted && 'bg-[color:var(--accent-green)]/5 ring-2 ring-inset ring-[color:var(--accent-green)]/30',
      )}
    >
      {/* Citation number */}
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded bg-muted/80 font-mono text-[10px] font-bold text-muted-foreground group-hover:bg-[color:var(--accent-green)]/10 group-hover:text-[color:var(--accent-green)]">
        {citationNumber}
      </span>

      {/* Favicon */}
      <div className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-sm bg-muted/50">
        {!favFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.favicon}
            alt=""
            width={16}
            height={16}
            className="h-4 w-4"
            onError={() => setFavFailed(true)}
          />
        ) : (
          <span className="text-[10px] font-bold text-muted-foreground">
            {host[0]?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="truncate text-[12px] text-muted-foreground">{host}</p>
        </div>
        <h3 className="mt-0.5 line-clamp-1 text-[14px] font-semibold leading-snug text-foreground group-hover:text-[color:var(--accent-green)]">
          {result.title}
        </h3>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          {result.description}
        </p>
      </div>

      {/* Thumb */}
      {result.image && (
        <div className="relative mt-0.5 hidden h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted md:block">
          <Image
            src={result.image}
            alt=""
            fill
            className="object-cover"
            sizes="80px"
            unoptimized
          />
        </div>
      )}

      {/* Actions */}
      <div className="mt-0.5 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            window.open(result.url, '_blank', 'noopener,noreferrer')
          }}
          aria-label="Open in new tab"
          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={handleBookmark}
          aria-label={isBookmarked ? 'Bookmarked' : 'Bookmark'}
          className={cn(
            'grid h-7 w-7 place-items-center rounded-lg transition-colors',
            isBookmarked
              ? 'bg-[color:var(--ink)] text-[color:var(--paper)]'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {isBookmarked ? (
            <BookmarkCheck className="h-3.5 w-3.5" />
          ) : (
            <BookmarkIcon className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </a>
  )
}

const IMG_SOURCE_LABELS: Record<string, { label: string; dashed: boolean }> = {
  pexels: { label: 'Pexels', dashed: false },
  unsplash: { label: 'Unsplash', dashed: false },
  bing: { label: 'Bing Images', dashed: false },
  google: { label: 'Google Images', dashed: false },
  placeholder: { label: 'Demo', dashed: true },
  demo: { label: 'Demo', dashed: true },
}

function ImageStripRibbon({
  items,
  query,
  imgSource,
}: {
  items: ImageStripItem[]
  query: string
  imgSource: string | null
}) {
  const badge = imgSource ? IMG_SOURCE_LABELS[imgSource] : null

  return (
    <div className="rounded-2xl border border-border bg-[color:var(--paper-raised)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[color:var(--ink)] text-[color:var(--paper)]">
            <ImageIcon className="h-3.5 w-3.5" />
          </span>
          <p className="font-serif text-sm text-foreground">
            Images for &ldquo;{query}&rdquo;
          </p>
        </div>
        {badge && (
          <span className={cn(
            'shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground',
            badge.dashed ? 'border-dashed border-border bg-card' : 'border-border bg-muted/60',
          )}>
            {badge.label}
          </span>
        )}
      </div>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto pb-1">
        {items.map((hit, i) => (
          <a
            key={`${hit.url}-${i}`}
            href={hit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-[112px] shrink-0 overflow-hidden rounded-xl border border-border bg-muted/40 transition-transform hover:scale-[1.03] hover:shadow-lg"
          >
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={hit.thumbnail}
                alt=""
                fill
                className="object-cover transition duration-300 group-hover:brightness-95"
                sizes="112px"
                unoptimized
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1.5 pt-6">
                <p className="line-clamp-2 text-[10px] font-medium leading-tight text-white">
                  {hit.title}
                </p>
                <p className="truncate text-[9px] text-white/75">{hit.source}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}

export function SearchResultsSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Image strip skeleton */}
      <div className="rounded-2xl border border-border bg-[color:var(--paper-raised)] p-4">
        <div className="mb-3 h-4 w-40 animate-pulse rounded bg-muted" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 w-28 shrink-0 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
      {/* Compact source rows skeleton */}
      <div className="overflow-hidden rounded-2xl border border-border bg-[color:var(--paper-raised)]">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex items-start gap-3 px-4 py-3.5',
              i < count - 1 && 'border-b border-border',
            )}
          >
            <div className="mt-0.5 h-5 w-5 animate-pulse rounded bg-muted" />
            <div className="mt-0.5 h-5 w-5 animate-pulse rounded bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 animate-pulse rounded bg-muted/60" />
              <div className="h-4 w-[80%] animate-pulse rounded bg-muted/90" />
              <div className="h-3 w-full animate-pulse rounded bg-muted/60" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
