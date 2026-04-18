'use client'

import * as React from 'react'

/**
 * Hand-drawn-ish compass / search illustration. Pure SVG with CSS animations
 * for a crafted, product-marketing feel.
 */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="relative mx-auto w-full max-w-[520px] aspect-[5/4]">
        {/* Floating paper cards in the background */}
        <Card
          className="absolute left-[6%] top-[18%] w-[44%] rotate-[-6deg] float-slow"
          title="The Quiet Web"
          meta="quietweb.org"
          hue={55}
          style={{ animationDelay: '-2s' }}
        />
        <Card
          className="absolute right-[4%] top-[8%] w-[40%] rotate-[5deg] float-slow"
          title="Garden notes"
          meta="aworkinggarden.com"
          hue={155}
          style={{ animationDelay: '-4s' }}
        />
        <Card
          className="absolute right-[8%] bottom-[6%] w-[48%] rotate-[-3deg] float-slow"
          title="Letters to myself"
          meta="lettersto.me"
          hue={220}
          style={{ animationDelay: '-6s' }}
        />

        {/* Compass */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <svg
            viewBox="0 0 260 260"
            className="h-56 w-56 md:h-64 md:w-64 text-[color:var(--ink)] dark:text-[color:var(--foreground)]"
          >
            <defs>
              <filter id="softshadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" />
              </filter>
            </defs>

            {/* Outer paper disc */}
            <circle
              cx="130"
              cy="130"
              r="112"
              fill="var(--paper-raised)"
              stroke="currentColor"
              strokeOpacity="0.9"
              strokeWidth="1.25"
            />
            <circle
              cx="130"
              cy="130"
              r="104"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="0.8"
              strokeDasharray="2 4"
            />

            {/* Tick marks around the rim */}
            {Array.from({ length: 48 }).map((_, i) => {
              const angle = (i / 48) * Math.PI * 2
              const inner = i % 4 === 0 ? 94 : 100
              const x1 = 130 + Math.cos(angle) * inner
              const y1 = 130 + Math.sin(angle) * inner
              const x2 = 130 + Math.cos(angle) * 108
              const y2 = 130 + Math.sin(angle) * 108
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeOpacity={i % 4 === 0 ? 0.9 : 0.35}
                  strokeWidth={i % 4 === 0 ? 1.2 : 0.8}
                />
              )
            })}

            {/* Cardinal letters (editorial serif) */}
            {[
              { x: 130, y: 40, label: 'N' },
              { x: 220, y: 135, label: 'E' },
              { x: 130, y: 228, label: 'S' },
              { x: 40, y: 135, label: 'W' },
            ].map((p) => (
              <text
                key={p.label}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-serif)"
                fontStyle="italic"
                fontSize="18"
                fill="currentColor"
                opacity="0.85"
              >
                {p.label}
              </text>
            ))}

            {/* Compass needle – slow rotation */}
            <g
              style={{
                transformOrigin: '130px 130px',
                animation: 'needle-spin 22s linear infinite',
              }}
            >
              <polygon
                points="130,60 138,130 130,200 122,130"
                fill="currentColor"
                opacity="0.9"
              />
              <polygon
                points="130,60 138,130 130,130"
                fill="var(--accent-warm)"
              />
            </g>

            {/* Center pin */}
            <circle cx="130" cy="130" r="5.5" fill="currentColor" />
            <circle cx="130" cy="130" r="2" fill="var(--paper-raised)" />
          </svg>

          {/* Orbiting tag */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0">
            <span
              className="orbit absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-border bg-[color:var(--paper-raised)] px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm"
              style={{ ['--r' as never]: '120px', ['--speed' as never]: '28s' }}
            >
              <span
                className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                style={{ background: 'var(--accent-green)' }}
              />
              searching…
            </span>
          </div>
        </div>

        <style>{`
          @keyframes needle-spin {
            0% { transform: rotate(0deg); }
            20% { transform: rotate(70deg); }
            40% { transform: rotate(40deg); }
            60% { transform: rotate(210deg); }
            80% { transform: rotate(180deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}

function Card({
  className,
  style,
  title,
  meta,
  hue,
}: {
  className?: string
  style?: React.CSSProperties
  title: string
  meta: string
  hue: number
}) {
  return (
    <div
      className={
        'rounded-lg border border-border bg-[color:var(--paper-raised)] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] px-3 py-2 ' +
        (className || '')
      }
      style={style}
    >
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ background: `oklch(0.7 0.12 ${hue})` }}
        />
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          {meta}
        </span>
      </div>
      <p className="mt-1 font-serif text-[15px] leading-tight text-foreground">
        {title}
      </p>
      <div className="mt-2 h-1 w-[60%] rounded-full bg-[color:var(--muted)]" />
      <div className="mt-1 h-1 w-[40%] rounded-full bg-[color:var(--muted)]" />
    </div>
  )
}
