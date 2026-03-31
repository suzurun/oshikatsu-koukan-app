import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '推し活マーケット',
  slug: 'oshikatsu-market',
  extra: {
    eas: {
      projectId: 'jp.oshikatsu.market',
    },
    supabaseUrl:     process.env.EXPO_PUBLIC_SUPABASE_URL     ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  },
})
