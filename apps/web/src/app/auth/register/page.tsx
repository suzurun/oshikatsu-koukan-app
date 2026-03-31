'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Step = 'age' | 'account' | 'profile'

const ARTISTS_SUGGESTIONS = [
  'BTS', 'BLACKPINK', 'NewJeans', 'LE SSERAFIM', 'aespa',
  '乃木坂46', 'AKB48', 'NiziU', 'TWICE', 'Stray Kids',
]

function calcAge(birthdate: string): number | null {
  if (!birthdate) return null
  const today = new Date()
  const birth = new Date(birthdate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('age')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [birthdate, setBirthdate] = useState('')
  const [account, setAccount] = useState({ email: '', password: '', confirmPassword: '', isAdult: true })
  const [profile, setProfile] = useState({
    username: '',
    displayName: '',
    favoriteArtists: [] as string[],
    customArtist: '',
  })

  function setAcc(field: string, value: string | boolean) {
    setAccount((p) => ({ ...p, [field]: value }))
    setError(null)
  }

  function setProf(field: string, value: string | string[]) {
    setProfile((p) => ({ ...p, [field]: value }))
    setError(null)
  }

  function toggleArtist(artist: string) {
    setProfile((p) => ({
      ...p,
      favoriteArtists: p.favoriteArtists.includes(artist)
        ? p.favoriteArtists.filter((a) => a !== artist)
        : [...p.favoriteArtists, artist],
    }))
  }

  function handleAgeNext(e: React.FormEvent) {
    e.preventDefault()
    if (!birthdate) { setError('生年月日を入力してください'); return }
    const age = calcAge(birthdate)
    if (age === null || age < 0) { setError('正しい生年月日を入力してください'); return }
    if (age < 13) {
      setError('13歳未満の方はご利用いただけません')
      return
    }
    if (age < 18) {
      // 未成年フローへ
      router.push(`/auth/register/underage?birth=${encodeURIComponent(birthdate)}`)
      return
    }
    setAccount(p => ({ ...p, isAdult: true }))
    setStep('account')
  }

  function handleAccountNext(e: React.FormEvent) {
    e.preventDefault()
    if (account.password !== account.confirmPassword) {
      setError('パスワードが一致しません')
      return
    }
    if (account.password.length < 8) {
      setError('パスワードは8文字以上で設定してください')
      return
    }
    setStep('profile')
  }

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile.username.trim()) {
      setError('ユーザー名を入力してください')
      return
    }
    if (!/^[a-z0-9_]{3,30}$/.test(profile.username)) {
      setError('ユーザー名は英小文字・数字・アンダースコアで3〜30文字にしてください')
      return
    }

    startTransition(async () => {
      const supabase = createClient()

      // 1. Supabase Auth でアカウント作成
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
      })

      if (signUpError) {
        setError(
          signUpError.message.includes('already registered')
            ? 'このメールアドレスは既に登録されています'
            : signUpError.message,
        )
        return
      }

      if (!authData.user) {
        setError('アカウント作成に失敗しました')
        return
      }

      // 2. プロフィール作成
      const artists = [
        ...profile.favoriteArtists,
        ...(profile.customArtist ? [profile.customArtist] : []),
      ]

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        username: profile.username,
        display_name: profile.displayName || profile.username,
        favorite_artists: artists,
        account_type: account.isAdult ? 'independent' : 'child',
        membership_type: 'free',
      })

      if (profileError) {
        setError(
          profileError.message.includes('profiles_username_key')
            ? 'このユーザー名は既に使われています'
            : profileError.message,
        )
        return
      }

      router.push('/dashboard')
      router.refresh()
    })
  }

  const age = calcAge(birthdate)

  return (
    <>
      {/* ステップインジケーター */}
      <div className="flex items-center gap-2 mb-6">
        <StepBadge num={1} active={step === 'age'} done={step === 'account' || step === 'profile'} label="年齢確認" />
        <div className={`flex-1 h-0.5 ${step === 'account' || step === 'profile' ? 'bg-primary-400' : 'bg-gray-200'}`} />
        <StepBadge num={2} active={step === 'account'} done={step === 'profile'} label="アカウント" />
        <div className={`flex-1 h-0.5 ${step === 'profile' ? 'bg-primary-400' : 'bg-gray-200'}`} />
        <StepBadge num={3} active={step === 'profile'} done={false} label="プロフィール" />
      </div>

      {/* ---- ステップ0: 年齢確認 ---- */}
      {step === 'age' && (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-1">生年月日の確認</h2>
          <p className="text-sm text-gray-500 mb-5">年齢確認のため生年月日を入力してください。</p>
          <form onSubmit={handleAgeNext} className="space-y-5">
            <Field label="生年月日 *">
              <input
                type="date"
                value={birthdate}
                onChange={e => { setBirthdate(e.target.value); setError(null) }}
                required
                max={new Date().toISOString().split('T')[0]}
                className={inputCls}
              />
              {age !== null && age >= 0 && (
                <p className={`text-xs mt-1.5 font-medium ${age < 18 ? 'text-amber-500' : 'text-green-500'}`}>
                  {age < 13
                    ? '⛔ 13歳未満はご利用いただけません'
                    : age < 18
                    ? `⚠️ ${age}歳（未成年）— 保護者の同意が必要です`
                    : `✅ ${age}歳（成人）— 通常登録へ進めます`}
                </p>
              )}
            </Field>

            {/* 未成年の場合の注意書き */}
            {age !== null && age >= 13 && age < 18 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1.5">
                <p className="font-bold text-sm">📋 18歳未満の方へ</p>
                <p>• 保護者の同意メールが必要です</p>
                <p>• 金銭取引（購入・販売）は18歳以上のみ対応</p>
                <p>• コミュニティ参加・グッズ閲覧はご利用いただけます</p>
                <p>• 取引は保護者アカウントを通じて行います</p>
              </div>
            )}

            {error && <ErrorBox>{error}</ErrorBox>}

            <button
              type="submit"
              disabled={!birthdate || (age !== null && age < 13)}
              className={`${primaryBtnCls} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {age !== null && age >= 13 && age < 18
                ? '未成年として登録する →'
                : '次へ'}
            </button>
          </form>
        </>
      )}

      {/* ---- ステップ1: アカウント情報 ---- */}
      {step === 'account' && (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-5">アカウント作成</h2>
          <form onSubmit={handleAccountNext} className="space-y-4">
            <Field label="メールアドレス">
              <input
                type="email"
                value={account.email}
                onChange={(e) => setAcc('email', e.target.value)}
                required
                autoComplete="email"
                placeholder="example@email.com"
                className={inputCls}
              />
            </Field>

            <Field label="パスワード（8文字以上）">
              <input
                type="password"
                value={account.password}
                onChange={(e) => setAcc('password', e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className={inputCls}
              />
            </Field>

            <Field label="パスワード（確認）">
              <input
                type="password"
                value={account.confirmPassword}
                onChange={(e) => setAcc('confirmPassword', e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
                className={inputCls}
              />
            </Field>

            {error && <ErrorBox>{error}</ErrorBox>}

            <button type="submit" className={primaryBtnCls}>次へ</button>
            <button type="button" onClick={() => { setStep('age'); setError(null) }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 text-center">
              ← 生年月日の入力に戻る
            </button>
          </form>
        </>
      )}

      {/* ---- ステップ2: プロフィール設定 ---- */}
      {step === 'profile' && (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-5">プロフィール設定</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <Field label="ユーザー名（英数字・アンダースコア）*">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) => setProf('username', e.target.value.toLowerCase())}
                  required
                  placeholder="username"
                  maxLength={30}
                  pattern="[a-z0-9_]{3,30}"
                  className={`${inputCls} pl-7`}
                />
              </div>
            </Field>

            <Field label="表示名">
              <input
                type="text"
                value={profile.displayName}
                onChange={(e) => setProf('displayName', e.target.value)}
                placeholder="例：推し活太郎"
                maxLength={50}
                className={inputCls}
              />
            </Field>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                推しアーティスト（複数選択可）
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {ARTISTS_SUGGESTIONS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleArtist(a)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors
                      ${profile.favoriteArtists.includes(a)
                        ? 'bg-primary-500 border-primary-500 text-white'
                        : 'border-gray-300 text-gray-600 hover:border-primary-300'}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={profile.customArtist}
                onChange={(e) => setProf('customArtist', e.target.value)}
                placeholder="その他のアーティスト名を入力..."
                className={inputCls}
              />
            </div>

            {error && <ErrorBox>{error}</ErrorBox>}

            <button
              type="submit"
              disabled={isPending}
              className={`${primaryBtnCls} disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {isPending ? '登録中...' : '登録する'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('account'); setError(null) }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 text-center"
            >
              ← 前に戻る
            </button>
          </form>
        </>
      )}

      <div className="mt-6 pt-6 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/auth/login" className="text-primary-500 hover:text-primary-600 font-medium">
            ログイン
          </Link>
        </p>
      </div>
    </>
  )
}

function StepBadge({ num, active, done, label }: { num: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
        ${done ? 'bg-primary-500 text-white' : active ? 'bg-primary-500 text-white ring-2 ring-primary-200' : 'bg-gray-200 text-gray-400'}`}>
        {done ? '✓' : num}
      </div>
      <span className={`text-xs hidden sm:block ${active ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
      {children}
    </div>
  )
}

const inputCls = `w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm
  focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent`

const primaryBtnCls = `w-full bg-primary-500 hover:bg-primary-600 text-white
  font-bold py-3 rounded-xl transition-colors text-sm`
