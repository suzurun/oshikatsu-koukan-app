import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="kyc" options={{ presentation: 'modal', headerShown: true, title: '本人確認' }} />
    </Stack>
  )
}
