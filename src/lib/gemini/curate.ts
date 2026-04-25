import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { RawArticle } from '@/lib/sources/hackernews'
import { fetchArticleBodies, type ArticleBody } from '@/lib/sources/reader'

const CardSchema = z.object({
  category: z.enum(['pick', 'tool', 'tip', 'deep', 'kr']),
  title: z.string().min(1).max(120),
  summary: z.array(z.string()).length(3),
  whyMatters: z.string().min(10).max(200),
  url: z.string().url(),
  sourceTitle: z.string(),
})

const CurationSchema = z.object({
  cards: z.array(CardSchema).min(1).max(5),
})

export type Card = z.infer<typeof CardSchema>
export type Curation = z.infer<typeof CurationSchema>

function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY is not set')
  return key
}

function loadPrompt(version = 'v1'): string {
  const path = join(process.cwd(), 'prompts', `curate-${version}.md`)
  return readFileSync(path, 'utf-8')
}

const MIN_BODY_CHARS_FOR_GROUNDING = 200

function formatArticleWithBody(
  article: RawArticle,
  index: number,
  body: ArticleBody | undefined,
): string {
  const head = `[${index + 1}] ${article.title}
URL: ${article.url}
Score: ${article.score}, Comments: ${article.commentsCount}`

  if (!body || !body.body || body.body.length < MIN_BODY_CHARS_FOR_GROUNDING) {
    return `${head}\nBody: <NO_BODY>`
  }
  return `${head}\nBody:\n${body.body}`
}

function formatArticleHeadOnly(article: RawArticle, index: number): string {
  return `[${index + 1}] ${article.title}
URL: ${article.url}
Score: ${article.score}, Comments: ${article.commentsCount}`
}

export async function curate(
  articles: RawArticle[],
  version = 'v1',
): Promise<Curation> {
  const genAI = new GoogleGenerativeAI(getApiKey())
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  })

  const systemPrompt = loadPrompt(version)

  // v3+: ground curation in real article bodies via Jina Reader
  const useBodyGrounding = version >= 'v3'

  let articleList: string
  let bodiesFetched = 0
  if (useBodyGrounding) {
    const bodies = await fetchArticleBodies(
      articles.map((a) => a.url),
      6,
    )
    bodiesFetched = bodies.filter((b) => b.status === 'ok' && b.body).length
    articleList = articles
      .map((a, i) => formatArticleWithBody(a, i, bodies[i]))
      .join('\n\n---\n\n')
  } else {
    articleList = articles.map(formatArticleHeadOnly).join('\n\n')
  }

  const userPrompt = `${systemPrompt}\n\n---\n\n## 오늘의 ${articles.length}개 글\n\n${articleList}\n\n위 글 중 5개를 큐레이션하여 JSON으로만 응답하세요.`

  if (useBodyGrounding) {
    console.info(
      `[curate] v=${version} bodies=${bodiesFetched}/${articles.length} promptChars=${userPrompt.length}`,
    )
  }

  const result = await model.generateContent(userPrompt)
  const text = result.response.text()

  try {
    const parsed = JSON.parse(text)
    return CurationSchema.parse(parsed)
  } catch (err) {
    console.error('Curation parse failed:', text.slice(0, 500))
    throw new Error(
      `LLM output validation failed: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
}
