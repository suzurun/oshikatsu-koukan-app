import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface Props { params: Promise<{ username: string }> }

const DUMMY_LISTINGS = [
  { id: 'u1', title: 'BTS RM フォトカード Indigo ver.', price: 3500, img: 'https://picsum.photos/seed/u-l1/300/300', badge: '希少' },
  { id: 'u2', title: 'BTS JIMIN アクリルスタンド Face ver.', price: null, img: 'https://picsum.photos/seed/u-l2/300/300', badge: '交換希望' },
  { id: 'u3', title: 'BTS V タワレコ 特典ポスター', price: 2800, img: 'https://picsum.photos/seed/u-l3/300/300', badge: null },
  { id: 'u4', title: 'BTS JUNGKOOK Golden トレカ', price: 1500, img: 'https://picsum.photos/seed/u-l4/300/300', badge: null },
  { id: 'u5', title: 'BTS SUGA 缶バッジ Agust D ver.', price: 800, img: 'https://picsum.photos/seed/u-l5/300/300', badge: null },
  { id: 'u6', title: 'BTS J-HOPE うちわ 2023ツアー', price: 2200, img: 'https://picsum.photos/seed/u-l6/300/300', badge: null },
]

const DUMMY_REVIEWS = [
  { id: 1, reviewer: 'kpop_lover88', score: 5, comment: '梱包も丁寧でとても迅速な対応でした。またぜひ取引したいです！', date: '2026-02-10' },
  { id: 2, reviewer: 'army_mina',    score: 5, comment: '説明通りの美品でした。コミュニケーションもスムーズで安心できました。', date: '2026-01-28' },
  { id: 3, reviewer: 'hoshi_fan',    score: 4, comment: '少し発送が遅かったですが、商品は問題なし。またよろしくお願いします。', date: '2026-01-15' },
]

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle()

  const { data: creditScore } = profile
    ? await supabase.from('credit_scores').select('*').eq('user_id', profile.id).maybeSingle()
    : { data: null }

  const { data: listings } = profile
    ? await supabase
        .from('listings')
        .select('id, title, asking_price, primary_image_url:listing_images(url), status')
        .eq('seller_id', profile.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(12)
    : { data: null }

  const { data: myUser } = await supabase.auth.getUser()

  // ダミーにフォールバック
  const isDemo = !profile
  const displayName = profile?.display_name ?? username
  const score = creditScore?.score ?? 98
  const totalTx = creditScore?.total_transactions ?? 52
  const completedTx = creditScore?.completed_transactions ?? 50
  const completionRate = totalTx > 0 ? Math.round((completedTx / totalTx) * 100) : 98
  const favoriteArtists = (profile?.favorite_artists as string[] | null) ?? ['BTS', 'K-POP']
  const bio = profile?.bio ?? 'BTS ARMYです！フォトカード・アクリルスタンドを中心に出品しています。丁寧な梱包を心がけています。交換も大歓迎💜'
  const isMine = !isDemo && myUser?.data?.user?.id === profile?.id

  const scoreColor   = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-500'
  const scoreBarColor= score >= 80 ? 'bg-green-500'   : score >= 60 ? 'bg-yellow-500'   : 'bg-red-500'

  const showListings = isDemo ? DUMMY_LISTINGS : (listings ?? []).map(l => ({
    id: String(l.id),
    title: String(l.title),
    price: (l.asking_price as number | null),
    img: ((l.primary_image_url as {url:string}[] | null)?.[0]?.url) ?? null,
    badge: null,
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

      {/* パンくず */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400">
        <Link href="/" className="hover:text-gray-600">トップ</Link>
        <span>/</span>
        <span className="text-gray-600">@{username}</span>
      </nav>

      {/* プロフィールカード */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* ヘッダー背景 */}
        <div className="h-24 bg-gradient-to-r from-sky-300 via-blue-200 to-pink-200"/>
        <div className="px-5 pb-5">
          {/* アバター */}
          <div className="flex items-end justify-between -mt-8 mb-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500
                            flex items-center justify-center text-white text-2xl font-black border-4 border-white shadow-md">
              {String(displayName)[0].toUpperCase()}
            </div>
            <div className="flex gap-2">
              {isMine ? (
                <Link href="/dashboard/edit"
                  className="text-xs px-4 py-1.5 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition-colors">
                  プロフィール編集
                </Link>
              ) : (
                <>
                  <button className="text-xs px-4 py-1.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold rounded-full hover:opacity-90 transition-opacity shadow-sm">
                    フォロー
                  </button>
                  <button className="text-xs px-4 py-1.5 border border-gray-200 rounded-full text-gray-600 hover:bg-gray-50 transition-colors">
                    メッセージ
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 名前・バッジ */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-lg font-black text-[#333333]">{displayName}</h1>
            <span className="text-xs bg-sky-50 text-sky-600 border border-sky-200 px-2 py-0.5 rounded-full font-bold">本人確認済み</span>
            {score >= 90 && (
              <span className="text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full font-bold">優良出品者</span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-3">@{username}</p>

          {/* 自己紹介 */}
          {bio && <p className="text-sm text-gray-600 leading-relaxed mb-3">{bio}</p>}

          {/* 推しアーティスト */}
          {favoriteArtists.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {favoriteArtists.map(a => (
                <span key={a} className="text-xs bg-pink-50 text-pink-600 border border-pink-100 px-2.5 py-0.5 rounded-full">
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 統計 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '信用スコア',  value: String(Math.round(score)), sub: score >= 80 ? '優良' : '標準', color: scoreColor },
          { label: '取引完了',   value: String(completedTx) + '件', sub: `完了率 ${completionRate}%`, color: 'text-gray-800' },
          { label: '出品中',     value: String(showListings.length) + '件', sub: '現在公開中', color: 'text-gray-800' },
          { label: '評価',       value: '★ 4.9', sub: `${DUMMY_REVIEWS.length}件のレビュー`, color: 'text-yellow-600' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{stat.label}</p>
            <p className="text-[10px] text-gray-300 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* 信用スコアバー */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-gray-700">信用スコア</h2>
          <span className={`text-xl font-black ${scoreColor}`}>{Math.round(score)}</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${scoreBarColor}`} style={{ width: `${score}%` }}/>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {score >= 80 ? '✅ 優良ユーザー・安心して取引できます' : score >= 60 ? '取引実績が積まれています' : '注意が必要です'}
        </p>
      </div>

      {/* 出品中のグッズ */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#333333]">
            出品中のグッズ
            <span className="text-xs font-normal text-gray-400 ml-2">{showListings.length}件</span>
          </h2>
        </div>
        {showListings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-400 text-sm">現在出品中の商品はありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {showListings.map(item => (
              <Link key={item.id} href={`/listings/${item.id}`} className="group">
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-sky-200 transition-all">
                  <div className="relative aspect-square bg-gray-50 overflow-hidden">
                    {item.img
                      ? <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                      : <div className="w-full h-full flex items-center justify-center text-3xl">🎁</div>
                    }
                    {item.badge && (
                      <span className={`absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                        ${item.badge === '希少' ? 'bg-purple-500 text-white' : 'bg-sky-100 text-sky-600'}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs text-[#333333] line-clamp-2 leading-tight font-medium">{item.title}</p>
                    <p className="text-sm font-bold text-[#333333] mt-1">
                      {item.price == null
                        ? <span className="text-sky-500 text-xs">交換希望</span>
                        : `¥${item.price.toLocaleString()}`
                      }
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* レビュー */}
      <section>
        <h2 className="text-base font-bold text-[#333333] mb-4">
          取引レビュー
          <span className="text-xs font-normal text-gray-400 ml-2">{DUMMY_REVIEWS.length}件</span>
        </h2>
        <div className="space-y-3">
          {DUMMY_REVIEWS.map(review => (
            <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-300 to-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {review.reviewer[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-700">@{review.reviewer}</p>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} className={`w-3.5 h-3.5 ${s <= review.score ? 'text-yellow-400' : 'text-gray-200'}`} viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21L12 17.27z"/>
                    </svg>
                  ))}
                </div>
                <span className="text-[11px] text-gray-400">{review.date}</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}



