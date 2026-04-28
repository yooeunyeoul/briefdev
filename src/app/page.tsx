import Link from 'next/link'
import { CardSwiper } from '@/components/card/CardSwiper'
import { getLatestBundle } from '@/lib/db/bundles'
import { createClient } from '@/lib/supabase/server'
import type { ViewableCard } from '@/lib/db/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type LoadResult =
  | { ok: true; cards: ViewableCard[]; bundleDate: string }
  | { ok: false; error: string }

async function loadCards(): Promise<LoadResult> {
  try {
    const latest = await getLatestBundle()
    if (latest && latest.cards.length > 0) {
      return {
        ok: true,
        cards: latest.cards,
        bundleDate: latest.bundle.bundle_date,
      }
    }
    return {
      ok: false,
      error: latest
        ? '오늘은 적합한 글이 부족했어요. 5장을 강제로 채우는 대신 비워두기로 결정했습니다.'
        : '아직 큐레이션이 준비되지 않았어요.',
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

function formatBundleDate(iso: string): string {
  // bundle_date is YYYY-MM-DD in KST. Force Asia/Seoul so the rendered string
  // matches the curator's day regardless of server timezone (Vercel runs UTC).
  const d = new Date(`${iso}T00:00:00+09:00`)
  return d.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Seoul',
  })
}

export default async function HomePage() {
  const [result, supabase] = await Promise.all([
    loadCards(),
    createClient(),
  ])
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-5 px-4 pb-16 pt-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          BriefDev
        </p>
        <h1 className="text-[26px] font-bold leading-tight text-zinc-100 sm:text-3xl">
          출근길 5분, 오늘의 AI 5장
        </h1>
        <p className="text-sm leading-relaxed text-zinc-400">
          본문 발췌로 할루시네이션 차단 — 한국 개발자 큐레이션
        </p>
      </header>

      <div className="flex items-center justify-between border-y border-white/10 py-2.5 text-xs text-zinc-400">
        <span>
          {result.ok ? (
            <>
              {formatBundleDate(result.bundleDate)} · 오늘 {result.cards.length}장
            </>
          ) : (
            '큐레이션 준비 중'
          )}
        </span>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="max-w-[140px] truncate text-zinc-500">{user.email}</span>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
              >
                로그아웃
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
          >
            로그인 (선택)
          </Link>
        )}
      </div>

      {result.ok ? (
        <CardSwiper
          cards={result.cards}
          isAuthenticated={Boolean(user)}
          siteUrl={(process.env.NEXT_PUBLIC_APP_URL ?? 'https://briefdev.vercel.app').replace(/\/$/, '')}
        />
      ) : (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          <p className="font-semibold">큐레이션이 비어 있어요</p>
          <p className="mt-2 text-xs opacity-80">{result.error}</p>
        </div>
      )}

      <footer className="mt-auto pt-8 text-center text-xs text-zinc-500">
        <p>매일 05:00 KST 갱신 · 한국·글로벌 9개 소스 본문 발췌 · Gemini 2.5 Flash 큐레이션</p>
      </footer>
    </main>
  )
}
