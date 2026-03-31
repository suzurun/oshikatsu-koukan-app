'use client'

import { useState } from 'react'

interface Props {
  images: string[]
  title: string
  aiScore?: number
  aiRisk?: string
}

export default function ListingGallery({ images, title, aiScore, aiRisk }: Props) {
  const [active, setActive] = useState(0)

  const safeImages = images.length > 0 ? images : []

  return (
    <div className="space-y-3">
      {/* メイン画像 */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
        {safeImages.length > 0 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={safeImages[active]}
            alt={title}
            className="w-full h-full object-cover transition-all duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl text-gray-300">🎁</div>
        )}

        {/* AI鑑定済みオーバーレイ */}
        {aiScore !== undefined && (
          <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm
            ${aiRisk === 'low'
              ? 'bg-gradient-to-r from-yellow-400/95 to-amber-400/95'
              : aiRisk === 'medium'
              ? 'bg-gradient-to-r from-orange-400/90 to-amber-500/90'
              : 'bg-gradient-to-r from-red-500/90 to-rose-500/90'
            }`}>
            {/* シールドアイコン */}
            <svg className={`w-4 h-4 flex-shrink-0 ${aiRisk === 'low' ? 'text-yellow-800' : 'text-white'}`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              {aiRisk === 'low' && (
                <path d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" fill="white" opacity="0.9"/>
              )}
            </svg>
            <div className="leading-none">
              <p className={`font-black text-[11px] leading-tight ${aiRisk === 'low' ? 'text-yellow-900' : 'text-white'}`}>
                {aiRisk === 'low' ? 'AI真贋鑑定済み' : aiRisk === 'medium' ? '要確認' : '要注意'}
              </p>
              <p className={`text-[10px] leading-tight ${aiRisk === 'low' ? 'text-yellow-800/80' : 'text-white/80'}`}>信頼度 {aiScore}%</p>
            </div>
          </div>
        )}

        {/* 枚数インジケーター（複数枚のとき右上） */}
        {safeImages.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/40 text-white text-[11px] font-bold px-2 py-1 rounded-full backdrop-blur-sm">
            {active + 1} / {safeImages.length}
          </div>
        )}

        {/* 前後ナビ（複数枚のとき） */}
        {safeImages.length > 1 && (
          <>
            <button
              onClick={() => setActive(i => (i - 1 + safeImages.length) % safeImages.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center transition-all"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setActive(i => (i + 1) % safeImages.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center transition-all"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {/* ドットインジケーター */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
              {safeImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-2 h-2 rounded-full transition-all ${i === active ? 'bg-white scale-125' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* サムネイル */}
      {safeImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {safeImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                i === active ? 'border-sky-400 shadow-md' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

