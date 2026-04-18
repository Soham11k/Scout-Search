import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { rateLimit, getIP } from '@/lib/rate-limit'

const FETCH_TIMEOUT_MS = 12_000
const MAX_TEXT_CHARS = 12_000

function extractContent(html: string): { title: string; description: string; text: string } {
  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]{1,300})<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : 'Untitled'

  // Meta description
  const descMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,300})["']/i,
  ) || html.match(
    /<meta[^>]+content=["']([^"']{1,300})["'][^>]+name=["']description["']/i,
  )
  const description = descMatch ? descMatch[1].trim() : ''

  // Strip noise elements
  let body = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ')
    .replace(/<aside\b[^<]*(?:(?!<\/aside>)<[^<]*)*<\/aside>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')

  // Decode common HTML entities
  body = body
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return { title, description, text: body.slice(0, MAX_TEXT_CHARS) }
}

export async function POST(request: NextRequest) {
  // Rate limit: 10 browse requests per IP per minute (fetches external pages + calls OpenAI)
  const rl = rateLimit(getIP(request), 10, 60_000)
  if (rl.limited) {
    return NextResponse.json(
      { error: `Too many requests — try again in ${rl.retryAfterSecs}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSecs) } },
    )
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { configured: false, error: 'Set OPENAI_API_KEY in .env.local' },
      { status: 503 },
    )
  }

  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const rawUrl = body.url?.trim()
  if (!rawUrl) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  // Validate URL
  let parsedUrl: URL
  try {
    parsedUrl = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Only http/https URLs allowed')
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL — use a full web address like https://example.com' }, { status: 400 })
  }

  // Block private IPs
  const host = parsedUrl.hostname
  if (
    /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) ||
    host === '::1'
  ) {
    return NextResponse.json({ error: 'Private or local URLs not allowed' }, { status: 400 })
  }

  // Fetch the page
  let html: string
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; ScoutBot/1.0; +https://scout.so/bot)',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })
    clearTimeout(timer)

    if (!res.ok) {
      return NextResponse.json(
        { error: `Page returned ${res.status} — it may be private or paywalled.` },
        { status: 422 },
      )
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('html')) {
      return NextResponse.json(
        { error: 'This URL does not return an HTML page (it may be a PDF, image, or API endpoint).' },
        { status: 422 },
      )
    }

    html = await res.text()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('abort') || msg.includes('timeout')) {
      return NextResponse.json({ error: 'Page took too long to respond (>12 s).' }, { status: 504 })
    }
    return NextResponse.json({ error: `Could not fetch page: ${msg}` }, { status: 502 })
  }

  const { title, description, text } = extractContent(html)

  const prompt = `You are Scout Browse — you read web pages and extract what matters.

PAGE TITLE: ${title}
URL: ${parsedUrl.toString()}
META DESCRIPTION: ${description || '(none)'}

RAW PAGE TEXT (first ${MAX_TEXT_CHARS} chars):
${text}

---

Your task — respond in this exact JSON structure (no extra keys, no markdown fences):
{
  "title": "clean, human title for this page",
  "summary": "2–4 sentences. What is this page about? Who wrote it? What is the main point or offer?",
  "keyPoints": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "sentiment": "positive | neutral | negative | mixed",
  "readingTimeMin": <integer minutes>,
  "topics": ["tag1", "tag2", "tag3"],
  "tldr": "One punchy sentence. The single most important thing to know."
}

Be factual, concise, and grounded in the text above. Do not invent information.`

  try {
    const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) {
      return NextResponse.json({ error: 'Empty response from model' }, { status: 502 })
    }

    const parsed = JSON.parse(raw)
    return NextResponse.json({
      url: parsedUrl.toString(),
      domain: parsedUrl.hostname.replace(/^www\./, ''),
      ...parsed,
    })
  } catch (e: unknown) {
    console.error('[scout] browse openai error:', e)
    const message = e instanceof Error ? e.message : 'AI summarization failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
