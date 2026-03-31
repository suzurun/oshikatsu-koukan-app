'use client'

import type { PriceAnalysisResponse } from '@oshikatsu/types'

interface AiPricePanelProps {
  loading: boolean
  result: PriceAnalysisResponse | null
  onApplyPrice: (price: number) => void
}

const RARITY_CONFIG = {
  common:     { label: '大量流通品', color: 'bg-gray-100 text-gray-600',       bar: 'w-1/4 bg-gray-400' },
  uncommon:   { label: 'やや希少',   color: 'bg-blue-100 text-blue-700',       bar: 'w-2/4 bg-blue-400' },
  rare:       { label: '希少品',     color: 'bg-purple-100 text-purple-700',   bar: 'w-3/4 bg-purple-500' },
  super_rare: { label: '超希少',     color: 'bg-yellow-100 text-yellow-700',   bar: 'w-full bg-yellow-500' },
}

const TREND_CONFIG = {
  rising:  { label: '↑ 価格上昇中', color: 'text-red-500' },
  stable:  { label: '→ 価格安定',   color: 'text-gray-500' },
  falling: { label: '↓ 価格下落中', color: 'text-blue-500' },
}

export function AiPricePanel({ loading, result, onApplyPrice }: AiPricePanelProps) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="font-medium text-purple-700">AIが相場を分析中...</p>
            <p className="text-xs text-purple-400 mt-0.5">
              全プラットフォームの価格データを収集しています
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!result) return null

  const { analysis, marketData, productName } = result
  const rarity = RARITY_CONFIG[analysis.rarityLabel ?? 'common']
  const trend = analysis.priceTrend ? TREND_CONFIG[analysis.priceTrend] : null

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-5 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <span className="font-bold text-purple-700">AI相場分析</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rarity.color}`}>
            {rarity.label}
          </span>
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend.color}`}>{trend.label}</span>
        )}
      </div>

      {/* 商品名 */}
      {productName && (
        <p className="text-sm text-gray-600">
          <span className="font-medium">認識結果:</span> {productName}
        </p>
      )}

      {/* 価格3パターン */}
      <div className="grid grid-cols-3 gap-3">
        <PriceCard
          label="早期売却価格"
          price={analysis.earlyBirdPrice}
          description="すぐに売れる価格"
          variant="default"
          onApply={onApplyPrice}
        />
        <PriceCard
          label="推奨価格"
          price={analysis.suggestedPrice}
          description="市場相場の中央値"
          variant="recommended"
          onApply={onApplyPrice}
        />
        <PriceCard
          label="プレミア価格"
          price={analysis.premiumPrice}
          description="希少性を反映した上限"
          variant="premium"
          onApply={onApplyPrice}
        />
      </div>

      {/* 希少性スコア */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>希少性スコア</span>
          <span className="font-bold text-purple-600">{analysis.rarityScore} / 100</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-700"
            style={{ width: `${analysis.rarityScore}%` }}
          />
        </div>
      </div>

      {/* 需要予測 */}
      <div className="flex items-center justify-between bg-white/60 rounded-lg px-4 py-2">
        <span className="text-sm text-gray-600">今後30日の推定需要</span>
        <span className="font-bold text-pink-600 text-lg">
          約{analysis.demandForecast30d?.toLocaleString() ?? '-'}人
        </span>
      </div>

      {/* 他プラットフォーム相場 */}
      {marketData && marketData.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">他プラットフォームの相場</p>
          <div className="space-y-1">
            {marketData.slice(0, 4).map((d, i) => (
              <div key={i} className="flex justify-between text-xs bg-white/50 rounded px-3 py-1.5">
                <span className="text-gray-500">{d.platform}</span>
                <span className="font-medium">
                  {d.currency === 'JPY' ? `¥${d.price.toLocaleString()}` : `$${d.price}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        信頼度 {Math.round((analysis.confidenceScore ?? 0) * 100)}% ·
        複数プラットフォームのデータを元にAIが算出
      </p>
    </div>
  )
}

function PriceCard({
  label,
  price,
  description,
  variant,
  onApply,
}: {
  label: string
  price: number | null | undefined
  description: string
  variant: 'default' | 'recommended' | 'premium'
  onApply: (price: number) => void
}) {
  const styles = {
    default:     'border-gray-200 bg-white',
    recommended: 'border-primary-300 bg-primary-50 ring-1 ring-primary-300',
    premium:     'border-yellow-200 bg-yellow-50',
  }

  return (
    <div className={`border rounded-lg p-3 text-center ${styles[variant]}`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-900">
        {price ? `¥${price.toLocaleString()}` : '—'}
      </p>
      <p className="text-xs text-gray-400 mb-2">{description}</p>
      {price && (
        <button
          type="button"
          onClick={() => onApply(price)}
          className="text-xs bg-gray-800 text-white px-2.5 py-1 rounded-full hover:bg-gray-700 transition-colors"
        >
          この価格を使う
        </button>
      )}
    </div>
  )
}
