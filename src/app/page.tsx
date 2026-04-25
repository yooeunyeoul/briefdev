import { CardSwiper } from '@/components/card/CardSwiper'
import { getLatestBundle } from '@/lib/db/bundles'
import type { Card } from '@/lib/gemini/curate'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type LoadResult =
  | { ok: true; cards: Card[]; bundleDate: string; source: 'db' }
  | { ok: false; error: string }

async function loadCards(): Promise<LoadResult> {
  try {
    const latest = await getLatestBundle()
    if (latest && latest.cards.length > 0) {
      return {
        ok: true,
        cards: latest.cards,
        bundleDate: latest.bundle.bundle_date,
        source: 'db',
      }
    }
    return {
      ok: false,
      error: '아직 큐레이션이 준비되지 않았어요. /api/cron/collect 를 먼저 호출해주세요.',
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

function formatBundleDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00+09:00`)
  return d.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

export default async function HomePage() {
  const result = await loadCards()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-16 pt-10">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            BriefDev
          </p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-100">오늘의 5장</h1>
        </div>
        {result.ok && (
          <time className="text-sm text-zinc-400">
            {formatBundleDate(result.bundleDate)}
          </time>
        )}
      </header>

      {result.ok ? (
        <CardSwiper cards={result.cards} />
      ) : (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          <p className="font-semibold">큐레이션이 비어 있어요</p>
          <p className="mt-2 text-xs opacity-80">{result.error}</p>
          <p className="mt-3 text-xs opacity-60">
            로컬 테스트: <code className="rounded bg-black/30 px-1.5 py-0.5">curl &quot;http://localhost:3000/api/cron/collect?token=$CRON_SECRET&quot;</code>
          </p>
        </div>
      )}

      <footer className="mt-auto pt-8 text-center text-xs text-zinc-500">
        한국 개발자를 위한 매일 5분 AI 트렌드
      </footer>
    </main>
  )
}
