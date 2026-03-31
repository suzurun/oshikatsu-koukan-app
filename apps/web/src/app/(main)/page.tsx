import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { OshiSection } from '@/components/oshi/OshiSection'

/* ─────────────────────────────────────────
   K-POP アーティスト（交換で人気）
───────────────────────────────────────── */
const KPOP_ARTISTS = [
  { slug: 'bts',       label: 'BTS',       img: 'https://picsum.photos/seed/bts/120/120',       hot: true },
  { slug: 'newjeans',  label: 'NewJeans',  img: 'https://picsum.photos/seed/newjeans/120/120',  hot: true },
  { slug: 'aespa',     label: 'aespa',     img: 'https://picsum.photos/seed/aespa/120/120',     hot: false },
  { slug: 'seventeen', label: 'SEVENTEEN', img: 'https://picsum.photos/seed/seventeen/120/120', hot: true },
  { slug: 'ive',       label: 'IVE',       img: 'https://picsum.photos/seed/ive/120/120',       hot: false },
  { slug: 'stray-kids',label: 'Stray Kids',img: 'https://picsum.photos/seed/straykids/120/120', hot: false },
  { slug: 'nct',       label: 'NCT',       img: 'https://picsum.photos/seed/nct/120/120',       hot: false },
  { slug: 'twice',     label: 'TWICE',     img: 'https://picsum.photos/seed/twice/120/120',     hot: false },
  { slug: 'lesserafim',label: 'LE SSERAFIM',img:'https://picsum.photos/seed/lesserafim/120/120',hot: false },
  { slug: 'exo',       label: 'EXO',       img: 'https://picsum.photos/seed/exo/120/120',       hot: false },
]

/* ─────────────────────────────────────────
   K-POP 交換ダミーリスト
───────────────────────────────────────── */
const KPOP_EXCHANGE_ITEMS = [
  { id: 'kx1', title: 'BTS RM フォトカード Indigo ver.',        img: 'https://picsum.photos/seed/bts-rm/300/300',    artist: 'BTS',      wantFor: 'JIMIN フォトカード希望' },
  { id: 'kx2', title: 'NewJeans ハニ トレカ OMG ver.',          img: 'https://picsum.photos/seed/nj-hani/300/300',   artist: 'NewJeans', wantFor: 'ミンジ or ヘリン希望' },
  { id: 'kx3', title: 'aespa カリナ アクリルスタンド',          img: 'https://picsum.photos/seed/aespa-k/300/300',   artist: 'aespa',    wantFor: 'NingNing希望' },
  { id: 'kx4', title: 'SEVENTEEN ウジ 缶バッジ FML ver.',       img: 'https://picsum.photos/seed/svt-wz/300/300',    artist: 'SEVENTEEN',wantFor: 'ホシ or クプス希望' },
  { id: 'kx5', title: 'IVE ウォニョン タワレコ 特典ポスター',  img: 'https://picsum.photos/seed/ive-wy/300/300',    artist: 'IVE',      wantFor: 'レイ希望' },
  { id: 'kx6', title: 'Stray Kids リノ フォトカード 5-STAR', img: 'https://picsum.photos/seed/skz-lino/300/300',  artist: 'StrayKids',wantFor: 'バンチャン希望' },
  { id: 'kx7', title: 'BTS JUNGKOOK ブロマイド Golden ver.',    img: 'https://picsum.photos/seed/bts-jk/300/300',    artist: 'BTS',      wantFor: 'V or RM希望' },
  { id: 'kx8', title: 'TWICE ナヨン フォトカード Ready To Be',  img: 'https://picsum.photos/seed/twice-ny/300/300',  artist: 'TWICE',    wantFor: 'モモ or サナ希望' },
]

/* ─────────────────────────────────────────
   推しジャンル定義
───────────────────────────────────────── */
const OTHER_GENRES = [
  { slug: 'jpop',    label: 'J-POP',    img: 'https://picsum.photos/seed/jpop/160/160',    color: 'from-sky-400 to-blue-400' },
  { slug: 'idol',    label: 'アイドル', img: 'https://picsum.photos/seed/idol/160/160',    color: 'from-violet-400 to-purple-400' },
  { slug: 'anime',   label: 'アニメ',   img: 'https://picsum.photos/seed/anime/160/160',   color: 'from-indigo-400 to-blue-500' },
  { slug: 'vtuber',  label: 'VTuber',   img: 'https://picsum.photos/seed/vtuber/160/160',  color: 'from-fuchsia-400 to-pink-400' },
  { slug: 'game',    label: 'ゲーム',   img: 'https://picsum.photos/seed/game/160/160',    color: 'from-teal-400 to-cyan-400' },
  { slug: 'band',    label: 'バンド',   img: 'https://picsum.photos/seed/band/160/160',    color: 'from-slate-500 to-gray-600' },
  { slug: 'sports',  label: 'スポーツ', img: 'https://picsum.photos/seed/sports/160/160',  color: 'from-orange-400 to-amber-400' },
  { slug: 'other',   label: 'その他',   img: 'https://picsum.photos/seed/other2/160/160',  color: 'from-gray-400 to-slate-400' },
]

/* ─────────────────────────────────────────
   カテゴリ定義
───────────────────────────────────────── */
const CATEGORIES = [
  { slug: 'photo-cards',   label: 'フォトカード', bg: 'bg-gradient-to-br from-pink-400 to-rose-500',   iconPath: 'M20 5h-3.2L15 3H9L7.2 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm3-5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z' },
  { slug: 'acrylic-stand', label: 'アクスタ',     bg: 'bg-gradient-to-br from-sky-400 to-cyan-500',    iconPath: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z' },
  { slug: 'uchiwa',        label: 'うちわ',       bg: 'bg-gradient-to-br from-fuchsia-400 to-pink-500', iconPath: 'M12 2a8 8 0 1 0 0 16A8 8 0 0 0 12 2zm0 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm-1 2h2v4h-2v-4z' },
  { slug: 'badges',        label: '缶バッジ',     bg: 'bg-gradient-to-br from-violet-400 to-purple-500', iconPath: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21L12 17.27z' },
  { slug: 'bromide',       label: 'ブロマイド',   bg: 'bg-gradient-to-br from-rose-400 to-orange-400',  iconPath: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm4 8H8v-.57C8 14.14 9.37 13 12 13s4 1.14 4 2.43V16z' },
  { slug: 'clearfile',     label: 'クリアファイル', bg: 'bg-gradient-to-br from-teal-400 to-green-500', iconPath: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z' },
  { slug: 'concert-goods', label: 'コンサート',   bg: 'bg-gradient-to-br from-amber-400 to-orange-500', iconPath: 'M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4zm-2 16.9V20H8v2h8v-2h-2v-2.1A7 7 0 0 0 19 11h-2a5 5 0 0 1-10 0H5a7 7 0 0 0 5 6.9z' },
  { slug: 'others',        label: 'その他',       bg: 'bg-gradient-to-br from-slate-400 to-gray-500',   iconPath: 'M4 6h16M4 12h16M4 18h16' },
]

export default async function HomePage() {
  const supabase = await createClient()

  const { data: newListings } = await supabase
    .from('v_active_listings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-10">

      {/* ═══════════════════════════════════════════
          ① メインヒーロー：交換 × K-POP を全面に
      ═══════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-[#1a1a3e] via-[#2d1b5e] to-[#1a1a3e] rounded-3xl overflow-hidden">
        {/* 装飾グロー */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-4 right-10 w-40 h-40 rounded-full bg-pink-500/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-32 h-32 rounded-full bg-sky-400/20 blur-2xl pointer-events-none" />
          <div className="absolute top-10 left-1/2 w-24 h-24 rounded-full bg-fuchsia-500/15 blur-2xl pointer-events-none" />
        </div>

        <div className="relative z-10 px-6 py-8 md:px-10">
          {/* 上部：バッジ帯 */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 bg-pink-500/20 border border-pink-400/30 text-pink-300 text-[11px] font-bold px-3 py-1 rounded-full">
              🔥 K-POP交換 No.1
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/80 text-[11px] font-bold px-3 py-1 rounded-full">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-yellow-300">
                <path d="M12 1l-9 4v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
              AI鑑定済み
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/80 text-[11px] font-bold px-3 py-1 rounded-full">
              本人確認済みユーザーのみ
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* 左：メインコピー */}
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-black leading-snug mb-3">
                <span className="block text-pink-300 text-sm font-bold tracking-widest mb-1">K-POPグッズ交換プラットフォーム</span>
                <span className="text-3xl md:text-4xl block">推しのグッズを</span>
                <span className="text-3xl md:text-4xl block">
                  <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">¥0</span>
                  で交換しよう
                </span>
              </h1>
              <p className="text-white/70 text-sm mb-6 leading-relaxed">
                持ってるグッズと欲しいグッズを交換するだけ。<br />
                お金を使わずコレクションを充実させよう。<br />
                <span className="text-pink-300 font-bold">BTS・NewJeans・aespa…K-POP交換が一番アツい！</span>
              </p>

              {/* CTA ボタン */}
              <div className="flex flex-wrap gap-3">
                <Link href="/search?type=exchange&genre=kpop"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:opacity-90
                             text-white font-black px-7 py-3 rounded-full transition-opacity shadow-lg text-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                  K-POP交換を探す
                  <span className="bg-yellow-300 text-fuchsia-700 text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">¥0</span>
                </Link>
                <Link href="/listings/new"
                  className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/30
                             text-white font-bold px-6 py-3 rounded-full transition-colors text-sm">
                  出品・交換する！
                </Link>
                <Link href="/search"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20
                             text-white/80 font-medium px-6 py-3 rounded-full transition-colors text-sm">
                  グッズを買う
                </Link>
              </div>
            </div>

            {/* 右：交換フロー（シンプル） */}
            <div className="flex-shrink-0 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 md:min-w-[180px]">
                <p className="text-white/50 text-[10px] font-bold text-center tracking-widest mb-3">交換の流れ</p>
                <div className="space-y-2.5">
                  {[
                    { step: '1', text: '交換したいグッズを出品' },
                    { step: '2', text: '欲しいグッズに交換申請' },
                    { step: '3', text: 'お互い発送して完了' },
                    { step: '¥0', text: '支払いなし！', highlight: true },
                  ].map((s) => (
                    <div key={s.step} className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0
                        ${s.highlight
                          ? 'bg-gradient-to-br from-yellow-300 to-pink-400 text-white'
                          : 'bg-white/20 text-white'}`}>
                        {s.step}
                      </div>
                      <span className={`text-xs ${s.highlight ? 'text-yellow-300 font-black' : 'text-white/80 font-medium'}`}>
                        {s.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 統計バー */}
          <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap gap-5">
            {[
              { num: '12,000+', label: 'K-POP交換グッズ' },
              { num: '8,500+',  label: '登録ユーザー' },
              { num: '98%',     label: '取引完了率' },
              { num: '¥0',      label: '交換手数料' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-white font-black text-lg leading-none">{stat.num}</p>
                <p className="text-white/50 text-[10px] mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ② K-POP アーティストから交換を探す
      ═══════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#333333] flex items-center gap-2">
            <span className="bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-xs font-black px-2.5 py-1 rounded-full">K-POP</span>
            アーティストから探す
          </h2>
          <Link href="/search?genre=kpop" className="text-sm text-sky-500 hover:text-sky-600 font-medium">
            すべて見る →
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {KPOP_ARTISTS.map((artist) => (
            <Link key={artist.slug} href={`/search?artist=${artist.slug}&type=exchange`}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 group">
              <div className="relative">
                <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-200
                  ${artist.hot
                    ? 'border-pink-400 shadow-md shadow-pink-200 group-hover:shadow-lg group-hover:shadow-pink-300'
                    : 'border-gray-200 group-hover:border-sky-300 group-hover:shadow-md'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={artist.img} alt={artist.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                </div>
                {artist.hot && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                    HOT
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium text-[#555555] group-hover:text-pink-500 transition-colors whitespace-nowrap text-center">
                {artist.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ③ K-POP 交換グッズ（ダミー）
      ═══════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#333333] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block animate-pulse" />
            今すぐ交換できるK-POPグッズ
          </h2>
          <Link href="/search?type=exchange&genre=kpop"
            className="text-sm text-pink-500 hover:text-pink-600 font-medium">
            もっと見る →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {KPOP_EXCHANGE_ITEMS.map((item) => (
            <Link key={item.id} href={`/listings/${item.id}`}
              className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-pink-200 hover:shadow-md transition-all">
              {/* 画像 */}
              <div className="aspect-square relative overflow-hidden bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.img} alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                {/* ¥0バッジ */}
                <div className="absolute top-2 left-2">
                  <span className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                    ¥0 交換
                  </span>
                </div>
                {/* AI鑑定バッジ */}
                <div className="absolute bottom-2 right-2">
                  <span className="bg-gradient-to-r from-amber-400 to-yellow-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5">
                      <path d="M12 1l-9 4v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                    </svg>
                    AI鑑定済
                  </span>
                </div>
              </div>
              {/* テキスト */}
              <div className="p-3">
                <span className="inline-block text-[10px] font-bold bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded mb-1">
                  {item.artist}
                </span>
                <p className="text-xs font-bold text-[#333333] leading-tight mb-1 line-clamp-2">{item.title}</p>
                <p className="text-[10px] text-gray-400 truncate">
                  <span className="text-sky-500">→</span> {item.wantFor}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* 交換CTA バー */}
        <div className="mt-4 bg-gradient-to-r from-rose-50 to-pink-50 border border-pink-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black text-[#333333]">あなたのK-POPグッズ、交換しませんか？</p>
            <p className="text-xs text-gray-500 mt-0.5">手持ちグッズを出品するだけ。マッチングしたら¥0で交換成立！</p>
          </div>
          <Link href="/listings/new"
            className="flex-shrink-0 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white font-black text-xs px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-md">
            出品する
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ④ 推しセクション（ログイン後パーソナライズ）
      ═══════════════════════════════════════════ */}
      <OshiSection />

      {/* ═══════════════════════════════════════════
          ⑤ 安心・安全バナー
      ═══════════════════════════════════════════ */}
      <section className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] rounded-2xl px-5 py-4 text-white">
        <p className="text-xs font-bold text-sky-300 mb-3 tracking-widest uppercase">Security &amp; Trust</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="w-11 h-11 rounded-full bg-rose-500/20 flex items-center justify-center mb-0.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-rose-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <p className="text-xs font-bold leading-tight">AI判定で<br />詐欺防止</p>
            <p className="text-[10px] text-white/50 leading-tight">出品物を自動審査</p>
          </div>
          <div className="flex flex-col items-center text-center gap-1.5 border-x border-white/10">
            <div className="w-11 h-11 rounded-full bg-sky-500/20 flex items-center justify-center mb-0.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-sky-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0z" />
              </svg>
            </div>
            <p className="text-xs font-bold leading-tight">身分証提示で<br />本人確認済み</p>
            <p className="text-[10px] text-white/50 leading-tight">全ユーザーが審査済み</p>
          </div>
          <div className="flex flex-col items-center text-center gap-1.5">
            <div className="w-11 h-11 rounded-full bg-emerald-500/20 flex items-center justify-center mb-0.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5 text-emerald-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0z" />
              </svg>
            </div>
            <p className="text-xs font-bold leading-tight">安心して<br />コミュニティ参加</p>
            <p className="text-[10px] text-white/50 leading-tight">身分証確認者のみ</p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center gap-4 flex-wrap">
          <span className="flex items-center gap-1 text-[10px] text-white/60"><svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-sky-400"><path d="M12 1l-9 4v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>AI自動審査</span>
          <span className="flex items-center gap-1 text-[10px] text-white/60"><svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-emerald-400"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21 12 17.27z"/></svg>信用スコア制度</span>
          <span className="flex items-center gap-1 text-[10px] text-white/60"><svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-rose-400"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>本人確認済みバッジ</span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ⑥ その他ジャンル
      ═══════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#333333]">他のジャンルから探す</h2>
          <Link href="/search" className="text-sm text-sky-500 hover:text-sky-600">すべて見る →</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {OTHER_GENRES.map((genre) => (
            <Link key={genre.slug} href={`/search?genre=${genre.slug}`}
              className="flex-shrink-0 flex flex-col items-center gap-2 group">
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${genre.color} p-0.5 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200`}>
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={genre.img} alt={genre.label} className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="text-xs font-medium text-[#555555] group-hover:text-sky-500 transition-colors whitespace-nowrap">{genre.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ⑦ カテゴリから探す
      ═══════════════════════════════════════════ */}
      <section>
        <h2 className="text-lg font-black text-[#333333] mb-4">グッズカテゴリ</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-4">
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} href={`/search?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 group">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${cat.bg} flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200`}>
                <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 sm:w-8 sm:h-8">
                  <path d={cat.iconPath} />
                </svg>
              </div>
              <span className="text-xs text-[#555555] text-center leading-tight font-medium group-hover:text-sky-500 transition-colors">
                {cat.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ⑧ コミュニティ入口
      ═══════════════════════════════════════════ */}
      <section className="bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100 rounded-2xl px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center flex-shrink-0 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-[#333333]">K-POP仲間とつながる「ファンルーム」</p>
              <p className="text-xs text-[#888888]">BTS部屋・NewJeans部屋…アーティストごとの交流スペース</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/community/bts" className="text-xs font-medium text-pink-500 hover:text-pink-600 bg-white border border-pink-200 px-3 py-1.5 rounded-full transition-colors hidden sm:block">BTS部屋</Link>
            <Link href="/community" className="text-xs font-bold text-white bg-gradient-to-r from-violet-400 to-pink-400 px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity">参加する →</Link>
          </div>
        </div>
        {/* 人気投稿 */}
        <div className="mt-3 border-t border-violet-100 pt-3">
          <div className="divide-y divide-gray-50 bg-white rounded-xl overflow-hidden">
            {[
              { tag: 'BTS',     text: 'BTS RM フォトカード Indigo ver. 交換できる方！', replies: 24, color: 'bg-pink-100 text-pink-600' },
              { tag: 'NewJeans',text: 'NewJeans OMG ハニ トレカ → ミンジ希望',        replies: 18, color: 'bg-rose-100 text-rose-600' },
              { tag: 'aespa',   text: 'aespa カリナ アクスタ → NingNing希望あり',     replies: 11, color: 'bg-fuchsia-100 text-fuchsia-600' },
            ].map((topic, i) => (
              <Link key={i} href="/community/timeline"
                className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${topic.color}`}>{topic.tag}</span>
                <p className="flex-1 text-xs text-[#333333] truncate">{topic.text}</p>
                <p className="flex-shrink-0 text-[11px] text-gray-400">返信 {topic.replies}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ⑨ 新着出品
      ═══════════════════════════════════════════ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-[#333333]">新着出品</h2>
          <Link href="/search?sort=new" className="text-sm text-sky-500 hover:text-sky-600">もっと見る →</Link>
        </div>
        {newListings && newListings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {newListings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                title={listing.title}
                price={listing.price}
                isExchangeOnly={listing.is_exchange_only}
                condition={listing.condition}
                primaryImageUrl={listing.primary_image_url}
                sellerName={listing.seller_name ?? ''}
                sellerScore={listing.seller_score ?? 100}
                rarityScore={listing.rarity_score}
                rarityLabel={listing.rarity_label}
                suggestedPrice={listing.suggested_price}
                demandForecast={listing.demand_forecast_30d}
                artistName={listing.artist_name}
                transactionType={listing.transaction_type}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="#f9a8d4" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </div>
            </div>
            <p className="text-[#888888]">まだ出品がありません</p>
            <Link href="/listings/new" className="text-pink-500 text-sm mt-2 inline-block hover:text-pink-600">
              最初に出品してみる →
            </Link>
          </div>
        )}
      </section>

    </div>
  )
}
