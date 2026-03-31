'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })

      if (error) {
        setError(
          error.message === 'Invalid login credentials'
            ? 'メールアドレスまたはパスワードが正しくありません'
            : error.message,
        )
        return
      }

      router.push(redirect)
      router.refresh()
    })
  }

  return (
    <>
      <h2 className="text-xl font-bold text-gray-900 mb-6">ログイン</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            required
            autoComplete="email"
            placeholder="example@email.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-60
                     disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl
                     transition-colors text-sm"
        >
          {isPending ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/auth/forgot-password"
          className="text-xs text-gray-400 hover:text-primary-500 transition-colors"
        >
          パスワードをお忘れの方
        </Link>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          アカウントをお持ちでない方は{' '}
          <Link
            href="/auth/register"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            新規登録
          </Link>
        </p>
      </div>
    </>
  )
}
