'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const CATEGORIES = [
  'フォトカード・トレカ', 'アクリルスタンド', 'うちわ', '缶バッジ',
  'ブロマイド', 'クリアファイル', 'コンサートグッズ', 'ぬいぐるみ',
  'ポスター', 'CD・DVD', 'グッズセット', 'その他',
]
const CONDITIONS = [
  { value: 'new',       label: '新品・未使用' },
  { value: 'like_new',  label: '未使用に近い' },
  { value: 'good',      label: '良好' },
  { value: 'fair',      label: 'やや傷・汚れあり' },
  { value: 'poor',      label: '傷・汚れあり' },
]
const TX_TYPES = [
  { value: 'sale',           label: '販売のみ' },
  { value: 'exchange',       label: '交換のみ（¥0）' },
  { value: 'sale_exchange',  label: '販売 ＆ 交換どちらでも' },
  { value: 'local_exchange', label: '現地手渡し交換' },
]

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const id = String(params.id)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'good',
    transaction_type: 'sale',
    asking_price: '',
    exchange_description: '',
    artist_name: '',
    is_exchange_only: false,
  })

  // 既存データ取得
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single()
      if (data) {
        setForm({
          title: String(data.title ?? ''),
          description: String(data.description ?? ''),
          category: String(data.category ?? ''),
          condition: String(data.condition ?? 'good'),
          transaction_type: String(data.transaction_type ?? 'sale'),
          asking_price: data.asking_price ? String(data.asking_price) : '',
          exchange_description: String(data.exchange_description ?? ''),
          artist_name: String(data.artist_name ?? ''),
          is_exchange_only: Boolean(data.is_exchange_only),
        })
      }
    }
    load()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const { error: err } = await supabase
        .from('listings')
        .update({
          title: form.title,
          description: form.description,
          category: form.category,
          condition: form.condition,
          transaction_type: form.transaction_type,
          asking_price: form.asking_price ? Number(form.asking_price) : null,
          exchange_description: form.exchange_description || null,
          artist_name: form.artist_name || null,
          is_exchange_only: form.transaction_type === 'exchange',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (err) {
        setError('更新に失敗しました。もう一度お試しください。')
        return
      }
      setSaved(true)
      setTimeout(() => router.push(`/listings/${id}`), 1200)
    })
  }

  const handleDelete = () => {
    if (!confirm('この出品を削除しますか？この操作は取り消せません。')) return
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('listings').update({ status: 'deleted' }).eq('id', id)
      router.push('/dashboard')
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/listings/${id}`}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-black text-[#333333]">出品を編集</h1>
          <p className="text-xs text-gray-400">変更内容は即時反映されます</p>
        </div>
      </div>

      {saved && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          <p className="text-sm text-green-700 font-medium">保存しました！商品ページに戻ります...</p>
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* アーティスト名 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700">基本情報</h2>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">アーティスト名</label>
            <input
              name="artist_name"
              value={form.artist_name}
              onChange={handleChange}
              placeholder="例：BTS、乃木坂46..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">商品タイトル <span className="text-rose-400">*</span></label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="例：BTS RM フォトカード Indigo ver."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">カテゴリ <span className="text-rose-400">*</span></label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
            >
              <option value="">選択してください</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">状態 <span className="text-rose-400">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {CONDITIONS.map(c => (
                <label key={c.value}
                  className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-colors
                    ${form.condition === c.value ? 'border-sky-400 bg-sky-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="condition" value={c.value} checked={form.condition === c.value} onChange={handleChange} className="sr-only"/>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${form.condition === c.value ? 'border-sky-500' : 'border-gray-300'}`}>
                    {form.condition === c.value && <div className="w-2 h-2 rounded-full bg-sky-500"/>}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{c.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 取引・価格 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="text-sm font-bold text-gray-700">取引・価格設定</h2>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">取引方法</label>
            <div className="space-y-2">
              {TX_TYPES.map(t => (
                <label key={t.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                    ${form.transaction_type === t.value ? 'border-sky-400 bg-sky-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="transaction_type" value={t.value} checked={form.transaction_type === t.value} onChange={handleChange} className="sr-only"/>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${form.transaction_type === t.value ? 'border-sky-500' : 'border-gray-300'}`}>
                    {form.transaction_type === t.value && <div className="w-2 h-2 rounded-full bg-sky-500"/>}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{t.label}</span>
                  {t.value === 'exchange' && (
                    <span className="ml-auto text-[10px] bg-rose-100 text-rose-600 font-bold px-2 py-0.5 rounded-full">人気</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {(form.transaction_type === 'sale' || form.transaction_type === 'sale_exchange') && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">販売価格（円）</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">¥</span>
                <input
                  name="asking_price"
                  type="number"
                  min="0"
                  value={form.asking_price}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </div>
            </div>
          )}

          {(form.transaction_type === 'exchange' || form.transaction_type === 'sale_exchange' || form.transaction_type === 'local_exchange') && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">交換希望グッズ（任意）</label>
              <input
                name="exchange_description"
                value={form.exchange_description}
                onChange={handleChange}
                placeholder="例：BTS SUGA フォトカードと交換希望"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>
          )}
        </div>

        {/* 商品説明 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">商品説明</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={6}
            placeholder="商品の状態、入手経緯、注意事項などを記載してください..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none"
          />
          <p className="text-[11px] text-gray-400 mt-1.5 text-right">{form.description.length} 文字</p>
        </div>

        {/* ボタン */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending || saved}
            className="flex-1 bg-gradient-to-r from-sky-400 to-blue-500 hover:opacity-90 disabled:opacity-60
                       text-white font-black py-3.5 rounded-xl transition-opacity text-sm shadow-md"
          >
            {isPending ? '保存中...' : '変更を保存する'}
          </button>
        </div>

        {/* 削除 */}
        <div className="border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="w-full text-xs text-rose-400 hover:text-rose-600 font-medium py-2 transition-colors"
          >
            この出品を削除する
          </button>
        </div>

      </form>
    </div>
  )
}



