'use client'

import * as React from 'react'
import {
  Bookmark as BookmarkIcon,
  BookmarkCheck,
  Copy,
  ExternalLink,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SearchResult {
  title: string
  url: string
  description: string
  displayUrl: string
  favicon: string
}

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  onBookmark: (result: SearchResult) => void
  bookmarkedUrls?: Set<string>
}

export function SearchResults({
  results,
  query,
  onBookmark,
  bookmarkedUrls = new Set(),
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
    <div className="flex flex-col gap-3">
      <div className="mb-1 flex items-baseline justify-between px-1 text-xs text-muted-foreground">
        <span>
          About{' '}
          <span className="font-semibold text-foreground">{results.length}</span>{' '}
          results for{' '}
          <span className="font-semibold text-foreground">
            &ldquo;{query}&rdquo;
          </span>
        </span>
      </div>
      {results.map((result, index) => (
        <ResultCard
          key={`${result.url}-${index}`}
          result={result}
          index={index}
          onBookmark={onBookmark}
          isBookmarked={bookmarkedUrls.has(result.url)}
        />
      ))}
    </div>
  )
}

function ResultCard({
  result,
  index,
  onBookmark,
  isBookmarked,
}: {
  result: SearchResult
  index: number
  onBookmark: (r: SearchResult) => void
  isBookmarked: boolean
}) {
  const [copied, setCopied] = React.useState(false)
  const [imgFailed, setImgFailed] = React.useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(result.url)
      setCopied(true)
      toast.success('Link copied')
      setTimeout(() => setCopied(false), 1400)
    } catch {
      toast.error('Could not copy link')
    }
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isBookmarked) {
      toast.info('Already bookmarked')
      return
    }
    onBookmark(result)
  }

  const breadcrumb = React.useMemo(() => {
    try {
      const u = new URL(result.url)
      const segments = u.pathname.split('/').filter(Boolean).slice(0, 3)
      return [u.hostname.replace(/^www\./, ''), ...segments]
    } catch {
      return [result.displayUrl]
    }
  }, [result.url, result.displayUrl])

  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group relative block overflow-hidden rounded-xl border border-border bg-[color:var(--paper-raised)] p-5',
        'transition-all duration-200 hover:-translate-y-[1px] hover:border-foreground/30 hover:shadow-[0_14px_40px_-24px_rgba(0,0,0,0.25)]',
        'reveal',
      )}
      style={{ transitionDelay: `${Math.min(index * 40, 400)}ms` }}
      ref={(el) => {
        if (!el || typeof IntersectionObserver === 'undefined') return
        const obs = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-visible')
                obs.unobserve(entry.target)
              }
            }
          },
          { rootMargin: '0px 0px -5% 0px', threshold: 0.1 },
        )
        obs.observe(el)
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card overflow-hidden">
          {!imgFailed && result.favicon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.favicon}
              alt=""
              width={18}
              height={18}
              className="h-[18px] w-[18px]"
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span className="text-[10px] font-bold text-muted-foreground">
              {result.displayUrl?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1 text-[11px] text-muted-foreground">
            {breadcrumb.map((seg, i) => (
              <React.Fragment key={i}>
                <span className="truncate max-w-[180px]">{seg}</span>
                {i < breadcrumb.length - 1 && (
                  <span className="opacity-50">›</span>
                )}
              </React.Fragment>
            ))}
          </div>
          <h3 className="mt-0.5 line-clamp-2 text-[17px] font-semibold text-foreground group-hover:text-[color:var(--accent-green)] transition-colors">
            {result.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-muted-foreground">
            {result.description}
          </p>
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
          <IconButton label="Copy link" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4 text-[color:var(--accent-green)]" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </IconButton>
          <IconButton
            label="Open in new tab"
            onClick={(e) => {
              e.preventDefault()
              window.open(result.url, '_blank', 'noopener,noreferrer')
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </IconButton>
          <IconButton
            label={isBookmarked ? 'Bookmarked' : 'Save bookmark'}
            onClick={handleBookmark}
            active={isBookmarked}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <BookmarkIcon className="h-4 w-4" />
            )}
          </IconButton>
        </div>
      </div>
    </a>
  )
}

function IconButton({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode
  label: string
  onClick: (e: React.MouseEvent) => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-md transition-colors',
        active
          ? 'bg-[color:var(--ink)] text-[color:var(--paper)]'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function SearchResultsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-[color:var(--paper-raised)] p-5"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex gap-3">
            <div className="h-8 w-8 shrink-0 rounded-md bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-muted" />
              <div className="h-4 w-3/4 rounded bg-muted/90" />
              <div className="h-3 w-full rounded bg-muted/70" />
              <div className="h-3 w-5/6 rounded bg-muted/70" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
