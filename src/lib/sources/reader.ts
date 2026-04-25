/**
 * Jina AI Reader — extracts main article body as Markdown.
 * https://r.jina.ai/{URL}
 *
 * Free tier without API key has IP-based rate limit.
 * Optionally provide JINA_API_KEY for higher limits.
 */

const READER_BASE = 'https://r.jina.ai/'
const FETCH_TIMEOUT_MS = 15_000
const MAX_BODY_CHARS = 4_000 // truncate to keep LLM prompt small

export type ArticleBody = {
  url: string
  body: string | null // markdown, truncated
  status: 'ok' | 'timeout' | 'error'
  error?: string
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

export async function fetchArticleBody(url: string): Promise<ArticleBody> {
  const headers: Record<string, string> = {
    Accept: 'text/plain',
    // Plain markdown without images/links list (smaller prompts)
    'X-Return-Format': 'markdown',
  }
  const apiKey = process.env.JINA_API_KEY
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  try {
    const res = await withTimeout(
      fetch(`${READER_BASE}${url}`, { headers, cache: 'no-store' }),
      FETCH_TIMEOUT_MS,
    )

    if (!res.ok) {
      return {
        url,
        body: null,
        status: 'error',
        error: `HTTP ${res.status}`,
      }
    }

    const text = await res.text()
    const trimmed = text.trim().slice(0, MAX_BODY_CHARS)

    return {
      url,
      body: trimmed.length > 0 ? trimmed : null,
      status: 'ok',
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      url,
      body: null,
      status: msg === 'timeout' ? 'timeout' : 'error',
      error: msg,
    }
  }
}

export async function fetchArticleBodies(
  urls: string[],
  concurrency = 5,
): Promise<ArticleBody[]> {
  const results: ArticleBody[] = []
  let i = 0

  async function worker() {
    while (i < urls.length) {
      const idx = i++
      results[idx] = await fetchArticleBody(urls[idx])
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  return results
}
