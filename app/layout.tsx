import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono, Instrument_Serif } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { PaletteProvider } from '@/lib/palette'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/lib/auth'
import './globals.css'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})
const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Scout — AI Search',
  description:
    'AI-powered search that answers first, cites its sources, and saves what matters. For everyone.',
  generator: 'Scout',
  applicationName: 'Scout',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Scout',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/icon.svg',
  },
  metadataBase: new URL('https://scout-search-eight.vercel.app'),
  openGraph: {
    title: 'Scout — AI Search',
    description:
      'AI-powered search that answers first, cites its sources, and saves what matters.',
    type: 'website',
    siteName: 'Scout',
    url: 'https://scout-search-eight.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Scout — AI Search',
    description:
      'AI-powered search that answers first, cites its sources, and saves what matters.',
    creator: '@scout',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f3ea' },
    { media: '(prefers-color-scheme: dark)', color: '#101214' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${serif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem('scout:palette');if(p&&['paper','sepia','mono','ocean','rose','forest'].indexOf(p)>-1){document.documentElement.setAttribute('data-palette',p)}else{document.documentElement.setAttribute('data-palette','paper')}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <PaletteProvider>
            <AuthProvider>
              {children}
              <Toaster position="bottom-right" closeButton />
            </AuthProvider>
          </PaletteProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
