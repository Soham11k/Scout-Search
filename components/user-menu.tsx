'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ChevronDown,
  LogOut,
  BookMarked,
  Sparkles,
  Monitor,
  Moon,
  Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { useAuth, initialsOf, type User } from '@/lib/auth'
import { usePalette, PALETTES } from '@/lib/palette'
import { cn } from '@/lib/utils'

export function Avatar({
  user,
  size = 32,
  className,
}: {
  user: Pick<User, 'name' | 'avatarHue'>
  size?: number
  className?: string
}) {
  const initials = initialsOf(user.name)
  return (
    <span
      aria-hidden
      className={cn(
        'inline-grid place-items-center rounded-full font-semibold text-[0.72em] tracking-tight',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `oklch(0.92 0.05 ${user.avatarHue})`,
        color: `oklch(0.3 0.08 ${user.avatarHue})`,
        border: '1px solid color-mix(in oklch, currentColor 8%, transparent)',
      }}
    >
      {initials || '·'}
    </span>
  )
}

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const router = useRouter()

  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  if (!user) return null

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-2 py-1 pr-3 text-sm hover:bg-card transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar user={user} size={24} />
        <span className="max-w-[120px] truncate font-medium">{user.name}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
        >
          <div className="border-b border-border p-3">
            <div className="flex items-center gap-3">
              <Avatar user={user} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <div className="p-1">
            <MenuLink
              href="/app"
              icon={<Sparkles className="h-4 w-4" />}
              label="Open Scout"
              onSelect={() => setOpen(false)}
            />
            <MenuLink
              href="/app?view=bookmarks"
              icon={<BookMarked className="h-4 w-4" />}
              label="Bookmarks"
              onSelect={() => setOpen(false)}
            />
          </div>

          <div className="border-t border-border p-2">
            <ThemeRow />
            <PaletteRow />
          </div>

          <div className="border-t border-border p-1">
            <button
              role="menuitem"
              onClick={() => {
                signOut()
                setOpen(false)
                router.push('/')
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/90 hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuLink({
  href,
  icon,
  label,
  onSelect,
}: {
  href: string
  icon: React.ReactNode
  label: string
  onSelect: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      role="menuitem"
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
    >
      <span className="text-muted-foreground">{icon}</span>
      {label}
    </Link>
  )
}

function PaletteRow() {
  const { palette, setPalette } = usePalette()
  return (
    <div className="flex items-center justify-between gap-2 px-2 pt-2 pb-1">
      <span className="text-xs font-medium text-muted-foreground">Palette</span>
      <div className="inline-flex items-center gap-1">
        {PALETTES.map((p) => {
          const active = palette === p.id
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPalette(p.id)
                toast.success(`Palette: ${p.label}`)
              }}
              aria-label={p.label}
              title={p.label}
              className={cn(
                'grid h-5 w-5 place-items-center rounded-full border transition-all',
                active
                  ? 'border-foreground scale-110 shadow-sm'
                  : 'border-border hover:scale-105',
              )}
              style={{ background: p.swatch }}
            >
              {active && (
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full bg-white mix-blend-difference"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ThemeRow() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const current = mounted ? theme ?? 'system' : 'system'
  const OPTIONS = [
    { id: 'light', icon: Sun, label: 'Light' },
    { id: 'system', icon: Monitor, label: 'System' },
    { id: 'dark', icon: Moon, label: 'Dark' },
  ] as const
  return (
    <div className="flex items-center justify-between px-2 py-1">
      <span className="text-xs font-medium text-muted-foreground">Theme</span>
      <div className="inline-flex rounded-full border border-border p-0.5">
        {OPTIONS.map((o) => {
          const Icon = o.icon
          const active = current === o.id
          return (
            <button
              key={o.id}
              onClick={() => setTheme(o.id)}
              aria-label={o.label}
              className={cn(
                'grid h-6 w-6 place-items-center rounded-full transition-colors',
                active
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-3 w-3" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
