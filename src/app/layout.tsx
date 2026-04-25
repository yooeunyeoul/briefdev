import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'https://briefdev.vercel.app',
  ),
  title: 'BriefDev — 한국 개발자를 위한 매일 5분 AI 트렌드',
  description:
    'Claude Code · Cursor · 새 모델 — 진짜 내 일에 영향 줄 5개만 골라드립니다.',
  openGraph: {
    title: 'BriefDev — 출퇴근 5분, 카드 5장',
    description:
      '한국 개발자를 위한 매일 5분 AI 트렌드 큐레이션. Claude Code · Cursor · 새 모델, 진짜 영향 줄 것만.',
    siteName: 'BriefDev',
    type: 'website',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BriefDev — 출퇴근 5분, 카드 5장',
    description:
      '한국 개발자를 위한 매일 5분 AI 트렌드 큐레이션',
    images: ['/api/og'],
  },
}

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  )
}
