import { CardSwiper } from '@/components/card/CardSwiper'
import { fetchHackerNewsTop } from '@/lib/sources/hackernews'
import { curate } from '@/lib/gemini/curate'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getTodayCards() {
  try {
    const articles = await fetchHackerNewsTop(30)
    const curation = await curate(articles, 'v1')
    return { ok: true as const, cards: curation.cards }
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export default async function HomePage() {
  const result = await getTodayCards()
  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-16 pt-10">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            BriefDev
          </p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-100">
            오늘의 5장
          </h1>
        </div>
        <time className="text-sm text-zinc-400">{today}</time>
      </header>

      {result.ok ? (
        <CardSwiper cards={result.cards} />
      ) : (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
          <p className="font-semibold">큐레이션 생성 실패</p>
          <p className="mt-2 break-all text-xs opacity-80">{result.error}</p>
        </div>
      )}

      <footer className="mt-auto pt-8 text-center text-xs text-zinc-500">
        한국 개발자를 위한 매일 5분 AI 트렌드
      </footer>
    </main>
  )
}
