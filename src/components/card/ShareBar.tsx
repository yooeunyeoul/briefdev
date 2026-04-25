'use client'

import { useState, useEffect } from 'react'

export type ShareBarProps = {
  url: string
  title: string
  text: string
  cardId: string
}

type Status = 'idle' | 'sharing' | 'shared' | 'copied' | 'failed'

async function trackShare(cardId: string) {
  try {
    await fetch('/api/views', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cardId, shared: true }),
      keepalive: true,
    })
  } catch {
    // analytics best-effort
  }
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through */
  }
  // Fallback: hidden textarea + execCommand (older browsers / non-secure contexts)
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

export function ShareBar({ url, title, text, cardId }: ShareBarProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [canNativeShare, setCanNativeShare] = useState(false)

  useEffect(() => {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      // canShare check is optional but more accurate
      const data = { title, text, url }
      try {
        if (typeof navigator.canShare === 'function') {
          setCanNativeShare(navigator.canShare(data))
        } else {
          setCanNativeShare(true)
        }
      } catch {
        setCanNativeShare(true)
      }
    }
  }, [title, text, url])

  function flash(next: Status) {
    setStatus(next)
    setTimeout(() => setStatus('idle'), 2000)
  }

  const shareText = `${title}\n\n${text}\n\n${url}`

  async function onShare() {
    setStatus('sharing')
    if (canNativeShare) {
      try {
        await navigator.share({ title, text, url })
        void trackShare(cardId)
        flash('shared')
        return
      } catch (err) {
        // AbortError = user cancelled, don't show as failed
        const aborted =
          err instanceof Error &&
          (err.name === 'AbortError' || err.message.includes('cancel'))
        if (aborted) {
          setStatus('idle')
          return
        }
        // Fall through to copy fallback
      }
    }
    // Fallback: copy
    const ok = await copyToClipboard(shareText)
    if (ok) {
      void trackShare(cardId)
      flash('copied')
    } else {
      flash('failed')
    }
  }

  async function onCopy() {
    const ok = await copyToClipboard(shareText)
    if (ok) {
      void trackShare(cardId)
      flash('copied')
    } else {
      flash('failed')
    }
  }

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
          onClick={onShare}
          disabled={status === 'sharing'}
          className="flex-1 rounded-2xl bg-zinc-100 px-3 py-3 text-sm font-semibold text-zinc-900 transition active:scale-[0.98] disabled:opacity-60"
        >
          {primaryLabel}
        </button>
        <button
          type="button"
          onClick={onCopy}
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
