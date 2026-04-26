import { NextResponse, type NextRequest } from 'next/server'
import { fetchAllSources } from '@/lib/sources'
import { curate } from '@/lib/gemini/curate'
import { saveArticles, saveBundle } from '@/lib/db/bundles'

export const dynamic = 'force-dynamic'
// Vercel Hobby allows up to 300s; v5 fetches multi-source pool + bodies via Jina.
export const maxDuration = 300

const PROMPT_VERSION = process.env.CURATION_PROMPT_VERSION ?? 'v6'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  // Vercel Cron sends Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get('authorization')
  if (authHeader === `Bearer ${secret}`) return true

  // Manual trigger via query string for local testing
  const queryToken = req.nextUrl.searchParams.get('token')
  if (queryToken && queryToken === secret) return true

  return false
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()

  try {
    const { articles, stats: srcStats } = await fetchAllSources()
    const savedCount = await saveArticles(articles)

    const curation = await curate(articles, PROMPT_VERSION)
    const { bundleId, bundleDate } = await saveBundle({
      cards: curation.cards,
      promptVersion: PROMPT_VERSION,
      sourceCount: articles.length,
    })

    return NextResponse.json({
      ok: true,
      stats: {
        articlesFetched: articles.length,
        articlesSaved: savedCount,
        bySource: srcStats.bySource,
        cardsCurated: curation.cards.length,
        bundleId,
        bundleDate,
        promptVersion: PROMPT_VERSION,
        elapsedMs: Date.now() - startedAt,
      },
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        elapsedMs: Date.now() - startedAt,
      },
      { status: 500 },
    )
  }
}
