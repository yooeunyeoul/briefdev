import { z } from 'zod'

const HN_BASE = 'https://hacker-news.firebaseio.com/v0'

const HnItemSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  url: z.string().url().optional(),
  score: z.number().optional(),
  by: z.string().optional(),
  time: z.number().optional(),
  type: z.string().optional(),
  descendants: z.number().optional(),
})

export type HnItem = z.infer<typeof HnItemSchema>

export type RawArticle = {
  source: string
  externalId: string
  title: string
  url: string
  score: number
  author: string
  publishedAt: Date
  commentsCount: number
}

async function fetchJson<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 0 } })
  if (!res.ok) throw new Error(`HN fetch failed: ${res.status} ${url}`)
  return schema.parse(await res.json())
}

const PAYWALL_HOSTS = new Set([
  'bloomberg.com',
  'www.bloomberg.com',
  'wsj.com',
  'www.wsj.com',
  'nytimes.com',
  'www.nytimes.com',
  'ft.com',
  'www.ft.com',
  'theinformation.com',
  'www.theinformation.com',
  'economist.com',
  'www.economist.com',
  'businessinsider.com',
  'www.businessinsider.com',
  'washingtonpost.com',
  'www.washingtonpost.com',
  'barrons.com',
  'www.barrons.com',
])

function isPaywalled(rawUrl: string): boolean {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase()
    return PAYWALL_HOSTS.has(host)
  } catch {
    return false
  }
}

export async function fetchHackerNewsTop(limit = 30): Promise<RawArticle[]> {
  const ids = await fetchJson(`${HN_BASE}/topstories.json`, z.array(z.number()))
  const topIds = ids.slice(0, limit)

  const items = await Promise.all(
    topIds.map((id) => fetchJson(`${HN_BASE}/item/${id}.json`, HnItemSchema)),
  )

  return items
    .filter((it): it is HnItem & { title: string; url: string } =>
      it.type === 'story' && Boolean(it.title) && Boolean(it.url),
    )
    .filter((it) => !isPaywalled(it.url))
    .map((it) => ({
      source: 'hackernews',
      externalId: String(it.id),
      title: it.title,
      url: it.url,
      score: it.score ?? 0,
      author: it.by ?? 'unknown',
      publishedAt: new Date((it.time ?? 0) * 1000),
      commentsCount: it.descendants ?? 0,
    }))
}
