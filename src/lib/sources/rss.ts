import type { RawArticle } from './hackernews'

export type RssSourceConfig = {
  name: string
  feedUrl: string
  externalIdPrefix: string
}

export const RSS_SOURCES: RssSourceConfig[] = [
  // --- Global AI / engineering ---
  {
    // ML engineering, models, training, inference
    name: 'huggingface',
    feedUrl: 'https://huggingface.co/blog/feed.xml',
    externalIdPrefix: 'huggingface',
  },
  {
    // AI tooling, prompt engineering, hands-on guides (Simon Willison)
    name: 'simonwillison',
    feedUrl: 'https://simonwillison.net/atom/everything/',
    externalIdPrefix: 'simonwillison',
  },
  {
    // The Verge AI section (consumer AI news)
    name: 'theverge-ai',
    feedUrl: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    externalIdPrefix: 'theverge',
  },
  {
    // Google AI / DeepMind announcements
    name: 'google-ai',
    feedUrl: 'https://blog.google/innovation-and-ai/technology/ai/rss/',
    externalIdPrefix: 'google-ai',
  },
  // --- Korean dev community (페르소나 매칭 핵심) ---
  {
    // GeekNews (한국 HackerNews) — 한국 개발자 커뮤니티 화제
    name: 'geeknews',
    feedUrl: 'https://news.hada.io/rss/news',
    externalIdPrefix: 'geeknews',
  },
  {
    // 토스 기술 블로그 — 깊이 있는 엔지니어링
    name: 'toss-tech',
    feedUrl: 'https://toss.tech/rss.xml',
    externalIdPrefix: 'toss',
  },
  {
    // 카카오 기술 블로그
    name: 'kakao-tech',
    feedUrl: 'https://tech.kakao.com/blog/feed/',
    externalIdPrefix: 'kakao',
  },
]

/** Minimal RSS/Atom parser — extracts title/link/pubDate via regex.
 *  No external deps. Good enough for engineering blog feeds. */
function extractTag(block: string, tag: string): string | undefined {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  if (!m) return undefined
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function extractAttr(block: string, tag: string, attr: string): string | undefined {
  const m = block.match(new RegExp(`<${tag}[^>]*\\s${attr}=['"]([^'"]+)['"]`, 'i'))
  return m?.[1]
}

function parseFeed(xml: string, source: RssSourceConfig): RawArticle[] {
  const isAtom =
    xml.includes('<feed') &&
    /xmlns=['"]http:\/\/www\.w3\.org\/2005\/Atom['"]/.test(xml)
  const itemTag = isAtom ? 'entry' : 'item'
  const items = xml.match(new RegExp(`<${itemTag}[\\s\\S]*?</${itemTag}>`, 'g')) ?? []

  const out: RawArticle[] = []
  for (let i = 0; i < items.length && out.length < 10; i++) {
    const block = items[i]
    const title = extractTag(block, 'title')
    if (!title) continue

    let link: string | undefined
    if (isAtom) {
      link = extractAttr(block, 'link', 'href')
    } else {
      link = extractTag(block, 'link')
    }
    if (!link) continue

    const pubDateStr =
      extractTag(block, 'pubDate') ?? extractTag(block, 'updated') ?? extractTag(block, 'published')
    const pubDate = pubDateStr ? new Date(pubDateStr) : new Date()

    const id = extractTag(block, 'guid') ?? extractTag(block, 'id') ?? link
    out.push({
      source: source.name,
      externalId: `${source.externalIdPrefix}:${id}`,
      title,
      url: link,
      score: 0,
      author: source.name,
      publishedAt: pubDate,
      commentsCount: 0,
    })
  }
  return out
}

async function fetchOneFeed(source: RssSourceConfig): Promise<RawArticle[]> {
  try {
    const res = await fetch(source.feedUrl, {
      headers: { 'user-agent': 'BriefDev/0.1' },
      cache: 'no-store',
    })
    if (!res.ok) {
      console.warn(`[rss] ${source.name}: HTTP ${res.status}`)
      return []
    }
    const xml = await res.text()
    return parseFeed(xml, source)
  } catch (err) {
    console.warn(`[rss] ${source.name}: ${err instanceof Error ? err.message : String(err)}`)
    return []
  }
}

export async function fetchRssArticles(
  sources: RssSourceConfig[] = RSS_SOURCES,
  perFeed = 5,
): Promise<RawArticle[]> {
  const all = await Promise.all(sources.map(fetchOneFeed))
  return all.flatMap((items) => items.slice(0, perFeed))
}
