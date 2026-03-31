'use client'

import { useState } from 'react'
import Link from 'next/link'

const ARTISTS = ['すべて', 'BTS', 'NewJeans', 'aespa', 'SEVENTEEN', 'IVE', 'Stray Kids', 'NCT', 'TWICE', 'LE SSERAFIM', 'EXO']

const DUMMY_POSTS = [
  {
    id: 'e1', artist: 'BTS', user: 'army_haruka', avatar: 'A',
    have: { title: 'RM フォトカード Indigo ver.', img: 'https://picsum.photos/seed/bts-rm-have/200/200' },
    want: { title: 'JIMIN フォトカード Face ver.', img: 'https://picsum.photos/seed/bts-jimin-want/200/200' },
    condition: '未開封', note: '状態は完璧です！トレカ交換歓迎', replies: 5, postedAt: '10分前', hot: true,
  },
  {
    id: 'e2', artist: 'NewJeans', user: 'nj_mina', avatar: 'N',
    have: { title: 'ハニ トレカ OMG ver.', img: 'https://picsum.photos/seed/nj-hani/200/200' },
    want: { title: 'ミンジ or ヘリン トレカ', img: 'https://picsum.photos/seed/nj-minji/200/200' },
    condition: '美品', note: 'ミンジ・ヘリンどちらでも！', replies: 3, postedAt: '25分前', hot: true,
  },
  {
    id: 'e3', artist: 'aespa', user: 'aespa_karina_fan', avatar: 'K',
    have: { title: 'カリナ アクリルスタンド', img: 'https://picsum.photos/seed/aespa-k/200/200' },
    want: { title: 'NingNing アクリルスタンド', img: 'https://picsum.photos/seed/aespa-n/200/200' },
    condition: '新品', note: '同シリーズでの交換希望です', replies: 2, postedAt: '1時間前', hot: false,
  },
  {
    id: 'e4', artist: 'SEVENTEEN', user: 'carat_jh', avatar: 'C',
    have: { title: 'ウジ 缶バッジ FML ver.', img: 'https://picsum.photos/seed/svt-wz/200/200' },
    want: { title: 'ホシ or ジョシュア缶バッジ', img: 'https://picsum.photos/seed/svt-hoshi/200/200' },
    condition: '良品', note: 'FML同シリーズ限定！よろしくお願いします🙏', replies: 7, postedAt: '2時間前', hot: false,
  },
  {
    id: 'e5', artist: 'IVE', user: 'dive_wonyoung', avatar: 'D',
    have: { title: 'ウォニョン タワレコ特典ポスター', img: 'https://picsum.photos/seed/ive-wy/200/200' },
    want: { title: 'レイ タワレコ特典ポスター', img: 'https://picsum.photos/seed/ive-rei/200/200' },
    condition: '未使用', note: '同タワレコ特典交換希望！', replies: 4, postedAt: '3時間前', hot: false,
  },
  {
    id: 'e6', artist: 'Stray Kids', user: 'stay_lino', avatar: 'S',
    have: { title: 'リノ フォトカード 5-STAR', img: 'https://picsum.photos/seed/skz-lino/200/200' },
    want: { title: 'バンチャン フォトカード', img: 'https://picsum.photos/seed/skz-bang/200/200' },
    condition: '新品', note: '5-STAR内での交換歓迎です！', replies: 6, postedAt: '5時間前', hot: false,
  },
]

const CONDITION_COLOR: Record<string, string> = {
  '未開封': 'bg-green-100 text-green-700',
  '未使用': 'bg-green-100 text-green-700',
  '新品':   'bg-green-100 text-green-700',
  '美品':   'bg-sky-100 text-sky-700',
  '良品':   'bg-blue-100 text-blue-700',
}

export default function ExchangeBoardPage() {
  const [selectedArtist, setSelectedArtist] = useState('すべて')
  const [showModal, setShowModal] = useState(false)
  const [haveText, setHaveText] = useState('')
  const [wantText, setWantText] = useState('')
  const [postNote, setPostNote] = useState('')

  const filtered = selectedArtist === 'すべて'
    ? DUMMY_POSTS
    : DUMMY_POSTS.filter(p => p.artist === selectedArtist)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/community"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-[#333333] flex items-center gap-2">
            <span className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-xs font-black px-2.5 py-1 rounded-full">K-POP</span>
            交換掲示板
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">持ってるグッズ ⇄ 欲しいグッズ を交換しよう！¥0</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex-shrink-0 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-black text-xs px-4 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-md flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          交換募集を投稿
        </button>
      </div>

      {/* 説明バナー */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 border border-pink-200 rounded-2xl px-5 py-4 mb-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-pink-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/>
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-[#333333]">持ってるグッズと欲しいグッズを交換するだけ <span className="text-pink-600">¥0！</span></p>
          <p className="text-xs text-gray-500 mt-0.5">「持ってる」と「欲しい」を投稿 → マッチしたら取引スタート</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-2xl font-black text-pink-500">¥0</p>
          <p className="text-[10px] text-gray-400">交換手数料</p>
        </div>
      </div>

      {/* アーティストフィルター */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-5">
        {ARTISTS.map(artist => (
          <button key={artist}
            onClick={() => setSelectedArtist(artist)}
            className={`flex-shrink-0 text-xs font-bold px-4 py-2 rounded-full border transition-all
              ${selectedArtist === artist
                ? 'bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white border-pink-500 shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:border-pink-300 hover:text-pink-500'}`}>
            {artist}
          </button>
        ))}
      </div>

      {/* 件数 */}
      <p className="text-xs text-gray-400 mb-4">
        {filtered.length}件の交換募集
        {selectedArtist !== 'すべて' && <span className="ml-1 text-pink-500 font-bold">#{selectedArtist}</span>}
      </p>

      {/* 投稿カード一覧 */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map(post => (
          <div key={post.id}
            className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-pink-200 hover:shadow-md transition-all group">

            {/* ヘッダー */}
            <div className="px-4 pt-4 pb-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500
                              flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                {post.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-[#333333]">@{post.user}</p>
              </div>
              <span className="text-[11px] font-bold bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">
                {post.artist}
              </span>
              {post.hot && (
                <span className="text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded-full">🔥HOT</span>
              )}
            </div>

            {/* 交換画像 */}
            <div className="px-4 py-2 flex items-center gap-3">
              {/* 持ってる */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 mb-1 font-medium">📦 持ってる</p>
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.have.img} alt={post.have.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                </div>
                <p className="text-[11px] text-[#333333] font-medium leading-tight line-clamp-2">{post.have.title}</p>
                <span className={`inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${CONDITION_COLOR[post.condition] ?? 'bg-gray-100 text-gray-500'}`}>
                  {post.condition}
                </span>
              </div>

              {/* 矢印 */}
              <div className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 to-fuchsia-400 flex items-center justify-center shadow-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/>
                  </svg>
                </div>
                <span className="text-[9px] text-pink-500 font-black">¥0</span>
              </div>

              {/* 欲しい */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 mb-1 font-medium">✨ 欲しい</p>
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 border-2 border-dashed border-pink-200 mb-1.5 flex items-center justify-center relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={post.want.img} alt={post.want.title}
                    className="w-full h-full object-cover opacity-70"/>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] text-pink-600 font-black bg-white/80 px-1.5 py-0.5 rounded-full">希望</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#333333] font-medium leading-tight line-clamp-2">{post.want.title}</p>
              </div>
            </div>

            {/* ノート・フッター */}
            {post.note && (
              <div className="mx-4 mb-3 bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-[11px] text-gray-500">{post.note}</p>
              </div>
            )}
            <div className="px-4 pb-4 flex items-center justify-between gap-3">
              <span className="text-[11px] text-gray-400">{post.postedAt}</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">返信 {post.replies}</span>
                <Link href={`/listings/${post.id}`}
                  className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-black text-xs px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity shadow-sm">
                  交換を申し込む
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 投稿モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#333333]">交換募集を投稿</h3>
              <button onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="bg-pink-50 border border-pink-100 rounded-xl p-3 text-xs text-pink-700 font-medium">
              ※ 出品済みのグッズが交換申請のベースになります。先に出品してからここで告知してください。
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                📦 持ってるグッズ（交換に出すもの）
              </label>
              <textarea value={haveText} onChange={e => setHaveText(e.target.value)}
                rows={2} placeholder="例：BTS RM フォトカード Indigo ver. 未開封"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-300"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">
                ✨ 欲しいグッズ（交換で受け取りたいもの）
              </label>
              <textarea value={wantText} onChange={e => setWantText(e.target.value)}
                rows={2} placeholder="例：BTS JIMIN フォトカード Face ver."
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-300"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">一言メモ（任意）</label>
              <input value={postNote} onChange={e => setPostNote(e.target.value)}
                placeholder="例：同シリーズ内での交換大歓迎！"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"/>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50">
                キャンセル
              </button>
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-black rounded-xl text-sm hover:opacity-90 shadow-md">
                投稿する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



