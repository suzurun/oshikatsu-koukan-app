import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { usePushNotifications } from '@/hooks/usePushNotifications'

function PushNotificationSetup() {
  usePushNotifications()
  return null
}

export default function RootLayout() {
  return (
    <>
      <PushNotificationSetup />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen
          name="listings/[id]"
          options={{ title: '商品詳細', headerBackTitle: '戻る' }}
        />
        <Stack.Screen
          name="listings/new"
          options={{ title: '出品する', presentation: 'modal' }}
        />
        <Stack.Screen
          name="transactions/[id]"
          options={{ title: '取引詳細', headerBackTitle: '戻る' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </>
  )
}
