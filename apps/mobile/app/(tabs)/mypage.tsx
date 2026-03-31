import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@oshikatsu/api-client'

interface Profile {
  id: string
  display_name: string
  username: string
  bio: string | null
  favorite_artists: string[] | null
  membership_type: string
  status: string
}

interface CreditScore {
  score: number
  total_transactions: number
  completed_transactions: number
  deposit_amount: number
  can_trade: boolean
}

export default function MyPageTab() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [activeListingsCount, setActiveListingsCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const [profileRes, scoreRes, wishRes, listingRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('credit_scores').select('*').eq('user_id', user.id).single(),
      supabase.from('wishlists').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('listings').select('id', { count: 'exact', head: true })
        .eq('seller_id', user.id).eq('status', 'active'),
    ])

    setProfile(profileRes.data as Profile | null)
    setCreditScore(scoreRes.data as CreditScore | null)
    setWishlistCount(wishRes.count ?? 0)
    setActiveListingsCount(listingRes.count ?? 0)
  }, [])

  useEffect(() => {
    fetchData().finally(() => setLoading(false))
  }, [fetchData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }, [fetchData])

  async function handleLogout() {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: 'ログアウト', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          router.replace('/auth/login')
        },
      },
    ])
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#e91e8c" /></View>
  }

  if (!profile) {
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

  const score = creditScore?.score ?? 100
  const isPremium = profile.membership_type === 'premium'
  const totalTx = creditScore?.total_transactions ?? 0
  const completedTx = creditScore?.completed_transactions ?? 0
  const completionRate = totalTx > 0 ? Math.round((completedTx / totalTx) * 100) : 100
  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'

  const menuItems = [
    { icon: '📦', label: '取引管理', sub: '購入中・出品中の取引', onPress: () => router.push('/(tabs)/transactions') },
    { icon: '♡', label: 'ほしい物リスト', sub: `${wishlistCount}件`, onPress: () => {} },
    { icon: '🔔', label: '通知設定', sub: 'プッシュ通知・メール通知', onPress: () => {} },
    { icon: '⭐', label: isPremium ? 'プレミアム管理' : 'プレミアム登録', sub: isPremium ? '月額385円' : 'AIアラート・優先表示', onPress: () => {} },
    { icon: '🛡️', label: 'eKYC / 本人確認', sub: '初回取引前に必要', onPress: () => router.push('/auth/kyc') },
    { icon: '⚙️', label: '設定', sub: 'プロフィール編集・パスワード変更', onPress: () => {} },
  ]

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e91e8c" />}
    >
      {/* プロフィールヘッダー */}
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>
            {(profile.display_name?.[0] ?? '?').toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{profile.display_name}</Text>
            {isPremium && (
              <View style={styles.premiumBadge}>
                <Text style={styles.premiumBadgeText}>⭐ プレミアム</Text>
              </View>
            )}
          </View>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.bio ? <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text> : null}
        </View>
      </View>

      {/* 推しアーティスト */}
      {(profile.favorite_artists ?? []).length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.artistRow}>
          {(profile.favorite_artists ?? []).map((a) => (
            <View key={a} style={styles.artistChip}>
              <Text style={styles.artistChipText}>{a}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* 信用スコア + 統計 */}
      <View style={styles.statsCard}>
        {/* 信用スコア */}
        <View style={styles.scoreSection}>
          <Text style={styles.statsLabel}>信用スコア</Text>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>{Math.round(score)}</Text>
          <View style={styles.scoreTrack}>
            <View style={[styles.scoreFill, { width: `${score}%` as `${number}%`, backgroundColor: scoreColor }]} />
          </View>
          <Text style={styles.scoreDesc}>
            {score >= 80 ? '優良ユーザー' : score >= 60 ? '標準' : '要改善'}
          </Text>
        </View>

        <View style={styles.dividerV} />

        {/* 取引統計 */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalTx}</Text>
            <Text style={styles.statLabel}>総取引</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#22c55e' }]}>{completedTx}</Text>
            <Text style={styles.statLabel}>完了</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#e91e8c' }]}>{completionRate}%</Text>
            <Text style={styles.statLabel}>完了率</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeListingsCount}</Text>
            <Text style={styles.statLabel}>出品中</Text>
          </View>
        </View>
      </View>

      {/* プレミアム案内 */}
      {!isPremium && (
        <TouchableOpacity style={styles.premiumBanner}>
          <View>
            <Text style={styles.premiumBannerTitle}>⭐ プレミアム会員になる</Text>
            <Text style={styles.premiumBannerSub}>月額385円 · AI価格アラート · フィード優先表示</Text>
          </View>
          <Text style={styles.premiumArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* メニュー */}
      <View style={styles.menuCard}>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuRow, i < menuItems.length - 1 && styles.menuRowBorder]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </View>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ログアウト */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>ログアウト</Text>
      </TouchableOpacity>

      <View style={{ height: 60 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 14, color: '#9ca3af', fontWeight: '500' },
  loginBtn: { backgroundColor: '#e91e8c', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  loginBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  header: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: '#fff', padding: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  avatarWrap: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#e91e8c', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  displayName: { fontSize: 17, fontWeight: '800', color: '#1a1a1a' },
  premiumBadge: { backgroundColor: '#f5f3ff', borderWidth: 1, borderColor: '#ddd6fe', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  premiumBadgeText: { fontSize: 10, color: '#7c3aed', fontWeight: '700' },
  username: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  bio: { fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 16 },

  artistRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  artistChip: { backgroundColor: '#fdf2f8', borderWidth: 1, borderColor: '#fce7f3', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  artistChipText: { fontSize: 11, color: '#e91e8c', fontWeight: '600' },

  statsCard: {
    flexDirection: 'row', backgroundColor: '#fff',
    margin: 12, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  scoreSection: { width: 90, alignItems: 'center', gap: 4 },
  statsLabel: { fontSize: 10, color: '#9ca3af', fontWeight: '600' },
  scoreValue: { fontSize: 32, fontWeight: '900' },
  scoreTrack: { width: '100%', height: 4, backgroundColor: '#f3f4f6', borderRadius: 2, overflow: 'hidden' },
  scoreFill: { height: '100%', borderRadius: 2 },
  scoreDesc: { fontSize: 9, color: '#9ca3af', marginTop: 2 },
  dividerV: { width: 1, backgroundColor: '#f3f4f6', marginHorizontal: 16 },
  statsGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statItem: { width: '45%', alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  statLabel: { fontSize: 10, color: '#9ca3af', marginTop: 2 },

  premiumBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fdf4ff', borderWidth: 1, borderColor: '#e9d5ff',
    margin: 12, marginTop: 0, borderRadius: 14, padding: 14,
  },
  premiumBannerTitle: { fontSize: 13, fontWeight: '700', color: '#7c3aed' },
  premiumBannerSub: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  premiumArrow: { fontSize: 18, color: '#7c3aed' },

  menuCard: {
    backgroundColor: '#fff', margin: 12, marginTop: 0,
    borderRadius: 16, borderWidth: 1, borderColor: '#f3f4f6', overflow: 'hidden',
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f9fafb' },
  menuIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  menuLabel: { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  menuSub: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  menuChevron: { fontSize: 20, color: '#d1d5db' },

  logoutBtn: {
    margin: 12, marginTop: 0, borderWidth: 1, borderColor: '#fee2e2',
    borderRadius: 14, padding: 14, alignItems: 'center',
  },
  logoutText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
})
