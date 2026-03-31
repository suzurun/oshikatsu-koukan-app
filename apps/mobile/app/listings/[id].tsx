import { useState, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@oshikatsu/api-client'

const CONDITION_LABELS: Record<string, string> = {
  new:      '新品',
  like_new: '未使用に近い',
  good:     '良好',
  fair:     'やや傷あり',
  poor:     '傷・汚れあり',
}

const TX_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  sale:          { label: '販売',  bg: '#dcfce7', color: '#166534' },
  exchange:      { label: '交換',  bg: '#dbeafe', color: '#1e40af' },
  local_exchange:{ label: '現地', bg: '#ffedd5', color: '#9a3412' },
}

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [listing, setListing] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [{ data: l }, { data: { user } }] = await Promise.all([
        supabase.from('v_active_listings').select('*').eq('id', id).maybeSingle(),
        supabase.auth.getUser(),
      ])
      setListing(l)
      setCurrentUserId(user?.id ?? null)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleRequest(type: 'sale' | 'exchange') {
    if (!currentUserId) {
      router.push('/auth/login')
      return
    }
    setRequesting(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-transaction', {
        body: { listingId: id, type },
      })
      if (error) throw error
      router.push(`/transactions/${data.id}`)
    } catch (e) {
      Alert.alert('エラー', e instanceof Error ? e.message : '申請に失敗しました')
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e91e8c" />
      </View>
    )
  }

  if (!listing) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFoundText}>商品が見つかりません</Text>
      </View>
    )
  }

  const price     = listing.price as number | null
  const suggested = listing.suggested_price as number | null
  const demand    = listing.demand_forecast_30d as number | null
  const txBadge   = TX_BADGE[String(listing.transaction_type ?? 'sale')]
  const isMine    = listing.seller_id === currentUserId
  const isPriceHigh = price && suggested && price > suggested * 1.5
  const isPriceLow  = price && suggested && price < suggested * 0.6

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* 商品画像 */}
      <View style={styles.imageWrap}>
        {listing.primary_image_url ? (
          <Image source={{ uri: String(listing.primary_image_url) }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.noImage]}>
            <Text style={{ fontSize: 64 }}>🎁</Text>
          </View>
        )}
        <View style={[styles.txBadge, { backgroundColor: txBadge.bg }]}>
          <Text style={[styles.txBadgeText, { color: txBadge.color }]}>{txBadge.label}</Text>
        </View>
      </View>

      <View style={styles.body}>

        {/* タイトル */}
        {listing.artist_name && (
          <Text style={styles.artist}>{String(listing.artist_name)}</Text>
        )}
        <Text style={styles.title}>{String(listing.title ?? '')}</Text>
        <Text style={styles.condition}>
          {CONDITION_LABELS[String(listing.condition ?? 'good')]}
        </Text>

        {/* 価格 */}
        <View style={styles.priceBox}>
          {listing.is_exchange_only ? (
            <Text style={styles.exchangeOnly}>交換のみ</Text>
          ) : price ? (
            <>
              <View style={styles.priceRow}>
                <Text style={styles.price}>¥{price.toLocaleString()}</Text>
                {isPriceHigh && <Text style={styles.highTag}>⚠ 相場より高め</Text>}
                {isPriceLow  && <Text style={styles.lowTag}>💙 お得価格</Text>}
              </View>
              {suggested && (
                <View style={styles.aiBarRow}>
                  <View style={styles.aiBarTrack}>
                    <View style={[
                      styles.aiBarFill,
                      {
                        width: `${Math.min(100, (price / (suggested * 1.5)) * 100)}%` as `${number}%`,
                        backgroundColor: isPriceHigh ? '#f87171' : isPriceLow ? '#60a5fa' : '#4ade80',
                      },
                    ]} />
                  </View>
                  <Text style={styles.aiPrice}>推奨¥{suggested.toLocaleString()}</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.noPrice}>価格未定</Text>
          )}
          {demand && demand > 5 && (
            <Text style={styles.demand}>🔥 {demand}人が探しています</Text>
          )}
        </View>

        {/* 出品者 */}
        <View style={styles.sellerRow}>
          <View style={styles.sellerAvatar}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
              {String(listing.seller_name ?? '?')[0]}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sellerName}>{String(listing.seller_name ?? '出品者')}</Text>
            <Text style={styles.sellerScore}>信頼スコア: {listing.seller_score ?? '--'}</Text>
          </View>
        </View>

        {/* 説明 */}
        {listing.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>商品説明</Text>
            <Text style={styles.description}>{String(listing.description)}</Text>
          </View>
        )}

        {/* アクションボタン */}
        {!isMine && (
          <View style={styles.actions}>
            {!listing.is_exchange_only && listing.transaction_type !== 'exchange' && (
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary, requesting && styles.btnDisabled]}
                onPress={() => handleRequest('sale')}
                disabled={requesting}
              >
                <Text style={styles.btnPrimaryText}>
                  {requesting ? '処理中...' : price ? `¥${price.toLocaleString()} で購入申請` : '購入申請'}
                </Text>
              </TouchableOpacity>
            )}
            {(listing.transaction_type === 'exchange' || listing.transaction_type === 'local_exchange') && (
              <TouchableOpacity
                style={[styles.btn, styles.btnBlue, requesting && styles.btnDisabled]}
                onPress={() => handleRequest('exchange')}
                disabled={requesting}
              >
                <Text style={styles.btnBlueText}>
                  {requesting ? '処理中...' : '交換申請'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {isMine && (
          <View style={styles.mineBox}>
            <Text style={styles.mineText}>自分の出品です</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 14, color: '#9ca3af' },
  imageWrap: { position: 'relative' },
  image: { width: '100%', aspectRatio: 1, resizeMode: 'cover' },
  noImage: { backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' },
  txBadge: {
    position: 'absolute', bottom: 12, left: 12,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  txBadgeText: { fontSize: 11, fontWeight: '700' },
  body: { padding: 16, gap: 12 },
  artist: { fontSize: 12, color: '#e91e8c', fontWeight: '600' },
  title:  { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', lineHeight: 24 },
  condition: { fontSize: 12, color: '#6b7280' },
  priceBox: {
    backgroundColor: '#f9fafb', borderRadius: 14, padding: 14, gap: 6,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price:    { fontSize: 28, fontWeight: '900', color: '#1a1a1a' },
  exchangeOnly: { fontSize: 18, fontWeight: 'bold', color: '#3b82f6' },
  noPrice:  { fontSize: 14, color: '#9ca3af' },
  highTag:  { fontSize: 10, color: '#ef4444', backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  lowTag:   { fontSize: 10, color: '#3b82f6', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  aiBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiBarTrack: { flex: 1, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden' },
  aiBarFill:  { height: '100%', borderRadius: 2 },
  aiPrice:    { fontSize: 10, color: '#9ca3af' },
  demand:     { fontSize: 12, color: '#e91e8c', fontWeight: '500' },
  sellerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 12,
  },
  sellerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#e91e8c', alignItems: 'center', justifyContent: 'center',
  },
  sellerName:  { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  sellerScore: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  section: { gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#374151' },
  description:  { fontSize: 13, color: '#4b5563', lineHeight: 20 },
  actions: { gap: 10, marginTop: 8 },
  btn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnPrimary: { backgroundColor: '#e91e8c' },
  btnBlue:    { backgroundColor: '#3b82f6' },
  btnDisabled:{ opacity: 0.5 },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  btnBlueText:    { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  mineBox: {
    backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fde68a',
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  mineText: { fontSize: 13, color: '#92400e' },
})
