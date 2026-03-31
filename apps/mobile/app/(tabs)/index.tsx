import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, TextInput, RefreshControl, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@oshikatsu/api-client'
import { MobileListingCard } from '@/components/MobileListingCard'

const CATEGORIES = [
  { slug: 'concert-goods', label: 'コンサート', icon: '🎤' },
  { slug: 'photo-cards',   label: 'フォトカード', icon: '📸' },
  { slug: 'badges',        label: '缶バッジ',    icon: '⭕' },
  { slug: 'bromide',       label: 'ブロマイド',   icon: '🖼️' },
  { slug: 'anime',         label: 'アニメ',      icon: '🎮' },
  { slug: 'uchiwa',        label: 'うちわ',      icon: '🪭' },
]

export default function HomeTab() {
  const router = useRouter()
  const [listings, setListings] = useState<Record<string, unknown>[]>([])
  const [hotListings, setHotListings] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchListings = useCallback(async () => {
    const [newResult, hotResult] = await Promise.all([
      supabase.from('v_active_listings').select('*').order('created_at', { ascending: false }).limit(12),
      supabase.from('v_active_listings').select('*').order('demand_forecast_30d', { ascending: false }).limit(6),
    ])
    setListings(newResult.data ?? [])
    setHotListings(hotResult.data ?? [])
  }, [])

  useEffect(() => {
    fetchListings().finally(() => setLoading(false))
  }, [fetchListings])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchListings()
    setRefreshing(false)
  }, [fetchListings])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e91e8c" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e91e8c" />}
      showsVerticalScrollIndicator={false}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>推し活マーケット</Text>
        <Text style={styles.headerSub}>AIが守る安心の取引</Text>
      </View>

      {/* 検索バー */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="グッズ名・アーティスト名..."
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>
      </View>

      {/* カテゴリ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.slug}
            style={styles.categoryChip}
            onPress={() => router.push(`/search?category=${cat.slug}`)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={styles.categoryLabel}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 🔥 人気急上昇 */}
      {hotListings.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 今みんなが探してる</Text>
            <TouchableOpacity onPress={() => router.push('/search?sort=demand')}>
              <Text style={styles.seeAll}>もっと見る</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={hotListings}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingLeft: 16, gap: 12 }}
            renderItem={({ item }) => (
              <MobileListingCard listing={item} compact />
            )}
          />
        </View>
      )}

      {/* 新着出品 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>新着出品</Text>
          <TouchableOpacity onPress={() => router.push('/search?sort=new')}>
            <Text style={styles.seeAll}>もっと見る</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.grid}>
          {listings.map((listing) => (
            <View key={String(listing.id)} style={styles.gridItem}>
              <MobileListingCard listing={listing} />
            </View>
          ))}
        </View>
        {listings.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎁</Text>
            <Text style={styles.emptyText}>まだ出品がありません</Text>
          </View>
        )}
      </View>

      {/* AIバッジ説明 */}
      <View style={styles.aiPromo}>
        <Text style={styles.aiPromoTitle}>✨ AI相場分析で安心取引</Text>
        <Text style={styles.aiPromoText}>
          全プラットフォームの相場をリアルタイム比較。{'\n'}
          ぼったくりなし・詐欺なしの市場。
        </Text>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#e91e8c' },
  headerSub: { fontSize: 12, color: '#9e9e9e', marginTop: 2 },
  searchContainer: { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6',
    borderRadius: 12, paddingHorizontal: 12, gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 14, color: '#1a1a1a' },
  categoryRow: { paddingHorizontal: 12, paddingVertical: 12, gap: 8 },
  categoryChip: {
    backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6',
    minWidth: 72,
  },
  categoryIcon: { fontSize: 20, marginBottom: 2 },
  categoryLabel: { fontSize: 10, color: '#374151', textAlign: 'center' },
  section: { marginTop: 8 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a1a1a' },
  seeAll: { fontSize: 12, color: '#e91e8c' },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8,
  },
  gridItem: { width: '47.5%' },
  emptyState: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 13, color: '#9ca3af' },
  aiPromo: {
    margin: 16, backgroundColor: '#fdf2f8', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: '#fce7f3',
  },
  aiPromoTitle: { fontSize: 14, fontWeight: 'bold', color: '#9d174d', marginBottom: 6 },
  aiPromoText: { fontSize: 12, color: '#be185d', lineHeight: 18 },
})
