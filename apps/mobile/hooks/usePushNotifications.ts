import { useEffect, useRef } from 'react'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '@oshikatsu/api-client'

// 通知受信時の表示設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
})

export function usePushNotifications() {
  const router = useRouter()
  const notificationListener  = useRef<Notifications.EventSubscription>()
  const responseListener      = useRef<Notifications.EventSubscription>()

  useEffect(() => {
    registerForPushNotifications()

    // 通知受信（フォアグラウンド）
    notificationListener.current = Notifications.addNotificationReceivedListener((_notification) => {
      // バッジ更新などの処理
    })

    // 通知タップ（バックグラウンド→フォアグラウンド）
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        type?: string
        relatedEntityId?: string
        relatedEntityType?: string
      }

      // タップ時の画面遷移
      if (data.relatedEntityType === 'transaction' && data.relatedEntityId) {
        router.push(`/transactions/${data.relatedEntityId}`)
      } else if (data.relatedEntityType === 'listing' && data.relatedEntityId) {
        router.push(`/listings/${data.relatedEntityId}`)
      }
    })

    return () => {
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [router])
}

async function registerForPushNotifications() {
  // 実機でのみ有効（シミュレータ不可）
  if (!Device.isDevice) return

  // 通知権限を要求
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') return

  // Android チャンネル設定
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name:            '推し活マーケット',
      importance:      Notifications.AndroidImportance.MAX,
      vibrationPattern:[0, 250, 250, 250],
      lightColor:      '#e91e8c',
    })
  }

  // Expo Push Token 取得
  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId: 'jp.oshikatsu.market',   // app.json の slug と一致
  })

  if (!token) return

  // ログイン中のユーザーにトークンを登録
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('push_tokens').upsert(
    {
      user_id:  user.id,
      token,
      platform: Platform.OS as 'ios' | 'android',
      is_active: true,
    },
    { onConflict: 'user_id,token' },
  )
}
