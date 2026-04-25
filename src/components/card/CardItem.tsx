import type { Card } from '@/lib/gemini/curate'
import type { ViewableCard } from '@/lib/db/types'

const CATEGORY_META: Record<
  Card['category'],
  { emoji: string; label: string; tone: string }
> = {
  pick: { emoji: '🔥', label: '오늘의 1픽', tone: 'from-rose-500/20 to-amber-500/20' },
  tool: { emoji: '📦', label: '모델·도구', tone: 'from-blue-500/20 to-indigo-500/20' },
  tip: { emoji: '💡', label: '실전 팁', tone: 'from-yellow-500/20 to-orange-500/20' },
  deep: { emoji: '📚', label: '깊이 읽기', tone: 'from-emerald-500/20 to-teal-500/20' },
  kr: { emoji: '🎯', label: '한국 화제', tone: 'from-purple-500/20 to-pink-500/20' },
}

export type CardItemProps = {
  card: ViewableCard
  position: number
  total: number
}

export function CardItem({ card, position, total }: CardItemProps) {
  const meta = CATEGORY_META[card.category]

  return (
    <article
      className={`relative flex h-full w-full flex-col overflow-hidden rounded-3xl bg-gradient-to-br ${meta.tone} bg-zinc-900/95 p-7 text-zinc-50 shadow-2xl ring-1 ring-white/10`}
    >
      <header className="flex items-center justify-between text-xs uppercase tracking-wider text-zinc-300">
        <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
          <span className="mr-1">{meta.emoji}</span>
          {meta.label}
        </span>
        <span className="font-mono">
          {position + 1} / {total}
        </span>
      </header>

      <h2 className="mt-6 text-2xl font-bold leading-snug tracking-tight sm:text-3xl">
        {card.title}
      </h2>

      <ul className="mt-6 space-y-2.5 text-base leading-relaxed text-zinc-200">
        {card.summary.map((line, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            🎯 왜 한국 개발자에게 중요한가
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-100">
            {card.whyMatters}
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
          <a
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-4 hover:underline"
          >
            원문 읽기 →
          </a>
          {card.sourceTitle && (
            <span className="truncate pl-3 text-right">{card.sourceTitle}</span>
          )}
        </div>
      </div>
    </article>
  )
}
