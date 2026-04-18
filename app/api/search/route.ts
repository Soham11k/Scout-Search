import { NextRequest, NextResponse } from 'next/server'

type SearchResult = {
  title: string
  url: string
  description: string
  displayUrl: string
  favicon: string
}

function faviconFor(host: string) {
  return `https://www.google.com/s2/favicons?domain=${host}&sz=32`
}

function demoResults(query: string): SearchResult[] {
  const q = query.trim()
  const base: Array<Omit<SearchResult, 'favicon' | 'displayUrl'>> = [
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
    }
  })
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')
  if (!query) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 },
    )
  }

  const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
  const engineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID

  // Demo fallback: keeps the product usable without API credentials.
  if (!apiKey || !engineId) {
    return NextResponse.json({
      results: demoResults(query),
      query,
      source: 'demo',
    })
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
        query,
      )}&key=${apiKey}&cx=${engineId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Scout/0.3)',
        },
      },
    )

    if (!response.ok) {
      console.error('[scout] Google Search API error:', response.status)
      return NextResponse.json(
        {
          results: demoResults(query),
          query,
          source: 'demo',
          warning:
            'Upstream search provider returned ' +
            response.status +
            '. Showing placeholder results.',
        },
        { status: 200 },
      )
    }

    const data = await response.json()
    const results: SearchResult[] = (data.items || []).map(
      (item: {
        title: string
        link: string
        snippet?: string
      }) => {
        const hostname = new URL(item.link).hostname
        return {
          title: item.title,
          url: item.link,
          description: item.snippet ?? '',
          displayUrl: hostname.replace(/^www\./, ''),
          favicon: faviconFor(hostname),
        }
      },
    )

    return NextResponse.json({ results, query, source: 'google' })
  } catch (error) {
    console.error('[scout] search error:', error)
    return NextResponse.json({
      results: demoResults(query),
      query,
      source: 'demo',
      warning: 'Search failed; showing placeholder results.',
    })
  }
}
