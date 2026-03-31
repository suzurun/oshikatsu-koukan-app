import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { SortSelect } from './SortSelect'

/* ─── ダミーデータ（DBが空のときに表示） ─── */
const DUMMY_LISTINGS = [
  { id: 'dummy-1',  title: '【BTS】RM ソロ ポップアップ 限定 フォトカード',        price: 3500,  is_exchange_only: false, condition: 'like_new', primary_image_url: 'https://picsum.photos/seed/bts1/400/400',    seller_name: 'haruka_oshi',  seller_score: 98,  rarity_score: 90, rarity_label: 'super_rare', suggested_price: 3200,  demand_forecast_30d: 42, artist_name: 'BTS',          transaction_type: 'sale',           ai_authenticated: true,  ai_auth_score: 99 },
  { id: 'dummy-2',  title: 'NewJeans ハニ 缶バッジ セット OMG ver.',              price: null,  is_exchange_only: true,  condition: 'new',      primary_image_url: 'https://picsum.photos/seed/nj2/400/400',     seller_name: 'mochi_hani',   seller_score: 95,  rarity_score: 75, rarity_label: 'rare',       suggested_price: null,  demand_forecast_30d: 35, artist_name: 'NewJeans',     transaction_type: 'exchange',       ai_authenticated: true,  ai_auth_score: 96 },
  { id: 'dummy-3',  title: 'TWICE サナ トレカ READY TO BE ツアーグッズ',          price: 2800,  is_exchange_only: false, condition: 'good',     primary_image_url: 'https://picsum.photos/seed/twice3/400/400',  seller_name: 'sana_love',    seller_score: 100, rarity_score: 60, rarity_label: 'uncommon',   suggested_price: 2500,  demand_forecast_30d: 28, artist_name: 'TWICE',        transaction_type: 'sale',           ai_authenticated: false, ai_auth_score: null },
  { id: 'dummy-4',  title: 'aespa カリナ うちわ SMTOWN LIVE 2024',               price: 1500,  is_exchange_only: false, condition: 'good',     primary_image_url: 'https://picsum.photos/seed/aespa4/400/400',  seller_name: 'karina_fan',   seller_score: 92,  rarity_score: 40, rarity_label: 'common',     suggested_price: 1800,  demand_forecast_30d: 19, artist_name: 'aespa',        transaction_type: 'sale',           ai_authenticated: false, ai_auth_score: null },
  { id: 'dummy-5',  title: 'STRAY KIDS リノ ブロマイド MANIAC 会場限定',          price: 4200,  is_exchange_only: false, condition: 'new',      primary_image_url: 'https://picsum.photos/seed/skz5/400/400',    seller_name: 'stay_rino',    seller_score: 97,  rarity_score: 85, rarity_label: 'rare',       suggested_price: 4000,  demand_forecast_30d: 55, artist_name: 'STRAY KIDS',   transaction_type: 'sale',           ai_authenticated: true,  ai_auth_score: 98 },
  { id: 'dummy-6',  title: 'IVE ウォニョン フォトカード LOVE DIVE',               price: 2200,  is_exchange_only: false, condition: 'like_new', primary_image_url: 'https://picsum.photos/seed/ive6/400/400',    seller_name: 'wonyo_pic',    seller_score: 99,  rarity_score: 70, rarity_label: 'rare',       suggested_price: 2000,  demand_forecast_30d: 33, artist_name: 'IVE',          transaction_type: 'sale',           ai_authenticated: true,  ai_auth_score: 97 },
  { id: 'dummy-7',  title: 'LE SSERAFIM サクラ タオル FEARLESS ツアー',           price: 3000,  is_exchange_only: false, condition: 'new',      primary_image_url: 'https://picsum.photos/seed/lsf7/400/400',    seller_name: 'sakura_07',    seller_score: 94,  rarity_score: 50, rarity_label: 'uncommon',   suggested_price: 2800,  demand_forecast_30d: 22, artist_name: 'LE SSERAFIM',  transaction_type: 'sale',           ai_authenticated: false, ai_auth_score: null },
  { id: 'dummy-8',  title: '【現地交換】ILLIT ミンジュ ポラロイド SUPER REAL ME', price: null,  is_exchange_only: false, condition: 'new',      primary_image_url: 'https://picsum.photos/seed/illit8/400/400',  seller_name: 'minju_minju',  seller_score: 88,  rarity_score: 95, rarity_label: 'super_rare', suggested_price: null,  demand_forecast_30d: 61, artist_name: 'ILLIT',        transaction_type: 'local_exchange', ai_authenticated: true,  ai_auth_score: 100 },
  { id: 'dummy-9',  title: 'Kep1er マシロ 缶バッジ FIRST IMPACT',               price: 800,   is_exchange_only: false, condition: 'good',     primary_image_url: 'https://picsum.photos/seed/kep9/400/400',    seller_name: 'mashiro_jp',   seller_score: 91,  rarity_score: 30, rarity_label: 'common',     suggested_price: 1000,  demand_forecast_30d: 8,  artist_name: 'Kep1er',       transaction_type: 'sale',           ai_authenticated: false, ai_auth_score: null },
  { id: 'dummy-10', title: 'ENHYPEN ニキ フォトカード BORDER: DAY ONE',          price: 1800,  is_exchange_only: false, condition: 'like_new', primary_image_url: 'https://picsum.photos/seed/en10/400/400',    seller_name: 'en_niki',      seller_score: 96,  rarity_score: 65, rarity_label: 'uncommon',   suggested_price: 1600,  demand_forecast_30d: 25, artist_name: 'ENHYPEN',      transaction_type: 'sale',           ai_authenticated: true,  ai_auth_score: 95 },
  { id: 'dummy-11', title: 'TOMORROW X TOGETHER テヒョン うちわ 名古屋公演',     price: 2500,  is_exchange_only: false, condition: 'good',     primary_image_url: 'https://picsum.photos/seed/txt11/400/400',   seller_name: 'moa_taehyun',  seller_score: 93,  rarity_score: 45, rarity_label: 'common',     suggested_price: 2200,  demand_forecast_30d: 15, artist_name: 'TXT',          transaction_type: 'sale',           ai_authenticated: false, ai_auth_score: null },
  { id: 'dummy-12', title: 'SEVENTEEN ウジ ブロマイド BE THE SUN ソウル公演',    price: 5500,  is_exchange_only: false, condition: 'new',      primary_image_url: 'https://picsum.photos/seed/svt12/400/400',   seller_name: 'woozi_carat',  seller_score: 100, rarity_score: 88, rarity_label: 'super_rare', suggested_price: 5000,  demand_forecast_30d: 48, artist_name: 'SEVENTEEN',    transaction_type: 'sale',           ai_authenticated: true,  ai_auth_score: 99 },
] as const

type DummyListing = typeof DUMMY_LISTINGS[number]
type AnyListing = DummyListing | Record<string, unknown>

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    sort?: string
    type?: string
    condition?: string
    min?: string
    max?: string
    page?: string
  }>
}

const SORT_OPTIONS = [
  { value: 'new',      label: '新着順' },
  { value: 'price_asc',label: '価格が低い順' },
  { value: 'price_desc',label: '価格が高い順' },
  { value: 'demand',   label: '人気順' },
  { value: 'rarity',   label: '希少度順' },
]

const TX_OPTIONS = [
  { value: '',               label: 'すべて' },
  { value: 'sale',           label: '販売のみ' },
  { value: 'exchange',       label: '交換のみ' },
  { value: 'local_exchange', label: '現地交換' },
]

const CONDITION_OPTIONS = [
  { value: '',         label: 'すべて' },
  { value: 'new',      label: '新品' },
  { value: 'like_new', label: '未使用に近い' },
  { value: 'good',     label: '良好' },
  { value: 'fair',     label: 'やや傷あり' },
]

const PAGE_SIZE = 20

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const q         = params.q ?? ''
  const category  = params.category ?? ''
  const sort      = params.sort ?? 'new'
  const type      = params.type ?? ''
  const condition = params.condition ?? ''
  const minPrice  = params.min ? Number(params.min) : null
  const maxPrice  = params.max ? Number(params.max) : null
  const page      = params.page ? Number(params.page) : 1

  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to   = from + PAGE_SIZE - 1

  let query = supabase
    .from('v_active_listings')
    .select('*', { count: 'exact' })
    .range(from, to)

  if (q) query = query.textSearch('search_vector', q, { type: 'websearch' })
  if (category) query = query.eq('category_slug', category)
  if (type) query = query.eq('transaction_type', type)
  if (condition) query = query.eq('condition', condition)
  if (minPrice) query = query.gte('price', minPrice)
  if (maxPrice) query = query.lte('price', maxPrice)

  switch (sort) {
    case 'price_asc':  query = query.order('price', { ascending: true, nullsFirst: false }); break
    case 'price_desc': query = query.order('price', { ascending: false, nullsFirst: false }); break
    case 'demand':     query = query.order('demand_forecast_30d', { ascending: false }); break
    case 'rarity':     query = query.order('rarity_score', { ascending: false }); break
    default:           query = query.order('created_at', { ascending: false })
  }

  const { data: rawListings, count: rawCount } = await query

  /* DBが空ならダミーデータにフォールバック */
  const isDummy = !rawListings || rawListings.length === 0
  const listings: AnyListing[] = isDummy ? [...DUMMY_LISTINGS] : rawListings
  const count = isDummy ? DUMMY_LISTINGS.length : rawCount
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  function buildUrl(overrides: Record<string, string | number | undefined>) {
    const p = new URLSearchParams()
    const merged = { q, category, sort, type, condition, min: params.min, max: params.max, ...overrides }
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, String(v)) })
    return `/search?${p.toString()}`
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex gap-6">

        {/* ---- サイドバー（フィルター） ---- */}
        <aside className="w-56 flex-shrink-0 hidden md:block space-y-6">

          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">並び替え</h3>
            <div className="space-y-1">
              {SORT_OPTIONS.map((opt) => (
                <a
                  key={opt.value}
                  href={buildUrl({ sort: opt.value, page: 1 })}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors
                    ${sort === opt.value ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {opt.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">取引種別</h3>
            <div className="space-y-1">
              {TX_OPTIONS.map((opt) => (
                <a
                  key={opt.value}
                  href={buildUrl({ type: opt.value, page: 1 })}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors
                    ${type === opt.value ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {opt.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">商品の状態</h3>
            <div className="space-y-1">
              {CONDITION_OPTIONS.map((opt) => (
                <a
                  key={opt.value}
                  href={buildUrl({ condition: opt.value, page: 1 })}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors
                    ${condition === opt.value ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {opt.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">価格帯</h3>
            <form method="get" action="/search" className="space-y-2">
              {q && <input type="hidden" name="q" value={q} />}
              {category && <input type="hidden" name="category" value={category} />}
              {sort && <input type="hidden" name="sort" value={sort} />}
              {type && <input type="hidden" name="type" value={type} />}
              {condition && <input type="hidden" name="condition" value={condition} />}
              <div className="flex items-center gap-2">
                <input
                  name="min"
                  type="number"
                  defaultValue={params.min}
                  placeholder="¥0"
                  min={0}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
                <span className="text-gray-400 text-xs flex-shrink-0">〜</span>
                <input
                  name="max"
                  type="number"
                  defaultValue={params.max}
                  placeholder="上限なし"
                  min={0}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gray-800 text-white text-xs py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
              >
                絞り込む
              </button>
            </form>
          </div>
        </aside>

        {/* ---- メインコンテンツ ---- */}
        <div className="flex-1 min-w-0">

          {/* 検索ヘッダー */}
          <div className="flex items-center justify-between mb-4">
            <div>
              {q ? (
                <h1 className="text-lg font-bold text-[#333333]">
                  「{q}」の検索結果
                  <span className="text-sm font-normal text-gray-400 ml-2">{count?.toLocaleString()}件</span>
                </h1>
              ) : category ? (
                <h1 className="text-lg font-bold text-[#333333]">
                  カテゴリ：{category}
                  <span className="text-sm font-normal text-gray-400 ml-2">{count?.toLocaleString()}件</span>
                  {isDummy && <span className="text-xs text-pink-400 ml-2 font-normal">（サンプル表示中）</span>}
                </h1>
              ) : (
                <h1 className="text-lg font-bold text-[#333333]">
                  すべての出品
                  <span className="text-sm font-normal text-gray-400 ml-2">{count?.toLocaleString()}件</span>
                  {isDummy && <span className="text-xs text-pink-400 ml-2 font-normal">（サンプル表示中）</span>}
                </h1>
              )}
            </div>

            {/* モバイル用ソート */}
            <Suspense fallback={null}>
              <SortSelect sort={sort} options={SORT_OPTIONS} />
            </Suspense>
          </div>

          {/* フィルタータグ */}
          {(q || category || type || condition || minPrice || maxPrice) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {q && <FilterTag label={`"${q}"`} href={buildUrl({ q: '', page: 1 })} />}
              {type && <FilterTag label={TX_OPTIONS.find(o => o.value === type)?.label ?? type} href={buildUrl({ type: '', page: 1 })} />}
              {condition && <FilterTag label={CONDITION_OPTIONS.find(o => o.value === condition)?.label ?? condition} href={buildUrl({ condition: '', page: 1 })} />}
              {(minPrice || maxPrice) && (
                <FilterTag
                  label={`¥${minPrice ?? 0}〜${maxPrice ? '¥' + maxPrice : ''}`}
                  href={buildUrl({ min: '', max: '', page: 1 })}
                />
              )}
            </div>
          )}

          {/* 商品グリッド */}
          {listings && listings.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {listings.map((listing) => {
                  const l = listing as DummyListing
                  return (
                  <ListingCard
                    key={l.id}
                    id={l.id}
                    title={l.title}
                    price={l.price ?? null}
                    isExchangeOnly={l.is_exchange_only}
                    condition={l.condition}
                    primaryImageUrl={l.primary_image_url ?? null}
                    sellerName={l.seller_name ?? ''}
                    sellerScore={l.seller_score ?? 100}
                    rarityScore={l.rarity_score ?? null}
                    rarityLabel={l.rarity_label ?? null}
                    suggestedPrice={l.suggested_price ?? null}
                    demandForecast={l.demand_forecast_30d ?? null}
                    artistName={l.artist_name ?? null}
                    transactionType={l.transaction_type as 'sale' | 'exchange' | 'local_exchange'}
                    aiAuthenticated={(l as DummyListing).ai_authenticated ?? null}
                    aiAuthScore={(l as DummyListing).ai_auth_score ?? null}
                  />
                  )
                })}
              </div>

              {/* ページネーション */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {page > 1 && (
                    <a href={buildUrl({ page: page - 1 })}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                      ← 前へ
                    </a>
                  )}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = Math.max(1, page - 2) + i
                    if (p > totalPages) return null
                    return (
                      <a
                        key={p}
                        href={buildUrl({ page: p })}
                        className={`px-4 py-2 border rounded-lg text-sm transition-colors
                          ${p === page ? 'bg-primary-500 border-primary-500 text-white' : 'border-gray-200 hover:bg-gray-50'}`}
                      >
                        {p}
                      </a>
                    )
                  })}
                  {page < totalPages && (
                    <a href={buildUrl({ page: page + 1 })}
                      className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">
                      次へ →
                    </a>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8" stroke="#7dd3fc" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-base font-medium text-[#555555]">
                {q ? `「${q}」に一致する商品が見つかりませんでした` : '出品がありません'}
              </p>
              <p className="text-sm mt-2 text-[#888888]">キーワードを変えて検索してみてください</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FilterTag({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-1 bg-primary-50 text-primary-600 border border-primary-200
                 rounded-full px-3 py-1 text-xs hover:bg-primary-100 transition-colors"
    >
      {label} <span className="text-primary-400">×</span>
    </a>
  )
}
