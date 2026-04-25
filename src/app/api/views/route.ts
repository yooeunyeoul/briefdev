import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const BodySchema = z.object({
  cardId: z.string().uuid(),
  readSeconds: z.number().int().nonnegative().max(3600).optional(),
  shared: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'unauthenticated' },
      { status: 401 },
    )
  }

  let body: z.infer<typeof BodySchema>
  try {
    body = BodySchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'bad request',
      },
      { status: 400 },
    )
  }

  const { error } = await supabase.from('user_views').upsert(
    {
      user_id: user.id,
      card_id: body.cardId,
      read_seconds: body.readSeconds ?? 0,
      shared: body.shared ?? false,
      viewed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,card_id' },
  )

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
