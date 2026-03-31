import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { WishlistRemoveButton } from './WishlistRemoveButton'

export const dynamic = 'force-dynamic'

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: items } = await supabase
    .from('wishlists')
    .select(`
      id,
      created_at,
      listings!listing_id (
        id, title, asking_price, status,
        listing_images!inner ( image_url, order_index )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">ほしい物リスト</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items?.length ?? 0}件</p>
        </div>
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← ダッシュボード
        </Link>
      </div>

      {/* 一覧 */}
      {!items || items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">💝</p>
          <p className="text-lg font-medium">まだ登録がありません</p>
          <Link
            href="/search"
            className="mt-4 inline-block text-sm text-pink-500 hover:text-pink-600 font-medium"
          >
            グッズを探す →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.map((item) => {
            const listing = item.listings as Record<string, unknown> | null
            if (!listing) return null

            const images = (listing.listing_images as Array<{ image_url: string; order_index: number }> | null)
              ?.sort((a, b) => a.order_index - b.order_index) ?? []
            const thumb = images[0]?.image_url ?? null
            const isSoldOut = listing.status !== 'active'

            return (
              <div key={item.id} className="relative group">
                <Link href={`/listings/${listing.id}`} className="block">
                  <div className={`relative aspect-square rounded-2xl overflow-hidden bg-gray-100 ${isSoldOut ? 'opacity-60' : ''}`}>
                    {thumb ? (
                      <Image src={thumb} alt={String(listing.title)} fill className="object-cover" sizes="200px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                    )}
                    {isSoldOut && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">
                          {listing.status === 'reserved' ? '取引中' : '売切れ'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 px-1">
                    <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-snug">
                      {String(listing.title)}
                    </p>
                    {listing.asking_price != null ? (
                      <p className="text-sm font-bold text-pink-600 mt-0.5">
                        ¥{Number(listing.asking_price).toLocaleString()}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5">交換希望</p>
                    )}
                  </div>
                </Link>

                {/* 削除ボタン */}
                <WishlistRemoveButton wishlistId={item.id} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
