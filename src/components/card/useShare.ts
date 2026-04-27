'use client'

import { useEffect, useState } from 'react'

export type ShareStatus = 'idle' | 'sharing' | 'shared' | 'copied' | 'failed'

export type UseShareInput = {
  url: string
  title: string
  text: string
  cardId: string
}

export type UseShareReturn = {
  status: ShareStatus
  canNativeShare: boolean
  share: () => Promise<void>
  copy: () => Promise<void>
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

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through */
  }
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

export function useShare({ url, title, text, cardId }: UseShareInput): UseShareReturn {
  const [status, setStatus] = useState<ShareStatus>('idle')
  const [canNativeShare, setCanNativeShare] = useState(false)

  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return
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
  }, [title, text, url])

  function flash(next: ShareStatus) {
    setStatus(next)
    setTimeout(() => setStatus('idle'), 2000)
  }

  const shareText = `${title}\n\n${text}\n\n${url}`

  async function share() {
    setStatus('sharing')
    if (canNativeShare) {
      try {
        await navigator.share({ title, text, url })
        void trackShare(cardId)
        flash('shared')
        return
      } catch (err) {
        const aborted =
          err instanceof Error &&
          (err.name === 'AbortError' || err.message.includes('cancel'))
        if (aborted) {
          setStatus('idle')
          return
        }
      }
    }
    const ok = await copyToClipboard(shareText)
    if (ok) {
      void trackShare(cardId)
      flash('copied')
    } else {
      flash('failed')
    }
  }

  async function copy() {
    const ok = await copyToClipboard(shareText)
    if (ok) {
      void trackShare(cardId)
      flash('copied')
    } else {
      flash('failed')
    }
  }

  return { status, canNativeShare, share, copy }
}
