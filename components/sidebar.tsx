'use client'

import * as React from 'react'
import {
  Bookmark as BookmarkIcon,
  Trash2,
  X,
  PanelLeft,
  Search,
  Clock,
  ExternalLink,
  History,
} from 'lucide-react'
import type { Bookmark } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface SidebarProps {
  bookmarks: Bookmark[]
  onBookmarkClick: (url: string) => void
  onDeleteBookmark: (id: string) => void
  isLoading?: boolean
  recentSearches?: string[]
  onRecentClick?: (q: string) => void
  onClearRecents?: () => void
}

export function Sidebar({
  bookmarks,
  onBookmarkClick,
  onDeleteBookmark,
  isLoading = false,
  recentSearches = [],
  onRecentClick,
  onClearRecents,
}: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [filter, setFilter] = React.useState('')

  React.useEffect(() => {
    const mql = window.matchMedia('(min-width: 1024px)')
    const apply = () => setIsOpen(mql.matches)
    apply()
    mql.addEventListener('change', apply)
    return () => mql.removeEventListener('change', apply)
  }, [])

  const filtered = React.useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return bookmarks
    return bookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        (b.description ?? '').toLowerCase().includes(q),
    )
  }, [bookmarks, filter])

  return (
    <>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          'fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-border bg-[color:var(--paper-raised)] px-3 py-2 text-xs font-medium shadow-md lg:hidden',
          isOpen && 'bg-foreground text-background border-transparent',
        )}
        aria-label="Toggle bookmarks panel"
      >
        {isOpen ? (
          <>
            <X className="h-4 w-4" />
            Close
          </>
        ) : (
          <>
            <PanelLeft className="h-4 w-4" />
            Bookmarks
            {bookmarks.length > 0 && (
              <span className="rounded-full bg-[color:var(--accent-green)]/15 px-1.5 text-[10px] font-semibold text-[color:var(--accent-green)]">
                {bookmarks.length}
              </span>
            )}
          </>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed top-16 bottom-0 left-0 z-40 w-80 overflow-hidden transition-transform duration-300 ease-out',
          'border-r border-border bg-sidebar text-sidebar-foreground',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-sidebar-border p-4">
            <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-[color:var(--paper)] dark:bg-[color:var(--paper-raised)] px-3 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter bookmarks"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {filter && (
                <button
                  onClick={() => setFilter('')}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Clear filter"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            <SectionHeader
              icon={<BookmarkIcon className="h-3.5 w-3.5" />}
              title="Bookmarks"
              count={bookmarks.length}
            />

            {isLoading ? (
              <div className="space-y-2 px-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-lg bg-sidebar-border/40 animate-pulse"
                  />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState filtered={filter.length > 0} />
            ) : (
              <div className="space-y-0.5">
                {filtered.map((bookmark) => (
                  <BookmarkRow
                    key={bookmark.id}
                    bookmark={bookmark}
                    onClick={() => {
                      onBookmarkClick(bookmark.url)
                    }}
                    onDelete={() => onDeleteBookmark(bookmark.id)}
                  />
                ))}
              </div>
            )}

            {recentSearches.length > 0 && (
              <div className="mt-8">
                <SectionHeader
                  icon={<History className="h-3.5 w-3.5" />}
                  title="Recent searches"
                  action={
                    onClearRecents && (
                      <button
                        onClick={onClearRecents}
                        className="text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </button>
                    )
                  }
                />
                <div className="space-y-0.5">
                  {recentSearches.slice(0, 8).map((q) => (
                    <button
                      key={q}
                      onClick={() => onRecentClick?.(q)}
                      className="group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-left text-muted-foreground transition-colors hover:bg-sidebar-border/40 hover:text-foreground"
                    >
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 truncate">{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-sidebar-border p-4 text-[11px] text-muted-foreground">
            <div className="flex items-center justify-between">
              <span className="font-serif italic">
                {bookmarks.length
                  ? `${bookmarks.length} bookmark${bookmarks.length === 1 ? '' : 's'}`
                  : 'Your little library'}
              </span>
              <span>v0.3</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

function SectionHeader({
  icon,
  title,
  count,
  action,
}: {
  icon?: React.ReactNode
  title: string
  count?: number
  action?: React.ReactNode
}) {
  return (
    <div className="mb-2 flex items-center justify-between px-2">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        {title}
        {typeof count === 'number' && (
          <span className="ml-1 rounded-full bg-sidebar-border/60 px-1.5 py-0.5 text-[10px] font-medium normal-case tracking-normal text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {action}
    </div>
  )
}

function BookmarkRow({
  bookmark,
  onClick,
  onDelete,
}: {
  bookmark: Bookmark
  onClick: () => void
  onDelete: () => void
}) {
  const host = React.useMemo(() => {
    try {
      return new URL(bookmark.url).hostname.replace(/^www\./, '')
    } catch {
      return bookmark.url
    }
  }, [bookmark.url])

  const favicon =
    bookmark.favicon_url ||
    `https://www.google.com/s2/favicons?domain=${host}&sz=32`

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className="group relative flex items-start gap-2 rounded-lg border border-transparent px-2.5 py-2 transition-all hover:border-sidebar-border hover:bg-sidebar-border/30 cursor-pointer"
    >
      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-md border border-sidebar-border bg-sidebar">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={favicon}
          alt=""
          width={16}
          height={16}
          className="h-4 w-4"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium group-hover:text-foreground">
          {bookmark.title}
        </div>
        <div className="truncate text-[11px] text-muted-foreground">
          {host}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => {
            e.stopPropagation()
            window.open(bookmark.url, '_blank', 'noopener,noreferrer')
          }}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-border/60 hover:text-foreground"
          aria-label="Open in new tab"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
          aria-label="Delete bookmark"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="mx-auto max-w-[240px] rounded-xl border border-dashed border-sidebar-border px-4 py-8 text-center">
      <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-md border border-sidebar-border bg-[color:var(--paper-raised)] text-[color:var(--accent-green)]">
        <BookmarkIcon className="h-4 w-4" />
      </div>
      <p className="font-serif text-[15px]">
        {filtered ? 'No matches' : 'Nothing saved yet'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {filtered
          ? 'Try a looser filter.'
          : 'The bookmark icon on any result will put it here.'}
      </p>
    </div>
  )
}
