import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#e91e8c',
        tabBarInactiveTintColor: '#9e9e9e',
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'ホーム', tabBarLabel: 'ホーム' }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: '検索', tabBarLabel: '検索' }}
      />
      <Tabs.Screen
        name="sell"
        options={{ title: '出品', tabBarLabel: '出品' }}
      />
      <Tabs.Screen
        name="transactions"
        options={{ title: '取引中', tabBarLabel: '取引中' }}
      />
      <Tabs.Screen
        name="mypage"
        options={{ title: 'マイページ', tabBarLabel: 'マイページ' }}
      />
    </Tabs>
  )
}
