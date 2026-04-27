'use client'

import { useShare } from './useShare'

export type ShareBarProps = {
  url: string
  title: string
  text: string
  cardId: string
}

export function ShareBar({ url, title, text, cardId }: ShareBarProps) {
  const { status, canNativeShare, share, copy } = useShare({ url, title, text, cardId })

  const primaryLabel =
    status === 'sharing'
      ? '공유 중...'
      : status === 'shared'
      ? '✅ 공유됨'
      : status === 'copied'
      ? '✅ 링크 복사됨'
      : status === 'failed'
      ? '⚠️ 다시 시도'
      : canNativeShare
      ? '📤 공유하기'
      : '📤 링크 복사'

  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-xs font-medium text-zinc-400">동료에게 공유</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={share}
          disabled={status === 'sharing'}
          className="flex-1 rounded-2xl bg-zinc-100 px-3 py-3 text-sm font-semibold text-zinc-900 transition active:scale-[0.98] disabled:opacity-60"
        >
          {primaryLabel}
        </button>
        <button
          type="button"
          onClick={copy}
          aria-label="링크 복사"
          className="rounded-2xl bg-zinc-800 px-4 py-3 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700 active:scale-[0.98]"
        >
          🔗
        </button>
      </div>
      {!canNativeShare && (
        <p className="px-1 text-[11px] text-zinc-500">
          이 브라우저는 시스템 공유를 지원하지 않아 링크 복사로 동작합니다.
        </p>
      )}
    </div>
  )
}
