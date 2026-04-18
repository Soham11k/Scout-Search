import { NextRequest, NextResponse } from 'next/server'
import type { ImageStripItem, SearchResult } from '@/lib/search-types'
import { getSearchCache, setSearchCache } from '@/lib/search-cache'
import { rateLimit, getIP } from '@/lib/rate-limit'

function faviconFor(host: string) {
  return `https://www.google.com/s2/favicons?domain=${host}&sz=64`
}

function hashToSeed(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

function demoImageForUrl(url: string): string {
  const seed = hashToSeed(url)
  return `https://picsum.photos/seed/${seed}/800/480`
}

function demoImageStrip(query: string): ImageStripItem[] {
  const words = query.trim().split(/\s+/).slice(0, 3).join(',')
  return Array.from({ length: 8 }, (_, i) => {
    const seed = hashToSeed(`${query}:${i}`)
    // Use Lorem Picsum with a consistent seed per query term for variety
    const thumb = `https://picsum.photos/seed/${seed}/400/300`
    return {
      url: `https://unsplash.com/s/photos/${encodeURIComponent(words)}`,
      thumbnail: thumb,
      title: query,
      source: 'placeholder',
    }
  })
}

async function fetchPexelsImages(
  query: string,
  apiKey: string,
): Promise<ImageStripItem[]> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`
  const res = await fetch(url, {
    headers: { Authorization: apiKey },
    next: { revalidate: 300 },
  })
  if (!res.ok) return []
  const data = await res.json()
  return ((data.photos as Array<{
    url: string
    alt: string | null
    src: { medium: string; small: string }
    photographer: string
  }>) || []).map((p) => ({
    url: p.url,
    thumbnail: p.src.medium || p.src.small,
    title: p.alt || query,
    source: p.photographer || 'Pexels',
  }))
}

async function fetchUnsplashImages(
  query: string,
  accessKey: string,
): Promise<ImageStripItem[]> {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${accessKey}` },
    next: { revalidate: 300 },
  })
  if (!res.ok) return []
  const data = await res.json()
  return ((data.results as Array<{
    links: { html: string }
    urls: { small: string; regular: string }
    alt_description: string | null
    description: string | null
    user: { name: string }
  }>) || []).map((p) => ({
    url: p.links.html,
    thumbnail: p.urls.small,
    title: p.alt_description || p.description || query,
    source: p.user?.name || 'Unsplash',
  }))
}

function extractImageFromPagemap(
  pagemap: Record<string, unknown> | undefined,
): string | undefined {
  if (!pagemap) return undefined

  const cseImage = pagemap.cse_image as Array<{ src?: string }> | undefined
  if (cseImage?.[0]?.src) return sanitizeImageUrl(cseImage[0].src)

  const thumb = pagemap.cse_thumbnail as Array<{ src?: string }> | undefined
  if (thumb?.[0]?.src) return sanitizeImageUrl(thumb[0].src)

  const metatags = pagemap.metatags as Array<Record<string, string>> | undefined
  if (metatags?.length) {
    const m = metatags[0]
    const og =
      m['og:image'] ||
      m['twitter:image'] ||
      m['twitter:image:src'] ||
      m['image']
    if (og) return sanitizeImageUrl(og)
  }

  return undefined
}

function sanitizeImageUrl(u: string): string | undefined {
  try {
    if (u.startsWith('//')) return `https:${u}`
    const parsed = new URL(u)
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return u
  } catch {
    return undefined
  }
  return undefined
}

function demoResults(query: string): SearchResult[] {
  const q = query.trim()
  const base: Array<Omit<SearchResult, 'favicon' | 'displayUrl' | 'image'>> = [
    {
      title: `A quiet guide to “${q}”`,
      url: 'https://quietweb.org/guides/' + encodeURIComponent(q),
      description:
        'A thoughtful overview, written by humans, with footnotes and no sponsored links. Read slowly.',
    },
    {
      title: `Field notes on ${q}`,
      url: 'https://fieldnotes.blog/' + encodeURIComponent(q),
      description:
        'A small blog of observations, occasionally correct, always earnest. Updated on Sundays.',
    },
    {
      title: `${q[0]?.toUpperCase()}${q.slice(1)} — a beginner’s map`,
      url: 'https://paperpixel.com/beginners-map/' + encodeURIComponent(q),
      description:
        'A hand-drawn primer for people meeting “' + q + '” for the first time. Diagrams included.',
    },
    {
      title: `Why we keep coming back to ${q}`,
      url: 'https://lettersto.me/' + encodeURIComponent(q),
      description:
        'Part essay, part diary entry. A slow argument for paying more attention.',
    },
    {
      title: `${q} on Wikipedia`,
      url:
        'https://en.wikipedia.org/wiki/' +
        encodeURIComponent(q.replaceAll(' ', '_')),
      description:
        'The free encyclopedia’s overview, where rabbit holes of citations begin.',
    },
    {
      title: `Questions people ask about ${q}`,
      url: 'https://askquietly.com/threads/' + encodeURIComponent(q),
      description:
        'A moderated thread where strangers answer patiently and sign off with their names.',
    },
  ]
  return base.map((r) => {
    const hostname = new URL(r.url).hostname
    return {
      ...r,
      displayUrl: hostname.replace(/^www\./, ''),
      favicon: faviconFor(hostname),
      image: demoImageForUrl(r.url),
    }
  })
}

async function fetchGoogleImageStrip(
  query: string,
  apiKey: string,
  cx: string,
): Promise<ImageStripItem[]> {
  const url = new URL('https://www.googleapis.com/customsearch/v1')
  url.searchParams.set('q', query)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('cx', cx)
  url.searchParams.set('searchType', 'image')
  url.searchParams.set('num', '10')
  url.searchParams.set('safe', 'active')

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Scout/0.4)' },
  })
  if (!res.ok) return []

  const data = await res.json()
  const items = (data.items || []) as Array<{
    link?: string
    title?: string
    displayLink?: string
    image?: { thumbnailLink?: string; thumbnailWidth?: number }
  }>

  return items
    .filter((it) => it.link)
    .map((it) => ({
      url: it.link!,
      thumbnail: it.image?.thumbnailLink || it.link!,
      title: (it.title || 'Image').slice(0, 80),
      source: it.displayLink || '',
    }))
}

async function fetchBingResults(
  query: string,
  apiKey: string,
): Promise<{ results: SearchResult[]; imageStrip: ImageStripItem[] }> {
  const webUrl = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=10&mkt=en-US&safeSearch=Moderate&responseFilter=Webpages`
  const imgUrl = `https://api.bing.microsoft.com/v7.0/images/search?q=${encodeURIComponent(query)}&count=10&mkt=en-US&safeSearch=Moderate`
  const headers = { 'Ocp-Apim-Subscription-Key': apiKey }

  const [webRes, imgRes] = await Promise.all([
    fetch(webUrl, { headers }),
    fetch(imgUrl, { headers }),
  ])

  const [webData, imgData] = await Promise.all([
    webRes.ok ? webRes.json() : Promise.resolve({}),
    imgRes.ok ? imgRes.json() : Promise.resolve({}),
  ])

  const webItems = (webData.webPages?.value || []) as Array<{
    name: string
    url: string
    snippet?: string
    thumbnailUrl?: string
    dateLastCrawled?: string
  }>

  const results: SearchResult[] = webItems.map((item) => {
    let hostname = item.url
    try {
      hostname = new URL(item.url).hostname
    } catch {
      // keep raw
    }
    return {
      title: item.name,
      url: item.url,
      description: item.snippet ?? '',
      displayUrl: hostname.replace(/^www\./, ''),
      favicon: faviconFor(hostname),
      image: item.thumbnailUrl ?? undefined,
    }
  })

  const imgItems = (imgData.value || []) as Array<{
    contentUrl?: string
    thumbnailUrl?: string
    name?: string
    hostPageDomainFriendlyName?: string
  }>

  const imageStrip: ImageStripItem[] = imgItems
    .filter((it) => it.thumbnailUrl)
    .map((it) => ({
      url: it.contentUrl || it.thumbnailUrl!,
      thumbnail: it.thumbnailUrl!,
      title: it.name || 'Image',
      source: it.hostPageDomainFriendlyName || '',
    }))

  return { results, imageStrip }
}

// ---------------------------------------------------------------------------
// Brave Search API — 2,000 free/month, no credit card needed
// https://brave.com/search/api/
// ---------------------------------------------------------------------------
async function fetchBraveResults(
  query: string,
  apiKey: string,
): Promise<{ results: SearchResult[]; imageStrip: ImageStripItem[] }> {
  const webUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10&safesearch=moderate`
  const imgUrl = `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(query)}&count=12&safesearch=strict`
  const headers = {
    'X-Subscription-Token': apiKey,
    Accept: 'application/json',
  }

  const [webRes, imgRes] = await Promise.all([
    fetch(webUrl, { headers, next: { revalidate: 300 } }),
    fetch(imgUrl, { headers, next: { revalidate: 300 } }).catch(() => null),
  ])

  if (!webRes.ok) {
    console.error('[scout] Brave web returned', webRes.status)
    return { results: [], imageStrip: [] }
  }

  const webData = await webRes.json()
  const imgData = imgRes && imgRes.ok ? await imgRes.json() : {}

  const webItems = (webData.web?.results || []) as Array<{
    title: string
    url: string
    description?: string
    thumbnail?: { src?: string }
    profile?: { img?: string }
  }>

  const results: SearchResult[] = webItems.map((item) => {
    let hostname = item.url
    try {
      hostname = new URL(item.url).hostname
    } catch {
      // ignore
    }
    // Brave descriptions often include <strong> highlights — strip them
    const rawDesc = item.description ?? ''
    const description = rawDesc.replace(/<[^>]+>/g, '')
    return {
      title: item.title,
      url: item.url,
      description,
      displayUrl: hostname.replace(/^www\./, ''),
      favicon: faviconFor(hostname),
      image: sanitizeImageUrl(item.thumbnail?.src || ''),
    }
  })

  const imgItems = (imgData.results || []) as Array<{
    title?: string
    url?: string
    source?: string
    thumbnail?: { src?: string }
    properties?: { url?: string }
  }>

  const imageStrip: ImageStripItem[] = imgItems
    .filter((it) => it.thumbnail?.src)
    .slice(0, 12)
    .map((it) => ({
      url: it.url || it.properties?.url || it.thumbnail!.src!,
      thumbnail: it.thumbnail!.src!,
      title: it.title || 'Image',
      source: it.source || '',
    }))

  return { results, imageStrip }
}

// ---------------------------------------------------------------------------
// Serper.dev — Google search results API, 2,500 free queries, no card
// https://serper.dev/
// ---------------------------------------------------------------------------
async function fetchSerperResults(
  query: string,
  apiKey: string,
): Promise<{ results: SearchResult[]; imageStrip: ImageStripItem[] }> {
  const headers = {
    'X-API-KEY': apiKey,
    'Content-Type': 'application/json',
  }

  const [webRes, imgRes] = await Promise.all([
    fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers,
      body: JSON.stringify({ q: query, num: 10 }),
    }),
    fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers,
      body: JSON.stringify({ q: query, num: 12 }),
    }).catch(() => null),
  ])

  if (!webRes.ok) {
    console.error('[scout] Serper web returned', webRes.status)
    return { results: [], imageStrip: [] }
  }

  const webData = await webRes.json()
  const imgData = imgRes && imgRes.ok ? await imgRes.json() : {}

  const organic = (webData.organic || []) as Array<{
    title: string
    link: string
    snippet?: string
    imageUrl?: string
  }>

  const results: SearchResult[] = organic.map((item) => {
    let hostname = item.link
    try {
      hostname = new URL(item.link).hostname
    } catch {
      // ignore
    }
    return {
      title: item.title,
      url: item.link,
      description: item.snippet ?? '',
      displayUrl: hostname.replace(/^www\./, ''),
      favicon: faviconFor(hostname),
      image: sanitizeImageUrl(item.imageUrl || ''),
    }
  })

  const images = (imgData.images || []) as Array<{
    title?: string
    link?: string
    imageUrl?: string
    thumbnailUrl?: string
    source?: string
  }>

  const imageStrip: ImageStripItem[] = images
    .filter((it) => it.thumbnailUrl || it.imageUrl)
    .slice(0, 12)
    .map((it) => ({
      url: it.link || it.imageUrl || it.thumbnailUrl!,
      thumbnail: it.thumbnailUrl || it.imageUrl!,
      title: it.title || 'Image',
      source: it.source || '',
    }))

  return { results, imageStrip }
}

// ---------------------------------------------------------------------------
// Tavily — AI-optimized search, 1,000 free/month, no card
// https://tavily.com/
// ---------------------------------------------------------------------------
async function fetchTavilyResults(
  query: string,
  apiKey: string,
): Promise<SearchResult[]> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: 10,
      include_images: false,
    }),
  })
  if (!res.ok) return []

  const data = await res.json()
  const items = (data.results || []) as Array<{
    title: string
    url: string
    content?: string
  }>

  return items.map((item) => {
    let hostname = item.url
    try {
      hostname = new URL(item.url).hostname
    } catch {
      // ignore
    }
    return {
      title: item.title,
      url: item.url,
      description: item.content ?? '',
      displayUrl: hostname.replace(/^www\./, ''),
      favicon: faviconFor(hostname),
    }
  })
}

function respondCached(query: string, payload: Record<string, unknown>) {
  setSearchCache(query, payload)
  return NextResponse.json({ ...payload, cached: false })
}

export async function GET(request: NextRequest) {
  // Rate limit: 60 searches per IP per minute (generous — cached hits are cheap)
  const rl = rateLimit(getIP(request), 60, 60_000)
  if (rl.limited) {
    return NextResponse.json(
      { error: `Too many searches — try again in ${rl.retryAfterSecs}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSecs) } },
    )
  }

  const query = request.nextUrl.searchParams.get('q')
  if (!query) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 },
    )
  }

  const cached = getSearchCache(query)
  if (cached) {
    return NextResponse.json({ ...cached, cached: true })
  }

  // Priority: Brave > Serper > Bing > Google CSE > Tavily > demo
  // Images: built-in strip from web API first, else Pexels/Unsplash, else placeholder
  const braveKey = process.env.BRAVE_SEARCH_API_KEY
  const serperKey = process.env.SERPER_API_KEY
  const bingKey = process.env.BING_SEARCH_API_KEY
  const googleKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const googleCx = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID
  const tavilyKey = process.env.TAVILY_API_KEY
  const pexelsKey = process.env.PEXELS_API_KEY
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY

  async function getRealImages(): Promise<{ strip: ImageStripItem[]; imgSource: string }> {
    if (pexelsKey) {
      const strip = await fetchPexelsImages(query, pexelsKey).catch(() => [])
      if (strip.length) return { strip, imgSource: 'pexels' }
    }
    if (unsplashKey) {
      const strip = await fetchUnsplashImages(query, unsplashKey).catch(() => [])
      if (strip.length) return { strip, imgSource: 'unsplash' }
    }
    return { strip: demoImageStrip(query), imgSource: 'placeholder' }
  }

  // --- Brave Search ---
  if (braveKey) {
    try {
      const { results, imageStrip: braveImages } = await fetchBraveResults(query, braveKey)
      if (results.length > 0) {
        const imageStrip = braveImages.length > 0
          ? braveImages
          : (await getRealImages()).strip
        return respondCached(query, {
          results,
          imageStrip,
          query,
          source: 'brave',
          imgSource: braveImages.length > 0 ? 'brave' : undefined,
        })
      }
    } catch (err) {
      console.error('[scout] Brave error:', err)
    }
  }

  // --- Serper (Google API) ---
  if (serperKey) {
    try {
      const { results, imageStrip: serperImages } = await fetchSerperResults(query, serperKey)
      if (results.length > 0) {
        const imageStrip = serperImages.length > 0
          ? serperImages
          : (await getRealImages()).strip
        return respondCached(query, {
          results,
          imageStrip,
          query,
          source: 'serper',
          imgSource: serperImages.length > 0 ? 'serper' : undefined,
        })
      }
    } catch (err) {
      console.error('[scout] Serper error:', err)
    }
  }

  // --- Bing ---
  if (bingKey) {
    try {
      const { results, imageStrip: bingImages } = await fetchBingResults(query, bingKey)
      if (results.length > 0) {
        const imageStrip = bingImages.length > 0
          ? bingImages
          : (await getRealImages()).strip
        return respondCached(query, { results, imageStrip, query, source: 'bing' })
      }
    } catch (err) {
      console.error('[scout] Bing error:', err)
    }
  }

  // --- Google CSE ---
  if (googleKey && googleCx) {
    try {
      const webUrl = new URL('https://www.googleapis.com/customsearch/v1')
      webUrl.searchParams.set('q', query)
      webUrl.searchParams.set('key', googleKey)
      webUrl.searchParams.set('cx', googleCx)
      webUrl.searchParams.set('num', '10')

      const [webRes, googleImages] = await Promise.all([
        fetch(webUrl.toString(), {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Scout/0.4)' },
        }),
        fetchGoogleImageStrip(query, googleKey, googleCx),
      ])

      if (webRes.ok) {
        const data = await webRes.json()
        const items = (data.items || []) as Array<{
          title: string
          link: string
          snippet?: string
          pagemap?: Record<string, unknown>
        }>

        const results: SearchResult[] = items.map((item) => {
          const hostname = new URL(item.link).hostname
          return {
            title: item.title,
            url: item.link,
            description: item.snippet ?? '',
            displayUrl: hostname.replace(/^www\./, ''),
            favicon: faviconFor(hostname),
            image: extractImageFromPagemap(item.pagemap),
          }
        })

        const imageStrip = googleImages.length > 0
          ? googleImages
          : (await getRealImages()).strip
        return respondCached(query, { results, imageStrip, query, source: 'google' })
      }
    } catch (err) {
      console.error('[scout] Google CSE error:', err)
    }
  }

  // --- Tavily (web-only, no images) ---
  if (tavilyKey) {
    try {
      const results = await fetchTavilyResults(query, tavilyKey)
      if (results.length > 0) {
        const { strip: imageStrip, imgSource } = await getRealImages()
        return respondCached(query, {
          results,
          imageStrip,
          query,
          source: 'tavily',
          imgSource,
        })
      }
    } catch (err) {
      console.error('[scout] Tavily error:', err)
    }
  }

  // --- Demo web results, but try real images ---
  const { strip: imageStrip, imgSource } = await getRealImages()
  const hasAnyKey = braveKey || serperKey || bingKey || googleKey || tavilyKey
  return respondCached(query, {
    results: demoResults(query),
    imageStrip,
    query,
    source: 'demo',
    imgSource,
    warning: hasAnyKey
      ? 'Search API failed — showing demo results.'
      : undefined,
  })
}
