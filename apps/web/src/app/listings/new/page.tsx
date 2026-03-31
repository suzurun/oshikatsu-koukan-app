'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUploader } from '@/components/listings/ImageUploader'
import { AiPricePanel } from '@/components/listings/AiPricePanel'
import { ListingForm } from '@/components/listings/ListingForm'
import { analyzePrice } from '@oshikatsu/api-client'
import type { PriceAnalysisResponse } from '@oshikatsu/types'

type Step = 'upload' | 'form'

export default function NewListingPage() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('upload')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<PriceAnalysisResponse | null>(null)
  const [appliedPrice, setAppliedPrice] = useState<number | null>(null)

  const handleImagesUploaded = useCallback((urls: string[]) => {
    setImageUrls((prev) => [...prev, ...urls])
  }, [])

  const handleAnalyzeRequest = useCallback(async (primaryUrl: string) => {
    setAnalyzing(true)
    try {
      const { data, error } = await analyzePrice({ imageUrl: primaryUrl })
      if (!error && data) {
        setAnalysis(data)
      }
    } finally {
      setAnalyzing(false)
    }
  }, [])

  const handleApplyPrice = useCallback((price: number) => {
    setAppliedPrice(price)
  }, [])

  const handleProceedToForm = () => {
    if (imageUrls.length === 0) return
    setStep('form')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => step === 'form' ? setStep('upload') : router.back()}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
          >
            ← {step === 'form' ? '写真に戻る' : 'キャンセル'}
          </button>
          <h1 className="font-bold text-gray-900">出品する</h1>
          <div className="w-16" />
        </div>

        {/* ステップインジケーター */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex items-center gap-2">
          <StepDot active={step === 'upload'} done={step === 'form'} label="写真" />
          <div className={`flex-1 h-0.5 ${step === 'form' ? 'bg-primary-400' : 'bg-gray-200'}`} />
          <StepDot active={step === 'form'} done={false} label="情報入力" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {step === 'upload' && (
          <>
            {/* 写真アップロード */}
            <section>
              <h2 className="text-base font-bold text-gray-800 mb-3">
                商品の写真を追加
              </h2>
              <ImageUploader
                onUploaded={handleImagesUploaded}
                onAnalyzeRequest={handleAnalyzeRequest}
                maxImages={10}
              />
            </section>

            {/* AI価格分析結果 */}
            {(analyzing || analysis) && (
              <section>
                <h2 className="text-base font-bold text-gray-800 mb-3">
                  AI相場分析結果
                </h2>
                <AiPricePanel
                  loading={analyzing}
                  result={analysis}
                  onApplyPrice={handleApplyPrice}
                />
              </section>
            )}

            {/* 次へボタン */}
            <button
              type="button"
              onClick={handleProceedToForm}
              disabled={imageUrls.length === 0}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300
                         disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl
                         transition-colors text-base"
            >
              {imageUrls.length === 0
                ? '写真を1枚以上追加してください'
                : `次へ進む（${imageUrls.length}枚選択中）`}
            </button>
          </>
        )}

        {step === 'form' && (
          <>
            {/* 選択中の写真サマリー */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-bold text-gray-800">選択した写真</h2>
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  変更する
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imageUrls.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt={`商品画像${i + 1}`}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                ))}
              </div>
            </section>

            {/* AI分析サマリー（コンパクト表示） */}
            {analysis && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>✨</span>
                  <span className="text-sm text-purple-700 font-medium">
                    AI推奨: ¥{analysis.analysis.suggestedPrice?.toLocaleString() ?? '—'}
                  </span>
                </div>
                <span className="text-xs text-purple-500">
                  希少性 {analysis.analysis.rarityScore}/100
                </span>
              </div>
            )}

            {/* 出品フォーム */}
            <ListingForm
              imageUrls={imageUrls}
              suggestedPrice={appliedPrice ?? analysis?.analysis.suggestedPrice}
            />
          </>
        )}
      </main>
    </div>
  )
}

function StepDot({
  active,
  done,
  label,
}: {
  active: boolean
  done: boolean
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
          ${done ? 'bg-primary-500 text-white'
            : active ? 'bg-primary-500 text-white ring-2 ring-primary-200'
            : 'bg-gray-200 text-gray-400'}`}
      >
        {done ? '✓' : ''}
      </div>
      <span className={`text-xs ${active ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  )
}
