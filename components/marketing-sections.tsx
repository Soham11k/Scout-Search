'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookmarkPlus,
  Keyboard,
  Leaf,
  ShieldCheck,
  Sparkles,
  Timer,
  Plus,
  Minus,
} from 'lucide-react'
import { Reveal } from '@/components/reveal'
import { HeroIllustration } from '@/components/hero-illustration'

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16 md:pt-24 pb-14 md:pb-20">
      <AmbientLines />
      <div className="container-editorial grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Reveal className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--accent-green)]" />
            Now in public beta · v0.3
          </Reveal>

          <Reveal delay={60}>
            <h1 className="mt-6 text-[44px] leading-[1.02] tracking-tight md:text-[64px]">
              A quieter place to{' '}
              <span className="font-serif italic text-[color:var(--accent-green)]">
                look things up.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-5 max-w-xl text-pretty text-[17px] leading-relaxed text-muted-foreground md:text-lg">
              Scout is a small, human-crafted search tool. It keeps the web
              calm, lets you bookmark anything in a keystroke, and respects
              your attention the way a good notebook would.
            </p>
          </Reveal>

          <Reveal delay={260}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background btn-shadow hover:opacity-95"
              >
                Create your account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium hover:bg-muted"
              >
                I already have one
              </Link>
              <span className="ml-1 hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
                <Keyboard className="h-3.5 w-3.5" />
                or press{' '}
                <kbd className="rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-[10px]">
                  <span>⌘</span>K
                </kbd>{' '}
                once inside
              </span>
            </div>
          </Reveal>

          <Reveal delay={360}>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[color:var(--accent-green)]" />
                No ads, no tracking pixels
              </span>
              <span className="inline-flex items-center gap-2">
                <Leaf className="h-4 w-4 text-[color:var(--accent-green)]" />
                Self-funded & independent
              </span>
              <span className="inline-flex items-center gap-2">
                <Timer className="h-4 w-4 text-[color:var(--accent-green)]" />
                Setup in 30 seconds
              </span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={180}>
          <HeroIllustration />
        </Reveal>
      </div>
    </section>
  )
}

function AmbientLines() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -top-20 h-[520px] w-full opacity-[0.35] dark:opacity-25"
      viewBox="0 0 1200 500"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="ln" x1="0" x2="1">
          <stop offset="0" stopColor="var(--ink)" stopOpacity="0" />
          <stop offset="0.5" stopColor="var(--ink)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--ink)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: 6 }).map((_, i) => {
        const y = 40 + i * 70
        return (
          <path
            key={i}
            d={`M0 ${y} Q 300 ${y - 40 + i * 6} 600 ${y} T 1200 ${y + 10}`}
            stroke="url(#ln)"
            strokeWidth="1"
            fill="none"
          />
        )
      })}
    </svg>
  )
}

export function PressStrip() {
  const items = [
    'The Quiet Review',
    'Field Notes',
    'Paper & Pixel',
    'Indie Hackers',
    'Makers Weekly',
    'Slow Internet',
    'Craftwork',
    'The Desk Journal',
  ]
  return (
    <section className="border-y border-border bg-[color:var(--paper-raised)]">
      <div className="container-editorial py-6">
        <div className="mb-3 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Quietly appreciated in
        </div>
        <div className="marquee-mask relative overflow-hidden">
          <div className="marquee-track flex w-max items-center gap-10 whitespace-nowrap">
            {[...items, ...items].map((label, i) => (
              <span
                key={i}
                className="font-serif text-xl italic text-foreground/70"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Results that breathe',
    body:
      'Generous line-height, quiet color, and a layout designed for the way you actually scan. No dark patterns, no endless carousels.',
  },
  {
    icon: BookmarkPlus,
    title: 'Bookmark with one tap',
    body:
      'Every result is a single keystroke away from your library. Scout keeps them tidy, searchable, and organized.',
  },
  {
    icon: Keyboard,
    title: 'Keyboard-first',
    body:
      '⌘K from anywhere. Arrow-key to move. Enter to open. Everything you love about fast tools, nothing you don’t.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by posture',
    body:
      'We don’t track you, sell your queries, or bounce them through ad networks. Your search stays yours.',
  },
  {
    icon: Timer,
    title: 'Feather-light',
    body:
      'Under 70 KB of JS on the landing page. Scout loads before your coffee stops swirling.',
  },
  {
    icon: Leaf,
    title: 'Made by one person',
    body:
      'Scout is built in a small workshop by one human who prefers craft over convenience.',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container-editorial">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Ideas we live by
          </p>
          <h2 className="mt-3 max-w-2xl text-balance text-4xl leading-[1.05] tracking-tight md:text-5xl">
            The small things,{' '}
            <span className="font-serif italic">done well.</span>
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            A handful of opinions that shape how Scout is built, and why it
            feels different the moment you use it.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <Reveal
                key={f.title}
                delay={i * 70}
                className="bg-background p-7 transition-colors hover:bg-[color:var(--paper-raised)]"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-md border border-border bg-card text-[color:var(--accent-green)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="font-serif text-xl">{f.title}</span>
                </div>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Sign in, quickly.',
      body:
        'Scout uses a simple local account so you can try it without a corporate sign-up flow.',
    },
    {
      n: '02',
      title: 'Search, calmly.',
      body:
        'Type a query. The results are clean, your recents are private, and everything feels considered.',
    },
    {
      n: '03',
      title: 'Save what matters.',
      body:
        'Tap to bookmark. Filter them later from the sidebar. Nothing is buried.',
    },
  ]
  return (
    <section id="how" className="py-20 md:py-28 bg-[color:var(--paper-raised)] border-y border-border">
      <div className="container-editorial">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            How it works
          </p>
          <h2 className="mt-3 text-balance text-4xl leading-[1.05] tracking-tight md:text-5xl">
            Three steps,{' '}
            <span className="font-serif italic">no dials to turn.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal
              key={s.n}
              delay={i * 100}
              className="relative rounded-2xl border border-border bg-background p-7"
            >
              <div className="absolute -top-4 left-6 rounded-md bg-[color:var(--ink)] px-2 py-1 font-mono text-[11px] text-[color:var(--paper)]">
                {s.n}
              </div>
              <h3 className="mt-2 font-serif text-2xl">{s.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                {s.body}
              </p>
              {i < steps.length - 1 && (
                <ArrowDoodle className="hidden md:block absolute -right-6 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function ArrowDoodle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 40"
      className={className}
      width="48"
      height="24"
      fill="none"
      aria-hidden
    >
      <path
        d="M2 20 C 20 2, 40 40, 70 20"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeDasharray="3 5"
      />
      <path
        d="M60 14 L72 20 L60 26"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const TESTIMONIALS = [
  {
    name: 'Miriam Osei',
    role: 'Editor, The Quiet Review',
    hue: 25,
    quote:
      'It feels like someone finally made a search tool with taste. The empty state alone made me smile.',
  },
  {
    name: 'Kenji Park',
    role: 'Writer & researcher',
    hue: 200,
    quote:
      'I keep Scout open in a pinned tab all day. The keyboard shortcuts are genuinely delightful.',
  },
  {
    name: 'Amélie Laurent',
    role: 'Designer, Paper & Pixel',
    hue: 330,
    quote:
      'The typography, the restraint, the tiny animations — this is what software used to feel like.',
  },
]

export function Testimonials() {
  return (
    <section id="words" className="py-20 md:py-28">
      <div className="container-editorial">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Kind words
          </p>
          <h2 className="mt-3 max-w-3xl text-balance text-4xl leading-[1.05] tracking-tight md:text-5xl">
            From people who use it{' '}
            <span className="font-serif italic">every day.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <Reveal
              key={t.name}
              delay={i * 100}
              className="rounded-2xl border border-border bg-[color:var(--paper-raised)] p-7"
            >
              <svg
                viewBox="0 0 24 24"
                width="22"
                height="22"
                className="text-[color:var(--accent-green)]"
                aria-hidden
              >
                <path
                  d="M10 6c-3 2-5 5-5 9v3h5v-7H7c0-2 1-4 3-5zm9 0c-3 2-5 5-5 9v3h5v-7h-3c0-2 1-4 3-5z"
                  fill="currentColor"
                />
              </svg>
              <p className="mt-3 font-serif text-[20px] leading-snug text-foreground">
                “{t.quote}”
              </p>
              <div className="mt-6 flex items-center gap-3">
                <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden>
                  <circle
                    cx="20"
                    cy="20"
                    r="19"
                    fill={`oklch(0.9 0.05 ${t.hue})`}
                    stroke={`oklch(0.3 0.08 ${t.hue})`}
                    strokeOpacity="0.2"
                  />
                  <text
                    x="20"
                    y="25"
                    textAnchor="middle"
                    fontSize="14"
                    fontFamily="var(--font-serif)"
                    fontStyle="italic"
                    fill={`oklch(0.3 0.08 ${t.hue})`}
                  >
                    {t.name
                      .split(' ')
                      .map((s) => s[0])
                      .join('')
                      .slice(0, 2)}
                  </text>
                </svg>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

const FAQS = [
  {
    q: 'Is Scout actually a search engine?',
    a: 'Scout is a thoughtful layer on top of a conventional search API (Google Custom Search by default). We don’t pretend to re-crawl the web — we make the parts you see feel calm.',
  },
  {
    q: 'Do you track my searches?',
    a: 'No. There are no ad pixels, no per-user analytics on your queries, and your recent searches live in your browser’s local storage, not on our servers.',
  },
  {
    q: 'How do bookmarks work?',
    a: 'Bookmarks are saved to Supabase when you configure it, or you can run Scout locally with a small demo store. Either way, you own your data.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'Not yet. Scout is a mobile-friendly web app today. A small, native companion is on the sketchpad for later in the year.',
  },
  {
    q: 'Who builds Scout?',
    a: 'One person, in a tiny studio, with too much coffee. It’s a project of patience rather than a startup.',
  },
]

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-28 border-t border-border">
      <div className="container-editorial grid gap-10 md:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Questions
          </p>
          <h2 className="mt-3 text-balance text-4xl leading-[1.05] tracking-tight md:text-5xl">
            Short answers,{' '}
            <span className="font-serif italic">honest ones.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            If you need a longer answer, write to{' '}
            <a
              href="mailto:hello@scout.example"
              className="dotted-underline hover:text-foreground"
            >
              hello@scout.example
            </a>
            .
          </p>
        </Reveal>

        <div className="divide-y divide-border rounded-2xl border border-border bg-[color:var(--paper-raised)]">
          {FAQS.map((item, i) => (
            <FAQItem key={i} q={item.q} a={item.a} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
        aria-expanded={open}
      >
        <span className="font-serif text-[19px] leading-snug">{q}</span>
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        >
          {open ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </span>
      </button>
      <div
        className="grid transition-all duration-300 ease-out"
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
        }}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-6 text-[15px] leading-relaxed text-muted-foreground">
            {a}
          </p>
        </div>
      </div>
    </div>
  )
}

export function FinalCTA() {
  return (
    <section className="pt-16 pb-24">
      <div className="container-editorial">
        <Reveal className="relative overflow-hidden rounded-[28px] border border-border bg-[color:var(--ink)] p-10 md:p-14 text-[color:var(--paper)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full opacity-[0.12]"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, var(--accent-warm), transparent 60%)',
            }}
          />
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--paper)]/60">
            One more thing
          </p>
          <h2 className="mt-3 max-w-2xl text-balance text-4xl leading-[1.05] tracking-tight md:text-[52px]">
            Come sit for a minute.{' '}
            <span className="font-serif italic text-[color:var(--accent-warm)]">
              The tea’s still warm.
            </span>
          </h2>
          <p className="mt-4 max-w-xl text-[color:var(--paper)]/75">
            Scout takes under a minute to set up and you can leave whenever you
            like. No credit card, no hand-shaking.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--paper)] px-5 py-3 text-sm font-semibold text-[color:var(--ink)] hover:opacity-95"
            >
              Create your account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-full border border-[color:var(--paper)]/30 px-5 py-3 text-sm font-medium text-[color:var(--paper)] hover:bg-[color:var(--paper)]/10"
            >
              Sign in
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
