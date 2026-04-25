import { z } from 'zod'
import type { RawArticle } from './hackernews'

/** GitHub repos created in the last 7 days, sorted by stars, AI-related queries. */
const QUERIES = [
  'topic:llm+stars:>50',
  'topic:agent+language:typescript+stars:>30',
  'topic:claude+stars:>20',
]

const RepoSchema = z.object({
  full_name: z.string(),
  html_url: z.string().url(),
  description: z.string().nullable(),
  stargazers_count: z.number(),
  pushed_at: z.string(),
  owner: z.object({ login: z.string() }),
})

const SearchSchema = z.object({
  items: z.array(RepoSchema),
})

function pastDate(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

async function searchOne(query: string, perQuery = 5): Promise<RawArticle[]> {
  const fullQuery = `${query}+pushed:>${pastDate(7)}`
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(fullQuery)}&sort=stars&order=desc&per_page=${perQuery}`

  try {
    const res = await fetch(url, {
      headers: {
        accept: 'application/vnd.github+json',
        'user-agent': 'BriefDev/0.1',
      },
      cache: 'no-store',
    })
    if (!res.ok) {
      console.warn(`[github] q="${query}": HTTP ${res.status}`)
      return []
    }
    const parsed = SearchSchema.parse(await res.json())
    return parsed.items.map((r) => ({
      source: 'github-trending',
      externalId: `gh:${r.full_name}`,
      title: r.description ? `${r.full_name} — ${r.description}` : r.full_name,
      url: r.html_url,
      score: r.stargazers_count,
      author: r.owner.login,
      publishedAt: new Date(r.pushed_at),
      commentsCount: 0,
    }))
  } catch (err) {
    console.warn(`[github] q="${query}": ${err instanceof Error ? err.message : String(err)}`)
    return []
  }
}

export async function fetchGithubTrendingAi(perQuery = 4): Promise<RawArticle[]> {
  const results = await Promise.all(QUERIES.map((q) => searchOne(q, perQuery)))
  // Dedupe by full_name
  const seen = new Set<string>()
  const out: RawArticle[] = []
  for (const item of results.flat()) {
    if (seen.has(item.externalId)) continue
    seen.add(item.externalId)
    out.push(item)
  }
  return out
}
