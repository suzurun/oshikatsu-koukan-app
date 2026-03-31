'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ─── ダミー：通常投稿 ─── */
const POSTS = [
  { id: 1,  user: 'haruka_fan',   avatar: 'https://picsum.photos/seed/u1/40/40',  time: '5分前',    likes: 142, replies: 38, tag: '交換',  content: '今日のコンサート最高だった！フォトカード交換できる方いたら声かけてください🙏 RM→ジン希望', img: 'https://picsum.photos/seed/c_post1/400/300' },
  { id: 2,  user: 'star_lover99',  avatar: 'https://picsum.photos/seed/u2/40/40',  time: '23分前',   likes: 89,  replies: 21, tag: '報告',  content: 'ポップアップストアで限定グッズゲット🎉 激レアアイテムなので大切にします💕',                      img: 'https://picsum.photos/seed/c_post2/400/300' },
  { id: 3,  user: 'momo_loves',    avatar: 'https://picsum.photos/seed/u3/40/40',  time: '1時間前',  likes: 203, replies: 54, tag: 'オフ会', content: '来月の東京公演、現地交換しませんか？渋谷エリアで待ち合わせできます✨',                            img: null },
  { id: 4,  user: 'pinkstar_yui',  avatar: 'https://picsum.photos/seed/u4/40/40',  time: '2時間前',  likes: 67,  replies: 15, tag: '交換',  content: 'アクスタ2種類持ってます。どちらかと交換してくれる方いたら🙏 状態はほぼ新品です！',              img: 'https://picsum.photos/seed/c_post4/400/300' },
  { id: 5,  user: 'nana_oshi',     avatar: 'https://picsum.photos/seed/u5/40/40',  time: '3時間前',  likes: 51,  replies: 12, tag: 'レポ',  content: '昨日のライブレポまとめました！セトリや演出について語り合いましょう🎵',                            img: null },
  { id: 6,  user: 'blue_dream7',   avatar: 'https://picsum.photos/seed/u6/40/40',  time: '5時間前',  likes: 78,  replies: 19, tag: '出品',  content: '未使用フォトカードセット出品します！AI鑑定済みで安心。詳細はDMまで💌',                          img: 'https://picsum.photos/seed/c_post6/400/300' },
]

/* ─── ダミー：交換募集 ─── */
const EXCHANGES = [
  {
    id: 1, user: 'army_hana',    avatar: 'https://picsum.photos/seed/eu1/40/40', time: '10分前',   condition: '未開封',
    have: { label: 'RM フォトカード ver.A',    img: 'https://picsum.photos/seed/ex1a/300/300' },
    want: { label: 'JIN フォトカード ver.B',   img: 'https://picsum.photos/seed/ex1b/300/300' },
  },
  {
    id: 2, user: 'blink_sora',   avatar: 'https://picsum.photos/seed/eu2/40/40', time: '34分前',   condition: '美品',
    have: { label: 'JIMIN アクリルスタンド',    img: 'https://picsum.photos/seed/ex2a/300/300' },
    want: { label: 'V アクリルスタンド',        img: 'https://picsum.photos/seed/ex2b/300/300' },
  },
  {
    id: 3, user: 'purple_yume',  avatar: 'https://picsum.photos/seed/eu3/40/40', time: '1時間前',  condition: '新品',
    have: { label: 'j-hope うちわ 2023ver.',   img: 'https://picsum.photos/seed/ex3a/300/300' },
    want: { label: 'JUNGKOOK うちわ 2023ver.', img: 'https://picsum.photos/seed/ex3b/300/300' },
  },
  {
    id: 4, user: 'suga_fan07',   avatar: 'https://picsum.photos/seed/eu4/40/40', time: '3時間前',  condition: '良好',
    have: { label: 'SUGA 缶バッジ セット',     img: 'https://picsum.photos/seed/ex4a/300/300' },
    want: { label: 'RM 缶バッジ セット',       img: 'https://picsum.photos/seed/ex4b/300/300' },
  },
]

/* ─── ダミー：イベント ─── */
const EVENTS = [
  {
    id: 1, title: 'ARMY 東京オフ会 ～トレカ交換＆推し語り～',
    date: '2026/03/08 14:00', place: '渋谷カフェ・スペース SHIBUYA',
    capacity: 20, joined: 17, organizer: 'army_haruka',
    tags: ['交換あり', '初心者歓迎'], tagColors: ['bg-sky-100 text-sky-600', 'bg-green-100 text-green-600'],
    img: 'https://picsum.photos/seed/ev1/600/200',
  },
  {
    id: 2, title: 'BTSグッズ鑑定会 ＆ ミニ交換会',
    date: '2026/03/15 13:00', place: '新宿区民センター 第3会議室',
    capacity: 30, joined: 22, organizer: 'bts_nerd_jp',
    tags: ['AI鑑定あり', '事前登録制'], tagColors: ['bg-violet-100 text-violet-600', 'bg-amber-100 text-amber-600'],
    img: 'https://picsum.photos/seed/ev2/600/200',
  },
  {
    id: 3, title: 'ARMY 大阪オフ会 春の推し活祭り🌸',
    date: '2026/04/03 13:30', place: '大阪梅田 コラボカフェ',
    capacity: 40, joined: 12, organizer: 'osaka_army',
    tags: ['初心者歓迎', '関西限定'], tagColors: ['bg-green-100 text-green-600', 'bg-rose-100 text-rose-600'],
    img: 'https://picsum.photos/seed/ev3/600/200',
  },
]

/* ─── ダミー：メンバー ─── */
const MEMBERS = [
  { id: 1,  name: 'haruka_army',   avatar: 'https://picsum.photos/seed/m1/60/60',  role: '管理人',   badge: '認証済み', trades: 48, joined: '2023/04' },
  { id: 2,  name: 'army_hana',     avatar: 'https://picsum.photos/seed/m2/60/60',  role: 'モデレーター', badge: '認証済み', trades: 32, joined: '2023/07' },
  { id: 3,  name: 'purple_yume',   avatar: 'https://picsum.photos/seed/m3/60/60',  role: 'メンバー', badge: '認証済み', trades: 21, joined: '2023/09' },
  { id: 4,  name: 'suga_fan07',    avatar: 'https://picsum.photos/seed/m4/60/60',  role: 'メンバー', badge: null,      trades: 15, joined: '2024/01' },
  { id: 5,  name: 'bts_nerd_jp',   avatar: 'https://picsum.photos/seed/m5/60/60',  role: 'メンバー', badge: '認証済み', trades: 63, joined: '2022/12' },
  { id: 6,  name: 'star_lover99',  avatar: 'https://picsum.photos/seed/m6/60/60',  role: 'メンバー', badge: null,      trades: 8,  joined: '2024/03' },
  { id: 7,  name: 'momo_loves',    avatar: 'https://picsum.photos/seed/m7/60/60',  role: 'メンバー', badge: '認証済み', trades: 19, joined: '2023/11' },
  { id: 8,  name: 'pinkstar_yui',  avatar: 'https://picsum.photos/seed/m8/60/60',  role: 'メンバー', badge: null,      trades: 5,  joined: '2024/05' },
]

const TAG_COLORS: Record<string, string> = {
  '交換':  'bg-sky-100 text-sky-600',
  '報告':  'bg-rose-100 text-rose-600',
  'オフ会':'bg-orange-100 text-orange-600',
  'レポ':  'bg-green-100 text-green-600',
  '出品':  'bg-violet-100 text-violet-600',
}

const TABS = ['ルーム投稿', '交換募集', 'オフ会・イベント', 'メンバー'] as const
type Tab = typeof TABS[number]


interface Props {
  slug: string
  communityName: string
  communityColor: string
  relatedCommunities: { slug: string; name: string; img: string; color: string; members: number }[]
}

export default function CommunityRoom({ slug, communityName, communityColor, relatedCommunities }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('ルーム投稿')

  return (
    <div>
      {/* ─── タブバー ─── */}
      <div className="flex gap-0 border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${activeTab === tab
                ? 'border-violet-500 text-violet-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab}
            {tab === '交換募集'      && <span className="ml-1.5 text-[10px] bg-sky-100 text-sky-600 font-bold px-1.5 py-0.5 rounded-full">{EXCHANGES.length}</span>}
            {tab === 'オフ会・イベント' && <span className="ml-1.5 text-[10px] bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded-full">{EVENTS.length}</span>}
          </button>
        ))}
      </div>

      {/* ─── メインコンテンツ ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10">

        {/* 左：タブコンテンツ */}
        <div className="md:col-span-2 space-y-4">

          {/* ── ルーム投稿タブ ── */}
          {activeTab === 'ルーム投稿' && (
            <>
              {/* ようこそメッセージ */}
              <div className={`bg-gradient-to-r ${communityColor} rounded-2xl px-4 py-3 flex items-center gap-3`}>
                <span className="text-2xl">🚪</span>
                <div>
                  <p className="text-white font-bold text-sm">{communityName} 部屋へようこそ！</p>
                  <p className="text-white/70 text-xs">推し仲間と自由に語り合おう✨</p>
                </div>
              </div>

              {/* 投稿ボックス */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex-shrink-0" />
                  <input type="text" placeholder={`${communityName} 部屋に投稿する...`} readOnly
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-violet-300 cursor-pointer" />
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                  <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-500 px-2 py-1 rounded-lg hover:bg-violet-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    画像
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-violet-500 px-2 py-1 rounded-lg hover:bg-violet-50 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    タグ
                  </button>
                  <button className={`ml-auto bg-gradient-to-r ${communityColor} text-white text-xs font-bold px-4 py-1.5 rounded-full`}>
                    投稿する
                  </button>
                </div>
              </div>

              {/* 投稿一覧 */}
              {POSTS.map(post => (
                <div key={post.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.avatar} alt={post.user} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-gray-800">@{post.user}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TAG_COLORS[post.tag] ?? 'bg-gray-100 text-gray-500'}`}>
                          {post.tag}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{post.time}</p>
                    </div>
                  </div>
                  {post.img ? (
                    <div className="flex items-start gap-3 mb-3">
                      <p className="flex-1 text-sm text-gray-700 leading-relaxed">{post.content}</p>
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.img} alt="post" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">{post.content}</p>
                  )}
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
                    <button className="flex items-center gap-1.5 text-gray-400 hover:text-rose-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="text-xs">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-gray-400 hover:text-violet-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-xs">{post.replies}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-gray-400 hover:text-sky-500 transition-colors ml-auto">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span className="text-xs">シェア</span>
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── 交換募集タブ ── */}
          {activeTab === '交換募集' && (
            <>
              <div className="bg-sky-50 border border-sky-100 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-sky-700">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                交換はアプリ内メッセージ経由で行ってください。直接連絡はトラブルの原因になります。
              </div>

              {EXCHANGES.map(ex => (
                <div key={ex.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                  {/* ヘッダー */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ex.avatar} alt={ex.user} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-800">@{ex.user}</p>
                      <p className="text-xs text-gray-400">{ex.time}</p>
                    </div>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">状態：{ex.condition}</span>
                  </div>

                  {/* 2枚並べ */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 rounded-xl overflow-hidden bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ex.have.img} alt={ex.have.label} className="w-full aspect-square object-cover" />
                      <div className="px-2 py-1.5 text-center">
                        <p className="text-[10px] text-gray-400 font-medium">持ってる</p>
                        <p className="text-xs font-bold text-gray-700 leading-tight">{ex.have.label}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <svg className="w-7 h-7 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0-4-4m4 4-4 4m0 6H4m0 0 4 4m-4-4 4-4" />
                      </svg>
                      <span className="text-[9px] text-sky-500 font-bold">交換</span>
                    </div>
                    <div className="flex-1 rounded-xl overflow-hidden bg-sky-50 border border-sky-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ex.want.img} alt={ex.want.label} className="w-full aspect-square object-cover opacity-80" />
                      <div className="px-2 py-1.5 text-center">
                        <p className="text-[10px] text-sky-500 font-medium">欲しい</p>
                        <p className="text-xs font-bold text-gray-700 leading-tight">{ex.want.label}</p>
                      </div>
                    </div>
                  </div>

                  {/* アクション */}
                  <button className="w-full bg-gradient-to-r from-sky-400 to-blue-500 text-white text-sm font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                    交換を申し込む
                  </button>
                </div>
              ))}
            </>
          )}

          {/* ── オフ会・イベントタブ ── */}
          {activeTab === 'オフ会・イベント' && (
            <>
              <button className={`w-full bg-gradient-to-r ${communityColor} text-white text-sm font-bold py-3 rounded-2xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                イベントを企画する
              </button>

              {EVENTS.map(ev => (
                <div key={ev.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
                  {/* バナー画像 */}
                  <div className="h-32 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ev.img} alt={ev.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    {/* タグ */}
                    <div className="flex gap-1.5 mb-2 flex-wrap">
                      {ev.tags.map((tag, i) => (
                        <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ev.tagColors[i]}`}>{tag}</span>
                      ))}
                    </div>
                    <h3 className="text-base font-bold text-gray-800 mb-2">{ev.title}</h3>
                    <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {ev.date}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {ev.place}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{ev.joined} / {ev.capacity}名 参加予定</span>
                        {/* 残り人数バー */}
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 ml-1">
                          <div className="bg-sky-400 h-1.5 rounded-full" style={{ width: `${(ev.joined / ev.capacity) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className={`flex-1 bg-gradient-to-r ${communityColor} text-white text-sm font-bold py-2.5 rounded-xl hover:opacity-90 transition-opacity`}>
                        参加する
                      </button>
                      <button className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                        詳細
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── メンバータブ ── */}
          {activeTab === 'メンバー' && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-700">メンバー一覧</p>
                <p className="text-xs text-gray-400">全 {MEMBERS.length}名（ダミー）</p>
              </div>
              <div className="divide-y divide-gray-50">
                {MEMBERS.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-800">@{m.name}</p>
                        {m.badge && (
                          <span className="text-[10px] bg-sky-100 text-sky-600 font-bold px-1.5 py-0.5 rounded-full">
                            {m.badge}
                          </span>
                        )}
                        {m.role !== 'メンバー' && (
                          <span className="text-[10px] bg-violet-100 text-violet-600 font-bold px-1.5 py-0.5 rounded-full">
                            {m.role}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">取引 {m.trades}件 · {m.joined}〜</p>
                    </div>
                    <button className="text-xs text-violet-500 hover:text-violet-700 font-medium px-3 py-1.5 border border-violet-200 rounded-full hover:bg-violet-50 transition-colors flex-shrink-0">
                      フォロー
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── サイドバー ─── */}
        <div className="space-y-4">
          {/* コミュニティルール */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3">🏠 部屋のルール</h3>
            <ol className="space-y-2 text-xs text-gray-600">
              {['お互いをリスペクトしよう', 'スパムや宣伝はNG', '交換は必ずアプリ経由で', 'グッズの真偽を偽らない', '楽しく推し活しよう！'].map((rule, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-bold text-violet-500 flex-shrink-0">{i + 1}.</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* クイックナビ */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3">🚪 この部屋でできること</h3>
            <div className="space-y-2">
              <button onClick={() => setActiveTab('交換募集')}
                className="w-full flex items-center gap-2 text-sm text-left px-3 py-2 rounded-xl hover:bg-sky-50 text-sky-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0-4-4m4 4-4 4m0 6H4m0 0 4 4m-4-4 4-4" />
                </svg>
                交換募集を見る ({EXCHANGES.length}件)
              </button>
              <button onClick={() => setActiveTab('オフ会・イベント')}
                className="w-full flex items-center gap-2 text-sm text-left px-3 py-2 rounded-xl hover:bg-orange-50 text-orange-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                オフ会・イベント ({EVENTS.length}件)
              </button>
              <button onClick={() => setActiveTab('メンバー')}
                className="w-full flex items-center gap-2 text-sm text-left px-3 py-2 rounded-xl hover:bg-violet-50 text-violet-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                部屋のメンバー ({MEMBERS.length}名)
              </button>
            </div>
          </div>

          {/* 関連コミュニティ */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3">🔗 他の部屋も見る</h3>
            <div className="space-y-2">
              {relatedCommunities.map(c => (
                <Link key={c.slug} href={`/community/${c.slug}`}
                  className="flex items-center gap-2 hover:bg-gray-50 rounded-xl p-1.5 transition-colors">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.color} overflow-hidden flex-shrink-0`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.img} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-800">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.members.toLocaleString()}人</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

