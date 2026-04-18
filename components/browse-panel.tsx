'use client'

import * as React from 'react'
import {
  Globe,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Clock,
  Tag,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type BrowseResult = {
  url: string
  domain: string
  title: string
  summary: string
  keyPoints: string[]
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
  readingTimeMin: number
  topics: string[]
  tldr: string
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800',
  negative: 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800',
  mixed: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-800',
  neutral: 'text-muted-foreground bg-muted border-border',
}

function BrowseResultCard({
  result,
  onSearch,
}: {
  result: BrowseResult
  onSearch?: (q: string) => void
}) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    try {
      const text = `${result.title}\n\n${result.tldr}\n\n${result.summary}\n\nKey points:\n${result.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success('Summary copied')
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[color:var(--paper-raised)] shadow-[0_8px_40px_-20px_rgba(0,0,0,0.15)]">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://www.google.com/s2/favicons?domain=${result.domain}&sz=32`}
              alt=""
              width={16}
              height={16}
              className="h-4 w-4 rounded-sm"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
            <span className="text-[12px] text-muted-foreground">{result.domain}</span>
            <span className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize',
              SENTIMENT_COLORS[result.sentiment] || SENTIMENT_COLORS.neutral,
            )}>
              {result.sentiment}
            </span>
          </div>
          <h2 className="font-serif text-[20px] leading-snug text-foreground md:text-[22px]">
            {result.title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Open original"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy summary"
            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {copied ? (
              <Check className="h-4 w-4 text-[color:var(--accent-green)]" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* TL;DR */}
      <div className="border-b border-border bg-[color:var(--accent-green)]/5 px-5 py-3.5">
        <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[color:var(--accent-green)]">
          TL;DR
        </p>
        <p className="text-[15px] font-medium leading-snug text-foreground">
          {result.tldr}
        </p>
      </div>

      <div className="px-5 pb-5 pt-4 space-y-5">
        {/* Summary */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Summary
          </p>
          <p className="text-[14px] leading-relaxed text-foreground/90">
            {result.summary}
          </p>
        </div>

        {/* Key points */}
        {result.keyPoints?.length > 0 && (
          <div>
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Key points
            </p>
            <ul className="space-y-2">
              {result.keyPoints.map((pt, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14px] text-foreground/85">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded bg-[color:var(--accent-green)]/10 font-mono text-[10px] font-bold text-[color:var(--accent-green)]">
                    {i + 1}
                  </span>
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          {result.readingTimeMin > 0 && (
            <span className="flex items-center gap-1 text-[12px] text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {result.readingTimeMin} min read
            </span>
          )}
          {result.topics?.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="h-3 w-3 text-muted-foreground" />
              {result.topics.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Search related */}
        {onSearch && result.topics?.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Search related
            </p>
            <div className="flex flex-wrap gap-2">
              {result.topics.slice(0, 4).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onSearch(t)}
                  className="group flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[12px] text-foreground/70 transition-all hover:border-foreground/20 hover:text-foreground"
                >
                  {t}
                  <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function BrowsePanel({ onSearch }: { onSearch?: (q: string) => void }) {
  const [url, setUrl] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<BrowseResult | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/browse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not read page')
      setResult(data as BrowseResult)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Auto-submit on paste if it looks like a URL
    const pasted = e.clipboardData.getData('text').trim()
    if (pasted.startsWith('http') || pasted.includes('.')) {
      setUrl(pasted)
      setTimeout(() => {
        handleSubmit()
      }, 50)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* URL input */}
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-border bg-[color:var(--paper-raised)] shadow-[0_4px_24px_-16px_rgba(0,0,0,0.15)]"
      >
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Globe className="h-4 w-4 shrink-0 text-[color:var(--accent-green)]" />
          <input
            ref={inputRef}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={handlePaste}
            placeholder="Paste any URL — Scout will read it and summarize what matters"
            type="url"
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
          <button
            type="submit"
            disabled={!url.trim() || loading}
            className={cn(
              'shrink-0 rounded-xl px-4 py-2 text-[13px] font-medium transition-all',
              url.trim() && !loading
                ? 'bg-[color:var(--ink)] text-[color:var(--paper)] hover:opacity-90'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Reading…
              </span>
            ) : (
              'Browse'
            )}
          </button>
        </div>
        <div className="border-t border-border px-4 py-2">
          <p className="text-[11px] text-muted-foreground">
            Paste a URL from any article, blog, docs page, or product — Scout
            reads it and gives you the key points instantly.
          </p>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="overflow-hidden rounded-2xl border border-border bg-[color:var(--paper-raised)]">
          <div className="space-y-3 p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-6 w-4/5 animate-pulse rounded bg-muted/90" />
            <div className="mt-4 h-3 w-full animate-pulse rounded bg-muted/70" />
            <div className="h-3 w-[92%] animate-pulse rounded bg-muted/70" />
            <div className="h-3 w-[80%] animate-pulse rounded bg-muted/70" />
          </div>
        </div>
      )}

      {/* Result */}
      {result && <BrowseResultCard result={result} onSearch={onSearch} />}

      {/* Empty hint */}
      {!loading && !result && !error && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-muted/40">
            <Globe className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-serif text-[18px] text-foreground">
              Paste any URL above
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              News articles, docs, product pages, research papers — Scout reads
              it and extracts what&apos;s worth knowing.
            </p>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-2 text-[12px] text-muted-foreground">
            {[
              'nytimes.com/…',
              'github.com/…',
              'arxiv.org/…',
              'producthunt.com/…',
            ].map((ex) => (
              <span
                key={ex}
                className="rounded-full border border-border bg-card px-2.5 py-1"
              >
                {ex}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
