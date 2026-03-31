import Link from 'next/link'

/* ─── ダミーデータ ─── */
const COMMUNITIES = [
  { slug: 'bts',          name: 'BTS',          genre: 'kpop',   img: 'https://picsum.photos/seed/bts_comm/160/160',      members: 12480, posts: 3241, color: 'from-purple-500 to-indigo-500',  hot: true  },
  { slug: 'newjeans',     name: 'NewJeans',      genre: 'kpop',   img: 'https://picsum.photos/seed/nj_comm/160/160',       members: 8920,  posts: 2108, color: 'from-sky-400 to-blue-500',       hot: true  },
  { slug: 'blackpink',    name: 'BLACKPINK',     genre: 'kpop',   img: 'https://picsum.photos/seed/bp_comm/160/160',       members: 15300, posts: 4520, color: 'from-pink-500 to-rose-500',      hot: true  },
  { slug: 'lesserafim',   name: 'LE SSERAFIM',   genre: 'kpop',   img: 'https://picsum.photos/seed/lsf_comm/160/160',      members: 6740,  posts: 1893, color: 'from-amber-400 to-orange-500',   hot: false },
  { slug: 'twice',        name: 'TWICE',         genre: 'kpop',   img: 'https://picsum.photos/seed/twice_comm/160/160',    members: 9210,  posts: 2654, color: 'from-rose-400 to-pink-500',      hot: false },
  { slug: 'aespa',        name: 'aespa',         genre: 'kpop',   img: 'https://picsum.photos/seed/aespa_comm/160/160',    members: 7630,  posts: 2011, color: 'from-cyan-400 to-teal-500',      hot: true  },
  { slug: 'stray-kids',   name: 'Stray Kids',    genre: 'kpop',   img: 'https://picsum.photos/seed/skz_comm/160/160',      members: 5480,  posts: 1542, color: 'from-yellow-400 to-orange-400',  hot: false },
  { slug: 'nogizaka46',   name: '乃木坂46',      genre: 'jpop',   img: 'https://picsum.photos/seed/nogi_comm/160/160',     members: 11200, posts: 3890, color: 'from-green-400 to-teal-500',     hot: false },
  { slug: 'akb48',        name: 'AKB48',         genre: 'jpop',   img: 'https://picsum.photos/seed/akb_comm/160/160',      members: 13400, posts: 5100, color: 'from-red-400 to-rose-500',       hot: false },
  { slug: 'niziu',        name: 'NiziU',         genre: 'jpop',   img: 'https://picsum.photos/seed/niziu_comm/160/160',    members: 4320,  posts: 1201, color: 'from-violet-400 to-fuchsia-500', hot: false },
  { slug: 'seventeen',    name: 'SEVENTEEN',     genre: 'kpop',   img: 'https://picsum.photos/seed/svt_comm/160/160',      members: 7890,  posts: 2340, color: 'from-blue-400 to-indigo-500',    hot: false },
  { slug: 'enhypen',      name: 'ENHYPEN',       genre: 'kpop',   img: 'https://picsum.photos/seed/en_comm/160/160',       members: 3210,  posts: 987,  color: 'from-slate-500 to-gray-600',     hot: false },
]

const TRENDING_POSTS = [
  {
    id: 1, community: 'BTS', communitySlug: 'bts', user: 'haruka_army', avatar: 'https://picsum.photos/seed/u1/40/40',
    time: '5分前', likes: 142, replies: 38, isExchange: true,
    content: 'BTSのラストコンサートで買ったRMのフォトカード、交換してくれる方いませんか？ジンのものと交換希望です！',
    imgs: ['https://picsum.photos/seed/bts-rm-card/300/300', 'https://picsum.photos/seed/bts-jin-card/300/300'],
    imgLabels: ['持ってる：RM', '欲しい：JIN'],
  },
  {
    id: 2, community: 'NewJeans', communitySlug: 'newjeans', user: 'mochi_bunnies', avatar: 'https://picsum.photos/seed/u2/40/40',
    time: '12分前', likes: 89, replies: 21, isExchange: false,
    content: 'OMG ツアーのハニ缶バッジゲット🐰💕 まだ買える方いたら絶対買った方がいい！！かわいすぎ',
    imgs: ['https://picsum.photos/seed/nj-hani-badge/600/400'],
    imgLabels: [],
  },
  {
    id: 3, community: 'BLACKPINK', communitySlug: 'blackpink', user: 'lisa_blink', avatar: 'https://picsum.photos/seed/u3/40/40',
    time: '28分前', likes: 203, replies: 54, isExchange: true,
    content: 'BORNPINKツアーのリサ アクスタを入手しました！同じもの2個持ってるのでどなたかロゼと交換してください',
    imgs: ['https://picsum.photos/seed/bp-lisa-acsta/300/300', 'https://picsum.photos/seed/bp-rose-acsta/300/300'],
    imgLabels: ['持ってる：LISA×2', '欲しい：ROSÉ'],
  },
  {
    id: 4, community: 'aespa', communitySlug: 'aespa', user: 'winter_fan', avatar: 'https://picsum.photos/seed/u4/40/40',
    time: '1時間前', likes: 67, replies: 15, isExchange: true,
    content: 'SMTOWN LIVEのカリナうちわ、状態ほぼ新品です。ウィンターのものと交換希望✨',
    imgs: ['https://picsum.photos/seed/aespa-karina-fan/300/300', 'https://picsum.photos/seed/aespa-winter-fan/300/300'],
    imgLabels: ['持ってる：カリナ', '欲しい：ウィンター'],
  },
  {
    id: 5, community: 'LE SSERAFIM', communitySlug: 'lesserafim', user: 'sakura_fan07', avatar: 'https://picsum.photos/seed/u5/40/40',
    time: '2時間前', likes: 51, replies: 12, isExchange: true,
    content: 'FEARLESSツアーのサクラちゃんタオル、ほぼ未使用です！カズハのグッズと交換したいです〜',
    imgs: ['https://picsum.photos/seed/lsf-sakura-towel/300/300', 'https://picsum.photos/seed/lsf-kazuha-goods/300/300'],
    imgLabels: ['持ってる：サクラ', '欲しい：カズハ'],
  },
  {
    id: 6, community: 'TWICE', communitySlug: 'twice', user: 'once_nayeon', avatar: 'https://picsum.photos/seed/u6/40/40',
    time: '3時間前', likes: 78, replies: 19, isExchange: false,
    content: 'READY TO BEツアーのサナちゃんのトレカ✨ 超高品質印刷でめちゃくちゃかわいい😭💗 コレクション中〜',
    imgs: ['https://picsum.photos/seed/twice-sana-card/600/400'],
    imgLabels: [],
  },
]

const GENRES = [
  { slug: 'all',    label: 'すべて' },
  { slug: 'kpop',  label: 'K-POP' },
  { slug: 'jpop',  label: 'J-POP' },
  { slug: 'anime', label: 'アニメ' },
  { slug: 'vtuber',label: 'VTuber' },
  { slug: 'other', label: 'その他' },
]

export default function CommunityPage() {
  const hotCommunities = COMMUNITIES.filter(c => c.hot)
  const allCommunities = COMMUNITIES

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ─── ヒーローバナー ─── */}
      <div className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black mb-2">
                推し活コミュニティ 💬
              </h1>
              <p className="text-white/80 text-sm md:text-base">
                推し仲間と繋がろう。交換・情報交換・オフ会まで！
              </p>
            </div>
            <button className="self-start md:self-auto flex items-center gap-2 bg-white text-violet-600
                               font-bold px-5 py-2.5 rounded-full shadow hover:shadow-md transition-all text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              投稿する
            </button>
          </div>

          {/* 統計 */}
          <div className="flex gap-6 mt-6 text-sm">
            <div className="text-center">
              <p className="text-xl font-black">125,430</p>
              <p className="text-white/70">メンバー</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-xl font-black">48,201</p>
              <p className="text-white/70">投稿</p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-xl font-black">{COMMUNITIES.length}</p>
              <p className="text-white/70">コミュニティ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">

        {/* ─── 今アツいコミュニティ ─── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🔥</span>
            <h2 className="text-base font-bold text-gray-800">今アツいコミュニティ</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {hotCommunities.map(c => (
              <Link key={c.slug} href={`/community/${c.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 p-4 text-center
                           hover:shadow-md hover:border-violet-200 transition-all">
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${c.color}
                                 mx-auto mb-2 overflow-hidden ring-2 ring-white shadow`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.img} alt={c.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-bold text-gray-800 truncate">{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.members.toLocaleString()}人</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── メインコンテンツ（2カラム） ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 左：トレンド投稿フィード */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <span>✨</span> 最新の投稿
              </h2>
              {/* ジャンルフィルター */}
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {GENRES.map(g => (
                  <button key={g.slug}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-colors
                      ${g.slug === 'all'
                        ? 'bg-violet-500 text-white border-violet-500'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-violet-300'}`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {TRENDING_POSTS.map(post => (
              <div key={post.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                {/* ヘッダー */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.avatar} alt={post.user} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800">@{post.user}</p>
                    <div className="flex items-center gap-1.5">
                      <Link href={`/community/${post.communitySlug}`}
                        className="text-xs text-violet-500 font-medium hover:underline">
                        #{post.community}
                      </Link>
                      <span className="text-gray-300 text-xs">·</span>
                      <span className="text-xs text-gray-400">{post.time}</span>
                    </div>
                  </div>
                </div>

                {/* 本文 + 画像（通常投稿は右サムネ、交換投稿はバッジ＋2枚並べ） */}
                {post.isExchange ? (
                  <>
                    <div className="flex items-start gap-2 mb-3">
                      <span className="flex-shrink-0 mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-600">
                        交換希望
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-3 mb-3">
                    <p className="flex-1 text-sm text-gray-700 leading-relaxed">{post.content}</p>
                    {post.imgs.length > 0 && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.imgs[0]} alt="post" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}

                {/* 画像：交換投稿のみ2枚並べ＋矢印 */}
                {post.isExchange && post.imgs.length > 0 && (
                  <div className="mb-3">
                    {post.imgs.length === 2 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 rounded-xl overflow-hidden bg-gray-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={post.imgs[0]} alt={post.imgLabels[0]} className="w-full aspect-square object-cover" />
                          {post.imgLabels[0] && (
                            <p className="text-[10px] text-center text-gray-500 py-1 bg-gray-50">{post.imgLabels[0]}</p>
                          )}
                        </div>
                        {/* 矢印 */}
                        <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                          <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0-4-4m4 4-4 4m0 6H4m0 0 4 4m-4-4 4-4" />
                          </svg>
                          <span className="text-[9px] text-sky-400 font-bold">交換</span>
                        </div>
                        <div className="flex-1 rounded-xl overflow-hidden bg-gray-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={post.imgs[1]} alt={post.imgLabels[1]} className="w-full aspect-square object-cover" />
                          {post.imgLabels[1] && (
                            <p className="text-[10px] text-center text-gray-500 py-1 bg-gray-50">{post.imgLabels[1]}</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 float-right ml-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.imgs[0]} alt="post" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                )}

                {/* アクション */}
                <div className="flex items-center gap-4 pt-1 border-t border-gray-50">
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-rose-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span className="text-xs font-medium">{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-violet-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-xs font-medium">{post.replies}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-sky-500 transition-colors ml-auto">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <span className="text-xs font-medium">シェア</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 右：コミュニティ一覧サイドバー */}
          <div className="space-y-4">
            {/* 検索 */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="コミュニティを検索..."
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent" />
            </div>

            {/* コミュニティランキング */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-50">
                <h3 className="text-sm font-bold text-gray-800">コミュニティ一覧</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {allCommunities.map((c, i) => (
                  <Link key={c.slug} href={`/community/${c.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <span className="w-5 text-xs font-bold text-gray-400 text-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${c.color}
                                     overflow-hidden flex-shrink-0`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.img} alt={c.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.members.toLocaleString()}人</p>
                    </div>
                    {c.hot && (
                      <span className="text-xs bg-rose-100 text-rose-500 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                        HOT
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* コミュニティ作成バナー */}
            <div className="bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl p-4 text-white">
              <p className="text-sm font-bold mb-1">推しのコミュニティを作ろう！</p>
              <p className="text-xs text-white/80 mb-3">
                まだコミュニティがない場合は、あなたが最初に作れます
              </p>
              <button className="w-full bg-white text-violet-600 font-bold text-xs py-2 rounded-xl
                                 hover:bg-violet-50 transition-colors">
                コミュニティを作成する
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

