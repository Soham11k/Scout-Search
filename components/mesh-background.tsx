export function MeshBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Soft radial wash */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_60%)]" />

      {/* Animated color blobs */}
      <div
        className="blob absolute -top-32 -left-32 h-[520px] w-[520px] rounded-full opacity-50 dark:opacity-40 mix-blend-normal"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, var(--gradient-1), transparent 60%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="blob absolute top-1/4 -right-24 h-[520px] w-[520px] rounded-full opacity-45 dark:opacity-35"
        style={{
          background:
            'radial-gradient(circle at 70% 30%, var(--gradient-2), transparent 60%)',
          filter: 'blur(90px)',
          animationDelay: '-6s',
        }}
      />
      <div
        className="blob absolute bottom-[-180px] left-1/3 h-[520px] w-[520px] rounded-full opacity-40 dark:opacity-30"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, var(--gradient-3), transparent 60%)',
          filter: 'blur(90px)',
          animationDelay: '-12s',
        }}
      />

      {/* Grain overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  )
}
