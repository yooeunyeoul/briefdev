import { NextResponse } from 'next/server'
import { fetchHackerNewsTop } from '@/lib/sources/hackernews'
import { curate } from '@/lib/gemini/curate'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET() {
  try {
    const articles = await fetchHackerNewsTop(30)
    const curation = await curate(articles, 'v1')

    return NextResponse.json({
      ok: true,
      stats: {
        sourceCount: articles.length,
        curatedCount: curation.cards.length,
      },
      curation,
    })
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
