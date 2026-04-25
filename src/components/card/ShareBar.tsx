'use client'

import { useState } from 'react'

export type ShareBarProps = {
  url: string
  title: string
  text: string
  cardId: string
}

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

export function ShareBar({ url, title, text, cardId }: ShareBarProps) {
  const [copied, setCopied] = useState(false)

  const shareText = `${title}\n\n${text}\n\n${url}`

  async function onNativeShare() {
    void trackShare(cardId)
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title, text, url })
      } catch {
        // user cancelled
      }
    } else {
      void onCopy()
    }
  }

  async function onCopy() {
    void trackShare(cardId)
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore
    }
  }

  function onSlack() {
    void trackShare(cardId)
    // Slack message URL → opens Slack with pre-filled text on the user's last channel
    const slackUrl = `https://slack.com/openid/connect?text=${encodeURIComponent(shareText)}`
    void onCopy() // also copy as fallback
    window.open(slackUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="px-1 text-xs font-medium text-zinc-400">동료에게 공유</p>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={onNativeShare}
          className="flex items-center justify-center gap-1 rounded-2xl bg-zinc-800 px-3 py-3 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700 active:scale-[0.98]"
        >
          📤 공유
        </button>
        <button
          type="button"
          onClick={onSlack}
          className="flex items-center justify-center gap-1 rounded-2xl bg-zinc-800 px-3 py-3 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700 active:scale-[0.98]"
        >
          💬 슬랙
        </button>
        <button
          type="button"
          onClick={onCopy}
          className="flex items-center justify-center gap-1 rounded-2xl bg-zinc-800 px-3 py-3 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700 active:scale-[0.98]"
        >
          {copied ? '✅ 복사됨' : '🔗 링크 복사'}
        </button>
      </div>
    </div>
  )
}
