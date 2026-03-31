'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@oshikatsu/api-client'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
    >
      ログアウト
    </button>
  )
}
