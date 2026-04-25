'use client'

import { useState, useRef, useEffect, type PointerEvent } from 'react'
import Link from 'next/link'
import type { ViewableCard } from '@/lib/db/types'
import { CardItem } from './CardItem'

const SWIPE_THRESHOLD = 60 // px

export type CardSwiperProps = {
  cards: ViewableCard[]
  isAuthenticated: boolean
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

export function CardSwiper({ cards, isAuthenticated }: CardSwiperProps) {
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState(0)
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

  return (
    <div className="flex flex-col gap-4">
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
      </div>

      <div className="flex items-center justify-between gap-2 px-1">
        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-100 disabled:opacity-30"
        >
          ← 이전
        </button>
        <div className="flex gap-1.5">
          {cards.map((_, i) => (
            <span
              key={i}
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
          className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 disabled:opacity-30"
        >
          다음 →
        </button>
      </div>

      <Link
        href={`/c/${card.id}`}
        className="text-center text-xs text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
      >
        이 카드 공유하기 →
      </Link>
    </div>
  )
}
