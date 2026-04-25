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
  const d = new Date(`${iso}T00:00:00+09:00`)
  return d.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-16 pt-8">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            BriefDev
          </p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-100">
            오늘의 {result.ok ? result.cards.length : 0}장
          </h1>
        </div>
        {result.ok && (
          <time className="text-sm text-zinc-400">
            {formatBundleDate(result.bundleDate)}
          </time>
        )}
      </header>

      <div className="flex items-center justify-end gap-3 text-xs text-zinc-500">
        {user ? (
          <>
            <span className="truncate text-zinc-400">{user.email}</span>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
              >
                로그아웃
              </button>
            </form>
          </>
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
        <CardSwiper cards={result.cards} isAuthenticated={Boolean(user)} />
      ) : (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          <p className="font-semibold">큐레이션이 비어 있어요</p>
          <p className="mt-2 text-xs opacity-80">{result.error}</p>
        </div>
      )}

      <footer className="mt-auto pt-8 text-center text-xs text-zinc-500">
        한국 개발자를 위한 매일 5분 AI 트렌드
      </footer>
    </main>
  )
}
