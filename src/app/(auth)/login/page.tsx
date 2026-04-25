import { LoginForm } from './LoginForm'

export const metadata = {
  title: '로그인 — BriefDev',
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-10">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          BriefDev
        </p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-100">
          매일 5분, 한국 개발자를 위한 AI 트렌드
        </h1>
        <p className="mt-3 text-sm text-zinc-400">
          이메일 한 줄만 — 비밀번호 없이 로그인합니다.
        </p>
      </header>

      <LoginForm />

      <p className="text-center text-xs text-zinc-500">
        이메일로 발송된 링크를 클릭하면 자동 로그인됩니다.
      </p>
    </main>
  )
}
