'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createListing, supabase } from '@oshikatsu/api-client'
import type { TransactionType } from '@oshikatsu/types'

interface ListingFormProps {
  imageUrls: string[]
  suggestedPrice?: number | null
}

const CONDITIONS = [
  { value: 'new',       label: '新品・未開封' },
  { value: 'like_new',  label: '未使用に近い' },
  { value: 'good',      label: '目立った傷・汚れなし' },
  { value: 'fair',      label: 'やや傷・汚れあり' },
  { value: 'poor',      label: '傷・汚れあり' },
]

const TRANSACTION_TYPES: { value: TransactionType; label: string; desc: string }[] = [
  { value: 'sale',          label: '売る',     desc: '価格を設定して販売' },
  { value: 'exchange',      label: '交換',     desc: '他のグッズと交換' },
  { value: 'local_exchange',label: '現地交換', desc: 'イベント会場で直接交換' },
]

export function ListingForm({ imageUrls, suggestedPrice }: ListingFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState({
    title: '',
    description: '',
    condition: 'good',
    transactionType: 'sale' as TransactionType,
    price: suggestedPrice?.toString() ?? '',
    exchangeDescription: '',
    artistName: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'タイトルを入力してください'
    if (form.title.length > 100) e.title = '100文字以内で入力してください'
    if (imageUrls.length === 0) e.images = '写真を1枚以上追加してください'
    if (form.transactionType === 'sale' && !form.price) e.price = '価格を入力してください'
    if (form.transactionType === 'exchange' && !form.exchangeDescription)
      e.exchangeDescription = '希望交換品を入力してください'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    startTransition(async () => {
      const { data, error } = await createListing({
        title: form.title,
        description: form.description,
        condition: form.condition,
        transactionType: form.transactionType,
        price: form.price ? Number(form.price) : null,
        exchangeDescription: form.exchangeDescription || null,
        artistName: form.artistName || null,
        isExchangeOnly: form.transactionType !== 'sale',
        status: 'ai_checking',
      })

      if (error) {
        setErrors({ submit: error })
        return
      }

      // 真贋チェックをバックグラウンドで実行（結果を待たずに画面遷移）
      // ※ verify-authenticity が high リスクと判定した場合は自動で出品停止される
      if (data?.id && imageUrls.length > 0) {
        supabase.functions.invoke('verify-authenticity', {
          body: { listingId: data.id, imageUrls },
        }).catch((err) => console.warn('authenticity check skipped:', err))
      }

      router.push(`/listings/${data?.id}`)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* 取引種別 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">取引方法</label>
        <div className="grid grid-cols-3 gap-2">
          {TRANSACTION_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => set('transactionType', t.value)}
              className={`border rounded-lg p-3 text-left transition-colors
                ${form.transactionType === t.value
                  ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-400'
                  : 'border-gray-200 hover:border-gray-300'}`}
            >
              <p className="font-medium text-sm">{t.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* タイトル */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="例：〇〇 缶バッジ 5種セット"
          maxLength={100}
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400
            ${errors.title ? 'border-red-400' : 'border-gray-300'}`}
        />
        <div className="flex justify-between mt-1">
          {errors.title
            ? <p className="text-xs text-red-500">{errors.title}</p>
            : <span />}
          <p className="text-xs text-gray-400">{form.title.length}/100</p>
        </div>
      </div>

      {/* アーティスト名 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          アーティスト・作品名
        </label>
        <input
          type="text"
          value={form.artistName}
          onChange={(e) => set('artistName', e.target.value)}
          placeholder="例：〇〇（バンド名・アニメ名など）"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
      </div>

      {/* 商品の状態 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">商品の状態</label>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => set('condition', c.value)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors
                ${form.condition === c.value
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-gray-300 text-gray-600 hover:border-primary-300'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* 価格（売る場合） */}
      {form.transactionType === 'sale' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            販売価格 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
            <input
              type="number"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="0"
              min="1"
              max="9999999"
              className={`w-full border rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400
                ${errors.price ? 'border-red-400' : 'border-gray-300'}`}
            />
          </div>
          {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
          {suggestedPrice && (
            <p className="text-xs text-purple-600 mt-1">
              ✨ AI推奨価格: ¥{suggestedPrice.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* 交換希望品（交換の場合） */}
      {(form.transactionType === 'exchange' || form.transactionType === 'local_exchange') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            希望交換品 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.exchangeDescription}
            onChange={(e) => set('exchangeDescription', e.target.value)}
            placeholder="例：〇〇の缶バッジ（種類問わず）と交換希望"
            rows={3}
            className={`w-full border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-400
              ${errors.exchangeDescription ? 'border-red-400' : 'border-gray-300'}`}
          />
          {errors.exchangeDescription && (
            <p className="text-xs text-red-500 mt-1">{errors.exchangeDescription}</p>
          )}
        </div>
      )}

      {/* 説明文 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">商品説明</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="商品の詳細情報（イベント名・シリアルナンバー・付属品など）"
          rows={5}
          maxLength={2000}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <p className="text-xs text-gray-400 text-right mt-1">{form.description.length}/2000</p>
      </div>

      {/* エラー */}
      {errors.submit && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          {errors.submit}
        </p>
      )}
      {errors.images && (
        <p className="text-sm text-red-500">{errors.images}</p>
      )}

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed
                   text-white font-bold py-3 rounded-xl transition-colors text-base"
      >
        {isPending ? '出品中...' : '出品する'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        出品後にAIが内容を自動審査します（通常1〜2分）
      </p>
    </form>
  )
}
