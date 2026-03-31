import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { createClient } from '@oshikatsu/api-client'

type Step = 'account' | 'profile'

const ARTISTS = ['BTS', 'BLACKPINK', 'NewJeans', 'LE SSERAFIM', '乃木坂46', 'AKB48', 'NiziU', 'TWICE']

export default function RegisterScreen() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('account')
  const [loading, setLoading] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isAdult, setIsAdult] = useState(false)

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [selectedArtists, setSelectedArtists] = useState<string[]>([])
  const [customArtist, setCustomArtist] = useState('')

  function toggleArtist(a: string) {
    setSelectedArtists((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a],
    )
  }

  function handleAccountNext() {
    if (!email || !password) {
      Alert.alert('エラー', 'すべての項目を入力してください')
      return
    }
    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません')
      return
    }
    if (password.length < 8) {
      Alert.alert('エラー', 'パスワードは8文字以上で設定してください')
      return
    }
    setStep('profile')
  }

  async function handleRegister() {
    if (!username.trim()) {
      Alert.alert('エラー', 'ユーザー名を入力してください')
      return
    }
    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      Alert.alert('エラー', 'ユーザー名は英小文字・数字・_で3〜30文字にしてください')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      const { data: authData, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        Alert.alert('エラー', signUpError.message.includes('already registered')
          ? 'このメールアドレスは既に登録されています'
          : signUpError.message)
        return
      }

      if (!authData.user) return

      const artists = [...selectedArtists, ...(customArtist ? [customArtist] : [])]
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        username,
        display_name: displayName || username,
        favorite_artists: artists,
        account_type: isAdult ? 'independent' : 'child',
        membership_type: 'free',
      })

      if (profileError) {
        Alert.alert('エラー', profileError.message.includes('profiles_username_key')
          ? 'このユーザー名は既に使われています'
          : profileError.message)
        return
      }

      router.replace('/(tabs)/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

        <View style={styles.logoArea}>
          <Text style={styles.logoTitle}>推し活マーケット</Text>
          <Text style={styles.logoSub}>新規アカウント作成</Text>
        </View>

        {/* ステップインジケーター */}
        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDotActive]}>
            <Text style={styles.stepDotText}>{step === 'profile' ? '✓' : '1'}</Text>
          </View>
          <View style={[styles.stepLine, step === 'profile' && styles.stepLineActive]} />
          <View style={[styles.stepDot, step === 'profile' ? styles.stepDotActive : styles.stepDotInactive]}>
            <Text style={[styles.stepDotText, step !== 'profile' && { color: '#9ca3af' }]}>2</Text>
          </View>
        </View>

        <View style={styles.card}>

          {/* ---- ステップ1 ---- */}
          {step === 'account' && (
            <>
              <Text style={styles.heading}>アカウント情報</Text>

              {[
                { label: 'メールアドレス', value: email, setter: setEmail, type: 'email-address' as const, secure: false, complete: 'email' as const },
                { label: 'パスワード（8文字以上）', value: password, setter: setPassword, type: 'default' as const, secure: true, complete: 'new-password' as const },
                { label: 'パスワード（確認）', value: confirmPassword, setter: setConfirmPassword, type: 'default' as const, secure: true, complete: 'new-password' as const },
              ].map((f) => (
                <View key={f.label} style={styles.fieldGroup}>
                  <Text style={styles.label}>{f.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={f.value}
                    onChangeText={f.setter}
                    keyboardType={f.type}
                    secureTextEntry={f.secure}
                    autoCapitalize="none"
                    autoComplete={f.complete}
                  />
                </View>
              ))}

              <TouchableOpacity
                style={styles.checkRow}
                onPress={() => setIsAdult((v) => !v)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isAdult && styles.checkboxChecked]}>
                  {isAdult && <Text style={{ color: '#fff', fontSize: 11 }}>✓</Text>}
                </View>
                <Text style={styles.checkLabel}>18歳以上です</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleAccountNext} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>次へ</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ---- ステップ2 ---- */}
          {step === 'profile' && (
            <>
              <Text style={styles.heading}>プロフィール設定</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>ユーザー名（英数字・_ / 3〜30文字）*</Text>
                <View style={styles.atRow}>
                  <Text style={styles.atSign}>@</Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={username}
                    onChangeText={(v) => setUsername(v.toLowerCase())}
                    placeholder="username"
                    maxLength={30}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>表示名</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="例：推し活太郎"
                  maxLength={50}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>推しアーティスト（複数選択可）</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {ARTISTS.map((a) => (
                    <TouchableOpacity
                      key={a}
                      style={[styles.artistChip, selectedArtists.includes(a) && styles.artistChipActive]}
                      onPress={() => toggleArtist(a)}
                    >
                      <Text style={[styles.artistChipText, selectedArtists.includes(a) && { color: '#fff' }]}>
                        {a}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput
                  style={styles.input}
                  value={customArtist}
                  onChangeText={setCustomArtist}
                  placeholder="その他のアーティスト名..."
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.btnDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.primaryBtnText}>登録する</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('account')}>
                <Text style={styles.backBtnText}>← 前に戻る</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>すでにアカウントをお持ちの方は</Text>
          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.footerLink}>ログイン</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf2f8' },
  inner: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logoArea: { alignItems: 'center', marginBottom: 24 },
  logoTitle: { fontSize: 26, fontWeight: '900', color: '#e91e8c' },
  logoSub: { fontSize: 12, color: '#9e9e9e', marginTop: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', width: '60%', marginBottom: 24 },
  stepDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#e91e8c' },
  stepDotInactive: { backgroundColor: '#e5e7eb' },
  stepDotText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#e5e7eb' },
  stepLineActive: { backgroundColor: '#e91e8c' },
  card: {
    width: '100%', backgroundColor: '#fff', borderRadius: 20,
    padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  heading: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 18 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, backgroundColor: '#fafafa',
  },
  atRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  atSign: { fontSize: 16, color: '#6b7280' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#e91e8c', borderColor: '#e91e8c' },
  checkLabel: { fontSize: 13, color: '#374151' },
  artistChip: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, marginRight: 8,
  },
  artistChipActive: { backgroundColor: '#e91e8c', borderColor: '#e91e8c' },
  artistChipText: { fontSize: 12, color: '#374151' },
  primaryBtn: {
    backgroundColor: '#e91e8c', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backBtn: { alignItems: 'center', marginTop: 14 },
  backBtnText: { fontSize: 13, color: '#9ca3af' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24 },
  footerText: { fontSize: 13, color: '#6b7280' },
  footerLink: { fontSize: 13, color: '#e91e8c', fontWeight: '600' },
})
