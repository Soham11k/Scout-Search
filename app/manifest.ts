import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Scout — AI Search',
    short_name: 'Scout',
    description:
      'AI-powered search that answers first, cites sources, and saves what matters.',
    start_url: '/app',
    display: 'standalone',
    background_color: '#f7f3ea',
    theme_color: '#f7f3ea',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
    screenshots: [],
    shortcuts: [
      {
        name: 'New Search',
        url: '/app',
        description: 'Open Scout and start a new search',
      },
    ],
    categories: ['productivity', 'utilities'],
    lang: 'en',
    dir: 'ltr',
  }
}
