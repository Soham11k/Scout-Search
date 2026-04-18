import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Scout — AI Search'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background:
            'linear-gradient(135deg, #1a1513 0%, #2a201b 55%, #1a1513 100%)',
          fontFamily: 'serif',
          color: '#f7f3ea',
          position: 'relative',
        }}
      >
        {/* Faint grid lines */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(#f7f3ea0c 1px, transparent 1px), linear-gradient(90deg, #f7f3ea0c 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Top row: logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '18px',
              background: '#f7f3ea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle
                cx="24"
                cy="24"
                r="17"
                stroke="#1a1513"
                strokeWidth="2.5"
              />
              <line
                x1="24"
                y1="5"
                x2="24"
                y2="43"
                stroke="#1a1513"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path d="M24 24 L32 16 L24 24 L16 32 Z" fill="#1a1513" />
            </svg>
            <div
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#c98745',
              }}
            />
          </div>
          <div
            style={{
              fontSize: '40px',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#f7f3ea',
              fontFamily: 'sans-serif',
            }}
          >
            Scout
          </div>
        </div>

        {/* Middle: big tagline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div
            style={{
              fontSize: '94px',
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              fontWeight: 400,
              maxWidth: '950px',
              color: '#f7f3ea',
              display: 'flex',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontFamily: 'sans-serif', fontWeight: 600 }}>
              A quieter place to&nbsp;
            </span>
            <span
              style={{
                fontStyle: 'italic',
                color: '#c98745',
                fontFamily: 'serif',
              }}
            >
              look things up.
            </span>
          </div>
          <div
            style={{
              fontSize: '28px',
              color: '#b3a99a',
              maxWidth: '900px',
              lineHeight: 1.35,
              fontFamily: 'sans-serif',
            }}
          >
            AI-powered search that answers first, cites its sources, and saves
            what matters.
          </div>
        </div>

        {/* Bottom: URL + feature pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              fontFamily: 'sans-serif',
            }}
          >
            {['AI answers', 'Real sources', 'Bookmarks', '6 palettes'].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '999px',
                    border: '1px solid #f7f3ea30',
                    fontSize: '20px',
                    color: '#e8dfce',
                  }}
                >
                  {label}
                </div>
              ),
            )}
          </div>
          <div
            style={{
              fontSize: '22px',
              color: '#c98745',
              fontFamily: 'monospace',
            }}
          >
            scout-search-eight.vercel.app
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
