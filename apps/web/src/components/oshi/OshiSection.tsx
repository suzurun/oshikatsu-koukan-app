'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

/* ── アーティスト別ダミーデータ ── */
const ARTIST_DUMMY: Record<string, {
  goods: { id: string; title: string; price: number | null; exchange: boolean; img: string; condition: string; badge?: string }[]
  community: { user: string; avatar: string; text: string; likes: number; replies: number; time: string }[]
  events: { id: string; title: string; date: string; place: string; capacity: number; joined: number; organizer: string; tag: string; tagColor: string }[]
}> = {
  bts: {
    goods: [
      { id: 'b1', title: 'BTS RM ソロ「Indigo」ポップアップ 限定フォトカード',     price: 3500, exchange: false, img: 'https://picsum.photos/seed/bts-rm/300/300',   condition: '未使用に近い', badge: '超希少' },
      { id: 'b2', title: 'BTS JIMIN フォトカード SET ME FREE ver.',              price: null, exchange: true,  img: 'https://picsum.photos/seed/bts-jimin/300/300', condition: '新品',         badge: '交換希望' },
      { id: 'b3', title: 'BTS V 「Layover」タワーレコード 特典ポスター',          price: 2800, exchange: false, img: 'https://picsum.photos/seed/bts-v/300/300',     condition: '良好' },
      { id: 'b4', title: 'BTS JUNG KOOK Golden アルバム トレカ ランダム1枚',      price: 1500, exchange: false, img: 'https://picsum.photos/seed/bts-jk/300/300',    condition: '新品' },
      { id: 'b5', title: 'BTS SUGA Agust D ツアー 缶バッジ セット',              price: 4200, exchange: false, img: 'https://picsum.photos/seed/bts-suga/300/300',  condition: '新品',         badge: '希少' },
      { id: 'b6', title: 'BTS Permission to Dance on Stage うちわ J-HOPE',       price: 2000, exchange: true,  img: 'https://picsum.photos/seed/bts-jhope/300/300', condition: '良好',         badge: '交換希望' },
    ],
    community: [
      { user: 'army_haruka',  avatar: 'https://picsum.photos/seed/u1/60/60', text: 'JIMINのSet Me Free PTオリカ探してます！RMとV持ってるので交換できる方DM🙏', likes: 34, replies: 12, time: '10分前' },
      { user: 'bts_mochi22',  avatar: 'https://picsum.photos/seed/u2/60/60', text: '昨日やっとIndigo完全版ゲット！フォトカード神すぎる🥺💜 #BTS #RM',        likes: 89, replies: 5,  time: '1時間前' },
      { user: 'purple_yume',  avatar: 'https://picsum.photos/seed/u3/60/60', text: 'Golden トレカ20枚開けたのにJKが1枚も出なかった…誰か交換してください😭',  likes: 52, replies: 28, time: '3時間前' },
      { user: 'taehyung_jp',  avatar: 'https://picsum.photos/seed/u4/60/60', text: 'Layoverのポスター余ってます！送料のみで差し上げます💜欲しい方コメントを', likes: 103,replies: 41, time: '5時間前' },
    ],
    events: [
      { id: 'e1', title: 'BTS ARMY 東京オフ会 ～トレカ交換＆推し語り～',   date: '2026/03/08 14:00', place: '渋谷カフェ・スペース',  capacity: 20, joined: 17, organizer: 'army_haruka',  tag: '交換あり', tagColor: 'bg-sky-100 text-sky-600' },
      { id: 'e2', title: 'RM「Indigo」リリース記念 ARMYお茶会',             date: '2026/03/15 13:00', place: '新宿 会議室B',        capacity: 15, joined: 15, organizer: 'purple_yume',   tag: '満員',     tagColor: 'bg-rose-100 text-rose-500' },
      { id: 'e3', title: 'Golden発売記念 JK推しオフ会 大阪',               date: '2026/03/22 16:00', place: '梅田カフェ',           capacity: 30, joined: 11, organizer: 'bts_mochi22',   tag: '参加受付中', tagColor: 'bg-green-100 text-green-600' },
    ],
  },
}

function getArtistDummy(artistId: string) {
  return ARTIST_DUMMY[artistId] ?? {
    goods: [
      { id: 'g1', title: `${artistId} フォトカード 限定ver.`,   price: 2500, exchange: false, img: `https://picsum.photos/seed/${artistId}g1/300/300`, condition: '新品',         badge: '希少' },
      { id: 'g2', title: `${artistId} 缶バッジ ツアーグッズ`,   price: 1800, exchange: false, img: `https://picsum.photos/seed/${artistId}g2/300/300`, condition: '未使用に近い' },
      { id: 'g3', title: `${artistId} トレカ 交換希望`,         price: null, exchange: true,  img: `https://picsum.photos/seed/${artistId}g3/300/300`, condition: '新品',         badge: '交換希望' },
      { id: 'g4', title: `${artistId} うちわ コンサートグッズ`, price: 2000, exchange: false, img: `https://picsum.photos/seed/${artistId}g4/300/300`, condition: '良好' },
    ],
    community: [
      { user: 'fan_user1', avatar: `https://picsum.photos/seed/${artistId}u1/60/60`, text: `${artistId}のグッズ交換できる方募集中！DMください🙏`,  likes: 21, replies: 8, time: '30分前' },
      { user: 'fan_user2', avatar: `https://picsum.photos/seed/${artistId}u2/60/60`, text: `${artistId}のコンサート最高でした！トレカ交換しましょう✨`, likes: 45, replies: 3, time: '2時間前' },
    ],
    events: [
      { id: 'ev1', title: `${artistId} ファンオフ会 ～グッズ交換＆トーク～`,  date: '2026/03/20 14:00', place: '東京 渋谷カフェ',  capacity: 20, joined: 8,  organizer: 'fan_user1', tag: '参加受付中', tagColor: 'bg-green-100 text-green-600' },
      { id: 'ev2', title: `${artistId} 推し語りお茶会`,                       date: '2026/04/10 13:00', place: '大阪 梅田',        capacity: 15, joined: 5,  organizer: 'fan_user2', tag: '参加受付中', tagColor: 'bg-green-100 text-green-600' },
    ],
  }
}

/* ── 今熱いコミュニティ（未設定時用） ── */
const HOT_COMMUNITIES = [
  { slug: 'bts',        name: 'BTS',        img: 'https://picsum.photos/seed/bts_comm/160/160',   color: 'from-purple-500 to-indigo-500',  members: 12480, heatScore: 98,  posts: '3,241件' },
  { slug: 'blackpink',  name: 'BLACKPINK',  img: 'https://picsum.photos/seed/bp_comm/160/160',    color: 'from-pink-500 to-rose-500',      members: 15300, heatScore: 96,  posts: '4,520件' },
  { slug: 'newjeans',   name: 'NewJeans',   img: 'https://picsum.photos/seed/nj_comm/160/160',    color: 'from-sky-400 to-blue-500',       members: 8920,  heatScore: 94,  posts: '2,108件' },
  { slug: 'aespa',      name: 'aespa',      img: 'https://picsum.photos/seed/aespa_comm/160/160', color: 'from-cyan-400 to-teal-500',      members: 7630,  heatScore: 91,  posts: '2,011件' },
  { slug: 'nogizaka46', name: '乃木坂46',   img: 'https://picsum.photos/seed/nogi_comm/160/160',  color: 'from-green-400 to-teal-500',     members: 11200, heatScore: 89,  posts: '3,890件' },
  { slug: 'twice',      name: 'TWICE',      img: 'https://picsum.photos/seed/twice_comm/160/160', color: 'from-rose-400 to-pink-500',      members: 9210,  heatScore: 87,  posts: '2,654件' },
]

/* ── 推しアーティスト一覧 ── */
export const OSHI_ARTISTS = [
  { id: 'bts',          name: 'BTS',           genre: 'K-POP',    img: 'https://picsum.photos/seed/bts/160/160',        color: 'from-purple-500 to-indigo-500' },
  { id: 'newjeans',     name: 'NewJeans',       genre: 'K-POP',    img: 'https://picsum.photos/seed/newjeans/160/160',   color: 'from-sky-400 to-cyan-400' },
  { id: 'aespa',        name: 'aespa',          genre: 'K-POP',    img: 'https://picsum.photos/seed/aespa/160/160',      color: 'from-slate-500 to-blue-600' },
  { id: 'twice',        name: 'TWICE',          genre: 'K-POP',    img: 'https://picsum.photos/seed/twice/160/160',      color: 'from-pink-400 to-rose-400' },
  { id: 'blackpink',    name: 'BLACKPINK',      genre: 'K-POP',    img: 'https://picsum.photos/seed/blackpink/160/160',  color: 'from-rose-500 to-pink-600' },
  { id: 'ive',          name: 'IVE',            genre: 'K-POP',    img: 'https://picsum.photos/seed/ive/160/160',        color: 'from-indigo-400 to-violet-500' },
  { id: 'straykids',    name: 'STRAY KIDS',     genre: 'K-POP',    img: 'https://picsum.photos/seed/skz/160/160',        color: 'from-yellow-500 to-orange-500' },
  { id: 'seventeen',    name: 'SEVENTEEN',      genre: 'K-POP',    img: 'https://picsum.photos/seed/svt/160/160',        color: 'from-blue-500 to-sky-400' },
  { id: 'lesserafim',   name: 'LE SSERAFIM',    genre: 'K-POP',    img: 'https://picsum.photos/seed/lsf/160/160',        color: 'from-red-500 to-rose-500' },
  { id: 'illit',        name: 'ILLIT',          genre: 'K-POP',    img: 'https://picsum.photos/seed/illit/160/160',      color: 'from-pink-300 to-violet-400' },
  { id: 'enhypen',      name: 'ENHYPEN',        genre: 'K-POP',    img: 'https://picsum.photos/seed/en/160/160',         color: 'from-gray-600 to-slate-500' },
  { id: 'txt',          name: 'TXT',            genre: 'K-POP',    img: 'https://picsum.photos/seed/txt/160/160',        color: 'from-teal-500 to-cyan-500' },
  { id: 'nogizaka46',   name: '乃木坂46',       genre: 'アイドル', img: 'https://picsum.photos/seed/nogi/160/160',       color: 'from-violet-400 to-purple-500' },
  { id: 'sakurazaka46', name: '櫻坂46',         genre: 'アイドル', img: 'https://picsum.photos/seed/sakura/160/160',     color: 'from-pink-400 to-rose-500' },
  { id: 'hinatazaka46', name: '日向坂46',       genre: 'アイドル', img: 'https://picsum.photos/seed/hinata/160/160',     color: 'from-sky-400 to-blue-400' },
  { id: 'snowman',      name: 'Snow Man',        genre: 'アイドル', img: 'https://picsum.photos/seed/snowman/160/160',    color: 'from-blue-400 to-indigo-500' },
  { id: 'sixtones',     name: 'SixTONES',        genre: 'アイドル', img: 'https://picsum.photos/seed/sixtones/160/160',   color: 'from-gray-700 to-slate-600' },
  { id: 'naniwa',       name: 'なにわ男子',      genre: 'アイドル', img: 'https://picsum.photos/seed/naniwa/160/160',     color: 'from-orange-400 to-amber-400' },
  { id: 'jjk',          name: '呪術廻戦',        genre: 'アニメ',   img: 'https://picsum.photos/seed/jjk/160/160',        color: 'from-blue-800 to-indigo-900' },
  { id: 'haikyuu',      name: 'ハイキュー!!',    genre: 'アニメ',   img: 'https://picsum.photos/seed/haikyu/160/160',     color: 'from-orange-500 to-yellow-500' },
  { id: 'bluelock',     name: 'ブルーロック',    genre: 'アニメ',   img: 'https://picsum.photos/seed/bluelock/160/160',   color: 'from-blue-600 to-cyan-600' },
]

const GENRES = ['すべて', 'K-POP', 'アイドル', 'アニメ']
const RANK_LABELS = ['推し1位', '推し2位', '推し3位'] as const
const RANK_MEDALS = ['🥇', '🥈', '🥉']

type ArtistType = typeof OSHI_ARTISTS[number]

export function OshiSection() {
  // 最大3枠。null = 未設定
  const [oshiList, setOshiList] = useState<(ArtistType | null)[]>([null, null, null])
  const [activeRank, setActiveRank]   = useState(0)          // 表示中のタブ (0-2)
  const [settingRank, setSettingRank] = useState<number | null>(null) // モーダルで設定中の順位
  const [filterGenre, setFilterGenre] = useState('すべて')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('oshi_list')
      if (saved) {
        const ids: (string | null)[] = JSON.parse(saved)
        const list = ids.map(id => id ? (OSHI_ARTISTS.find(a => a.id === id) ?? null) : null)
        setOshiList(list)
        // 最初に設定されているランクをアクティブにする
        const firstSet = list.findIndex(o => o !== null)
        if (firstSet >= 0) setActiveRank(firstSet)
      }
    } catch {}
  }, [])

  function saveList(list: (ArtistType | null)[]) {
    setOshiList(list)
    try {
      localStorage.setItem('oshi_list', JSON.stringify(list.map(o => o?.id ?? null)))
    } catch {}
  }

  function selectOshi(artist: ArtistType) {
    if (settingRank === null) return
    const next = [...oshiList]
    next[settingRank] = artist
    saveList(next)
    setActiveRank(settingRank)
    setSettingRank(null)
  }

  function clearSlot(rank: number) {
    const next = [...oshiList]
    next[rank] = null
    saveList(next)
    // アクティブを残っている最初のスロットへ
    const firstSet = next.findIndex(o => o !== null)
    setActiveRank(firstSet >= 0 ? firstSet : 0)
    setSettingRank(null)
  }

  if (!mounted) return null

  const hasAnyOshi = oshiList.some(o => o !== null)
  const filtered   = filterGenre === 'すべて' ? OSHI_ARTISTS : OSHI_ARTISTS.filter(a => a.genre === filterGenre)

  /* ── 推し未設定：推し設定ボタン ＋ 今熱いコミュニティを表示 ── */
  if (!hasAnyOshi) {
    return (
      <>
        {/* ── 推し1位・2位・3位 設定ボタン ── */}
        <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-violet-400 to-pink-400 px-4 py-2.5 flex items-center justify-between">
            <p className="text-white font-black text-sm">推しを登録してパーソナライズ</p>
            <span className="text-white/70 text-xs hidden sm:block">設定するとトップが推し専用に切り替わります</span>
          </div>
          <div className="flex divide-x divide-gray-100">
            {RANK_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => { setSettingRank(i); setFilterGenre('すべて') }}
                className="flex-1 flex flex-col items-center gap-1.5 py-3 hover:bg-violet-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 group-hover:border-violet-400 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-400 group-hover:text-violet-500 transition-colors">{RANK_MEDALS[i]} {label}</p>
                  <p className="text-[10px] text-gray-300">未設定</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── 左右2カラム：熱いコミュニティ ＋ 安心バナー ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

          {/* ── 左：熱いコミュニティ ── */}
          <section className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm h-full">
            <div className="bg-gradient-to-r from-orange-400 to-rose-400 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🔥</span>
                <p className="text-white font-black text-xs">今熱いコミュニティ</p>
              </div>
              <Link href="/community" className="text-white/80 hover:text-white text-[10px] font-bold transition-colors">
                すべて見る →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {HOT_COMMUNITIES.map((c, i) => (
                <Link key={c.slug} href={`/community/${c.slug}`}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors">
                  <span className="w-5 text-center text-sm flex-shrink-0">
                    {i < 3 ? ['🥇','🥈','🥉'][i] : <span className="text-xs font-bold text-gray-400">{i + 1}</span>}
                  </span>
                  <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${c.color} overflow-hidden flex-shrink-0`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.img} alt={c.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#333333]">{c.name}</p>
                    <p className="text-[10px] text-gray-400">{c.members.toLocaleString()}人</p>
                  </div>
                  <span className="text-[10px] font-bold text-rose-500 flex-shrink-0">{c.heatScore}🔥</span>
                </Link>
              ))}
            </div>
          </section>

          {/* ── 右：AI審議診断 ／ 安心コミュニティ バナー（黄色背景・4カラム） ── */}
          <section className="rounded-2xl overflow-hidden shadow-sm h-full flex flex-col bg-gradient-to-br from-yellow-300 via-amber-300 to-orange-300 border border-yellow-200">
            {/* タイトル */}
            <div className="px-4 pt-4 pb-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <svg className="w-4 h-4 text-orange-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  <path d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" fill="white"/>
                </svg>
                <span className="text-[10px] font-black text-orange-700 tracking-widest uppercase">Security &amp; Trust</span>
              </div>
              <p className="text-orange-900 font-black text-sm leading-snug">
                AI審議診断で詐欺ゼロ！<br />
                <span className="text-orange-700">安心・安全コミュニティ</span>
              </p>
            </div>

            {/* 4カラム ポイント */}
            <div className="flex-1 grid grid-cols-2 gap-2 px-3 pb-3">
              {[
                {
                  emoji: '🤖',
                  bg: 'bg-white/60',
                  label: 'AI詐欺防止',
                  desc: '投稿・出品を\nAIが自動審査',
                },
                {
                  emoji: '🪪',
                  bg: 'bg-white/60',
                  label: '本人確認済み',
                  desc: '全ユーザーが\n身分証提示',
                },
                {
                  emoji: '🛡️',
                  bg: 'bg-white/60',
                  label: '安心取引',
                  desc: 'エスクロー決済\n詐欺ゼロ保証',
                },
                {
                  emoji: '👥',
                  bg: 'bg-white/60',
                  label: '安全な場',
                  desc: '確認済みのみの\nクローズドな空間',
                },
              ].map((item, i) => (
                <div key={i} className={`${item.bg} rounded-xl p-2.5 flex flex-col items-center text-center gap-1`}>
                  <span className="text-2xl leading-none">{item.emoji}</span>
                  <p className="text-orange-900 text-[11px] font-black leading-tight">{item.label}</p>
                  <p className="text-orange-700/70 text-[9px] leading-tight whitespace-pre-line">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* CTAボタン */}
            <div className="px-3 pb-4">
              <Link href="/community"
                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl
                           bg-orange-500 hover:bg-orange-600 text-white font-black text-xs
                           transition-colors shadow-md">
                安心コミュニティに参加する →
              </Link>
            </div>
          </section>

        </div>

        {settingRank !== null && (
          <OshiModal
            rank={settingRank}
            filtered={filtered}
            filterGenre={filterGenre}
            setFilterGenre={setFilterGenre}
            onSelect={selectOshi}
            onClose={() => setSettingRank(null)}
          />
        )}
      </>
    )
  }

  /* ── 推し設定済み ── */
  const currentOshi = oshiList[activeRank]
  const dummy = currentOshi ? getArtistDummy(currentOshi.id) : null

  return (
    <>
      {/* ── ランクタブバー ── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* タブ */}
        <div className="flex border-b border-gray-100">
          {RANK_LABELS.map((label, i) => {
            const oshi = oshiList[i]
            const isActive = activeRank === i
            return (
              <button key={i} onClick={() => oshi ? setActiveRank(i) : (setSettingRank(i), setFilterGenre('すべて'))}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 transition-colors relative
                  ${isActive
                    ? 'bg-gradient-to-b from-violet-50 to-white border-b-2 border-violet-500'
                    : 'hover:bg-gray-50 border-b-2 border-transparent'}`}>
                {oshi ? (
                  <>
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${oshi.color} overflow-hidden flex-shrink-0 ring-1 ring-white shadow-sm`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={oshi.img} alt={oshi.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className={`text-[10px] font-bold ${isActive ? 'text-violet-500' : 'text-gray-400'}`}>
                        {RANK_MEDALS[i]} {label}
                      </p>
                      <p className={`text-xs font-black leading-tight ${isActive ? 'text-[#333333]' : 'text-gray-500'}`}>
                        {oshi.name}
                      </p>
                    </div>
                    <span className={`text-xs font-black sm:hidden ${isActive ? 'text-violet-600' : 'text-gray-500'}`}>
                      {RANK_MEDALS[i]}
                    </span>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 text-gray-400 hover:text-violet-400 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-xs font-medium hidden sm:inline">{label}を設定</span>
                    <span className="text-xs font-medium sm:hidden">{RANK_MEDALS[i]}</span>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* アクティブ推しのヘッダー */}
        {currentOshi && (
          <div className={`relative bg-gradient-to-r ${currentOshi.color} px-5 py-4 overflow-hidden`}>
            <div className="absolute -top-3 -right-3 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/60 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={currentOshi.img} alt={currentOshi.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-lg leading-none">{RANK_MEDALS[activeRank]}</span>
                </div>
                <div>
                  <p className="text-white/70 text-xs">{RANK_LABELS[activeRank]}</p>
                  <p className="text-white font-black text-xl leading-tight">{currentOshi.name}</p>
                  <p className="text-white/70 text-xs">{currentOshi.genre}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link href={`/search?artist=${currentOshi.id}`}
                  className="bg-white text-gray-700 font-bold text-xs px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors shadow-sm hidden sm:flex items-center gap-1">
                  グッズ一覧
                </Link>
                <Link href={`/community/${currentOshi.id}`}
                  className="bg-white/20 text-white font-bold text-xs px-3 py-1.5 rounded-full hover:bg-white/30 transition-colors border border-white/30 hidden sm:flex items-center gap-1">
                  部屋へ
                </Link>
                <button onClick={() => { setSettingRank(activeRank); setFilterGenre('すべて') }}
                  className="text-white/60 hover:text-white text-xs transition-colors ml-1">
                  変更
                </button>
                <button onClick={() => clearSlot(activeRank)}
                  className="text-white/40 hover:text-white/80 text-xs transition-colors">
                  解除
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── 推しのグッズ ── */}
      {currentOshi && dummy && (
        <>
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#333333] flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${currentOshi.color} inline-block`} />
                {currentOshi.name} のグッズ
              </h2>
              <Link href={`/search?artist=${currentOshi.id}`} className="text-xs text-sky-500 hover:text-sky-600">
                もっと見る →
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {dummy.goods.map(item => (
                <Link key={item.id} href={`/listings/${item.id}`} className="group block">
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-sky-200 transition-all">
                    <div className="relative aspect-square bg-gray-50 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.img} alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      {item.badge && (
                        <span className={`absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          item.badge === '超希少' ? 'bg-yellow-400 text-yellow-900' :
                          item.badge === '希少'   ? 'bg-purple-500 text-white' :
                          'bg-blue-100 text-blue-600'
                        }`}>{item.badge}</span>
                      )}
                      {item.exchange && (
                        <span className="absolute top-1.5 right-1.5 bg-sky-100 text-sky-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">交換</span>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] text-[#333333] line-clamp-2 leading-tight font-medium">{item.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{item.condition}</p>
                      <p className="text-sm font-bold text-[#333333] mt-1">
                        {item.exchange ? <span className="text-sky-500 text-xs">交換希望</span> : `¥${item.price?.toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── ファンルーム ＆ イベント（PC: 左右 / SP: 上下） ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* コミュニティ */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-[#333333] flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${currentOshi.color} inline-block`} />
                  {currentOshi.name} ファンルーム
                </h2>
                <Link href={`/community/${currentOshi.id}`} className="text-xs text-sky-500 hover:text-sky-600">
                  ルームへ →
                </Link>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
                {dummy.community.map((post, i) => (
                  <Link key={i} href={`/community/${currentOshi.id}`}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.avatar} alt={post.user} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-[#333333]">@{post.user}</span>
                        <span className="text-[10px] text-gray-400">{post.time}</span>
                      </div>
                      <p className="text-xs text-[#555555] leading-relaxed line-clamp-2">{post.text}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                        <span>♥ {post.likes}</span>
                        <span>💬 {post.replies}件</span>
                      </div>
                    </div>
                  </Link>
                ))}
                <div className="px-4 py-3 text-center">
                  <Link href={`/community/${currentOshi.id}`}
                    className="text-xs text-violet-500 font-bold hover:text-violet-600 transition-colors">
                    ファンルームをもっと見る →
                  </Link>
                </div>
              </div>
            </section>

            {/* イベント */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-[#333333] flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${currentOshi.color} inline-block`} />
                  {currentOshi.name} のイベント・オフ会
                </h2>
                <Link href="/community/events" className="text-xs text-sky-500 hover:text-sky-600">
                  すべて見る →
                </Link>
              </div>
              <div className="space-y-3">
                {dummy.events.map(ev => {
                  const pct  = Math.round((ev.joined / ev.capacity) * 100)
                  const full = ev.joined >= ev.capacity
                  return (
                    <Link key={ev.id} href={`/community/${currentOshi.id}`}
                      className="block bg-white border border-gray-100 rounded-xl px-4 py-3 hover:shadow-md hover:border-violet-200 transition-all group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${ev.tagColor}`}>{ev.tag}</span>
                            <p className="text-sm font-bold text-[#333333] truncate group-hover:text-violet-600 transition-colors">{ev.title}</p>
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-[#666666]">
                            <span>📅 {ev.date}</span>
                            <span>📍 {ev.place}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${full ? 'bg-rose-400' : 'bg-gradient-to-r from-violet-400 to-pink-400'}`}
                                style={{ width: `${pct}%` }} />
                            </div>
                            <span className={`text-[11px] font-bold flex-shrink-0 ${full ? 'text-rose-500' : 'text-violet-500'}`}>
                              {ev.joined}/{ev.capacity}人
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 self-center">
                          {full
                            ? <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">満員</span>
                            : <span className="text-xs text-white font-bold bg-gradient-to-r from-violet-400 to-pink-400 px-3 py-1.5 rounded-full">参加する</span>
                          }
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          </div>
        </>
      )}

      {settingRank !== null && (
        <OshiModal
          rank={settingRank}
          filtered={filtered}
          filterGenre={filterGenre}
          setFilterGenre={setFilterGenre}
          onSelect={selectOshi}
          onClose={() => setSettingRank(null)}
          onClear={oshiList[settingRank] ? () => clearSlot(settingRank) : undefined}
        />
      )}
    </>
  )
}

/* ── 推し選択モーダル ── */
function OshiModal({
  rank, filtered, filterGenre, setFilterGenre, onSelect, onClose, onClear,
}: {
  rank: number
  filtered: typeof OSHI_ARTISTS
  filterGenre: string
  setFilterGenre: (g: string) => void
  onSelect: (a: typeof OSHI_ARTISTS[number]) => void
  onClose: () => void
  onClear?: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-violet-400 to-pink-400 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-black text-base">
              {RANK_MEDALS[rank]} {RANK_LABELS[rank]}を選んでください
            </p>
            <p className="text-white/80 text-xs mt-0.5">設定するとトップに専用セクションが表示されます</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* ジャンルタブ */}
        <div className="flex gap-2 px-4 pt-4 pb-2">
          {GENRES.map(g => (
            <button key={g} onClick={() => setFilterGenre(g)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                filterGenre === g ? 'bg-violet-500 text-white' : 'bg-gray-100 text-[#555555] hover:bg-gray-200'
              }`}>
              {g}
            </button>
          ))}
        </div>

        {/* アーティスト一覧 */}
        <div className="px-4 pb-4 max-h-72 overflow-y-auto grid grid-cols-4 gap-3">
          {filtered.map(artist => (
            <button key={artist.id} onClick={() => onSelect(artist)}
              className="flex flex-col items-center gap-1.5 group">
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${artist.color} p-0.5
                              group-hover:scale-110 transition-transform shadow-sm`}>
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={artist.img} alt={artist.name} className="w-full h-full object-cover"/>
                </div>
              </div>
              <span className="text-[11px] font-medium text-[#555555] group-hover:text-violet-500 text-center leading-tight transition-colors">
                {artist.name}
              </span>
            </button>
          ))}
        </div>

        {onClear && (
          <div className="border-t border-gray-100 px-4 py-3 flex justify-center">
            <button onClick={onClear} className="text-xs text-gray-400 hover:text-rose-400 transition-colors">
              このスロットの設定を解除する
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
