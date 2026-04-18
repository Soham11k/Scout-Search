'use client'

import * as React from 'react'
import { Search, X, CornerDownLeft, Clock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  onSearch: (query: string) => void
  initialQuery?: string
  recent?: string[]
  suggestions?: string[]
  autoFocus?: boolean
  size?: 'lg' | 'md'
}

export function SearchBar({
  onSearch,
  initialQuery = '',
  recent = [],
  suggestions = [],
  autoFocus = false,
  size = 'lg',
}: SearchBarProps) {
  const [query, setQuery] = React.useState(initialQuery)
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(-1)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const rootRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const items = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return {
      recent: (q ? recent.filter((r) => r.toLowerCase().includes(q)) : recent).slice(0, 5),
      suggestions: (q
        ? suggestions.filter((s) => s.toLowerCase().includes(q))
        : suggestions
      ).slice(0, 5),
    }
  }, [query, suggestions, recent])

  const flat = React.useMemo(
    () => [...items.recent, ...items.suggestions],
    [items],
  )

  const submit = (value: string) => {
    const v = value.trim()
    if (!v) return
    setQuery(v)
    setOpen(false)
    setActive(-1)
    onSearch(v)
    inputRef.current?.blur()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (open && active >= 0 && flat[active]) {
        submit(flat[active])
      } else {
        submit(query)
      }
    } else if (e.key === 'ArrowDown') {
      if (!flat.length) return
      e.preventDefault()
      setOpen(true)
      setActive((a) => (a + 1) % flat.length)
    } else if (e.key === 'ArrowUp') {
      if (!flat.length) return
      e.preventDefault()
      setOpen(true)
      setActive((a) => (a <= 0 ? flat.length - 1 : a - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  const showDropdown = open && flat.length > 0

  return (
    <div ref={rootRef} className="relative w-full">
      <div
        className={cn(
          'relative flex items-center rounded-xl border border-border bg-[color:var(--paper-raised)] transition-all duration-150',
          'shadow-[0_1px_0_rgba(0,0,0,0.03),0_12px_24px_-16px_rgba(0,0,0,0.18)]',
          'focus-within:border-foreground/40 focus-within:shadow-[0_1px_0_rgba(0,0,0,0.05),0_20px_40px_-18px_rgba(0,0,0,0.22)]',
          size === 'lg' ? 'gap-3 px-4 py-3' : 'gap-2 px-3 py-2',
        )}
      >
        <Search
          className={cn(
            'shrink-0 text-muted-foreground',
            size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
          )}
        />
        <input
          id="scout-search"
          ref={inputRef}
          type="text"
          autoFocus={autoFocus}
          placeholder="Ask, or look something up…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          enterKeyHint="search"
          aria-label="Search"
          className={cn(
            'flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/80',
            size === 'lg' ? 'text-[17px]' : 'text-sm',
          )}
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <kbd
          className="hidden md:inline-flex select-none items-center gap-1 rounded-md border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground"
          aria-hidden
        >
          <span className="text-sm leading-none">⌘</span>K
        </kbd>

        <button
          type="button"
          onClick={() => submit(query)}
          disabled={!query.trim()}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg font-semibold text-background bg-foreground transition-all btn-shadow',
            'hover:opacity-95 active:scale-[0.98]',
            'disabled:opacity-40 disabled:pointer-events-none',
            size === 'lg' ? 'px-3.5 py-2 text-sm' : 'px-3 py-1.5 text-xs',
          )}
          aria-label="Search"
        >
          Look up
          <CornerDownLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {showDropdown && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
        >
          {items.recent.length > 0 && (
            <Section title="Recent" icon={<Clock className="h-3.5 w-3.5" />}>
              {items.recent.map((r, i) => (
                <Item
                  key={`r-${r}`}
                  label={r}
                  active={active === i}
                  onHover={() => setActive(i)}
                  onSelect={() => submit(r)}
                />
              ))}
            </Section>
          )}
          {items.suggestions.length > 0 && (
            <Section
              title="Try"
              icon={<Sparkles className="h-3.5 w-3.5" />}
            >
              {items.suggestions.map((s, i) => {
                const idx = items.recent.length + i
                return (
                  <Item
                    key={`s-${s}`}
                    label={s}
                    active={active === idx}
                    onHover={() => setActive(idx)}
                    onSelect={() => submit(s)}
                  />
                )
              })}
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="py-1">
      <div className="flex items-center gap-1.5 px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        {title}
      </div>
      <div>{children}</div>
    </div>
  )
}

function Item({
  label,
  active,
  onHover,
  onSelect,
}: {
  label: string
  active: boolean
  onHover: () => void
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onClick={onSelect}
      role="option"
      aria-selected={active}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2 text-sm text-left transition-colors',
        active ? 'bg-muted' : 'hover:bg-muted/60',
      )}
    >
      <Search className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="flex-1 truncate">{label}</span>
      <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
    </button>
  )
}
