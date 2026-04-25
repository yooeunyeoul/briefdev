import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { getCardById } from '@/lib/db/bundles'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CATEGORY_META: Record<
  string,
  { emoji: string; label: string; bg: string }
> = {
  pick: { emoji: '🔥', label: '오늘의 1픽', bg: 'linear-gradient(135deg,#f43f5e22,#f59e0b22)' },
  tool: { emoji: '📦', label: '모델·도구', bg: 'linear-gradient(135deg,#3b82f622,#6366f122)' },
  tip: { emoji: '💡', label: '실전 팁', bg: 'linear-gradient(135deg,#eab30822,#f9731622)' },
  deep: { emoji: '📚', label: '깊이 읽기', bg: 'linear-gradient(135deg,#10b98122,#14b8a622)' },
  kr: { emoji: '🎯', label: '한국 화제', bg: 'linear-gradient(135deg,#a855f722,#ec489922)' },
}

export async function GET(req: NextRequest) {
  const cardId = req.nextUrl.searchParams.get('cardId')

  // Default fallback OG (when no cardId)
  if (!cardId) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#09090b',
            color: '#fafafa',
            fontFamily: 'sans-serif',
          }}
        >
          <div style={{ fontSize: 36, color: '#71717a', letterSpacing: 4 }}>
            BriefDev
          </div>
          <div style={{ fontSize: 64, fontWeight: 700, marginTop: 24 }}>
            출퇴근 5분, 카드 5장
          </div>
          <div style={{ fontSize: 32, color: '#a1a1aa', marginTop: 16 }}>
            한국 개발자를 위한 매일 5분 AI 트렌드
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    )
  }

  try {
    const result = await getCardById(cardId)
    if (!result) throw new Error('not found')
    const { card } = result
    const meta = CATEGORY_META[card.category] ?? CATEGORY_META.tool

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#09090b',
            color: '#fafafa',
            padding: 64,
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 24,
              color: '#a1a1aa',
              letterSpacing: 4,
            }}
          >
            <span>BriefDev</span>
            <span
              style={{
                background: '#27272a',
                padding: '8px 20px',
                borderRadius: 999,
                fontSize: 24,
                color: '#fafafa',
                letterSpacing: 0,
              }}
            >
              {meta.emoji} {meta.label}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              marginTop: 48,
              padding: 48,
              borderRadius: 32,
              background: meta.bg,
              border: '1px solid #ffffff15',
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 700,
                lineHeight: 1.2,
                color: '#fafafa',
              }}
            >
              {card.title.length > 60 ? card.title.slice(0, 58) + '…' : card.title}
            </div>

            <div
              style={{
                marginTop: 'auto',
                padding: 32,
                background: '#00000055',
                borderRadius: 24,
                border: '1px solid #ffffff15',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  letterSpacing: 2,
                  color: '#fcd34d',
                  fontWeight: 600,
                }}
              >
                🎯 누구에게 유용한가
              </div>
              <div
                style={{
                  fontSize: 28,
                  marginTop: 12,
                  lineHeight: 1.4,
                  color: '#fafafa',
                }}
              >
                {card.whyMatters.length > 140
                  ? card.whyMatters.slice(0, 138) + '…'
                  : card.whyMatters}
              </div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    )
  } catch {
    return new Response('not found', { status: 404 })
  }
}
