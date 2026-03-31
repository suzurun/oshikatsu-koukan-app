'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function WishlistRemoveButton({ wishlistId }: { wishlistId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('wishlists').delete().eq('id', wishlistId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="absolute top-2 right-2 w-7 h-7 bg-white/80 backdrop-blur-sm rounded-full
                 flex items-center justify-center text-gray-500 hover:text-red-500
                 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm disabled:opacity-50"
      aria-label="リストから削除"
    >
      {loading ? '…' : '×'}
    </button>
  )
}
