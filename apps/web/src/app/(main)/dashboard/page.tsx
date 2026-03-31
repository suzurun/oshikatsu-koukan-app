import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from './LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [
    { data: profile },
    { data: creditScore },
    { data: recentTx },
    { data: myListings },
    { data: wishlistCount },
    { data: kycRecord },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('credit_scores').select('*').eq('user_id', user.id).single(),
    supabase
      .from('transactions')
      .select(`
        id, status, transaction_type, agreed_price, created_at,
        listings!listing_id(title, primary_image_url)
      `)
      .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('listings')
      .select('id, title, status, asking_price, primary_image_url:listing_images(url)')
      .eq('seller_id', user.id)
      .in('status', ['active', 'reserved', 'draft'])
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('wishlists')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('kyc_records')
      .select('status, submitted_at, approved_at')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const score = creditScore?.score ?? 100
  const isPremium = profile?.membership_type === 'premium'
  const kycStatus = (kycRecord?.status ?? 'none') as 'none' | 'pending' | 'approved' | 'rejected'
  const totalTx = creditScore?.total_transactions ?? 0
  const completedTx = creditScore?.completed_transactions ?? 0
  const completionRate = totalTx > 0 ? Math.round((completedTx / totalTx) * 100) : 100

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    requested:         { label: '申請中',    color: 'text-yellow-700 bg-yellow-50' },
    agreed:            { label: '合意済み',   color: 'text-blue-700 bg-blue-50' },
    deposit_held:      { label: '決済済み',   color: 'text-purple-700 bg-purple-50' },
    shipping_unlocked: { label: '発送解禁',   color: 'text-indigo-700 bg-indigo-50' },
    shipped_by_seller: { label: '発送済み',   color: 'text-cyan-700 bg-cyan-50' },
    delivered:         { label: '配達済み',   color: 'text-teal-700 bg-teal-50' },
    completed:         { label: '完了',      color: 'text-green-700 bg-green-100' },
    cancelled:         { label: 'キャンセル', color: 'text-gray-500 bg-gray-100' },
    disputed:          { label: '紛争中',    color: 'text-red-700 bg-red-50' },
  }

  const LISTING_STATUS: Record<string, { label: string; color: string }> = {
    active:   { label: '公開中', color: 'text-green-700 bg-green-50' },
    reserved: { label: '取引中', color: 'text-blue-700 bg-blue-50' },
    draft:    { label: '下書き', color: 'text-gray-500 bg-gray-100' },
  }

  const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-500'
  const scoreBarColor = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

      {/* プロフィールカード */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-2xl font-black flex-shrink-0">
            {String(profile?.display_name ?? user.email ?? '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{profile?.display_name ?? '名前未設定'}</h1>
              {isPremium && (
                <span className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  ⭐ プレミアム
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">@{profile?.username ?? '--'}</p>
            {profile?.bio && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{profile.bio}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/edit"
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              編集
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* 推しアーティスト */}
        {(profile?.favorite_artists as string[] | null)?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {(profile.favorite_artists as string[]).map((artist: string) => (
              <span key={artist} className="text-xs bg-pink-50 text-pink-600 border border-pink-100 px-2 py-0.5 rounded-full">
                {artist}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ═══ 本人確認バナー ═══ */}
      {kycStatus === 'none' && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-sm">本人確認がまだ完了していません</p>
              <p className="text-white/80 text-xs mt-0.5 leading-relaxed">
                身分証をアップロードして本人確認を完了すると、取引・購入・出品が解禁されます。
              </p>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Link href="/auth/kyc"
                  className="inline-flex items-center gap-1.5 bg-white text-orange-500 font-black text-xs px-4 py-2 rounded-full hover:bg-orange-50 transition-colors shadow-sm">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                  </svg>
                  本人確認をする
                </Link>
                <Link href="/auth/kyc?step=identity"
                  className="inline-flex items-center gap-1.5 bg-white/20 text-white font-bold text-xs px-4 py-2 rounded-full hover:bg-white/30 transition-colors border border-white/40">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  身分証をアップロード
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {kycStatus === 'pending' && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
            <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sky-700 font-bold text-sm">本人確認 審査中</p>
            <p className="text-sky-500 text-xs mt-0.5">書類を確認中です。通常5分〜数時間で完了します。結果はメールでお知らせします。</p>
          </div>
          <span className="text-xs bg-sky-200 text-sky-700 font-bold px-3 py-1 rounded-full flex-shrink-0">審査中</span>
        </div>
      )}

      {kycStatus === 'approved' && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-teal-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              <path d="M10 17l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" fill="white"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-teal-700 font-bold text-sm">本人確認 完了済み</p>
            <p className="text-teal-500 text-xs mt-0.5">
              {kycRecord?.approved_at
                ? `${new Date(String(kycRecord.approved_at)).toLocaleDateString('ja-JP')} 承認`
                : '承認済み'} · すべての取引機能が利用できます
            </p>
          </div>
          <span className="text-xs bg-teal-500 text-white font-bold px-3 py-1 rounded-full flex-shrink-0">✓ 確認済み</span>
        </div>
      )}

      {kycStatus === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-red-700 font-bold text-sm">本人確認 再提出が必要です</p>
            <p className="text-red-500 text-xs mt-0.5">書類に問題がありました。再度アップロードしてください。</p>
            <Link href="/auth/kyc?step=identity"
              className="inline-block mt-2 text-xs bg-red-500 text-white font-bold px-4 py-1.5 rounded-full hover:bg-red-600 transition-colors">
              再提出する
            </Link>
          </div>
        </div>
      )}

      {/* 統計 + 信用スコア */}
      <div className="grid sm:grid-cols-3 gap-4">
        {/* 信用スコア */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:col-span-1">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">信用スコア</h2>
          <div className={`text-4xl font-black mb-2 ${scoreColor}`}>{Math.round(score)}</div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div className={`h-full rounded-full transition-all ${scoreBarColor}`} style={{ width: `${score}%` }} />
          </div>
          <p className="text-xs text-gray-400">
            {score >= 80 ? '優良ユーザー' : score >= 60 ? '標準' : '要改善'}
          </p>
          {creditScore?.deposit_amount && (
            <p className="text-xs text-gray-400 mt-1">
              デポジット: ¥{(creditScore.deposit_amount as number).toLocaleString()}
            </p>
          )}
        </div>

        {/* 取引統計 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:col-span-2">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">取引実績</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalTx}</p>
              <p className="text-xs text-gray-400 mt-1">総取引数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{completedTx}</p>
              <p className="text-xs text-gray-400 mt-1">完了</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">{completionRate}%</p>
              <p className="text-xs text-gray-400 mt-1">完了率</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-50">
            <Link href="/transactions" className="text-center group">
              <p className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                {(recentTx ?? []).length}
              </p>
              <p className="text-xs text-gray-400">進行中取引</p>
            </Link>
            <Link href="/dashboard/wishlist" className="text-center group">
              <p className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                {wishlistCount?.count ?? 0}
              </p>
              <p className="text-xs text-gray-400">ほしい物リスト</p>
            </Link>
          </div>
        </div>
      </div>

      {/* プレミアム案内 */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-gray-800 text-sm">⭐ プレミアム会員に登録する</p>
              <p className="text-xs text-gray-500 mt-1">月額385円（税込）でAI相場アラート・フィード優先表示・出品数無制限</p>
            </div>
            <Link
              href="/dashboard/premium"
              className="flex-shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              登録する
            </Link>
          </div>
        </div>
      )}

      {/* 最近の取引 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-700">最近の取引</h2>
          <Link href="/transactions" className="text-xs text-primary-500 hover:text-primary-600">すべて見る →</Link>
        </div>
        {(recentTx ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">取引履歴はありません</p>
        ) : (
          <div className="space-y-2">
            {(recentTx ?? []).map((tx) => {
              const s = STATUS_LABELS[String(tx.status ?? '')] ?? { label: String(tx.status), color: 'text-gray-500 bg-gray-100' }
              const listing = tx.listings as Record<string, unknown> | null
              return (
                <Link key={String(tx.id)} href={`/transactions/${tx.id}`}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                    {listing?.primary_image_url
                      ? <img src={String(listing.primary_image_url)} alt="" className="w-full h-full object-cover" />
                      : <span className="text-lg">🎁</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{String(listing?.title ?? '商品名なし')}</p>
                    {tx.agreed_price && (
                      <p className="text-xs text-gray-400">¥{(tx.agreed_price as number).toLocaleString()}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}>{s.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* 自分の出品 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-700">出品中のグッズ</h2>
          <Link href="/listings/new" className="text-xs text-primary-500 hover:text-primary-600">+ 出品する</Link>
        </div>
        {(myListings ?? []).length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">出品中のグッズはありません</p>
            <Link href="/listings/new" className="text-primary-500 text-sm mt-2 inline-block hover:underline">
              最初に出品してみる →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(myListings ?? []).map((listing) => {
              const s = LISTING_STATUS[String(listing.status ?? 'draft')] ?? { label: String(listing.status), color: 'text-gray-500 bg-gray-100' }
              const imgUrl = (listing.primary_image_url as { url: string }[] | null)?.[0]?.url
              return (
                <Link key={String(listing.id)} href={`/listings/${listing.id}`}
                  className="group border border-gray-100 rounded-xl overflow-hidden hover:border-primary-200 transition-colors">
                  <div className="aspect-square bg-gray-100 relative">
                    {imgUrl
                      ? <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl">🎁</div>}
                    <span className={`absolute top-1.5 right-1.5 text-xs font-bold px-1.5 py-0.5 rounded-md ${s.color}`}>{s.label}</span>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-800 truncate">{String(listing.title)}</p>
                    {listing.asking_price && (
                      <p className="text-xs text-primary-600 font-bold mt-0.5">¥{(listing.asking_price as number).toLocaleString()}</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* クイックリンク */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: '/messages',                iconPath: 'M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z', label: 'メッセージ',      color: 'text-sky-500',   bg: 'bg-sky-50',    badge: null },
          { href: '/transactions',            iconPath: 'M20 7l-8-4-8 4m16 0-8 4m8-4v10l-8 4m0-10L4 7m8 4v10',             label: '取引管理',        color: 'text-indigo-500', bg: 'bg-indigo-50', badge: null },
          { href: '/dashboard/wallet',        iconPath: 'M21 12a2.25 2.25 0 0 0-2.25-2.25H15a3 3 0 1 1-6 0H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6m18 0v3M3 6v3', label: 'ウォレット',      color: 'text-green-500',  bg: 'bg-green-50',  badge: null },
          { href: '/dashboard/wishlist',      iconPath: 'M4.318 6.318a4.5 4.5 0 0 0 0 6.364L12 20.364l7.682-7.682a4.5 4.5 0 0 0-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 0 0-6.364 0z', label: 'ほしい物リスト', color: 'text-pink-500',  bg: 'bg-pink-50',   badge: null },
          { href: '/dashboard/notifications', iconPath: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9', label: '通知',        color: 'text-amber-500', bg: 'bg-amber-50',  badge: null },
          { href: '/dashboard/settings',      iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z', label: '設定',       color: 'text-violet-500',bg: 'bg-violet-50', badge: null },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-4 hover:border-sky-200 hover:shadow-sm transition-all group">
            <div className={`w-9 h-9 rounded-full ${item.bg} flex items-center justify-center flex-shrink-0`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={`w-4 h-4 ${item.color}`}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath}/>
              </svg>
            </div>
            <span className="text-sm font-medium text-[#333333]">{item.label}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-gray-300 ml-auto group-hover:text-sky-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </Link>
        ))}

        {/* 本人確認・身分証アップロード（2カラム幅） */}
        <div className="col-span-2 bg-white border border-gray-100 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            <span className="text-xs font-bold text-gray-500">本人確認・身分証</span>
            {kycStatus === 'approved' && (
              <span className="ml-auto text-[10px] bg-teal-100 text-teal-600 font-bold px-2 py-0.5 rounded-full">✓ 確認済み</span>
            )}
            {kycStatus === 'pending' && (
              <span className="ml-auto text-[10px] bg-sky-100 text-sky-600 font-bold px-2 py-0.5 rounded-full">審査中</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/auth/kyc"
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-colors
                ${kycStatus === 'approved'
                  ? 'bg-teal-50 text-teal-600 border border-teal-200'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'}`}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
              </svg>
              {kycStatus === 'approved' ? '本人確認済み' : '本人確認をする'}
            </Link>
            <Link href="/auth/kyc?step=identity"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-orange-300 hover:text-orange-500 transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              身分証をアップロード
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
