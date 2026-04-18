'use client'

import * as React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, ArrowRight, Sparkles, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type Snippet = {
  title: string
  description: string
  url: string
  image?: string
}

const FOLLOWUP_MARKER = 'SCOUT_FOLLOWUPS:'

function parseStream(raw: string): { answer: string; followups: string[] } {
  const idx = raw.indexOf(FOLLOWUP_MARKER)
  if (idx === -1) return { answer: raw, followups: [] }
  const answerPart = raw.slice(0, idx).trim()
  const jsonPart = raw.slice(idx + FOLLOWUP_MARKER.length).trim()
  let followups: string[] = []
  try {
    const parsed = JSON.parse(jsonPart)
    if (Array.isArray(parsed)) followups = parsed.filter((s) => typeof s === 'string')
  } catch {
    // still streaming the JSON — that's fine
  }
  return { answer: answerPart, followups }
}

function CitationButton({ n }: { n: string }) {
  return (
    <button
      type="button"
      title={`Jump to source ${n}`}
      onClick={() =>
        document
          .querySelector(`[data-citation="${n}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      className="mx-0.5 inline-flex h-[1.1em] min-w-[1.3em] items-center justify-center rounded-sm bg-[color:var(--accent-green)]/15 px-1 font-mono text-[11px] font-bold text-[color:var(--accent-green)] align-middle transition-all hover:bg-[color:var(--accent-green)]/30"
    >
      [{n}]
    </button>
  )
}

function renderWithCitations(text: string) {
  const parts = text.split(/(\[\d+\])/g)
  return parts.map((part, i) => {
    const m = part.match(/^\[(\d+)\]$/)
    if (m) return <CitationButton key={i} n={m[1]} />
    return <React.Fragment key={i}>{part}</React.Fragment>
  })
}

function AnswerText({
  text,
  streaming,
}: {
  text: string
  streaming: boolean
}) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-[1.8] prose-p:text-[15px] prose-p:text-foreground/90 prose-headings:font-serif prose-headings:text-foreground prose-strong:text-foreground prose-ul:text-foreground/85 prose-ol:text-foreground/85 prose-code:text-[color:var(--accent-green)] prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-[13px] prose-code:font-mono">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p>
              {React.Children.map(children, (child) => {
                if (typeof child === 'string') return renderWithCitations(child)
                return child
              })}
              {streaming && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse rounded-sm bg-[color:var(--accent-green)] align-middle" />
              )}
            </p>
          ),
          li: ({ children }) => (
            <li>
              {React.Children.map(children, (child) => {
                if (typeof child === 'string') return renderWithCitations(child)
                return child
              })}
            </li>
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-[color:var(--accent-green)] underline underline-offset-2 hover:opacity-80">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

function SourceChips({ snippets }: { snippets: Snippet[] }) {
  if (snippets.length === 0) return null
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {snippets.slice(0, 6).map((s, i) => {
        const host = (() => {
          try {
            return new URL(s.url).hostname.replace(/^www\./, '')
          } catch {
            return s.url
          }
        })()
        return (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[12px] text-muted-foreground transition-all hover:border-foreground/25 hover:text-foreground"
          >
            <span className="grid h-4 w-4 shrink-0 place-items-center rounded-sm bg-muted font-mono text-[10px] font-bold text-foreground/60 group-hover:bg-[color:var(--accent-green)]/15 group-hover:text-[color:var(--accent-green)]">
              {i + 1}
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`}
              alt=""
              width={12}
              height={12}
              className="h-3 w-3 rounded-sm"
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
            <span className="max-w-[120px] truncate">{host}</span>
          </a>
        )
      })}
    </div>
  )
}

export function AiOverview({
  query,
  snippets,
  active,
  onFollowup,
}: {
  query: string
  snippets: Snippet[]
  active: boolean
  onFollowup?: (q: string) => void
}) {
  const [rawText, setRawText] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [hidden, setHidden] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [done, setDone] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const { answer, followups } = React.useMemo(() => parseStream(rawText), [rawText])

  const key = React.useMemo(
    () => `${query}::${snippets.map((s) => s.url).join('|')}`,
    [query, snippets],
  )

  React.useEffect(() => {
    if (!active || !query.trim() || snippets.length === 0) {
      setRawText('')
      setError(null)
      setHidden(false)
      setDone(false)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setRawText('')
    setDone(false)
    setHidden(false)

    ;(async () => {
      try {
        const res = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, results: snippets, stream: true }),
        })

        if (res.status === 503) {
          const data = await res.json().catch(() => ({}))
          if (data.configured === false) {
            if (!cancelled) setHidden(true)
            return
          }
        }

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Could not generate answer')
        }

        const ctype = res.headers.get('content-type') || ''
        if (ctype.includes('text/plain') && res.body) {
          if (!cancelled) setLoading(false)
          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let acc = ''
          while (!cancelled) {
            const { done: d, value } = await reader.read()
            if (d) break
            acc += decoder.decode(value, { stream: true })
            if (!cancelled) setRawText(acc)
          }
          if (!cancelled) setDone(true)
          return
        }

        const data = await res.json()
        if (!cancelled) {
          setRawText(data.text ?? '')
          setDone(true)
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Something went wrong')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [key, query, snippets, active])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(answer)
      setCopied(true)
      toast.success('Answer copied')
      setTimeout(() => setCopied(false), 1600)
    } catch {
      toast.error('Could not copy')
    }
  }

  if (hidden) return null
  if (!active || snippets.length === 0) return null

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-[color:var(--paper-raised)] shadow-[0_8px_40px_-20px_rgba(0,0,0,0.18)]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-[color:var(--accent-green)]/10">
            <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent-green)]" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Scout AI
            </p>
            <p className="font-serif text-[14px] leading-tight text-foreground">
              Answer
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {loading && (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--accent-green)]" />
              Thinking…
            </span>
          )}
          {done && answer && (
            <button
              type="button"
              onClick={handleCopy}
              title="Copy answer"
              className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-[color:var(--accent-green)]" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-5 pt-4">
        {/* Loading skeleton */}
        {loading && !rawText && (
          <div className="space-y-2.5">
            <div className="h-4 w-full animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-[94%] animate-pulse rounded-md bg-muted" />
            <div className="h-4 w-[88%] animate-pulse rounded-md bg-muted" />
            <div className="mt-3 h-4 w-full animate-pulse rounded-md bg-muted/70" />
            <div className="h-4 w-[96%] animate-pulse rounded-md bg-muted/70" />
            <div className="h-4 w-[60%] animate-pulse rounded-md bg-muted/70" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive/70" />
            <span>{error}</span>
          </div>
        )}

        {/* Streaming / final answer */}
        {answer && (
          <>
            <AnswerText text={answer} streaming={!done} />
            <SourceChips snippets={snippets} />
          </>
        )}

        {/* Follow-up questions */}
        {done && followups.length > 0 && onFollowup && (
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              People also ask
            </p>
            <div className="flex flex-col gap-1.5">
              {followups.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => onFollowup(q)}
                  className={cn(
                    'group flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-2.5 text-left text-[13px] text-foreground/80',
                    'transition-all hover:border-foreground/20 hover:bg-muted/50 hover:text-foreground',
                  )}
                >
                  <span className="leading-snug">{q}</span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        {done && (
          <p className="mt-4 text-[11px] text-muted-foreground/60">
            AI can make mistakes — verify important facts from the sources below.
          </p>
        )}
      </div>
    </div>
  )
}
