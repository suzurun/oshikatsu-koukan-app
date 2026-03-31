import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, ActivityIndicator, StyleSheet, Alert,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { analyzePrice, createListing } from '@oshikatsu/api-client'
import type { PriceAnalysisResponse, TransactionType } from '@oshikatsu/types'

type Step = 'upload' | 'form'

const CONDITIONS = [
  { value: 'new',       label: '新品' },
  { value: 'like_new',  label: '未使用に近い' },
  { value: 'good',      label: '傷なし' },
  { value: 'fair',      label: 'やや傷あり' },
  { value: 'poor',      label: '傷あり' },
]

export default function NewListingScreen() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')
  const [images, setImages] = useState<{ uri: string; uploaded?: string }[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<PriceAnalysisResponse | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    title: '',
    price: '',
    condition: 'good',
    transactionType: 'sale' as TransactionType,
    description: '',
    artistName: '',
    exchangeDescription: '',
  })

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('権限が必要です', '写真へのアクセスを許可してください')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - images.length,
    })

    if (!result.canceled) {
      const newImages = result.assets.map((a) => ({ uri: a.uri }))
      setImages((prev) => [...prev, ...newImages])

      // 最初の画像でAI分析
      if (images.length === 0 && newImages[0]) {
        runAnalysis(newImages[0].uri)
      }
    }
  }, [images.length])

  const takePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('権限が必要です', 'カメラへのアクセスを許可してください')
      return
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 })
    if (!result.canceled && result.assets[0]) {
      const newImage = { uri: result.assets[0].uri }
      setImages((prev) => [...prev, newImage])
      if (images.length === 0) runAnalysis(newImage.uri)
    }
  }, [images.length])

  const runAnalysis = async (localUri: string) => {
    setAnalyzing(true)
    try {
      // NOTE: 本番では localUri をSupabase Storageにアップロードしてから分析
      const { data } = await analyzePrice({ imageUrl: localUri })
      if (data) setAnalysis(data)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      Alert.alert('エラー', 'タイトルを入力してください')
      return
    }
    if (form.transactionType === 'sale' && !form.price) {
      Alert.alert('エラー', '価格を入力してください')
      return
    }

    setSubmitting(true)
    try {
      const { data, error } = await createListing({
        title: form.title,
        description: form.description,
        condition: form.condition,
        transactionType: form.transactionType,
        price: form.price ? Number(form.price) : null,
        exchangeDescription: form.exchangeDescription || null,
        artistName: form.artistName || null,
        isExchangeOnly: form.transactionType !== 'sale',
        status: 'ai_checking',
      })

      if (error) {
        Alert.alert('エラー', error)
        return
      }
      Alert.alert('出品完了！', 'AIが内容を審査中です（1〜2分）', [
        { text: 'OK', onPress: () => router.replace(`/listings/${data?.id}`) },
      ])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

      {/* ステップヘッダー */}
      <View style={styles.stepHeader}>
        <StepDot active={step === 'upload'} done={step === 'form'} label="写真" />
        <View style={[styles.stepLine, step === 'form' && styles.stepLineActive]} />
        <StepDot active={step === 'form'} done={false} label="情報入力" />
      </View>

      {step === 'upload' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>商品の写真を追加</Text>

          {/* 画像グリッド */}
          <View style={styles.imageGrid}>
            {images.map((img, i) => (
              <Image key={i} source={{ uri: img.uri }} style={styles.imageThumbnail} />
            ))}
            {images.length < 10 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
                <Text style={styles.addImageIcon}>＋</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ボタン行 */}
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={takePhoto}>
              <Text style={styles.secondaryBtnText}>📷 カメラで撮影</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
              <Text style={styles.secondaryBtnText}>🖼 ライブラリから</Text>
            </TouchableOpacity>
          </View>

          {/* AI分析結果 */}
          {(analyzing || analysis) && (
            <View style={styles.aiPanel}>
              {analyzing ? (
                <View style={styles.aiLoading}>
                  <ActivityIndicator color="#9c27b0" />
                  <Text style={styles.aiLoadingText}>AIが相場を分析中...</Text>
                </View>
              ) : analysis ? (
                <>
                  <Text style={styles.aiTitle}>✨ AI相場分析</Text>
                  <View style={styles.priceRow}>
                    <PriceChip
                      label="早期売却"
                      price={analysis.analysis.earlyBirdPrice}
                      onPress={(p) => setForm((f) => ({ ...f, price: String(p) }))}
                    />
                    <PriceChip
                      label="推奨価格"
                      price={analysis.analysis.suggestedPrice}
                      highlighted
                      onPress={(p) => setForm((f) => ({ ...f, price: String(p) }))}
                    />
                    <PriceChip
                      label="プレミア"
                      price={analysis.analysis.premiumPrice}
                      onPress={(p) => setForm((f) => ({ ...f, price: String(p) }))}
                    />
                  </View>
                  <Text style={styles.aiDemand}>
                    需要予測: 今後30日 約{analysis.analysis.demandForecast30d}人
                    　希少性スコア: {analysis.analysis.rarityScore}/100
                  </Text>
                </>
              ) : null}
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, images.length === 0 && styles.primaryBtnDisabled]}
            onPress={() => images.length > 0 && setStep('form')}
            disabled={images.length === 0}
          >
            <Text style={styles.primaryBtnText}>
              {images.length === 0 ? '写真を選んでください' : `次へ（${images.length}枚）`}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'form' && (
        <View style={styles.section}>

          {/* AI分析サマリー */}
          {analysis && (
            <View style={styles.aiSummary}>
              <Text style={styles.aiSummaryText}>
                ✨ AI推奨: ¥{analysis.analysis.suggestedPrice?.toLocaleString() ?? '—'}
                　希少性 {analysis.analysis.rarityScore}/100
              </Text>
            </View>
          )}

          {/* 取引種別 */}
          <Text style={styles.label}>取引方法</Text>
          <View style={styles.typeRow}>
            {(['sale', 'exchange', 'local_exchange'] as TransactionType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, form.transactionType === t && styles.typeBtnActive]}
                onPress={() => setForm((f) => ({ ...f, transactionType: t }))}
              >
                <Text style={[styles.typeBtnText, form.transactionType === t && styles.typeBtnTextActive]}>
                  {t === 'sale' ? '売る' : t === 'exchange' ? '交換' : '現地交換'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>タイトル *</Text>
          <TextInput
            style={styles.input}
            value={form.title}
            onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
            placeholder="例：〇〇 缶バッジ 5種セット"
            maxLength={100}
          />

          <Text style={styles.label}>アーティスト・作品名</Text>
          <TextInput
            style={styles.input}
            value={form.artistName}
            onChangeText={(v) => setForm((f) => ({ ...f, artistName: v }))}
            placeholder="例：〇〇（バンド名・アニメ名）"
          />

          <Text style={styles.label}>商品の状態</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.conditionRow}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.conditionBtn, form.condition === c.value && styles.conditionBtnActive]}
                onPress={() => setForm((f) => ({ ...f, condition: c.value }))}
              >
                <Text style={[styles.conditionBtnText, form.condition === c.value && styles.conditionBtnTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {form.transactionType === 'sale' && (
            <>
              <Text style={styles.label}>販売価格 *</Text>
              <View style={styles.priceInputRow}>
                <Text style={styles.yen}>¥</Text>
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  value={form.price}
                  onChangeText={(v) => setForm((f) => ({ ...f, price: v }))}
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
            </>
          )}

          {(form.transactionType === 'exchange' || form.transactionType === 'local_exchange') && (
            <>
              <Text style={styles.label}>希望交換品 *</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={form.exchangeDescription}
                onChangeText={(v) => setForm((f) => ({ ...f, exchangeDescription: v }))}
                placeholder="例：〇〇の缶バッジと交換希望"
                multiline
                numberOfLines={3}
              />
            </>
          )}

          <Text style={styles.label}>商品説明</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={form.description}
            onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
            placeholder="イベント名・付属品・購入時期など"
            multiline
            numberOfLines={5}
            maxLength={2000}
          />

          <TouchableOpacity
            style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>出品する</Text>}
          </TouchableOpacity>

          <Text style={styles.note}>出品後にAIが自動審査します（1〜2分）</Text>
        </View>
      )}
    </ScrollView>
  )
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[
        styles.dot,
        (active || done) ? styles.dotActive : styles.dotInactive,
      ]}>
        {done && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
      </View>
      <Text style={{ fontSize: 10, color: active ? '#e91e8c' : '#999', marginTop: 2 }}>{label}</Text>
    </View>
  )
}

function PriceChip({
  label, price, highlighted = false, onPress,
}: {
  label: string
  price: number | null | undefined
  highlighted?: boolean
  onPress: (p: number) => void
}) {
  if (!price) return null
  return (
    <TouchableOpacity
      style={[styles.priceChip, highlighted && styles.priceChipHighlighted]}
      onPress={() => onPress(price)}
    >
      <Text style={styles.priceChipLabel}>{label}</Text>
      <Text style={[styles.priceChipValue, highlighted && styles.priceChipValueHighlighted]}>
        ¥{price.toLocaleString()}
      </Text>
      <Text style={styles.priceChipApply}>タップして適用</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  stepHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, paddingHorizontal: 32, gap: 8, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  stepLine: { flex: 1, height: 2, backgroundColor: '#e5e7eb' },
  stepLineActive: { backgroundColor: '#e91e8c' },
  dot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dotActive: { backgroundColor: '#e91e8c' },
  dotInactive: { backgroundColor: '#e5e7eb' },
  section: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imageThumbnail: { width: 80, height: 80, borderRadius: 8 },
  addImageBtn: {
    width: 80, height: 80, borderRadius: 8, borderWidth: 2, borderStyle: 'dashed',
    borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center',
  },
  addImageIcon: { fontSize: 24, color: '#9ca3af' },
  imageActions: { flexDirection: 'row', gap: 8 },
  secondaryBtn: {
    flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 13, color: '#374151' },
  aiPanel: {
    backgroundColor: '#faf5ff', borderWidth: 1, borderColor: '#e9d5ff',
    borderRadius: 12, padding: 14, gap: 10,
  },
  aiLoading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiLoadingText: { color: '#7e22ce', fontSize: 14 },
  aiTitle: { color: '#7e22ce', fontWeight: 'bold', fontSize: 14 },
  priceRow: { flexDirection: 'row', gap: 8 },
  priceChip: {
    flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 8, padding: 8, alignItems: 'center',
  },
  priceChipHighlighted: { borderColor: '#e91e8c', backgroundColor: '#fdf2f8' },
  priceChipLabel: { fontSize: 10, color: '#6b7280' },
  priceChipValue: { fontSize: 14, fontWeight: 'bold', color: '#1a1a1a' },
  priceChipValueHighlighted: { color: '#e91e8c' },
  priceChipApply: { fontSize: 9, color: '#9ca3af', marginTop: 2 },
  aiDemand: { fontSize: 11, color: '#7e22ce' },
  aiSummary: {
    backgroundColor: '#fdf2f8', borderWidth: 1, borderColor: '#f9a8d4',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
  },
  aiSummaryText: { fontSize: 12, color: '#9d174d', fontWeight: '500' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 4 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: '#fff',
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  yen: { fontSize: 16, color: '#374151' },
  priceInput: { flex: 1 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  typeBtnActive: { borderColor: '#e91e8c', backgroundColor: '#fdf2f8' },
  typeBtnText: { fontSize: 13, color: '#374151' },
  typeBtnTextActive: { color: '#e91e8c', fontWeight: '600' },
  conditionRow: { marginBottom: 4 },
  conditionBtn: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, marginRight: 8,
  },
  conditionBtnActive: { borderColor: '#e91e8c', backgroundColor: '#e91e8c' },
  conditionBtnText: { fontSize: 12, color: '#374151' },
  conditionBtnTextActive: { color: '#fff' },
  primaryBtn: {
    backgroundColor: '#e91e8c', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  primaryBtnDisabled: { backgroundColor: '#d1d5db' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  note: { fontSize: 11, color: '#9ca3af', textAlign: 'center' },
})
