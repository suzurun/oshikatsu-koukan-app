import Link from 'next/link'

interface ListingCardProps {
  id: string
  title: string
  price: number | null
  isExchangeOnly: boolean
  condition: string
  primaryImageUrl: string | null
  sellerName: string
  sellerScore: number
  rarityScore?: number | null
  rarityLabel?: string | null
  suggestedPrice?: number | null
  demandForecast?: number | null
  artistName?: string | null
  transactionType: 'sale' | 'exchange' | 'local_exchange'
  aiAuthenticated?: boolean | null
  aiAuthScore?: number | null
}

const RARITY_BADGE: Record<string, { label: string; cls: string }> = {
  super_rare: { label: '超希少', cls: 'bg-yellow-400 text-yellow-900' },
  rare:       { label: '希少',   cls: 'bg-purple-500 text-white' },
  uncommon:   { label: 'やや希少', cls: 'bg-blue-400 text-white' },
  common:     { label: '',       cls: '' },
}

const CONDITION_LABEL: Record<string, string> = {
  new:      '新品',
  like_new: '未使用に近い',
  good:     '良好',
  fair:     'やや傷あり',
  poor:     '傷あり',
}

const TX_BADGE: Record<string, { label: string; cls: string }> = {
  sale:          { label: '販売',     cls: 'bg-green-100 text-green-700' },
  exchange:      { label: '交換',     cls: 'bg-blue-100 text-blue-700' },
  local_exchange:{ label: '現地交換', cls: 'bg-orange-100 text-orange-700' },
}

export function ListingCard({
  id, title, price, isExchangeOnly, condition,
  primaryImageUrl, sellerName, sellerScore,
  rarityScore, rarityLabel, suggestedPrice, demandForecast,
  artistName, transactionType, aiAuthenticated, aiAuthScore,
}: ListingCardProps) {
  const rarity = rarityLabel ? RARITY_BADGE[rarityLabel] : null
  const txBadge = TX_BADGE[transactionType]

  // AI価格と出品価格の乖離を検出（ぼったくり警告）
  const isPriceHigh = price && suggestedPrice && price > suggestedPrice * 1.5
  const isPriceLow  = price && suggestedPrice && price < suggestedPrice * 0.6

  return (
    <Link href={`/listings/${id}`} className="group block">
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden
                      hover:shadow-md hover:border-primary-200 transition-all duration-200">

        {/* 商品画像 */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {primaryImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
              🎁
            </div>
          )}

          {/* 希少性バッジ */}
          {rarity && rarity.label && (
            <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${rarity.cls}`}>
              {rarity.label}
            </span>
          )}

          {/* 取引種別バッジ */}
          <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${txBadge.cls}`}>
            {txBadge.label}
          </span>

          {/* AI鑑定済みバッジ */}
          {aiAuthenticated && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1
                            bg-gradient-to-r from-teal-500/90 to-cyan-500/90
                            backdrop-blur-sm px-2 py-1">
              {/* シールドアイコン */}
              <svg className="w-3.5 h-3.5 text-white flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                <path d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" fill="white"/>
              </svg>
              <span className="text-white text-xs font-bold tracking-wide">AI鑑定済み</span>
              {aiAuthScore && (
                <span className="ml-auto text-white/90 text-xs font-medium">
                  {aiAuthScore}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* 商品情報 */}
        <div className="p-3 space-y-1.5">
          {/* アーティスト名 */}
          {artistName && (
            <p className="text-xs text-primary-500 font-medium truncate">{artistName}</p>
          )}

          {/* タイトル */}
          <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
            {title}
          </p>

          {/* 状態 */}
          <p className="text-xs text-gray-400">
            {CONDITION_LABEL[condition] ?? condition}
          </p>

          {/* 価格 */}
          <div className="flex items-baseline gap-1.5">
            {isExchangeOnly ? (
              <span className="text-sm font-bold text-blue-600">交換希望</span>
            ) : price ? (
              <>
                <span className="text-base font-bold text-gray-900">
                  ¥{price.toLocaleString()}
                </span>
                {isPriceHigh && (
                  <span className="text-xs text-red-400" title={`AI推奨: ¥${suggestedPrice?.toLocaleString()}`}>
                    ⚠ 高め
                  </span>
                )}
                {isPriceLow && (
                  <span className="text-xs text-blue-400" title={`AI推奨: ¥${suggestedPrice?.toLocaleString()}`}>
                    💙 お得
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm text-gray-400">価格未定</span>
            )}
          </div>

          {/* AI価格インジケーター */}
          {suggestedPrice && price && (
            <div className="flex items-center gap-1">
              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isPriceHigh ? 'bg-red-400' : isPriceLow ? 'bg-blue-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${Math.min(100, (price / (suggestedPrice * 1.5)) * 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-400">
                AI推奨 ¥{suggestedPrice.toLocaleString()}
              </span>
            </div>
          )}

          {/* 需要・信用スコア */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-400">
              信頼度 {sellerScore}%
            </span>
            {demandForecast && demandForecast > 10 && (
              <span className="text-xs text-pink-500 font-medium">
                🔥 {demandForecast}人が探してる
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
