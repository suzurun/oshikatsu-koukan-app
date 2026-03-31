'use client'

import { useState, useTransition, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type KycStep = 'intro' | 'payment' | 'identity' | 'waiting' | 'done'

function KycPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<KycStep>('intro')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [idType, setIdType] = useState<'mynumber' | 'license' | 'passport'>('license')

  // ?step=identity で直接アップロード画面へ
  useEffect(() => {
    if (searchParams.get('step') === 'identity') {
      setStep('identity')
    }
  }, [searchParams])

  const STEPS: { key: KycStep; label: string }[] = [
    { key: 'intro',    label: '説明' },
    { key: 'payment',  label: '審査費用' },
    { key: 'identity', label: '本人確認' },
    { key: 'waiting',  label: '審査中' },
  ]

  const currentIdx = STEPS.findIndex((s) => s.key === step)

  async function handlePayment() {
    startTransition(async () => {
      setError(null)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // KYCレコードを作成（審査費用支払いはStripeで処理）
      const { error } = await supabase.from('kyc_records').upsert({
        user_id: user.id,
        status: 'pending',
        kyc_provider: 'TRUSTDOCK',
        kyc_fee_paid: true, // 本来はStripe決済後にWebhookで更新
        submitted_at: new Date().toISOString(),
      })

      if (error) {
        setError('エラーが発生しました。もう一度お試しください。')
        return
      }

      setStep('identity')
    })
  }

  async function handleIdentitySubmit() {
    startTransition(async () => {
      setError(null)
      // 本来はTRUSTDOCK APIに書類データを送信
      // ここではモックとして審査中に遷移
      setStep('waiting')

      // 審査中ポーリング（本番ではWebhookで更新）
      setTimeout(() => setStep('done'), 3000)
    })
  }

  if (step === 'done') {
    return (
      <div className="text-center space-y-5 py-2">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400
                        flex items-center justify-center mx-auto shadow-lg">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            <path d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" fill="white"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">本人確認が完了しました</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            審査が承認されました。<br />
            これで購入・出品・取引が利用できます。
          </p>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-left">
          <p className="text-xs font-bold text-teal-700 mb-2">✅ 解禁された機能</p>
          <ul className="space-y-1 text-xs text-teal-600">
            <li>• 商品の購入・支払い</li>
            <li>• 商品の出品・販売</li>
            <li>• クレジットカード登録</li>
            <li>• 高額取引（3万円超）</li>
          </ul>
        </div>
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 hover:opacity-90 text-white font-bold py-3 rounded-xl transition-opacity text-sm"
        >
          マイページへ戻る
        </button>
      </div>
    )
  }

  return (
    <>
      {/* ステップバー */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1 flex-1">
            <div className={`flex-1 flex items-center gap-1`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                ${i < currentIdx ? 'bg-primary-500 text-white'
                  : i === currentIdx ? 'bg-primary-500 text-white ring-2 ring-primary-200'
                  : 'bg-gray-200 text-gray-400'}`}>
                {i < currentIdx ? '✓' : i + 1}
              </div>
              <span className={`text-xs hidden sm:block ${i === currentIdx ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < currentIdx ? 'bg-primary-400' : 'bg-gray-200'}`} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ---- イントロ ---- */}
      {step === 'intro' && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-gray-900">本人確認（eKYC）</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-blue-800">なぜ必要なの？</p>
            <p className="text-sm text-blue-700">
              取引の安全を守るため、初回取引時に本人確認を行っています。
              古物営業法の規定により、3万円超の取引では本人確認が義務付けられています。
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: '🔒', title: '個人情報は暗号化', desc: 'KMS暗号化で厳重に保護。取引相手には一切公開されません。' },
              { icon: '⏱️', title: '審査は約5分', desc: '書類をアップロードするだけ。AIが自動で審査します。' },
              { icon: '💳', title: '審査費用300円', desc: '審査通過後は返金不可。審査不通過の場合は全額返金。' },
            ].map((item) => (
              <div key={item.title} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep('payment')}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            本人確認を始める
          </button>
          <button
            onClick={() => router.back()}
            className="w-full text-sm text-gray-400 hover:text-gray-600 text-center"
          >
            あとで行う
          </button>
        </div>
      )}

      {/* ---- 審査費用の支払い ---- */}
      {step === 'payment' && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-gray-900">審査費用のお支払い</h2>

          <div className="border border-gray-200 rounded-xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">eKYC審査費用</span>
              <span className="text-lg font-bold text-gray-900">¥300</span>
            </div>
            <div className="border-t pt-3 text-xs text-gray-400 space-y-1">
              <p>• 審査通過後は返金不可</p>
              <p>• 審査不通過の場合は全額返金</p>
              <p>• 一度承認されれば再度の支払いは不要</p>
            </div>
          </div>

          {/* クレジットカード入力（Stripe Elements を想定） */}
          <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-500">Stripe決済フォーム</p>
            <p className="text-xs text-gray-400 mt-1">（本番環境ではStripe Elementsが表示されます）</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={isPending}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed
                       text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            {isPending ? '処理中...' : '¥300を支払って審査を開始'}
          </button>
        </div>
      )}

      {/* ---- 本人確認書類アップロード ---- */}
      {step === 'identity' && (
        <div className="space-y-5">
          <h2 className="text-xl font-bold text-gray-900">本人確認書類の提出</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">書類の種類を選択</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'license' as const,   label: '運転免許証', icon: '🚗' },
                { value: 'mynumber' as const,  label: 'マイナンバーカード', icon: '🪪' },
                { value: 'passport' as const,  label: 'パスポート', icon: '📘' },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setIdType(t.value)}
                  className={`border rounded-xl p-3 text-center transition-colors
                    ${idType === t.value ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-400' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="text-2xl mb-1">{t.icon}</div>
                  <p className="text-xs font-medium text-gray-700">{t.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 書類アップロードエリア */}
          <UploadArea label="書類（表面）" />
          {idType !== 'passport' && <UploadArea label="書類（裏面）" />}

          {/* 顔認証（セルフィー） */}
          <UploadArea label="本人の顔写真（セルフィー）" hint="書類を顔の横に持って撮影してください" />

          {idType === 'mynumber' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                📱 マイナンバーカードをお持ちの方はNFCスキャンが利用できます（審査精度が向上します）
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleIdentitySubmit}
            disabled={isPending}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed
                       text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            {isPending ? '送信中...' : '書類を送信して審査を開始'}
          </button>
        </div>
      )}

      {/* ---- 審査中 ---- */}
      {step === 'waiting' && (
        <div className="text-center space-y-5 py-4">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">審査中...</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            AIが書類を確認しています。<br />
            通常5分以内に完了します。<br />
            結果はメールでもお知らせします。
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left">
            <p className="text-xs text-yellow-700">
              ⚠️ このページを閉じても審査は続行されます。
              完了後、アプリ内通知でお知らせします。
            </p>
          </div>
        </div>
      )}
    </>
  )
}

function UploadArea({ label, hint }: { label: string; hint?: string }) {
  const [preview, setPreview] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setPreview(URL.createObjectURL(file))
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
      <label className={`block border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors
        ${preview ? 'border-primary-300' : 'border-gray-300 hover:border-primary-300'}`}>
        <input type="file" accept="image/*" className="hidden" onChange={handleChange} />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="w-full h-40 object-cover" />
        ) : (
          <div className="h-32 flex flex-col items-center justify-center text-gray-400 gap-2">
            <span className="text-3xl">📁</span>
            <span className="text-xs">タップして選択 または ドラッグ&ドロップ</span>
          </div>
        )}
      </label>
    </div>
  )
}

export default function KycPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-gray-400 text-sm">読み込み中...</div>}>
      <KycPageInner />
    </Suspense>
  )
}
