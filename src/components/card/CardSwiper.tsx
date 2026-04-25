'use client'

import { useState, useRef, type PointerEvent } from 'react'
import type { Card } from '@/lib/gemini/curate'
import { CardItem } from './CardItem'

const SWIPE_THRESHOLD = 60 // px

export type CardSwiperProps = {
  cards: Card[]
}

export function CardSwiper({ cards }: CardSwiperProps) {
  const [index, setIndex] = useState(0)
  const [drag, setDrag] = useState(0)
  const startX = useRef<number | null>(null)
  const total = cards.length

  function next() {
    setIndex((i) => Math.min(i + 1, total - 1))
  }
  function prev() {
    setIndex((i) => Math.max(i - 1, 0))
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    startX.current = e.clientX
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (startX.current === null) return
    setDrag(e.clientX - startX.current)
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
        className="relative h-[78vh] max-h-[640px] w-full select-none touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="absolute inset-0 transition-transform"
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
    </div>
  )
}
