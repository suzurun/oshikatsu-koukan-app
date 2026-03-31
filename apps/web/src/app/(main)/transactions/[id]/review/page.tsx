'use client'

import { useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const TAGS_POSITIVE = ['梱包が丁寧', '発送が早い', '説明通りの商品', '対応が丁寧', 'また取引したい', 'コミュニケーション良好']
const TAGS_NEGATIVE = ['対応が遅い', '説明と異なる', '梱包が雑', '発送が遅い', '連絡が取りにくい']

export default function ReviewPage() {
  const router = useRouter()
  const params = useParams()
  const txId = String(params.id)
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const [score, setScore] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [comment, setComment] = useState('')

  const tags = score >= 4 ? TAGS_POSITIVE : score > 0 ? TAGS_NEGATIVE : TAGS_POSITIVE

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (score === 0) return
    startTransition(async () => {
      // 本番: Supabase reviews テーブルに INSERT
      await new Promise(r => setTimeout(r, 800))
      setDone(true)
    })
  }

  const scoreLabel = ['', '残念だった', 'やや残念', '普通', '良かった', '最高だった！'][score] ?? ''
  const scoreColor = score >= 4 ? 'text-yellow-500' : score === 3 ? 'text-gray-400' : 'text-red-400'

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21L12 17.27z"/>
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-black text-[#333333]">レビューを投稿しました！</h2>
          <p className="text-sm text-gray-500 mt-2">ご協力ありがとうございます。<br/>みんなの安心な取引に役立ちます。</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/transactions"
            className="px-6 py-2.5 border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            取引一覧へ
          </Link>
          <Link href="/"
            className="px-6 py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold rounded-full text-sm hover:opacity-90 transition-opacity">
            トップへ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">

      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/transactions/${txId}`}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-black text-[#333333]">取引相手を評価する</h1>
          <p className="text-xs text-gray-400">正直な評価が安心な市場を作ります</p>
        </div>
      </div>

      {/* 相手情報 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500
                        flex items-center justify-center text-white font-black text-lg flex-shrink-0">
          A
        </div>
        <div>
          <p className="text-sm font-bold text-[#333333]">@army_haruka</p>
          <p className="text-xs text-gray-400">BTS RM フォトカード Indigo ver. の取引</p>
        </div>
        <span className="ml-auto text-xs bg-green-100 text-green-600 font-bold px-2.5 py-1 rounded-full">取引完了</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* 星評価 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <p className="text-sm font-bold text-gray-700 mb-4">取引はどうでしたか？</p>
          <div className="flex items-center justify-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => { setScore(s); setSelectedTags([]) }}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <svg
                  className={`w-10 h-10 transition-colors ${
                    s <= (hovered || score)
                      ? s >= 4 ? 'text-yellow-400' : s === 3 ? 'text-gray-400' : 'text-red-400'
                      : 'text-gray-200'
                  }`}
                  viewBox="0 0 24 24" fill="currentColor"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21L12 17.27z"/>
                </svg>
              </button>
            ))}
          </div>
          {score > 0 && (
            <p className={`text-sm font-bold ${scoreColor}`}>{scoreLabel}</p>
          )}
        </div>

        {/* タグ選択 */}
        {score > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-sm font-bold text-gray-700 mb-3">
              {score >= 4 ? '😊 良かった点は？' : '😔 気になった点は？'}
              <span className="text-xs font-normal text-gray-400 ml-1">（複数選択可）</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs font-medium px-3.5 py-2 rounded-full border transition-colors
                    ${selectedTags.includes(tag)
                      ? score >= 4
                        ? 'bg-yellow-400 text-white border-yellow-400'
                        : 'bg-rose-400 text-white border-rose-400'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* コメント */}
        {score > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              コメント
              <span className="text-xs font-normal text-gray-400 ml-1">（任意）</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={4}
              maxLength={300}
              placeholder="取引の感想を自由に書いてください..."
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none
                         focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent"
            />
            <p className="text-[11px] text-gray-400 mt-1 text-right">{comment.length}/300</p>
          </div>
        )}

        <button
          type="submit"
          disabled={score === 0 || isPending}
          className="w-full bg-gradient-to-r from-yellow-400 to-amber-400 hover:opacity-90 disabled:opacity-40
                     text-white font-black py-4 rounded-xl transition-opacity text-sm shadow-md"
        >
          {isPending ? '送信中...' : score === 0 ? '★ 星をタップして評価する' : 'レビューを投稿する'}
        </button>
      </form>
    </div>
  )
}



