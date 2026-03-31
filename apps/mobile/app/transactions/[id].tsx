import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, Alert, RefreshControl,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@oshikatsu/api-client'

const STATUS_STEPS = [
  { key: 'requested',         label: '申請',     desc: '購入申請が送られました' },
  { key: 'agreed',            label: '合意',     desc: '出品者が承認しました' },
  { key: 'deposit_held',      label: '決済',     desc: 'エスクロー決済が完了しました' },
  { key: 'shipping_unlocked', label: '発送解禁', desc: '双方が発送準備OKを確認しました' },
  { key: 'delivered',         label: '配達',     desc: '商品が到着しました' },
  { key: 'completed',         label: '完了',     desc: '取引が完了しました' },
]

const STATUS_ORDER = [
  'requested', 'agreed', 'kyc_required', 'deposit_held',
  'shipping_unlocked', 'shipped_by_seller', 'shipped_by_buyer', 'both_shipped',
  'delivered', 'receipt_confirmed', 'completed',
]

const CLOSED_STATUSES = ['completed', 'cancelled', 'auto_cancelled', 'disputed', 'dispute_resolved']

function getStepIndex(status: string) {
  const idx = STATUS_ORDER.indexOf(status)
  return idx === -1 ? 0 : idx
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [tx, setTx] = useState<Record<string, unknown> | null>(null)
  const [listing, setListing] = useState<Record<string, unknown> | null>(null)
  const [partner, setPartner] = useState<string>('')
  const [userId, setUserId] = useState<string | null>(null)
  const [isSeller, setIsSeller] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/auth/login'); return }
    setUserId(user.id)

    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single()

    if (!txData) { router.back(); return }
    setTx(txData as Record<string, unknown>)

    const isSell = txData.seller_id === user.id
    setIsSeller(isSell)

    const partnerId = isSell ? txData.buyer_id : txData.seller_id
    const [{ data: l }, { data: p }] = await Promise.all([
      supabase.from('listings').select('id, title, primary_image_url').eq('id', txData.listing_id).single(),
      supabase.from('profiles').select('display_name').eq('id', partnerId).single(),
    ])
    setListing(l as Record<string, unknown> | null)
    setPartner(String((p as Record<string, unknown> | null)?.display_name ?? ''))
  }, [id])

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [fetchData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }, [fetchData])

  async function invoke(action: string) {
    setActionLoading(true)
    try {
      const { error } = await supabase.functions.invoke('transaction-action', {
        body: { transactionId: id, action },
      })
      if (error) throw error
      await fetchData()
    } catch (e) {
      Alert.alert('エラー', e instanceof Error ? e.message : '操作に失敗しました')
    } finally {
      setActionLoading(false)
    }
  }

  function confirmAction(title: string, message: string, action: string) {
    Alert.alert(title, message, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '実行する', style: action === 'cancel' || action === 'dispute' ? 'destructive' : 'default',
        onPress: () => invoke(action) },
    ])
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#e91e8c" /></View>
  }

  if (!tx) return null

  const status   = String(tx.status ?? 'requested')
  const stepIdx  = getStepIndex(status)
  const isClosed = CLOSED_STATUSES.includes(status)
  const isBuyer  = !isSeller
  const myShippingReady = isSeller ? Boolean(tx.seller_shipping_ready) : Boolean(tx.buyer_shipping_ready)

  const canShippingReady  = (status === 'agreed' || status === 'deposit_held') && !myShippingReady
  const canConfirmReceipt = isBuyer && (status === 'shipped_by_seller' || status === 'both_shipped' || status === 'delivered')
  const canCancel = status === 'requested' || (status === 'agreed' && isSeller)
  const canDispute = isBuyer && (status === 'shipped_by_seller' || status === 'both_shipped' || status === 'delivered')

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e91e8c" />}
    >
      {/* 商品カード */}
      <View style={styles.listingCard}>
        <View style={styles.listingThumb}>
          {listing?.primary_image_url ? (
            <Image source={{ uri: String(listing.primary_image_url) }} style={styles.thumbImg} />
          ) : (
            <Text style={{ fontSize: 28 }}>🎁</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.listingTitle} numberOfLines={2}>{String(listing?.title ?? '商品名なし')}</Text>
          <Text style={styles.partnerLabel}>
            {isSeller ? '購入者' : '出品者'}: {partner || '不明'}
          </Text>
          {tx.agreed_price && (
            <Text style={styles.agreedPrice}>¥{(tx.agreed_price as number).toLocaleString()}</Text>
          )}
        </View>
        <View style={[styles.roleBadge, isSeller ? styles.roleSeller : styles.roleBuyer]}>
          <Text style={styles.roleText}>{isSeller ? '出品者' : '購入者'}</Text>
        </View>
      </View>

      {/* ステータスタイムライン */}
      {!isClosed && (
        <View style={styles.timelineCard}>
          <Text style={styles.sectionTitle}>取引ステップ</Text>
          <View style={{ marginTop: 12 }}>
            {STATUS_STEPS.map((step, i) => {
              const sIdx    = getStepIndex(step.key)
              const done    = stepIdx > sIdx
              const current = stepIdx === sIdx

              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepIndicator}>
                    <View style={[
                      styles.stepDot,
                      done    ? styles.stepDone
                      : current ? styles.stepCurrent
                      :           styles.stepPending,
                    ]}>
                      <Text style={[styles.stepDotText, (done || current) && { color: '#fff' }]}>
                        {done ? '✓' : String(i + 1)}
                      </Text>
                    </View>
                    {i < STATUS_STEPS.length - 1 && (
                      <View style={[styles.stepLine, done && styles.stepLineDone]} />
                    )}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepLabel, (done || current) && { color: '#1a1a1a' }]}>
                      {step.label}
                    </Text>
                    <Text style={[styles.stepDesc, (done || current) && { color: '#6b7280' }]}>
                      {step.desc}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      )}

      {/* クローズバナー */}
      {isClosed && (
        <View style={[styles.closedBanner,
          status === 'completed' ? styles.closedDone
          : status === 'disputed' ? styles.closedDispute
          : styles.closedCancel
        ]}>
          <Text style={styles.closedText}>
            {status === 'completed'      && '✅ 取引が完了しました'}
            {status === 'cancelled'      && '取引はキャンセルされました'}
            {status === 'auto_cancelled' && '取引は自動キャンセルされました'}
            {status === 'disputed'       && '⚠ 紛争申立が受付されました'}
            {status === 'dispute_resolved' && '紛争が解決されました'}
          </Text>
        </View>
      )}

      {/* 発送期限 */}
      {tx.shipping_deadline && (
        <View style={styles.deadlineBanner}>
          <Text style={styles.deadlineText}>
            ⏰ 発送期限: {new Date(String(tx.shipping_deadline)).toLocaleString('ja-JP')}
          </Text>
        </View>
      )}

      {/* アクションボタン */}
      {!isClosed && (
        <View style={styles.actions}>
          {canShippingReady && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionIndigo, actionLoading && styles.actionDisabled]}
              onPress={() => invoke('shipping_ready')}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnText}>
                {actionLoading ? '処理中...' : '発送準備OK ✓'}
              </Text>
            </TouchableOpacity>
          )}

          {myShippingReady && (status === 'agreed' || status === 'deposit_held') && (
            <View style={styles.waitingBox}>
              <Text style={styles.waitingText}>発送準備OKを送信済み。相手の確認待ちです。</Text>
            </View>
          )}

          {canConfirmReceipt && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionGreen, actionLoading && styles.actionDisabled]}
              onPress={() => confirmAction('受取確認', '商品を受け取りましたか？\n確認後、取引が完了しエスクロー資金が出品者に送金されます。', 'confirm_receipt')}
              disabled={actionLoading}
            >
              <Text style={styles.actionBtnText}>
                {actionLoading ? '処理中...' : '受取確認 → 取引完了'}
              </Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionGray, actionLoading && styles.actionDisabled]}
              onPress={() => confirmAction('キャンセル', '取引をキャンセルしますか？', 'cancel')}
              disabled={actionLoading}
            >
              <Text style={styles.actionGrayText}>キャンセルする</Text>
            </TouchableOpacity>
          )}

          {canDispute && (
            <TouchableOpacity
              style={[styles.disputeLink, actionLoading && styles.actionDisabled]}
              onPress={() => confirmAction('紛争申立', '問題がある場合、紛争を申立てますか？\n運営が確認し、エスクロー資金を保護します。', 'dispute')}
              disabled={actionLoading}
            >
              <Text style={styles.disputeText}>問題を報告（紛争申立）</Text>
            </TouchableOpacity>
          )}

          {!canShippingReady && !canConfirmReceipt && !canCancel && !canDispute && (
            <View style={styles.waitingBox}>
              <Text style={styles.waitingText}>相手のアクション待ちです</Text>
            </View>
          )}
        </View>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', margin: 12, borderRadius: 16,
    padding: 12, borderWidth: 1, borderColor: '#f3f4f6',
  },
  listingThumb: {
    width: 64, height: 64, borderRadius: 12, overflow: 'hidden',
    backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  thumbImg:     { width: '100%', height: '100%', resizeMode: 'cover' },
  listingTitle: { fontSize: 14, fontWeight: '700', color: '#1a1a1a', lineHeight: 20 },
  partnerLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  agreedPrice:  { fontSize: 13, fontWeight: '700', color: '#e91e8c', marginTop: 2 },
  roleBadge:    { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  roleSeller:   { backgroundColor: '#fdf2f8' },
  roleBuyer:    { backgroundColor: '#eff6ff' },
  roleText:     { fontSize: 10, fontWeight: '700', color: '#6b7280' },

  timelineCard: {
    backgroundColor: '#fff', margin: 12, marginTop: 0,
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151' },
  stepRow:      { flexDirection: 'row', gap: 12 },
  stepIndicator:{ alignItems: 'center', width: 28 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
    borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  stepDone:    { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  stepCurrent: { backgroundColor: '#e91e8c', borderColor: '#e91e8c' },
  stepPending: { backgroundColor: '#fff', borderColor: '#e5e7eb' },
  stepDotText: { fontSize: 10, fontWeight: '700', color: '#d1d5db' },
  stepLine:    { width: 2, flex: 1, backgroundColor: '#f3f4f6', marginVertical: 2 },
  stepLineDone:{ backgroundColor: '#86efac' },
  stepContent: { flex: 1, paddingBottom: 16 },
  stepLabel:   { fontSize: 13, fontWeight: '600', color: '#d1d5db' },
  stepDesc:    { fontSize: 11, color: '#d1d5db', marginTop: 2 },

  closedBanner: { margin: 12, marginTop: 0, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1 },
  closedDone:    { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  closedDispute: { backgroundColor: '#fff1f2', borderColor: '#fecdd3' },
  closedCancel:  { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
  closedText:    { fontSize: 14, fontWeight: '700', color: '#374151' },

  deadlineBanner: {
    margin: 12, marginTop: 0, backgroundColor: '#fff7ed',
    borderWidth: 1, borderColor: '#fed7aa', borderRadius: 12, padding: 12,
  },
  deadlineText: { fontSize: 12, color: '#c2410c' },

  actions: { margin: 12, marginTop: 0, gap: 10 },
  actionBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  actionIndigo:  { backgroundColor: '#6366f1' },
  actionGreen:   { backgroundColor: '#22c55e' },
  actionGray:    { backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  actionDisabled:{ opacity: 0.5 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  actionGrayText:{ color: '#6b7280', fontSize: 14, fontWeight: '600' },
  waitingBox: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 12, padding: 14, alignItems: 'center',
  },
  waitingText: { fontSize: 13, color: '#9ca3af' },
  disputeLink: { alignItems: 'center', paddingVertical: 8 },
  disputeText: { fontSize: 12, color: '#ef4444', textDecorationLine: 'underline' },
})
