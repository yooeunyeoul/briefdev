import { fetchHackerNewsTop, type RawArticle } from './hackernews'
import { fetchRssArticles } from './rss'
import { fetchGithubTrendingAi } from './github'

export type AggregateStats = {
  total: number
  bySource: Record<string, number>
}

/** Combine all sources into a single deduplicated pool. */
export async function fetchAllSources(): Promise<{
  articles: RawArticle[]
  stats: AggregateStats
}> {
  const [hn, rss, gh] = await Promise.all([
    fetchHackerNewsTop(12),
    fetchRssArticles(),
    fetchGithubTrendingAi(),
  ])

  const seen = new Set<string>()
  const out: RawArticle[] = []
  const bySource: Record<string, number> = {}

  for (const article of [...rss, ...gh, ...hn]) {
    const key = article.url
    if (seen.has(key)) continue
    seen.add(key)
    out.push(article)
    bySource[article.source] = (bySource[article.source] ?? 0) + 1
  }

  return {
    articles: out,
    stats: { total: out.length, bySource },
  }
}
