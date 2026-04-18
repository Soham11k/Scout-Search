'use client'

import * as React from 'react'
import Link from 'next/link'
import { Logo } from '@/components/logo'

export function AuthShell({
  children,
  title,
  subtitle,
  footer,
}: {
  children: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left: form */}
      <div className="flex min-h-screen flex-col px-6 py-8 md:px-14">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Scout home">
            <Logo />
          </Link>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ← Back to home
          </Link>
        </div>

        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="text-[32px] leading-[1.05] tracking-tight md:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-3 text-[15px] text-muted-foreground">
                {subtitle}
              </p>
            )}
            <div className="mt-8">{children}</div>
          </div>
        </div>

        <div className="mt-6 text-xs text-muted-foreground">{footer}</div>
      </div>

      {/* Right: editorial illustration */}
      <aside className="relative hidden md:block bg-[color:var(--ink)] text-[color:var(--paper)] overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(closest-side at 30% 30%, color-mix(in oklch, var(--accent-warm) 30%, transparent), transparent 60%), radial-gradient(closest-side at 70% 70%, color-mix(in oklch, var(--accent-green) 28%, transparent), transparent 60%)',
            opacity: 0.6,
          }}
        />
        {/* Dot grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'radial-gradient(currentColor 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />

        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <div />

          <figure className="max-w-md">
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              className="opacity-70"
              aria-hidden
            >
              <path
                d="M10 6c-3 2-5 5-5 9v3h5v-7H7c0-2 1-4 3-5zm9 0c-3 2-5 5-5 9v3h5v-7h-3c0-2 1-4 3-5z"
                fill="currentColor"
              />
            </svg>
            <blockquote className="mt-6 font-serif text-[26px] leading-[1.2] md:text-[32px]">
              The right tool doesn’t shout. It waits, politely, for you to
              look up — then disappears.
            </blockquote>
            <figcaption className="mt-6 text-sm text-[color:var(--paper)]/70">
              — a note on our desk
            </figcaption>
          </figure>

          <div className="flex items-center gap-3 text-xs text-[color:var(--paper)]/60">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--accent-green)]" />
            Built carefully · Used calmly
          </div>
        </div>
      </aside>
    </div>
  )
}
