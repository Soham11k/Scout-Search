'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { id: 'light', icon: Sun, label: 'Light' },
  { id: 'system', icon: Monitor, label: 'System' },
  { id: 'dark', icon: Moon, label: 'Dark' },
] as const

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const active = mounted ? theme ?? 'system' : 'system'

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        'relative inline-flex items-center gap-1 rounded-full p-1 glass',
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon
        const isActive = active === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={opt.label}
            onClick={() => setTheme(opt.id)}
            className={cn(
              'relative z-10 grid h-7 w-7 place-items-center rounded-full transition-colors',
              isActive
                ? 'text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-[var(--gradient-1)] to-[var(--gradient-2)] shadow-sm"
              />
            )}
            <Icon className="h-3.5 w-3.5" />
          </button>
        )
      })}
      <span className="sr-only">
        Current theme: {mounted ? resolvedTheme : 'system'}
      </span>
    </div>
  )
}
