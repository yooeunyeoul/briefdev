import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { RawArticle } from '@/lib/sources/hackernews'

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

export async function curate(
  articles: RawArticle[],
  version = 'v1',
): Promise<Curation> {
  const genAI = new GoogleGenerativeAI(getApiKey())
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  })

  const systemPrompt = loadPrompt(version)
  const articleList = articles
    .map(
      (a, i) =>
        `[${i + 1}] ${a.title}\nURL: ${a.url}\nScore: ${a.score}, Comments: ${a.commentsCount}`,
    )
    .join('\n\n')

  const userPrompt = `${systemPrompt}\n\n---\n\n## 오늘의 30개 글\n\n${articleList}\n\n위 글 중 5개를 큐레이션하여 JSON으로만 응답하세요.`

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
