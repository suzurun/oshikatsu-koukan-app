import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ListingGallery from './ListingGallery'
import { BuyRequestButton } from './BuyRequestButton'

interface Props { params: Promise<{ id: string }> }

/* ─── ラベルマップ ─── */
const CONDITION_LABELS: Record<string, string> = {
  new: '新品', like_new: '未使用に近い', good: '良好', fair: 'やや傷あり', poor: '傷・汚れあり',
}
const TX_LABELS: Record<string, { label: string; color: string }> = {
  sale:          { label: '販売',     color: 'text-green-700 bg-green-50 border-green-200' },
  exchange:      { label: '交換希望', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  local_exchange:{ label: '現地交換', color: 'text-orange-700 bg-orange-50 border-orange-200' },
}
const RARITY_LABELS: Record<string, { label: string; color: string }> = {
  super_rare:{ label: '超希少', color: 'bg-yellow-100 text-yellow-800' },
  rare:      { label: '希少',   color: 'bg-purple-100 text-purple-800' },
  uncommon:  { label: 'やや希少', color: 'bg-blue-100 text-blue-800' },
  common:    { label: '',       color: '' },
}

/* ─── ダミーデータ（Supabaseに商品がない場合のデモ用） ─── */
const DUMMY_LISTING = {
  id: 'demo',
  title: 'BTS RM ソロ「Indigo」ポップアップ 限定フォトカード',
  description: '2023年に開催されたRM「Indigo」ポップアップストアで入手した限定フォトカードです。\n\n未開封・未使用の新品です。購入から保管まで丁寧に扱っておりました。\n\nお取引はすべてアプリ内のメッセージを通じて行います。発送はらくらくメルカリ便を予定しています。\n\n質問があればお気軽にどうぞ！',
  artist_name: 'BTS',
  price: 3500,
  suggested_price: 3200,
  condition: 'new',
  transaction_type: 'sale',
  is_exchange_only: false,
  exchange_description: null,
  rarity_label: 'super_rare',
  demand_forecast_30d: 28,
  seller_name: 'army_haruka',
  seller_score: 98,
  seller_id: 'seller_demo',
  category: 'フォトカード',
  images: [
    'https://picsum.photos/seed/bts-rm-card/600/600',
    'https://picsum.photos/seed/bts-rm-card2/600/600',
    'https://picsum.photos/seed/bts-rm-card3/600/600',
  ],
  ai_auth_score: 97,
  ai_auth_risk: 'low',
  ai_auth_reasoning: '公式グッズと特徴が一致。ホログラムシール・印刷品質ともに正規品の特徴を確認。',
  views: 342,
  favorites: 47,
  created_at: '2026-02-10T10:30:00Z',
}

const RELATED_ITEMS = [
  { id: 'r1', title: 'BTS JIMIN フォトカード SET ME FREE ver.', price: null, exchange: true,  img: 'https://picsum.photos/seed/bts-jimin/300/300', condition: '新品',    badge: '交換希望' },
  { id: 'r2', title: 'BTS V 「Layover」タワーレコード 特典ポスター', price: 2800, exchange: false, img: 'https://picsum.photos/seed/bts-v/300/300',    condition: '良好',    badge: null },
  { id: 'r3', title: 'BTS JUNG KOOK Golden アルバム トレカ',       price: 1500, exchange: false, img: 'https://picsum.photos/seed/bts-jk/300/300',   condition: '新品',    badge: '希少' },
  { id: 'r4', title: 'BTS SUGA Agust D ツアー 缶バッジ',           price: 4200, exchange: false, img: 'https://picsum.photos/seed/bts-suga/300/300', condition: '新品',    badge: '希少' },
]

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  /* ─── Supabaseからデータ取得（なければダミー） ─── */
  const { data: rawListing } = await supabase
    .from('v_active_listings').select('*').eq('id', id).maybeSingle()

  const { data: images } = await supabase
    .from('listing_images').select('*').eq('listing_id', id).order('sort_order')

  const [{ data: { user } }, { data: aiAnalysis }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('ai_price_analyses')
      .select('authenticity_score, counterfeit_risk, authenticity_flags, authenticity_reasoning')
      .eq('listing_id', id).maybeSingle(),
  ])

  /* ─── データ統合（実データ優先、なければダミー） ─── */
  const isDemo   = !rawListing
  const listing  = rawListing ?? DUMMY_LISTING as typeof DUMMY_LISTING
  const price    = (listing.price ?? null) as number | null
  const suggested = (listing.suggested_price ?? null) as number | null
  const demand   = (listing.demand_forecast_30d ?? null) as number | null
  const rarity   = RARITY_LABELS[String(listing.rarity_label ?? 'common')]
  const txBadge  = TX_LABELS[String(listing.transaction_type ?? 'sale')]
  const isPriceHigh = price && suggested && price > suggested * 1.5
  const isPriceLow  = price && suggested && price < suggested * 0.6
  const isMine   = !isDemo && user?.id === (listing as Record<string, unknown>).seller_id

  /* ─── 画像URL配列 ─── */
  const imageUrls: string[] = isDemo
    ? (DUMMY_LISTING.images as string[])
    : images && images.length > 0
      ? images.map(img => String(img.image_url))
      : rawListing?.primary_image_url
        ? [String(rawListing.primary_image_url)]
        : []

  /* ─── AI分析 ─── */
  const ai = isDemo
    ? { score: DUMMY_LISTING.ai_auth_score, risk: DUMMY_LISTING.ai_auth_risk, reason: DUMMY_LISTING.ai_auth_reasoning }
    : aiAnalysis
      ? { score: Number(aiAnalysis.authenticity_score), risk: String(aiAnalysis.counterfeit_risk), reason: String(aiAnalysis.authenticity_reasoning ?? '') }
      : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">

      {/* ─── パンくず ─── */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600">トップ</Link>
        <span>/</span>
        <Link href="/search" className="hover:text-gray-600">商品一覧</Link>
        <span>/</span>
        {listing.artist_name && (
          <>
            <Link href={`/search?artist=${listing.artist_name}`} className="hover:text-gray-600">
              {String(listing.artist_name)}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-gray-600 truncate max-w-[200px]">{String(listing.title)}</span>
      </nav>

      {/* ─── メインコンテンツ ─── */}
      <div className="grid md:grid-cols-2 gap-8 items-start">

        {/* 左：画像ギャラリー */}
        <div className="space-y-4">
          <ListingGallery
            images={imageUrls}
            title={String(listing.title)}
            aiScore={ai?.score}
            aiRisk={ai?.risk}
          />

          {/* 商品詳細テーブル（左下） */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50">
              <h3 className="text-sm font-bold text-gray-700">商品情報</h3>
            </div>
            <div className="divide-y divide-gray-50 text-sm">
              {[
                { label: 'カテゴリ',   value: String((listing as Record<string, unknown>).category ?? 'フォトカード') },
                { label: 'アーティスト', value: String(listing.artist_name ?? '未設定') },
                { label: '状態',       value: CONDITION_LABELS[String(listing.condition ?? 'good')] ?? String(listing.condition ?? '') },
                { label: '取引方法',   value: txBadge.label },
                { label: '閲覧数',     value: `${isDemo ? DUMMY_LISTING.views : '--'} 回` },
                { label: 'お気に入り', value: `${isDemo ? DUMMY_LISTING.favorites : '--'} 件` },
                { label: '出品日',     value: new Date(String((listing as Record<string, unknown>).created_at ?? Date.now())).toLocaleDateString('ja-JP') },
              ].map(row => (
                <div key={row.label} className="flex items-center px-4 py-2.5">
                  <span className="w-28 text-gray-400 flex-shrink-0">{row.label}</span>
                  <span className="text-gray-700 font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右：情報・アクション */}
        <div className="space-y-5">

          {/* タイトル・バッジ */}
          <div>
            {listing.artist_name && (
              <p className="text-sm font-semibold text-sky-500 mb-1">{String(listing.artist_name)}</p>
            )}
            <h1 className="text-xl font-bold text-[#333333] leading-snug mb-3">{String(listing.title)}</h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${txBadge.color}`}>
                {txBadge.label}
              </span>
              {rarity.label && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${rarity.color}`}>
                  {rarity.label}
                </span>
              )}
              <span className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                {CONDITION_LABELS[String(listing.condition ?? 'good')]}
              </span>
              <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                出品中
              </span>
            </div>
          </div>

          {/* 価格ボックス */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
            {listing.is_exchange_only ? (
              <div>
                <p className="text-2xl font-black text-blue-600">交換のみ</p>
                {(listing as Record<string, unknown>).exchange_description && (
                  <p className="text-sm text-blue-500 mt-1">{String((listing as Record<string, unknown>).exchange_description)}</p>
                )}
              </div>
            ) : price ? (
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-[#333333]">¥{price.toLocaleString()}</span>
                  {isPriceHigh && <span className="text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-1 rounded-full">⚠ 相場より高め</span>}
                  {isPriceLow  && <span className="text-xs font-bold text-blue-500 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full">💙 お得価格</span>}
                </div>
                {suggested && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>
                        AI推奨相場
                      </span>
                      <span className="font-bold text-gray-600">¥{suggested.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${isPriceHigh ? 'bg-red-400' : isPriceLow ? 'bg-blue-400' : 'bg-green-400'}`}
                        style={{ width: `${Math.min(100, (price / (suggested * 1.5)) * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400">価格未定</p>
            )}

            {demand && demand > 5 && (
              <div className="flex items-center gap-1.5 text-sm text-rose-500 font-bold">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5 0.67z"/></svg>
                {demand}人が今この商品を探しています
              </div>
            )}
          </div>

          {/* アクションボタン */}
          {!isMine && (
            <div className="space-y-3">
              <BuyRequestButton
                listingId={id}
                transactionType={String(listing.transaction_type ?? 'sale')}
                price={price}
                isExchangeOnly={Boolean(listing.is_exchange_only)}
                isLoggedIn={!!user}
              />
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:border-rose-200 hover:text-rose-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  お気に入り
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  シェア
                </button>
              </div>
            </div>
          )}

          {/* 自分の出品の場合 */}
          {isMine && (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm font-bold text-yellow-700 mb-1">自分の出品です</p>
                <p className="text-xs text-yellow-600">この商品はあなたが出品しています</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/listings/${id}/edit`}
                  className="flex items-center justify-center gap-1.5 py-2.5 border border-sky-200 text-sky-600 rounded-xl text-sm font-bold hover:bg-sky-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  編集
                </Link>
                <button className="flex items-center justify-center gap-1.5 py-2.5 border border-rose-200 text-rose-500 rounded-xl text-sm font-bold hover:bg-rose-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  削除
                </button>
              </div>
            </div>
          )}

          {/* 出品者カード */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">出品者</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                {String(listing.seller_name ?? '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-[#333333]">@{String(listing.seller_name ?? '出品者')}</p>
                  <span className="text-xs bg-sky-50 text-sky-600 border border-sky-200 px-2 py-0.5 rounded-full font-bold">認証済み</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21L12 17.27z"/></svg>
                    信頼スコア {listing.seller_score ?? 98}%
                  </span>
                  <span>取引実績 47件</span>
                </div>
              </div>
              {(Number(listing.seller_score ?? 98) >= 90) && (
                <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full flex-shrink-0">
                  優良出品者
                </span>
              )}
            </div>
            <Link href={`/users/${listing.seller_name}`}
              className="mt-3 flex items-center justify-center gap-1 text-xs text-sky-500 hover:text-sky-600 font-medium">
              プロフィールを見る →
            </Link>
          </div>

          {/* 取引の流れ */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">取引の流れ</h3>
            <div className="space-y-2">
              {[
                { step: 1, icon: '🛒', label: '購入申請', desc: 'ボタンを押して申請' },
                { step: 2, icon: '✅', label: '出品者が承認', desc: '24時間以内に返答' },
                { step: 3, icon: '💳', label: 'エスクロー決済', desc: '安心の第三者預かり' },
                { step: 4, icon: '📦', label: '発送・受取', desc: '追跡番号で確認可' },
                { step: 5, icon: '⭐', label: '評価・完了', desc: 'お互いに評価' },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0 text-sm font-black text-sky-500">
                    {s.step}
                  </div>
                  <span className="text-base">{s.icon}</span>
                  <div>
                    <span className="text-xs font-bold text-[#333333]">{s.label}</span>
                    <span className="text-xs text-gray-400 ml-1">— {s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 安心保証 */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
            {[
              { icon: '🛡️', label: 'AI詐欺防止' },
              { icon: '🪪', label: '本人確認済み' },
              { icon: '💰', label: 'エスクロー決済' },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl py-2.5 px-1">
                <p className="text-lg mb-0.5">{item.icon}</p>
                <p className="font-medium text-[10px]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 商品説明（フル幅） ─── */}
      {listing.description && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <h3 className="text-base font-bold text-[#333333] mb-3">商品説明</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{String(listing.description)}</p>
        </div>
      )}

      {/* ─── AI真贋チェック詳細（フル幅） ─── */}
      {ai && (
        <div className={`rounded-2xl p-5 border ${
          ai.risk === 'low'    ? 'bg-teal-50 border-teal-200' :
          ai.risk === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                                 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              ai.risk === 'low' ? 'bg-teal-500' : ai.risk === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                <path d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" fill="white"/>
              </svg>
            </div>
            <div>
              <p className={`font-bold text-sm ${
                ai.risk === 'low' ? 'text-teal-700' : ai.risk === 'medium' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                AI真贋判定：{ai.risk === 'low' ? '✅ 正規品の可能性が高い' : ai.risk === 'medium' ? '⚠️ 要確認' : '🚫 偽物の疑いあり'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">信頼スコア {ai.score}%</p>
            </div>
          </div>
          {ai.reason && (
            <p className={`text-xs leading-relaxed ${
              ai.risk === 'low' ? 'text-teal-600' : ai.risk === 'medium' ? 'text-yellow-700' : 'text-red-600'
            }`}>{ai.reason}</p>
          )}
        </div>
      )}

      {/* ─── 関連商品 ─── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#333333]">関連商品</h2>
          <Link href={`/search?artist=${listing.artist_name}`} className="text-xs text-sky-500 hover:text-sky-600">
            もっと見る →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {RELATED_ITEMS.map(item => (
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
                                               'bg-sky-100 text-sky-600'
                    }`}>{item.badge}</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs text-[#333333] line-clamp-2 leading-tight font-medium">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.condition}</p>
                  <p className="text-sm font-bold text-[#333333] mt-1">
                    {item.exchange ? <span className="text-sky-500 text-xs">交換希望</span> : `¥${item.price?.toLocaleString()}`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  )
}
