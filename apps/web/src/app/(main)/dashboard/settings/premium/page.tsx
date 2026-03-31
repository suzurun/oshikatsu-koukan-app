'use client'

import { useState } from 'react'
import Link from 'next/link'

const PLANS = [
  {
    id: 'monthly',
    label: 'ベーシック',
    price: 385,
    unit: '月',
    badge: null,
    features: [
      'AI相場アラート（無制限）',
      '出品数無制限',
      'フィード優先表示',
      'コミュニティ入室無制限',
    ],
  },
  {
    id: 'yearly',
    label: 'プレミアム年間',
    price: 3850,
    unit: '年',
    badge: '2ヶ月分お得',
    features: [
      'ベーシックの全機能',
      'AI真贋判定 優先審査',
      '限定バッジ表示',
      '手数料 2% → 1% に割引',
      '専用サポート対応',
    ],
  },
]

export default function PremiumPage() {
  const [selected, setSelected] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/settings"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-black text-[#333333]">プレミアム会員</h1>
          <p className="text-xs text-gray-400">より快適な推し活取引体験を</p>
        </div>
      </div>

      {/* ヒーロー */}
      <div className="relative bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-3xl p-6 mb-6 overflow-hidden text-center">
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none"/>
        <div className="absolute bottom-0 -left-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none"/>
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21L12 17.27z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-1">プレミアム会員</h2>
          <p className="text-white/80 text-sm">推し活マーケットをもっと便利に、もっとお得に</p>
        </div>
      </div>

      {/* プラン選択 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {PLANS.map(plan => (
          <button
            key={plan.id}
            onClick={() => setSelected(plan.id as 'monthly' | 'yearly')}
            className={`relative text-left p-4 rounded-2xl border-2 transition-all
              ${selected === plan.id
                ? 'border-violet-400 bg-violet-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-violet-200'}`}
          >
            {plan.badge && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] bg-rose-400 text-white font-black px-2.5 py-0.5 rounded-full whitespace-nowrap">
                {plan.badge}
              </span>
            )}
            <p className="text-xs font-bold text-gray-500 mb-1">{plan.label}</p>
            <p className="text-2xl font-black text-[#333333]">
              ¥{plan.price.toLocaleString()}
              <span className="text-xs font-normal text-gray-400">/{plan.unit}</span>
            </p>
            {selected === plan.id && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 機能一覧 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h3 className="text-sm font-bold text-gray-700 mb-3">
          {PLANS.find(p => p.id === selected)?.label} の特典
        </h3>
        <ul className="space-y-2.5">
          {PLANS.find(p => p.id === selected)?.features.map(f => (
            <li key={f} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <span className="text-sm text-[#333333]">{f}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 比較表 */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-6">
        <div className="grid grid-cols-3 bg-gray-50 text-center text-xs font-bold text-gray-400 px-4 py-2.5 border-b border-gray-100">
          <span className="text-left">機能</span>
          <span>無料</span>
          <span className="text-violet-600">プレミアム</span>
        </div>
        {[
          { label: '出品数',              free: '月5件',   premium: '無制限' },
          { label: 'AI相場アラート',       free: '月3回',   premium: '無制限' },
          { label: '取引手数料',           free: '2%',      premium: '1%' },
          { label: 'コミュニティ入室',      free: '月10回',  premium: '無制限' },
          { label: 'フィード優先表示',      free: '×',       premium: '○' },
          { label: 'AI真贋判定 優先審査',   free: '×',       premium: '○' },
        ].map((row, i) => (
          <div key={i} className="grid grid-cols-3 text-center text-xs px-4 py-3 border-b border-gray-50 last:border-0">
            <span className="text-left text-gray-600 font-medium">{row.label}</span>
            <span className="text-gray-400">{row.free}</span>
            <span className={`font-bold ${row.premium === '×' ? 'text-gray-300' : 'text-violet-600'}`}>{row.premium}</span>
          </div>
        ))}
      </div>

      {/* 支払いボタン（Stripe想定） */}
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 text-center mb-4">
        <p className="text-sm text-gray-500">Stripe決済フォーム</p>
        <p className="text-xs text-gray-400 mt-1">（本番環境ではStripe Elementsが表示されます）</p>
      </div>

      <button
        className="w-full bg-gradient-to-r from-violet-500 to-pink-500 hover:opacity-90 text-white font-black py-4 rounded-xl text-sm shadow-lg transition-opacity"
        onClick={() => alert('本番環境ではStripe決済が開始されます')}
      >
        {selected === 'monthly' ? '月額 ¥385 で始める' : '年額 ¥3,850 で始める（2ヶ月分お得！）'}
      </button>

      <p className="text-center text-[11px] text-gray-400 mt-3">
        いつでもキャンセル可能・日割り返金なし・自動更新
      </p>
    </div>
  )
}



