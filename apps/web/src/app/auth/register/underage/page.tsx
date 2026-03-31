'use client'

import { useState, useTransition, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Step = 'confirm' | 'guardian' | 'account' | 'profile' | 'done'

const ARTISTS_SUGGESTIONS = [
  'BTS', 'BLACKPINK', 'NewJeans', 'LE SSERAFIM', 'aespa',
  '乃木坂46', 'AKB48', 'NiziU', 'TWICE', 'Stray Kids',
]

const STEP_LABELS: { key: Step; label: string }[] = [
  { key: 'confirm',  label: '制限確認' },
  { key: 'guardian', label: '保護者情報' },
  { key: 'account',  label: 'アカウント' },
  { key: 'profile',  label: 'プロフィール' },
]

function UnderageRegisterInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const birth = searchParams.get('birth') ?? ''

  const [step, setStep]       = useState<Step>('confirm')
  const [isPending, startTransition] = useTransition()
  const [error, setError]     = useState<string | null>(null)

  const [guardian, setGuardian] = useState({
    name: '',
    email: '',
    relation: '母',
    agreed: false,
  })
  const [account, setAccount] = useState({ email: '', password: '', confirmPassword: '' })
  const [profile, setProfile] = useState({
    username: '',
    displayName: '',
    favoriteArtists: [] as string[],
    customArtist: '',
  })

  // 年齢計算
  const [ageStr, setAgeStr] = useState('')
  useEffect(() => {
    if (!birth) return
    const today = new Date()
    const b = new Date(birth)
    let age = today.getFullYear() - b.getFullYear()
    const m = today.getMonth() - b.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--
    setAgeStr(String(age))
  }, [birth])

  function setG(field: string, value: string | boolean) {
    setGuardian(p => ({ ...p, [field]: value }))
    setError(null)
  }
  function setAcc(field: string, value: string) {
    setAccount(p => ({ ...p, [field]: value }))
    setError(null)
  }
  function setProf(field: string, value: string | string[]) {
    setProfile(p => ({ ...p, [field]: value }))
    setError(null)
  }
  function toggleArtist(artist: string) {
    setProfile(p => ({
      ...p,
      favoriteArtists: p.favoriteArtists.includes(artist)
        ? p.favoriteArtists.filter(a => a !== artist)
        : [...p.favoriteArtists, artist],
    }))
  }

  const currentStepIdx = STEP_LABELS.findIndex(s => s.key === step)

  /* ─── サブミット処理 ─── */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile.username.trim()) { setError('ユーザー名を入力してください'); return }
    if (!/^[a-z0-9_]{3,30}$/.test(profile.username)) {
      setError('ユーザー名は英小文字・数字・アンダースコアで3〜30文字にしてください')
      return
    }

    startTransition(async () => {
      const supabase = createClient()

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
      })
      if (signUpError) {
        setError(
          signUpError.message.includes('already registered')
            ? 'このメールアドレスは既に登録されています'
            : signUpError.message
        )
        return
      }
      if (!authData.user) { setError('アカウント作成に失敗しました'); return }

      const artists = [
        ...profile.favoriteArtists,
        ...(profile.customArtist ? [profile.customArtist] : []),
      ]

      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        username: profile.username,
        display_name: profile.displayName || profile.username,
        favorite_artists: artists,
        account_type: 'child',
        membership_type: 'free',
        guardian_email: guardian.email,
        guardian_name: guardian.name,
        guardian_relation: guardian.relation,
        birthdate: birth,
      })

      if (profileError) {
        setError(
          profileError.message.includes('profiles_username_key')
            ? 'このユーザー名は既に使われています'
            : profileError.message
        )
        return
      }

      setStep('done')
    })
  }

  return (
    <>
      {/* 未成年バッジ */}
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-5">
        <span className="text-base">⚠️</span>
        <div>
          <p className="text-xs font-bold text-amber-700">未成年（{ageStr}歳）専用登録フロー</p>
          <p className="text-[10px] text-amber-600">保護者の同意が必要です</p>
        </div>
        <Link href="/auth/register" className="ml-auto text-[10px] text-amber-500 hover:text-amber-600 font-medium underline">
          戻る
        </Link>
      </div>

      {/* ステップインジケーター */}
      {step !== 'done' && (
        <div className="flex items-center gap-1 mb-6">
          {STEP_LABELS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1 flex-1">
              <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${
                  i < currentStepIdx ? 'bg-sky-400 text-white'
                  : i === currentStepIdx ? 'bg-sky-500 text-white ring-2 ring-sky-200'
                  : 'bg-gray-200 text-gray-400'
                }`}>
                  {i < currentStepIdx ? '✓' : i + 1}
                </div>
                <span className={`text-[9px] hidden sm:block ${i === currentStepIdx ? 'text-sky-600 font-bold' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-3 ${i < currentStepIdx ? 'bg-sky-400' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══ STEP 1: 利用制限の確認 ═══ */}
      {step === 'confirm' && (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-1">18歳未満の利用について</h2>
          <p className="text-xs text-gray-500 mb-4">ご登録の前に以下をよくお読みください</p>

          {/* できること */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-3">
            <p className="text-sm font-bold text-green-700 mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              できること
            </p>
            <ul className="space-y-1.5 text-xs text-green-700">
              {[
                'グッズ・商品の閲覧・検索',
                'コミュニティへの投稿・交流',
                'ファンルームへの参加',
                'イベント・オフ会の閲覧・参加表明',
                'お気に入りリストの作成',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* できないこと */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-sm font-bold text-red-600 mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              制限されること
            </p>
            <ul className="space-y-1.5 text-xs text-red-600">
              {[
                '商品の購入・支払い（保護者アカウント必要）',
                '商品の出品・販売',
                'クレジットカード・電子マネーの登録',
                '個人情報の公開設定の変更',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="flex-shrink-0 font-bold">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* 保護者同意の説明 */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 mb-5">
            <p className="text-xs font-bold text-sky-700 flex items-center gap-1.5 mb-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              保護者への同意確認メールを送信します
            </p>
            <p className="text-[11px] text-sky-600 leading-relaxed">
              次のステップで保護者のメールアドレスを入力すると、同意確認メールが届きます。
              保護者が承認するまでの間、一部機能が制限されます。
            </p>
          </div>

          <button
            onClick={() => setStep('guardian')}
            className={primaryBtnCls}
          >
            内容を確認しました。次へ →
          </button>
        </>
      )}

      {/* ═══ STEP 2: 保護者情報 ═══ */}
      {step === 'guardian' && (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-1">保護者情報の入力</h2>
          <p className="text-xs text-gray-500 mb-5">保護者（親権者）のメールアドレスへ同意確認を送ります</p>
          <form onSubmit={e => { e.preventDefault(); if (!guardian.agreed) { setError('同意のチェックを入れてください'); return }; setStep('account') }} className="space-y-4">

            <Field label="保護者のお名前 *">
              <input
                type="text"
                value={guardian.name}
                onChange={e => setG('name', e.target.value)}
                required
                placeholder="例：山田 花子"
                className={inputCls}
              />
            </Field>

            <Field label="保護者との続柄 *">
              <select
                value={guardian.relation}
                onChange={e => setG('relation', e.target.value)}
                className={inputCls}
              >
                {['母', '父', '祖母', '祖父', '兄・姉', 'その他'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>

            <Field label="保護者のメールアドレス *">
              <input
                type="email"
                value={guardian.email}
                onChange={e => setG('email', e.target.value)}
                required
                placeholder="parent@example.com"
                className={inputCls}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                ※ このアドレスに同意確認メールを送ります。本人のアドレスとは別にしてください。
              </p>
            </Field>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={guardian.agreed}
                onChange={e => setG('agreed', e.target.checked)}
                className="mt-0.5 accent-sky-500 w-4 h-4"
              />
              <span className="text-xs text-gray-600 leading-relaxed">
                保護者へ同意確認メールを送ることに同意します。また、利用制限の内容を保護者に説明しました。
              </span>
            </label>

            {error && <ErrorBox>{error}</ErrorBox>}

            <button type="submit" className={primaryBtnCls}>次へ →</button>
            <button type="button" onClick={() => { setStep('confirm'); setError(null) }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 text-center">
              ← 前に戻る
            </button>
          </form>
        </>
      )}

      {/* ═══ STEP 3: アカウント情報 ═══ */}
      {step === 'account' && (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-1">アカウント作成</h2>
          <p className="text-xs text-gray-500 mb-5">ログイン用のメールアドレスとパスワードを設定します</p>
          <form onSubmit={e => {
            e.preventDefault()
            if (account.password !== account.confirmPassword) { setError('パスワードが一致しません'); return }
            if (account.password.length < 8) { setError('パスワードは8文字以上で設定してください'); return }
            if (account.email === guardian.email) { setError('保護者のメールアドレスとは異なるアドレスを使用してください'); return }
            setStep('profile')
          }} className="space-y-4">

            <Field label="メールアドレス *">
              <input type="email" value={account.email} onChange={e => setAcc('email', e.target.value)}
                required placeholder="your@email.com" className={inputCls} />
              <p className="text-[10px] text-gray-400 mt-1">※ 保護者のアドレスとは異なるものを入力してください</p>
            </Field>

            <Field label="パスワード（8文字以上）*">
              <input type="password" value={account.password} onChange={e => setAcc('password', e.target.value)}
                required placeholder="••••••••" className={inputCls} />
            </Field>

            <Field label="パスワード（確認）*">
              <input type="password" value={account.confirmPassword} onChange={e => setAcc('confirmPassword', e.target.value)}
                required placeholder="••••••••" className={inputCls} />
            </Field>

            {error && <ErrorBox>{error}</ErrorBox>}

            <button type="submit" className={primaryBtnCls}>次へ →</button>
            <button type="button" onClick={() => { setStep('guardian'); setError(null) }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 text-center">
              ← 前に戻る
            </button>
          </form>
        </>
      )}

      {/* ═══ STEP 4: プロフィール設定 ═══ */}
      {step === 'profile' && (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-1">プロフィール設定</h2>
          <p className="text-xs text-gray-500 mb-5">あなたのプロフィールを作成しましょう</p>
          <form onSubmit={handleSubmit} className="space-y-5">

            <Field label="ユーザー名（英数字・アンダースコア）*">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <input
                  type="text"
                  value={profile.username}
                  onChange={e => setProf('username', e.target.value.toLowerCase())}
                  required
                  placeholder="username"
                  maxLength={30}
                  pattern="[a-z0-9_]{3,30}"
                  className={`${inputCls} pl-7`}
                />
              </div>
            </Field>

            <Field label="表示名">
              <input type="text" value={profile.displayName} onChange={e => setProf('displayName', e.target.value)}
                placeholder="例：推し活さくら" maxLength={50} className={inputCls} />
            </Field>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                推しアーティスト（複数選択可）
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {ARTISTS_SUGGESTIONS.map(a => (
                  <button key={a} type="button" onClick={() => toggleArtist(a)}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors
                      ${profile.favoriteArtists.includes(a)
                        ? 'bg-sky-500 border-sky-500 text-white'
                        : 'border-gray-300 text-gray-600 hover:border-sky-300'}`}>
                    {a}
                  </button>
                ))}
              </div>
              <input type="text" value={profile.customArtist}
                onChange={e => setProf('customArtist', e.target.value)}
                placeholder="その他のアーティスト名を入力..." className={inputCls} />
            </div>

            {error && <ErrorBox>{error}</ErrorBox>}

            <button type="submit" disabled={isPending}
              className={`${primaryBtnCls} disabled:opacity-60 disabled:cursor-not-allowed`}>
              {isPending ? '登録中...' : '登録する'}
            </button>
            <button type="button" onClick={() => { setStep('account'); setError(null) }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 text-center">
              ← 前に戻る
            </button>
          </form>
        </>
      )}

      {/* ═══ 完了画面 ═══ */}
      {step === 'done' && (
        <div className="text-center space-y-5 py-4">
          {/* アイコン */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-violet-400
                          flex items-center justify-center mx-auto shadow-lg">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>

          <div>
            <h2 className="text-xl font-black text-gray-900 mb-2">登録完了！</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              アカウントが作成されました。<br />
              保護者（<span className="font-bold text-sky-600">{guardian.email}</span>）へ<br />
              同意確認メールを送信しました。
            </p>
          </div>

          {/* 保護者承認待ち */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
            <p className="text-xs font-bold text-amber-700 mb-2">📧 保護者の承認をお待ちください</p>
            <ul className="space-y-1.5 text-xs text-amber-600">
              <li className="flex items-start gap-1.5">
                <span className="flex-shrink-0 font-bold">①</span>
                保護者のメールに同意確認メールが届きます
              </li>
              <li className="flex items-start gap-1.5">
                <span className="flex-shrink-0 font-bold">②</span>
                保護者がメール内のリンクをクリックして承認
              </li>
              <li className="flex items-start gap-1.5">
                <span className="flex-shrink-0 font-bold">③</span>
                承認後、コミュニティ・閲覧機能が利用可能に
              </li>
            </ul>
          </div>

          {/* 今すぐできること */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left">
            <p className="text-xs font-bold text-green-700 mb-2">✅ 今すぐできること</p>
            <ul className="space-y-1 text-xs text-green-600">
              <li>• グッズの閲覧・検索</li>
              <li>• コミュニティの投稿・交流</li>
              <li>• ファンルームへの参加</li>
            </ul>
          </div>

          <Link href="/"
            className="block w-full py-3 bg-gradient-to-r from-sky-400 to-violet-500
                       text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity">
            トップページへ →
          </Link>
          <Link href="/auth/login" className="text-xs text-gray-400 hover:text-gray-600">
            ログインページへ
          </Link>
        </div>
      )}

      {step !== 'done' && (
        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            すでにアカウントをお持ちの方は{' '}
            <Link href="/auth/login" className="text-sky-500 hover:text-sky-600 font-medium">
              ログイン
            </Link>
          </p>
        </div>
      )}
    </>
  )
}

export default function UnderageRegisterPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>}>
      <UnderageRegisterInner />
    </Suspense>
  )
}

/* ─── 共通コンポーネント ─── */
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
  focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent`
const primaryBtnCls = `w-full bg-gradient-to-r from-sky-400 to-violet-500
  hover:opacity-90 text-white font-bold py-3 rounded-xl transition-opacity text-sm`



