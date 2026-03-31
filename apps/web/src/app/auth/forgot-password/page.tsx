'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError('メールアドレスを入力してください'); return }
    setError('')
    startTransition(async () => {
      // 本番: supabase.auth.resetPasswordForEmail(email, { redirectTo: ... })
      await new Promise(r => setTimeout(r, 800))
      setSent(true)
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-pink-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* ロゴ */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-pink-400 flex items-center justify-center mx-auto mb-3 shadow-md">
              <span className="text-white font-black text-lg">推</span>
            </div>
          </Link>
          <h1 className="text-xl font-black text-[#333333]">パスワードをお忘れの方</h1>
          <p className="text-sm text-gray-500 mt-1">登録済みのメールアドレスに再設定リンクを送ります</p>
        </div>

        {sent ? (
          /* 送信完了 */
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/>
              </svg>
            </div>
            <div>
              <p className="font-black text-[#333333] text-base">メールを送信しました</p>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                <span className="font-medium text-sky-600">{email}</span> に<br />
                パスワード再設定のリンクを送りました。<br />
                メールをご確認ください。
              </p>
            </div>
            <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 text-left space-y-1">
              <p>• メールが届かない場合は迷惑メールフォルダをご確認ください</p>
              <p>• リンクの有効期限は <strong>1時間</strong> です</p>
              <p>• 数分経っても届かない場合は再度お試しください</p>
            </div>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="w-full py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              別のアドレスで再送する
            </button>
            <Link href="/auth/login"
              className="block text-sm text-sky-500 hover:text-sky-600 font-medium">
              ← ログイン画面に戻る
            </Link>
          </div>
        ) : (
          /* 入力フォーム */
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="example@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm
                             focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
                />
                {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-sky-400 to-blue-500 hover:opacity-90 disabled:opacity-50
                           text-white font-black py-3.5 rounded-xl transition-opacity text-sm shadow-md"
              >
                {isPending ? '送信中...' : '再設定メールを送る'}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-gray-100 text-center">
              <Link href="/auth/login"
                className="text-sm text-gray-500 hover:text-gray-700 font-medium">
                ← ログイン画面に戻る
              </Link>
            </div>
          </div>
        )}

        {/* 新規登録リンク */}
        <p className="text-center text-xs text-gray-400 mt-6">
          アカウントをお持ちでない方は
          <Link href="/auth/register" className="text-sky-500 hover:text-sky-600 font-bold ml-1">新規登録</Link>
        </p>
      </div>
    </div>
  )
}



