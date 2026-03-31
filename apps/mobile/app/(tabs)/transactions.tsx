import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@oshikatsu/api-client'

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  requested:        { label: '申請中',      bg: '#fef9c3', color: '#854d0e' },
  agreed:           { label: '合意済み',     bg: '#dbeafe', color: '#1e40af' },
  kyc_required:     { label: '本人確認待ち', bg: '#ffedd5', color: '#9a3412' },
  deposit_held:     { label: '決済済み',     bg: '#ede9fe', color: '#6d28d9' },
  shipping_unlocked:{ label: '発送解禁',     bg: '#e0e7ff', color: '#3730a3' },
  shipped_by_seller:{ label: '発送済み',     bg: '#cffafe', color: '#0e7490' },
  shipped_by_buyer: { label: '発送済み',     bg: '#cffafe', color: '#0e7490' },
  both_shipped:     { label: '双方発送済み', bg: '#cffafe', color: '#0e7490' },
  delivered:        { label: '配達済み',     bg: '#d1fae5', color: '#065f46' },
  receipt_confirmed:{ label: '受取確認済み', bg: '#bbf7d0', color: '#166534' },
  completed:        { label: '完了',        bg: '#dcfce7', color: '#15803d' },
  cancelled:        { label: 'キャンセル',   bg: '#f3f4f6', color: '#6b7280' },
  auto_cancelled:   { label: '自動キャンセル', bg: '#f3f4f6', color: '#6b7280' },
  disputed:         { label: '紛争中',      bg: '#fee2e2', color: '#dc2626' },
  dispute_resolved: { label: '解決済み',    bg: '#f3f4f6', color: '#6b7280' },
}

type TabMode = 'buying' | 'selling'

export default function TransactionsTab() {
  const router = useRouter()
  const [mode, setMode] = useState<TabMode>('buying')
  const [buyingTxs, setBuyingTxs] = useState<Record<string, unknown>[]>([])
  const [sellingTxs, setSellingTxs] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const fetchTransactions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUserId(user.id)

    const [buyRes, sellRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('id, status, transaction_type, agreed_price, created_at, listing_id, seller_id')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('transactions')
        .select('id, status, transaction_type, agreed_price, created_at, listing_id, buyer_id')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    // listing タイトル・画像を追加取得
    const buyIds  = (buyRes.data ?? []).map((t) => String(t.listing_id))
    const sellIds = (sellRes.data ?? []).map((t) => String(t.listing_id))
    const allIds  = [...new Set([...buyIds, ...sellIds])]

    let listingMap: Record<string, Record<string, unknown>> = {}
    if (allIds.length > 0) {
      const { data: listings } = await supabase
        .from('listings')
        .select('id, title, primary_image_url')
        .in('id', allIds)
      listings?.forEach((l) => { listingMap[String(l.id)] = l as Record<string, unknown> })
    }

    const enrich = (txs: Record<string, unknown>[]) =>
      txs.map((t) => ({ ...t, _listing: listingMap[String(t.listing_id)] ?? null }))

    setBuyingTxs(enrich((buyRes.data ?? []) as Record<string, unknown>[]))
    setSellingTxs(enrich((sellRes.data ?? []) as Record<string, unknown>[]))
  }, [])

  useEffect(() => {
    fetchTransactions().finally(() => setLoading(false))
  }, [fetchTransactions])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchTransactions()
    setRefreshing(false)
  }, [fetchTransactions])

  const data = mode === 'buying' ? buyingTxs : sellingTxs

  function renderItem({ item }: { item: Record<string, unknown> }) {
    const status  = STATUS_LABELS[String(item.status ?? '')] ?? { label: String(item.status), bg: '#f3f4f6', color: '#6b7280' }
    const listing = item._listing as Record<string, unknown> | null

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/transactions/${item.id}`)}
        activeOpacity={0.75}
      >
        <View style={styles.thumb}>
          {listing?.primary_image_url ? (
            <Image source={{ uri: String(listing.primary_image_url) }} style={styles.thumbImage} />
          ) : (
            <Text style={{ fontSize: 24 }}>🎁</Text>
          )}
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {String(listing?.title ?? '商品名なし')}
          </Text>
          {item.agreed_price && (
            <Text style={styles.rowPrice}>¥{(item.agreed_price as number).toLocaleString()}</Text>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e91e8c" />
      </View>
    )
  }

  if (!userId) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🔒</Text>
        <Text style={styles.emptyTitle}>ログインが必要です</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/auth/login')}>
          <Text style={styles.loginBtnText}>ログインする</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* タブ切替 */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, mode === 'buying' && styles.tabActive]}
          onPress={() => setMode('buying')}
        >
          <Text style={[styles.tabText, mode === 'buying' && styles.tabTextActive]}>
            購入中 {buyingTxs.length > 0 && `(${buyingTxs.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === 'selling' && styles.tabActive]}
          onPress={() => setMode('selling')}
        >
          <Text style={[styles.tabText, mode === 'selling' && styles.tabTextActive]}>
            出品中 {sellingTxs.length > 0 && `(${sellingTxs.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {data.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>
            {mode === 'buying' ? '購入中の取引はありません' : '出品中の取引はありません'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e91e8c" />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#f9fafb' },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  tabs: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive:     { borderBottomColor: '#e91e8c' },
  tabText:       { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  tabTextActive: { color: '#e91e8c', fontWeight: '700' },
  list: { padding: 12, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  thumb: {
    width: 52, height: 52, borderRadius: 10, overflow: 'hidden',
    backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center',
  },
  thumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  rowInfo:   { flex: 1, gap: 3 },
  rowTitle:  { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  rowPrice:  { fontSize: 12, color: '#e91e8c', fontWeight: '600' },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText:  { fontSize: 10, fontWeight: '700' },
  emptyIcon:  { fontSize: 48 },
  emptyTitle: { fontSize: 14, color: '#9ca3af', fontWeight: '500' },
  loginBtn: {
    backgroundColor: '#e91e8c', borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12, marginTop: 8,
  },
  loginBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
})
