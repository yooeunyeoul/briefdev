'use client'

import { useState, type FormEvent } from 'react'
import { createClient } from '@/lib/supabase/client'

type Status =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; email: string }
  | { kind: 'error'; message: string }

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email) return
    setStatus({ kind: 'sending' })

    try {
      const supabase = createClient()
      const redirectTo = `${window.location.origin}/api/auth/callback`
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      })
      if (error) throw error
      setStatus({ kind: 'sent', email })
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : String(err),
      })
    }
  }

  if (status.kind === 'sent') {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
        <p className="font-semibold">📬 메일을 보냈어요</p>
        <p className="mt-2 break-all">
          <span className="opacity-70">{status.email}</span> 받은편지함을
          확인하세요.
        </p>
        <p className="mt-3 text-xs opacity-70">
          메일이 안 보이면 스팸함을 확인해주세요.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        required
        autoFocus
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={status.kind === 'sending'}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-base text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-400 focus:outline-none disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={status.kind === 'sending'}
        className="w-full rounded-xl bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-900 transition active:scale-[0.99] disabled:opacity-60"
      >
        {status.kind === 'sending' ? '보내는 중…' : '매직링크 받기'}
      </button>

      {status.kind === 'error' && (
        <p className="text-xs text-rose-300">{status.message}</p>
      )}
    </form>
  )
}
