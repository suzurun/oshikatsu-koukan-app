'use client'

import { useState } from 'react'
import Link from 'next/link'

const TABS = ['すべて', 'K-POP', 'J-POP', 'アイドル', 'アニメ', 'VTuber']

const DUMMY_POSTS = [
  {
    id: 'p1', user: 'army_haruka', avatar: 'A', avatarColor: 'from-pink-400 to-rose-500',
    tag: 'K-POP', artist: 'BTS', time: '5分前',
    text: 'BTSのRM、Indigoフォトカード余ってる方いませんか？Jimのやつと交換したいです！',
    imgs: ['https://picsum.photos/seed/bts-rm-tl/400/400'],
    isExchange: true, likes: 12, replies: 5,
    wantFor: 'JIMIN フォトカード希望',
  },
  {
    id: 'p2', user: 'nj_minlover', avatar: 'N', avatarColor: 'from-sky-400 to-blue-500',
    tag: 'K-POP', artist: 'NewJeans', time: '12分前',
    text: 'NewJeans の新曲OMG、本当に神すぎた…ハニちゃんのトレカ引いたけどミンジ推しなので交換希望です😭',
    imgs: ['https://picsum.photos/seed/nj-hani-tl/400/400'],
    isExchange: true, likes: 34, replies: 8,
    wantFor: 'ミンジ トレカ希望',
  },
  {
    id: 'p3', user: 'aespa_forever', avatar: 'K', avatarColor: 'from-violet-400 to-purple-500',
    tag: 'K-POP', artist: 'aespa', time: '30分前',
    text: 'aespaのカリナちゃん本当に可愛すぎる〜！昨日届いたアクスタめちゃくちゃ良かった✨',
    imgs: ['https://picsum.photos/seed/aespa-k-tl/400/400'],
    isExchange: false, likes: 48, replies: 11, wantFor: '',
  },
  {
    id: 'p4', user: 'stay_rino', avatar: 'S', avatarColor: 'from-amber-400 to-orange-500',
    tag: 'K-POP', artist: 'Stray Kids', time: '1時間前',
    text: 'SKZのリノさん5-STARフォトカード持ってます！バンちゃんのやつと交換できる方連絡ください🙏',
    imgs: ['https://picsum.photos/seed/skz-lino-tl/400/400'],
    isExchange: true, likes: 9, replies: 3,
    wantFor: 'バンチャン フォトカード',
  },
  {
    id: 'p5', user: 'nogifan46', avatar: 'M', avatarColor: 'from-indigo-400 to-blue-500',
    tag: 'J-POP', artist: '乃木坂46', time: '2時間前',
    text: '乃木坂の33rdシングル、特典券2枚余ってます。どなたか交換or譲渡しませんか？',
    imgs: [],
    isExchange: true, likes: 7, replies: 2,
    wantFor: '他シングル特典希望',
  },
  {
    id: 'p6', user: 'holo_fan', avatar: 'H', avatarColor: 'from-teal-400 to-cyan-500',
    tag: 'VTuber', artist: 'ホロライブ', time: '3時間前',
    text: 'ホロライブの新グッズ来たけどやっぱり推しの缶バッジだけ欲しいんだよな〜😅交換相談乗ります！',
    imgs: ['https://picsum.photos/seed/holo-tl/400/400'],
    isExchange: false, likes: 22, replies: 6, wantFor: '',
  },
]

export default function TimelinePage() {
  const [activeTab, setActiveTab] = useState('すべて')
  const [postText, setPostText] = useState('')
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  const filtered = activeTab === 'すべて' ? DUMMY_POSTS : DUMMY_POSTS.filter(p => p.tag === activeTab)

  const toggleLike = (id: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/community"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-black text-[#333333]">タイムライン</h1>
          <p className="text-xs text-gray-400 mt-0.5">推し仲間の最新投稿</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href="/community/exchange-board"
            className="text-xs font-bold bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity">
            交換掲示板
          </Link>
        </div>
      </div>

      {/* 投稿ボックス */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5 shadow-sm">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-pink-400 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
            あ
          </div>
          <div className="flex-1">
            <textarea
              value={postText}
              onChange={e => setPostText(e.target.value)}
              placeholder="推しのこと、グッズ交換のこと、なんでも投稿しよう…"
              rows={2}
              className="w-full resize-none text-sm text-[#333333] placeholder-gray-400 focus:outline-none leading-relaxed"
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <div className="flex gap-3">
                <button className="flex items-center gap-1 text-gray-400 hover:text-sky-500 transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z"/>
                  </svg>
                  <span className="text-xs">画像</span>
                </button>
                <button className="flex items-center gap-1 text-gray-400 hover:text-pink-500 transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/>
                  </svg>
                  <span className="text-xs">交換募集</span>
                </button>
              </div>
              <button
                disabled={!postText.trim()}
                className="bg-gradient-to-r from-sky-400 to-blue-500 text-white font-black text-xs px-5 py-2 rounded-full hover:opacity-90 disabled:opacity-40 transition-opacity shadow-sm">
                投稿
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide mb-5">
        {TABS.map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all
              ${activeTab === tab
                ? 'bg-gradient-to-r from-sky-400 to-blue-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* 投稿フィード */}
      <div className="space-y-4">
        {filtered.map(post => (
          <div key={post.id} className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-sky-100 hover:shadow-sm transition-all">
            <div className="flex gap-3">
              {/* アバター */}
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${post.avatarColor} flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
                {post.avatar}
              </div>

              <div className="flex-1 min-w-0">
                {/* ユーザー・時刻 */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-[#333333]">@{post.user}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                    ${post.tag === 'K-POP' ? 'bg-pink-100 text-pink-600' :
                      post.tag === 'J-POP' ? 'bg-sky-100 text-sky-600' :
                      post.tag === 'VTuber' ? 'bg-teal-100 text-teal-600' :
                      'bg-gray-100 text-gray-500'}`}>
                    {post.artist}
                  </span>
                  {post.isExchange && (
                    <span className="text-[10px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">
                      🔄 交換希望
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{post.time}</span>
                </div>

                {/* テキスト */}
                <p className="text-sm text-[#333333] leading-relaxed mb-2">{post.text}</p>

                {/* 交換希望表示 */}
                {post.isExchange && post.wantFor && (
                  <div className="bg-pink-50 border border-pink-100 rounded-xl px-3 py-2 mb-2 flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-pink-500 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/>
                    </svg>
                    <p className="text-xs text-pink-700 font-medium">{post.wantFor}</p>
                  </div>
                )}

                {/* 画像 */}
                {post.imgs.length > 0 && (
                  <div className="rounded-xl overflow-hidden mb-2 max-w-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.imgs[0]} alt="" className="w-full object-cover max-h-48"/>
                  </div>
                )}

                {/* アクション */}
                <div className="flex items-center gap-4 mt-1">
                  <button onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-xs transition-colors ${likedPosts.has(post.id) ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'}`}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill={likedPosts.has(post.id) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                    </svg>
                    {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-sky-500 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
                    </svg>
                    {post.replies}
                  </button>
                  {post.isExchange && (
                    <Link href="/community/exchange-board"
                      className="ml-auto text-xs bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-black px-3 py-1 rounded-full hover:opacity-90 transition-opacity">
                      交換する
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}



