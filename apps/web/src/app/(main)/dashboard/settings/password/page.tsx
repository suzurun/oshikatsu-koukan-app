'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function PasswordPage() {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [show, setShow] = useState({ new: false, confirm: false })
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })

  const strength = (() => {
    const p = form.newPassword
    if (p.length === 0) return 0
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  })()

  const strengthLabel = ['', '弱い', 'やや弱い', '普通', '強い'][strength]
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'][strength]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.newPassword !== form.confirmPassword) {
      setError('新しいパスワードが一致しません')
      return
    }
    if (form.newPassword.length < 8) {
      setError('パスワードは8文字以上で設定してください')
      return
    }
    startTransition(async () => {
      const supabase = createClient()
      const { error: err } = await supabase.auth.updateUser({ password: form.newPassword })
      if (err) {
        setError(err.message)
        return
      }
      setDone(true)
    })
  }

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="text-center space-y-5 py-10">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-black text-[#333333]">パスワードを変更しました</h2>
            <p className="text-sm text-gray-500 mt-1">次回ログインから新しいパスワードをお使いください</p>
          </div>
          <Link href="/dashboard/settings"
            className="inline-block bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold px-8 py-3 rounded-xl text-sm hover:opacity-90 transition-opacity">
            設定に戻る
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">

      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/settings"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-black text-[#333333]">パスワードを変更</h1>
          <p className="text-xs text-gray-400">定期的な変更をおすすめします</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-600">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">

          {/* 新しいパスワード */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              新しいパスワード <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={show.new ? 'text' : 'password'}
                value={form.newPassword}
                onChange={e => setForm(prev => ({ ...prev, newPassword: e.target.value }))}
                required
                minLength={8}
                placeholder="8文字以上"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
              <button type="button" onClick={() => setShow(s => ({ ...s, new: !s.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  {show.new
                    ? <><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></>
                    : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>
                  }
                </svg>
              </button>
            </div>

            {/* 強度インジケーター */}
            {form.newPassword.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-gray-200'}`}/>
                  ))}
                </div>
                <p className={`text-xs font-medium ${
                  strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-orange-500' : strength === 3 ? 'text-yellow-600' : 'text-green-500'
                }`}>{strengthLabel}</p>
              </div>
            )}
          </div>

          {/* 確認 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              新しいパスワード（確認） <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type={show.confirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                placeholder="もう一度入力してください"
                className={`w-full border rounded-xl px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 transition-colors
                  ${form.confirmPassword && form.newPassword !== form.confirmPassword
                    ? 'border-red-300 focus:ring-red-300'
                    : form.confirmPassword && form.newPassword === form.confirmPassword
                    ? 'border-green-300 focus:ring-green-300'
                    : 'border-gray-200 focus:ring-sky-300'}`}
              />
              <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  {show.confirm
                    ? <><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></>
                    : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></>
                  }
                </svg>
              </button>
            </div>
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <p className="text-xs text-red-500 mt-1">パスワードが一致しません</p>
            )}
            {form.confirmPassword && form.newPassword === form.confirmPassword && (
              <p className="text-xs text-green-500 mt-1">✓ 一致しています</p>
            )}
          </div>
        </div>

        {/* ヒント */}
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 text-xs text-sky-600 space-y-1">
          <p className="font-bold text-sky-700 mb-1.5">安全なパスワードのポイント</p>
          <p className={form.newPassword.length >= 8 ? 'text-green-600' : ''}>
            {form.newPassword.length >= 8 ? '✓' : '•'} 8文字以上
          </p>
          <p className={/[A-Z]/.test(form.newPassword) ? 'text-green-600' : ''}>
            {/[A-Z]/.test(form.newPassword) ? '✓' : '•'} 大文字を含む
          </p>
          <p className={/[0-9]/.test(form.newPassword) ? 'text-green-600' : ''}>
            {/[0-9]/.test(form.newPassword) ? '✓' : '•'} 数字を含む
          </p>
          <p className={/[^A-Za-z0-9]/.test(form.newPassword) ? 'text-green-600' : ''}>
            {/[^A-Za-z0-9]/.test(form.newPassword) ? '✓' : '•'} 記号を含む（例：@#$%）
          </p>
        </div>

        <button
          type="submit"
          disabled={isPending || form.newPassword !== form.confirmPassword || form.newPassword.length < 8}
          className="w-full bg-gradient-to-r from-sky-400 to-blue-500 hover:opacity-90 disabled:opacity-50
                     text-white font-black py-3.5 rounded-xl transition-opacity text-sm shadow-md"
        >
          {isPending ? '変更中...' : 'パスワードを変更する'}
        </button>
      </form>
    </div>
  )
}



