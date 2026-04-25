import { createServiceClient } from '@/lib/supabase/server'
import type { Card } from '@/lib/gemini/curate'
import type { RawArticle } from '@/lib/sources/hackernews'
import type { BundleWithCards, DbBundle, DbCard } from './types'

function todayDateKST(): string {
  // KST = UTC+9. Always use Asia/Seoul for bundle_date.
  const now = new Date()
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return kst.toISOString().slice(0, 10) // YYYY-MM-DD
}

export async function saveArticles(articles: RawArticle[]): Promise<number> {
  const supabase = createServiceClient()
  const rows = articles.map((a) => ({
    source: a.source,
    external_id: a.externalId,
    title: a.title,
    url: a.url,
    score: a.score,
    author: a.author,
    published_at: a.publishedAt.toISOString(),
    comments_count: a.commentsCount,
  }))

  const { error, count } = await supabase
    .from('articles')
    .upsert(rows, { onConflict: 'source,external_id', count: 'exact' })

  if (error) throw new Error(`saveArticles failed: ${error.message}`)
  return count ?? rows.length
}

export async function saveBundle(opts: {
  cards: Card[]
  promptVersion: string
  sourceCount: number
  bundleDate?: string
}): Promise<{ bundleId: string; bundleDate: string }> {
  const supabase = createServiceClient()
  const bundleDate = opts.bundleDate ?? todayDateKST()

  // Upsert bundle (one per day)
  const { data: bundle, error: bundleErr } = await supabase
    .from('bundles')
    .upsert(
      {
        bundle_date: bundleDate,
        prompt_version: opts.promptVersion,
        source_count: opts.sourceCount,
      },
      { onConflict: 'bundle_date' },
    )
    .select('id, bundle_date')
    .single<Pick<DbBundle, 'id' | 'bundle_date'>>()

  if (bundleErr || !bundle) {
    throw new Error(`saveBundle.bundle failed: ${bundleErr?.message}`)
  }

  // Replace cards for this bundle (idempotent re-run)
  await supabase.from('cards').delete().eq('bundle_id', bundle.id)

  if (opts.cards.length === 0) {
    return { bundleId: bundle.id, bundleDate: bundle.bundle_date }
  }

  const cardRows = opts.cards.map((c, i) => ({
    bundle_id: bundle.id,
    position: i,
    category: c.category,
    title: c.title,
    summary: c.summary,
    why_matters: c.whyMatters,
    url: c.url,
    source_title: c.sourceTitle,
  }))

  const { error: cardsErr } = await supabase.from('cards').insert(cardRows)
  if (cardsErr) throw new Error(`saveBundle.cards failed: ${cardsErr.message}`)

  return { bundleId: bundle.id, bundleDate: bundle.bundle_date }
}

export async function getCardById(id: string): Promise<{
  card: import('./types').ViewableCard
  bundleDate: string
} | null> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('cards')
    .select('*, bundle:bundles(bundle_date)')
    .eq('id', id)
    .maybeSingle<DbCard & { bundle: { bundle_date: string } | null }>()

  if (error) throw new Error(`getCardById failed: ${error.message}`)
  if (!data) return null

  return {
    card: {
      id: data.id,
      category: data.category,
      title: data.title,
      summary: data.summary,
      whyMatters: data.why_matters,
      url: data.url,
      sourceTitle: data.source_title ?? '',
    },
    bundleDate: data.bundle?.bundle_date ?? '',
  }
}

export async function getLatestBundle(): Promise<BundleWithCards | null> {
  const supabase = createServiceClient()

  // Find the most recent bundle that actually has cards (skip empty days).
  const { data: bundles, error: bundleErr } = await supabase
    .from('bundles')
    .select('*, cards(count)')
    .order('bundle_date', { ascending: false })
    .limit(7)
    .returns<(DbBundle & { cards: { count: number }[] })[]>()

  if (bundleErr) throw new Error(`getLatestBundle failed: ${bundleErr.message}`)
  if (!bundles || bundles.length === 0) return null

  const bundle = bundles.find((b) => (b.cards?.[0]?.count ?? 0) > 0) ?? bundles[0]

  const { data: cards, error: cardsErr } = await supabase
    .from('cards')
    .select('*')
    .eq('bundle_id', bundle.id)
    .order('position', { ascending: true })
    .returns<DbCard[]>()

  if (cardsErr) throw new Error(`getLatestBundle.cards failed: ${cardsErr.message}`)

  return {
    bundle,
    cards: (cards ?? []).map((c) => ({
      id: c.id,
      category: c.category,
      title: c.title,
      summary: c.summary,
      whyMatters: c.why_matters,
      url: c.url,
      sourceTitle: c.source_title ?? '',
    })),
  }
}
