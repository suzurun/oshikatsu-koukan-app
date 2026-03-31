import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { useRouter } from 'expo-router'

const RARITY_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  super_rare: { label: '超希少', bg: '#fef08a', color: '#713f12' },
  rare:       { label: '希少',   bg: '#a855f7', color: '#fff' },
  uncommon:   { label: 'やや希少', bg: '#60a5fa', color: '#fff' },
  common:     { label: '',       bg: '',        color: '' },
}

const TX_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  sale:          { label: '販売',     bg: '#dcfce7', color: '#166534' },
  exchange:      { label: '交換',     bg: '#dbeafe', color: '#1e40af' },
  local_exchange:{ label: '現地',     bg: '#ffedd5', color: '#9a3412' },
}

interface Props {
  listing: Record<string, unknown>
  compact?: boolean
}

export function MobileListingCard({ listing, compact = false }: Props) {
  const router = useRouter()
  const rarity  = RARITY_BADGE[String(listing.rarity_label ?? 'common')]
  const txBadge = TX_BADGE[String(listing.transaction_type ?? 'sale')]

  const price        = listing.price as number | null
  const suggestedPrice = listing.suggested_price as number | null
  const isPriceHigh  = price && suggestedPrice && price > suggestedPrice * 1.5
  const isPriceLow   = price && suggestedPrice && price < suggestedPrice * 0.6
  const demand       = listing.demand_forecast_30d as number | null

  const cardStyle = compact ? styles.compactCard : styles.card

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={() => router.push(`/listings/${listing.id}`)}
      activeOpacity={0.85}
    >
      {/* 商品画像 */}
      <View style={compact ? styles.compactImageWrap : styles.imageWrap}>
        {listing.primary_image_url ? (
          <Image
            source={{ uri: String(listing.primary_image_url) }}
            style={compact ? styles.compactImage : styles.image}
          />
        ) : (
          <View style={[compact ? styles.compactImage : styles.image, styles.noImage]}>
            <Text style={styles.noImageIcon}>🎁</Text>
          </View>
        )}

        {/* 希少バッジ */}
        {rarity.label ? (
          <View style={[styles.badge, { backgroundColor: rarity.bg, top: 6, left: 6 }]}>
            <Text style={[styles.badgeText, { color: rarity.color }]}>{rarity.label}</Text>
          </View>
        ) : null}

        {/* 取引種別 */}
        <View style={[styles.badge, { backgroundColor: txBadge.bg, top: 6, right: 6 }]}>
          <Text style={[styles.badgeText, { color: txBadge.color }]}>{txBadge.label}</Text>
        </View>
      </View>

      {/* 情報 */}
      <View style={styles.info}>
        {listing.artist_name ? (
          <Text style={styles.artist} numberOfLines={1}>{String(listing.artist_name)}</Text>
        ) : null}

        <Text style={styles.title} numberOfLines={2}>{String(listing.title ?? '')}</Text>

        {/* 価格 */}
        <View style={styles.priceRow}>
          {listing.is_exchange_only ? (
            <Text style={styles.exchangeLabel}>交換希望</Text>
          ) : price ? (
            <>
              <Text style={styles.price}>¥{price.toLocaleString()}</Text>
              {isPriceHigh && <Text style={styles.highTag}>⚠高め</Text>}
              {isPriceLow  && <Text style={styles.lowTag}>💙お得</Text>}
            </>
          ) : (
            <Text style={styles.noPrice}>価格未定</Text>
          )}
        </View>

        {/* AI推奨価格バー */}
        {suggestedPrice && price && !compact && (
          <View style={styles.aiBar}>
            <View style={styles.aiBarTrack}>
              <View
                style={[
                  styles.aiBarFill,
                  {
                    width: `${Math.min(100, (price / (suggestedPrice * 1.5)) * 100)}%`,
                    backgroundColor: isPriceHigh ? '#f87171' : isPriceLow ? '#60a5fa' : '#4ade80',
                  },
                ]}
              />
            </View>
            <Text style={styles.aiPrice}>推奨¥{suggestedPrice.toLocaleString()}</Text>
          </View>
        )}

        {/* 需要表示 */}
        {demand && demand > 10 && !compact && (
          <Text style={styles.demand}>🔥 {demand}人が探してる</Text>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  compactCard: {
    backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#f3f4f6', width: 140,
  },
  imageWrap: { position: 'relative' },
  compactImageWrap: { position: 'relative' },
  image: { width: '100%', aspectRatio: 1, resizeMode: 'cover' },
  compactImage: { width: 140, height: 140, resizeMode: 'cover' },
  noImage: { backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' },
  noImageIcon: { fontSize: 32 },
  badge: {
    position: 'absolute', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { fontSize: 9, fontWeight: '700' },
  info: { padding: 8, gap: 3 },
  artist: { fontSize: 10, color: '#e91e8c', fontWeight: '600' },
  title: { fontSize: 12, color: '#1a1a1a', fontWeight: '500', lineHeight: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  price: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a' },
  exchangeLabel: { fontSize: 12, fontWeight: 'bold', color: '#3b82f6' },
  noPrice: { fontSize: 11, color: '#9ca3af' },
  highTag: { fontSize: 9, color: '#ef4444' },
  lowTag: { fontSize: 9, color: '#3b82f6' },
  aiBar: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  aiBarTrack: {
    flex: 1, height: 3, backgroundColor: '#f3f4f6',
    borderRadius: 2, overflow: 'hidden',
  },
  aiBarFill: { height: '100%', borderRadius: 2 },
  aiPrice: { fontSize: 9, color: '#9ca3af' },
  demand: { fontSize: 10, color: '#e91e8c', fontWeight: '500' },
})
