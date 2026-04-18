import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { rateLimit, getIP } from '@/lib/rate-limit'

type Source = {
  title: string
  description: string
  url: string
  image?: string
}

type Body = {
  query?: string
  stream?: boolean
  results?: Source[]
}

function buildPrompt(query: string, sources: Source[]) {
  const hasSources = sources.length > 0

  let prompt = `You are Scout — a sharp, honest AI search engine. Answer directly and cite sources precisely.\n\n`
  prompt += `USER QUERY: "${query}"\n\n`

  if (hasSources) {
    prompt += `SOURCES (cite these by number only — never fabricate URLs or facts):\n`
    sources.slice(0, 8).forEach((r, i) => {
      prompt += `[${i + 1}] ${r.title}\n    URL: ${r.url}\n    Snippet: ${r.description}\n\n`
    })

    prompt += `INSTRUCTIONS:
- Lead with the direct answer in the first sentence. Never start with "Great question" or "Certainly".
- Cite sources inline with [1][2] immediately after any claim they support.
- Write 2–4 tight paragraphs. Dense, useful, no filler.
- If it's a comparison query, compare concisely. If it's a how-to, give numbered steps.
- If sources conflict or are thin on a point, say so briefly.
- Write for a smart, busy person. No obvious caveats.

After your full answer, on its own line with no extra text before or after, write:
SCOUT_FOLLOWUPS:["follow-up question 1","follow-up question 2","follow-up question 3"]

These 3 follow-ups should be the most natural next things the user would want to know.`
  } else {
    prompt += `INSTRUCTIONS:
- Give a clear, direct answer based on your training knowledge.
- 2–3 paragraphs, dense and useful.
- Acknowledge you don't have live web sources for this.

After your answer, on its own line:
SCOUT_FOLLOWUPS:["follow-up question 1","follow-up question 2","follow-up question 3"]`
  }

  return prompt
}

export async function POST(request: NextRequest) {
  // Rate limit: 20 AI requests per IP per minute
  const rl = rateLimit(getIP(request), 20, 60_000)
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

  let body: Body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const query = body.query?.trim()
  if (!query) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 })
  }

  const sources = Array.isArray(body.results) ? body.results : []
  const useStream = body.stream === true
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'
  const prompt = buildPrompt(query, sources)
  const openai = new OpenAI({ apiKey })

  if (useStream) {
    try {
      const stream = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1400,
        stream: true,
      })

      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const part of stream) {
              const t = part.choices[0]?.delta?.content ?? ''
              if (t) controller.enqueue(encoder.encode(t))
            }
            controller.close()
          } catch (e) {
            controller.error(e)
          }
        },
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store',
          'X-Scout-Streamed': '1',
        },
      })
    } catch (e) {
      console.error('[scout] openai stream:', e)
      const message = e instanceof Error ? e.message : 'OpenAI request failed'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1400,
    })

    const text = completion.choices[0]?.message?.content?.trim()
    if (!text) {
      return NextResponse.json({ error: 'Empty response from model' }, { status: 502 })
    }
    return NextResponse.json({ configured: true, text })
  } catch (e) {
    console.error('[scout] openai:', e)
    const message = e instanceof Error ? e.message : 'OpenAI request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
