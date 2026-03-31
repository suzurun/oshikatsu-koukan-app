import { useState, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, ScrollView,
} from 'react-native'
import { supabase } from '@oshikatsu/api-client'
import { MobileListingCard } from '@/components/MobileListingCard'

const SORT_OPTIONS = [
  { value: 'new',        label: '新着' },
  { value: 'demand',     label: '人気' },
  { value: 'price_asc',  label: '安い順' },
  { value: 'price_desc', label: '高い順' },
  { value: 'rarity',     label: '希少度' },
]

const TX_OPTIONS = [
  { value: '',               label: 'すべて' },
  { value: 'sale',           label: '販売' },
  { value: 'exchange',       label: '交換' },
  { value: 'local_exchange', label: '現地' },
]

const CATEGORIES = [
  { slug: '',               label: 'すべて' },
  { slug: 'concert-goods',  label: 'コンサート' },
  { slug: 'photo-cards',    label: 'フォトカード' },
  { slug: 'badges',         label: '缶バッジ' },
  { slug: 'bromide',        label: 'ブロマイド' },
  { slug: 'anime',          label: 'アニメ' },
  { slug: 'uchiwa',         label: 'うちわ' },
]

export default function SearchTab() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [sort, setSort] = useState('new')
  const [txType, setTxType] = useState('')
  const [category, setCategory] = useState('')
  const [total, setTotal] = useState(0)

  const doSearch = useCallback(async (opts?: {
    q?: string; sortVal?: string; tx?: string; cat?: string
  }) => {
    const q       = opts?.q       ?? query
    const sortVal = opts?.sortVal ?? sort
    const tx      = opts?.tx      ?? txType
    const cat     = opts?.cat     ?? category

    setLoading(true)
    setSearched(true)

    let dbQuery = supabase
      .from('v_active_listings')
      .select('*', { count: 'exact' })
      .limit(30)

    if (q.trim()) dbQuery = dbQuery.textSearch('search_vector', q.trim(), { type: 'websearch' })
    if (tx)  dbQuery = dbQuery.eq('transaction_type', tx)
    if (cat) dbQuery = dbQuery.eq('category_slug', cat)

    switch (sortVal) {
      case 'price_asc':  dbQuery = dbQuery.order('price', { ascending: true,  nullsFirst: false }); break
      case 'price_desc': dbQuery = dbQuery.order('price', { ascending: false, nullsFirst: false }); break
      case 'demand':     dbQuery = dbQuery.order('demand_forecast_30d', { ascending: false }); break
      case 'rarity':     dbQuery = dbQuery.order('rarity_score', { ascending: false }); break
      default:           dbQuery = dbQuery.order('created_at', { ascending: false })
    }

    const { data, count } = await dbQuery
    setResults(data ?? [])
    setTotal(count ?? 0)
    setLoading(false)
  }, [query, sort, txType, category])

  function handleSortChange(val: string) {
    setSort(val)
    doSearch({ sortVal: val })
  }

  function handleTxChange(val: string) {
    setTxType(val)
    doSearch({ tx: val })
  }

  function handleCategoryChange(val: string) {
    setCategory(val)
    doSearch({ cat: val })
  }

  return (
    <View style={styles.container}>

      {/* 検索バー */}
      <View style={styles.searchArea}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="グッズ名・アーティスト名..."
            returnKeyType="search"
            onSubmitEditing={() => doSearch()}
            autoFocus={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false) }}>
              <Text style={styles.clearBtn}>×</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={() => doSearch()}>
          <Text style={styles.searchBtnText}>検索</Text>
        </TouchableOpacity>
      </View>

      {/* カテゴリ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.slug}
            style={[styles.filterChip, category === cat.slug && styles.filterChipActive]}
            onPress={() => handleCategoryChange(cat.slug)}
          >
            <Text style={[styles.filterChipText, category === cat.slug && styles.filterChipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 取引種別・並び替え */}
      <View style={styles.sortArea}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}
        >
          {TX_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sortChip, txType === opt.value && styles.sortChipActive]}
              onPress={() => handleTxChange(opt.value)}
            >
              <Text style={[styles.sortChipText, txType === opt.value && styles.sortChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.dividerV} />
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sortChip, sort === opt.value && styles.sortChipActive]}
              onPress={() => handleSortChange(opt.value)}
            >
              <Text style={[styles.sortChipText, sort === opt.value && styles.sortChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 結果件数 */}
      {searched && !loading && (
        <Text style={styles.resultCount}>
          {total.toLocaleString()}件
        </Text>
      )}

      {/* 結果一覧 */}
      {loading ? (
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color="#e91e8c" />
          <Text style={styles.loadingText}>検索中...</Text>
        </View>
      ) : searched ? (
        results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.gridItem}>
                <MobileListingCard listing={item} />
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>見つかりませんでした</Text>
            <Text style={styles.emptyDesc}>キーワードを変えて検索してみてください</Text>
          </View>
        )
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🎁</Text>
          <Text style={styles.emptyTitle}>グッズを検索しよう</Text>
          <Text style={styles.emptyDesc}>
            キーワードやカテゴリから{'\n'}お目当てのグッズを探せます
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchArea: {
    flexDirection: 'row', gap: 8, padding: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 10, gap: 6,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: '#1a1a1a' },
  clearBtn: { fontSize: 16, color: '#9ca3af', paddingHorizontal: 4 },
  searchBtn: {
    backgroundColor: '#e91e8c', borderRadius: 10,
    paddingHorizontal: 14, justifyContent: 'center',
  },
  searchBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  filterRow: {
    backgroundColor: '#fff', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  filterChip: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  filterChipActive: { backgroundColor: '#e91e8c', borderColor: '#e91e8c' },
  filterChipText: { fontSize: 12, color: '#374151' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  sortArea: {
    backgroundColor: '#fff', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  sortChip: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  sortChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  sortChipText: { fontSize: 11, color: '#374151' },
  sortChipTextActive: { color: '#fff', fontWeight: '600' },
  dividerV: { width: 1, backgroundColor: '#e5e7eb', marginHorizontal: 4 },
  resultCount: { fontSize: 12, color: '#6b7280', paddingHorizontal: 16, paddingVertical: 8 },
  grid: { padding: 8 },
  gridRow: { gap: 8 },
  gridItem: { flex: 1 },
  loadingArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#9ca3af' },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 8,
  },
  emptyIcon: { fontSize: 48, marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  emptyDesc: { fontSize: 13, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
})
