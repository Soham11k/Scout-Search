'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[12px] font-medium text-foreground/80">
          {label}
        </span>
        {hint && (
          <span className="text-[11px] text-muted-foreground">{hint}</span>
        )}
      </div>
      {children}
    </label>
  )
}

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-lg border border-border bg-[color:var(--input)] px-3.5 py-2.5 text-[15px] text-foreground outline-none',
        'placeholder:text-muted-foreground/70',
        'focus:border-foreground/40 focus:ring-2 focus:ring-foreground/10',
        'transition-colors',
        className,
      )}
    />
  )
}

export function PasswordInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  const [shown, setShown] = React.useState(false)
  return (
    <div className="relative">
      <TextInput
        {...props}
        type={shown ? 'text' : 'password'}
        className="pr-11"
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="absolute right-1 top-1 grid h-[calc(100%-0.5rem)] w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={shown ? 'Hide password' : 'Show password'}
      >
        {shown ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}

export function SubmitButton({
  loading,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={cn(
        'relative inline-flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background btn-shadow',
        'hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed',
        'transition-opacity',
      )}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-background/30 border-t-background"
        />
      )}
      {children}
    </button>
  )
}

export function InlineAlert({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'info'
  children: React.ReactNode
}) {
  const toneClass =
    tone === 'error'
      ? 'border-destructive/30 bg-destructive/10 text-destructive'
      : 'border-border bg-muted text-foreground/80'
  return (
    <div
      role="alert"
      className={cn('rounded-lg border px-3 py-2 text-[13px]', toneClass)}
    >
      {children}
    </div>
  )
}

export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="h-px bg-border" />
  return (
    <div className="my-1 flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
