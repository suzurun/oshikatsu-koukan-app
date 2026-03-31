import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Image,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { createClient } from '@oshikatsu/api-client'

type KycStep = 'intro' | 'payment' | 'identity' | 'waiting' | 'done'
type IdType = 'license' | 'mynumber' | 'passport'

export default function KycScreen() {
  const router = useRouter()
  const [step, setStep] = useState<KycStep>('intro')
  const [loading, setLoading] = useState(false)
  const [idType, setIdType] = useState<IdType>('license')
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [backImage, setBackImage] = useState<string | null>(null)
  const [selfieImage, setSelfieImage] = useState<string | null>(null)

  const pickImage = async (setter: (uri: string) => void) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    })
    if (!result.canceled && result.assets[0]) {
      setter(result.assets[0].uri)
    }
  }

  const takeSelfie = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('権限が必要です', 'カメラへのアクセスを許可してください')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      quality: 0.9,
    })
    if (!result.canceled && result.assets[0]) {
      setSelfieImage(result.assets[0].uri)
    }
  }

  async function handlePayment() {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('kyc_records').upsert({
        user_id: user.id,
        status: 'pending',
        kyc_provider: 'TRUSTDOCK',
        kyc_fee_paid: true,
        submitted_at: new Date().toISOString(),
      })
      if (error) throw error
      setStep('identity')
    } catch {
      Alert.alert('エラー', '処理に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmitIdentity() {
    if (!frontImage || !selfieImage) {
      Alert.alert('エラー', '書類（表面）と顔写真が必要です')
      return
    }
    setLoading(true)
    // 本番ではTRUSTDOCK APIに書類を送信
    setTimeout(() => {
      setLoading(false)
      setStep('waiting')
      setTimeout(() => setStep('done'), 3000)
    }, 1000)
  }

  if (step === 'done') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.doneIcon}>✅</Text>
        <Text style={styles.doneTitle}>本人確認完了！</Text>
        <Text style={styles.doneDesc}>これで取引を開始できます。</Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.replace('/(tabs)/')}
        >
          <Text style={styles.primaryBtnText}>ホームへ戻る</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (step === 'waiting') {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#e91e8c" />
        <Text style={styles.waitingTitle}>審査中...</Text>
        <Text style={styles.waitingDesc}>
          AIが書類を確認しています。{'\n'}
          通常5分以内に完了します。{'\n'}
          完了後、通知でお知らせします。
        </Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>

      {/* ---- イントロ ---- */}
      {step === 'intro' && (
        <>
          <Text style={styles.title}>本人確認（eKYC）</Text>
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>なぜ必要なの？</Text>
            <Text style={styles.infoText}>
              取引の安全を守るため、初回取引時に本人確認が必要です。
              古物営業法により3万円超の取引では義務付けられています。
            </Text>
          </View>

          {[
            { icon: '🔒', title: '個人情報は暗号化保護', desc: '取引相手には一切公開されません' },
            { icon: '⏱️', title: '審査は約5分', desc: '書類をアップロードするだけ' },
            { icon: '💳', title: '審査費用300円', desc: '不通過の場合は全額返金' },
          ].map((item) => (
            <View key={item.title} style={styles.infoItem}>
              <Text style={styles.infoItemIcon}>{item.icon}</Text>
              <View>
                <Text style={styles.infoItemTitle}>{item.title}</Text>
                <Text style={styles.infoItemDesc}>{item.desc}</Text>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('payment')}>
            <Text style={styles.primaryBtnText}>本人確認を始める</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.skipBtn} onPress={() => router.back()}>
            <Text style={styles.skipBtnText}>あとで行う</Text>
          </TouchableOpacity>
        </>
      )}

      {/* ---- 審査費用 ---- */}
      {step === 'payment' && (
        <>
          <Text style={styles.title}>審査費用のお支払い</Text>
          <View style={styles.priceCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>eKYC審査費用</Text>
              <Text style={styles.priceValue}>¥300</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.priceNote}>• 審査通過後は返金不可{'\n'}• 審査不通過は全額返金{'\n'}• 一度承認後は再支払い不要</Text>
          </View>

          <View style={styles.mockPayment}>
            <Text style={styles.mockPaymentText}>Stripe決済フォーム{'\n'}（本番環境で表示）</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handlePayment}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>¥300を支払って審査を開始</Text>}
          </TouchableOpacity>
        </>
      )}

      {/* ---- 書類提出 ---- */}
      {step === 'identity' && (
        <>
          <Text style={styles.title}>本人確認書類の提出</Text>

          <Text style={styles.sectionLabel}>書類の種類</Text>
          <View style={styles.idTypeRow}>
            {([
              { value: 'license' as IdType,   label: '運転免許証', icon: '🚗' },
              { value: 'mynumber' as IdType,  label: 'マイナンバー', icon: '🪪' },
              { value: 'passport' as IdType,  label: 'パスポート', icon: '📘' },
            ]).map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.idTypeBtn, idType === t.value && styles.idTypeBtnActive]}
                onPress={() => setIdType(t.value)}
              >
                <Text style={styles.idTypeIcon}>{t.icon}</Text>
                <Text style={[styles.idTypeLabel, idType === t.value && { color: '#e91e8c' }]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ImageUploadSlot
            label="書類（表面）*"
            uri={frontImage}
            onPick={() => pickImage(setFrontImage)}
          />
          {idType !== 'passport' && (
            <ImageUploadSlot
              label="書類（裏面）"
              uri={backImage}
              onPick={() => pickImage(setBackImage)}
            />
          )}
          <ImageUploadSlot
            label="顔写真（セルフィー）*"
            hint="書類を顔の横に持って撮影"
            uri={selfieImage}
            onPick={takeSelfie}
            isSelfie
          />

          {idType === 'mynumber' && (
            <View style={[styles.infoBox, { marginBottom: 16 }]}>
              <Text style={styles.infoText}>
                📱 マイナンバーカードのNFCスキャンが使えます（審査精度が向上します）
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleSubmitIdentity}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>書類を送信して審査を開始</Text>}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  )
}

function ImageUploadSlot({
  label, hint, uri, onPick, isSelfie = false,
}: {
  label: string
  hint?: string
  uri: string | null
  onPick: () => void
  isSelfie?: boolean
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {hint && <Text style={styles.hintText}>{hint}</Text>}
      <TouchableOpacity style={styles.uploadSlot} onPress={onPick}>
        {uri ? (
          <Image source={{ uri }} style={styles.uploadPreview} />
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Text style={styles.uploadIcon}>{isSelfie ? '🤳' : '📁'}</Text>
            <Text style={styles.uploadText}>タップして{isSelfie ? '撮影' : '選択'}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  inner: { padding: 20, paddingBottom: 40 },
  centerContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 32, gap: 16, backgroundColor: '#f9fafb',
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
  infoBox: {
    backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe',
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  infoTitle: { fontSize: 13, fontWeight: '700', color: '#1e40af', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#1e40af', lineHeight: 20 },
  infoItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: '#f3f4f6',
  },
  infoItemIcon: { fontSize: 22 },
  infoItemTitle: { fontSize: 13, fontWeight: '600', color: '#111827' },
  infoItemDesc: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  priceCard: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
    borderRadius: 14, padding: 16, marginBottom: 16,
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: 14, color: '#374151' },
  priceValue: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },
  priceNote: { fontSize: 12, color: '#9ca3af', lineHeight: 20 },
  mockPayment: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db',
    borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 16,
  },
  mockPaymentText: { fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  hintText: { fontSize: 11, color: '#9ca3af', marginBottom: 6 },
  idTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  idTypeBtn: {
    flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    padding: 10, alignItems: 'center', backgroundColor: '#fff',
  },
  idTypeBtnActive: { borderColor: '#e91e8c', backgroundColor: '#fdf2f8' },
  idTypeIcon: { fontSize: 22, marginBottom: 4 },
  idTypeLabel: { fontSize: 11, color: '#374151', textAlign: 'center' },
  uploadSlot: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db',
    borderRadius: 12, overflow: 'hidden',
  },
  uploadPreview: { width: '100%', height: 160, resizeMode: 'cover' },
  uploadPlaceholder: {
    height: 120, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  uploadIcon: { fontSize: 32 },
  uploadText: { fontSize: 13, color: '#9ca3af' },
  primaryBtn: {
    backgroundColor: '#e91e8c', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  skipBtn: { alignItems: 'center', marginTop: 14 },
  skipBtnText: { fontSize: 13, color: '#9ca3af' },
  waitingTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginTop: 16 },
  waitingDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 24 },
  doneIcon: { fontSize: 56 },
  doneTitle: { fontSize: 22, fontWeight: 'bold', color: '#1a1a1a' },
  doneDesc: { fontSize: 14, color: '#6b7280' },
})
