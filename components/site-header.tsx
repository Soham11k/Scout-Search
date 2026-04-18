'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/logo'
import { UserMenu } from '@/components/user-menu'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/#features', label: 'Features' },
  { href: '/#how', label: 'How it works' },
  { href: '/#words', label: 'Words' },
  { href: '/#faq', label: 'FAQ' },
]

export function SiteHeader({
  variant = 'marketing',
}: {
  variant?: 'marketing' | 'app'
}) {
  const { user, status } = useAuth()
  const pathname = usePathname()
  const [scrolled, setScrolled] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  React.useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full transition-colors',
        scrolled || variant === 'app'
          ? 'backdrop-blur-md bg-background/75 border-b border-border'
          : 'bg-transparent',
      )}
    >
      <div className="container-editorial flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="Scout home" className="shrink-0">
            <Logo />
          </Link>
          {variant === 'marketing' && (
            <nav className="hidden md:flex items-center gap-6">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground link-underline"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === 'authenticated' && user ? (
            <>
              {variant === 'marketing' && (
                <Link
                  href="/app"
                  className="hidden sm:inline-flex items-center rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Open Scout →
                </Link>
              )}
              <UserMenu />
            </>
          ) : status === 'unauthenticated' ? (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full bg-foreground px-3.5 py-1.5 text-sm font-medium text-background hover:opacity-90 transition-opacity btn-shadow"
              >
                Get started
              </Link>
            </>
          ) : (
            <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
          )}

          {variant === 'marketing' && (
            <button
              className="md:hidden grid h-9 w-9 place-items-center rounded-lg border border-border"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {mobileOpen && variant === 'marketing' && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container-editorial py-4 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-2 py-2 text-sm hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
