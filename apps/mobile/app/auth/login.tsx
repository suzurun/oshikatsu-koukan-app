import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { signInWithEmail } from '@oshikatsu/api-client'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください')
      return
    }

    setLoading(true)
    try {
      const { error } = await signInWithEmail(email, password)
      if (error) {
        Alert.alert(
          'ログインエラー',
          error.message.includes('Invalid login credentials')
            ? 'メールアドレスまたはパスワードが正しくありません'
            : error.message,
        )
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

        {/* ロゴ */}
        <View style={styles.logoArea}>
          <Text style={styles.logoTitle}>推し活マーケット</Text>
          <Text style={styles.logoSub}>AIが守る、安心のグッズ取引</Text>
        </View>

        {/* フォーム */}
        <View style={styles.card}>
          <Text style={styles.heading}>ログイン</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>メールアドレス</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>パスワード</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="current-password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>ログイン</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkBtn}>
            <Text style={styles.linkText}>パスワードをお忘れの方</Text>
          </TouchableOpacity>
        </View>

        {/* 新規登録 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>アカウントをお持ちでない方は</Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.footerLink}>新規登録</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fdf2f8' },
  inner: {
    flexGrow: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, paddingVertical: 40,
  },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoTitle: {
    fontSize: 28, fontWeight: '900',
    color: '#e91e8c',
  },
  logoSub: { fontSize: 13, color: '#9e9e9e', marginTop: 4 },
  card: {
    width: '100%', backgroundColor: '#fff', borderRadius: 20,
    padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  heading: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 20 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    backgroundColor: '#fafafa',
  },
  primaryBtn: {
    backgroundColor: '#e91e8c', borderRadius: 14, paddingVertical: 15,
    alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  linkBtn: { alignItems: 'center', marginTop: 14 },
  linkText: { fontSize: 12, color: '#9ca3af' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24 },
  footerText: { fontSize: 13, color: '#6b7280' },
  footerLink: { fontSize: 13, color: '#e91e8c', fontWeight: '600' },
})
