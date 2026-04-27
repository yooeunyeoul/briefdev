'use client'

import { useState, useRef, useEffect, type PointerEvent } from 'react'
import type { ViewableCard } from '@/lib/db/types'
import { CardItem } from './CardItem'
import { useShare } from './useShare'

const SWIPE_THRESHOLD = 60 // px
const SWIPE_HINT_KEY = 'briefdev:swipe-hint-seen'
const SWIPE_HINT_TIMEOUT_MS = 4000

export type CardSwiperProps = {
  cards: ViewableCard[]
  isAuthenticated: boolean
  siteUrl: string
}

async function trackView(cardId: string, readSeconds: number) {
  try {
    await fetch('/api/views', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cardId, readSeconds }),
      keepalive: true,
    })
  } catch {
    // analytics is best-effort
  }
}

export function CardSwiper({ cards, isAuthenticated, siteUrl }: CardSwiperProps) {
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const startX = useRef<number | null>(null)
  const enteredAt = useRef<number>(Date.now())
  const total = cards.length

  // Track view when current card changes (best-effort)
  useEffect(() => {
    enteredAt.current = Date.now()
    if (!isAuthenticated || !cards[index]) return
    const cardId = cards[index].id

    return () => {
      const seconds = Math.round((Date.now() - enteredAt.current) / 1000)
      void trackView(cardId, seconds)
    }
  }, [index, cards, isAuthenticated])

  // First-time swipe hint — auto-hide after 4s, never show again
  useEffect(() => {
    if (total < 2) return
    try {
      if (localStorage.getItem(SWIPE_HINT_KEY) === '1') return
    } catch {
      return
    }
    setShowHint(true)
    const timer = setTimeout(() => {
      setShowHint(false)
      try {
        localStorage.setItem(SWIPE_HINT_KEY, '1')
      } catch {
        // ignore quota / private mode
      }
    }, SWIPE_HINT_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [total])

  function dismissHint() {
    if (!showHint) return
    setShowHint(false)
    try {
      localStorage.setItem(SWIPE_HINT_KEY, '1')
    } catch {
      // ignore
    }
  }

  function next() {
    setIndex((i) => Math.min(i + 1, total - 1))
  }
  function prev() {
    setIndex((i) => Math.max(i - 1, 0))
  }

  function isInteractive(el: EventTarget | null): boolean {
    if (!(el instanceof Element)) return false
    return Boolean(el.closest('a, button, input, textarea, [role="button"]'))
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (isInteractive(e.target)) return // let clicks through
    startX.current = e.clientX
    dismissHint()
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return
    const dx = e.clientX - startX.current
    // Capture pointer only after a real drag starts so child clicks still work
    if (Math.abs(dx) > 6 && !e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    setDrag(dx)
  }
  function onPointerUp() {
    if (drag > SWIPE_THRESHOLD) prev()
    else if (drag < -SWIPE_THRESHOLD) next()
    setDrag(0)
    startX.current = null
  }

  if (total === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-zinc-400">
        오늘의 카드가 아직 준비되지 않았어요. 곧 도착합니다.
      </div>
    )
  }

  const card = cards[index]
  const { status: shareStatus, canNativeShare, share } = useShare({
    url: `${siteUrl}/c/${card.id}`,
    title: card.title,
    text: card.whyMatters,
    cardId: card.id,
  })

  const shareIcon =
    shareStatus === 'sharing'
      ? '⋯'
      : shareStatus === 'shared' || shareStatus === 'copied'
      ? '✅'
      : shareStatus === 'failed'
      ? '⚠️'
      : '📤'

  const shareAria =
    shareStatus === 'shared'
      ? '공유됨'
      : shareStatus === 'copied'
      ? '링크 복사됨'
      : shareStatus === 'failed'
      ? '공유 실패 — 다시 시도'
      : canNativeShare
      ? '동료에게 공유'
      : '링크 복사'

  return (
    <div className="flex flex-col gap-4 pb-28">
      <div
        className="relative w-full select-none touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="transition-transform"
          style={{
            transform: `translateX(${drag}px) rotate(${drag * 0.02}deg)`,
            transitionDuration: drag === 0 ? '200ms' : '0ms',
          }}
        >
          <CardItem card={card} position={index} total={total} />
        </div>

        {/* First-time swipe hint — fades after first drag or 4s */}
        {showHint && (
          <div
            className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2
                       flex items-center justify-center gap-3 px-4
                       animate-[swipe-hint-fade_4s_ease-in-out_forwards]"
            aria-hidden="true"
          >
            <div className="flex items-center gap-2 rounded-full bg-zinc-900/80 px-4 py-2
                            text-sm text-zinc-100 backdrop-blur-md shadow-2xl
                            animate-[swipe-hint-wiggle_1.4s_ease-in-out_infinite]">
              <span aria-hidden>👈</span>
              <span>좌우로 밀어보세요</span>
              <span aria-hidden>👉</span>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom action bar — anchored to viewport, never jumps with card height.
          Respects iOS safe area so it sits above the home indicator.
          Combines pagination + share into a single control surface. */}
      <div
        className="fixed bottom-0 left-1/2 z-50 -translate-x-1/2
                   mb-[max(0.75rem,env(safe-area-inset-bottom))]
                   flex items-center gap-2 rounded-full border border-white/10
                   bg-zinc-900/85 px-2 py-1.5 shadow-2xl backdrop-blur-md"
      >
        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          aria-label="이전 카드"
          className="rounded-full bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 transition disabled:opacity-30"
        >
          ←
        </button>
        <div className="flex gap-1.5 px-1">
          {cards.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`카드 ${i + 1}로 이동`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-8 bg-zinc-100' : 'w-1.5 bg-zinc-600'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          disabled={index === total - 1}
          aria-label="다음 카드"
          className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition disabled:opacity-30"
        >
          →
        </button>
        <div className="mx-1 h-5 w-px bg-white/10" aria-hidden />
        <button
          type="button"
          onClick={share}
          disabled={shareStatus === 'sharing'}
          aria-label={shareAria}
          title={shareAria}
          className="rounded-full bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 transition hover:bg-zinc-700 disabled:opacity-50"
        >
          {shareIcon}
        </button>
      </div>
    </div>
  )
}
