import { cn } from '@/lib/utils'

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string
  showWordmark?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        aria-hidden
        className="relative grid h-7 w-7 place-items-center rounded-md bg-[color:var(--ink)] text-[color:var(--paper)]"
      >
        {/* Compass rose mark */}
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 3.5 L12 20.5" />
          <path d="M3.5 12 L20.5 12" opacity="0.55" />
          <path d="M12 12 L15.5 8.5 L12 12 L8.5 15.5 Z" fill="currentColor" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[color:var(--accent-warm)]" />
      </span>
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight">
          Scout
        </span>
      )}
    </span>
  )
}
