import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CardItem } from '@/components/card/CardItem'
import { ShareBar } from '@/components/card/ShareBar'
import { getCardById } from '@/lib/db/bundles'

export const dynamic = 'force-dynamic'

type Params = { id: string }

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'https://briefdev.vercel.app'
  )
}

export async function generateMetadata(
  { params }: { params: Promise<Params> },
): Promise<Metadata> {
  const { id } = await params
  const result = await getCardById(id).catch(() => null)
  if (!result) return { title: 'BriefDev' }

  const { card } = result
  const ogUrl = `${siteUrl()}/api/og?cardId=${card.id}`
  const pageUrl = `${siteUrl()}/c/${card.id}`
  const description = card.whyMatters

  return {
    title: `${card.title} — BriefDev`,
    description,
    openGraph: {
      title: card.title,
      description,
      url: pageUrl,
      siteName: 'BriefDev',
      type: 'article',
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: card.title,
      description,
      images: [ogUrl],
    },
  }
}

export default async function CardPage({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const result = await getCardById(id)
  if (!result) notFound()

  const { card } = result
  const shareUrl = `${siteUrl()}/c/${card.id}`

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pb-16 pt-10">
      <header className="flex items-baseline justify-between">
        <Link href="/" className="text-xs font-semibold uppercase tracking-widest text-zinc-500 hover:text-zinc-300">
          ← BriefDev
        </Link>
        <span className="text-xs text-zinc-500">한 장 보기</span>
      </header>

      <CardItem card={card} position={0} total={1} />

      <ShareBar
        url={shareUrl}
        title={card.title}
        text={card.whyMatters}
        cardId={card.id}
      />

      <Link
        href="/"
        className="text-center text-xs text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
      >
        오늘의 다른 카드 보기 →
      </Link>
    </main>
  )
}
