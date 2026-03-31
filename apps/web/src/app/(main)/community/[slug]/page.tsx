import Link from 'next/link'
import CommunityRoom from './CommunityRoom'

/* ─── コミュニティマスタデータ ─── */
export const COMMUNITY_DATA: Record<string, {
  name: string; genre: string; img: string; banner: string;
  members: number; posts: number; color: string; description: string;
}> = {
  'bts':         { name: 'BTS',          genre: 'K-POP',  img: 'https://picsum.photos/seed/bts_comm/160/160',    banner: 'https://picsum.photos/seed/bts_banner/1200/300',    members: 12480, posts: 3241, color: 'from-purple-500 to-indigo-600',  description: 'BTS（防弾少年団）のファンコミュニティ。グッズ交換・情報交換・オフ会など。' },
  'newjeans':    { name: 'NewJeans',      genre: 'K-POP',  img: 'https://picsum.photos/seed/nj_comm/160/160',     banner: 'https://picsum.photos/seed/nj_banner/1200/300',     members: 8920,  posts: 2108, color: 'from-sky-400 to-blue-600',       description: 'NewJeansのバニーたちが集まるコミュニティ🐰' },
  'blackpink':   { name: 'BLACKPINK',     genre: 'K-POP',  img: 'https://picsum.photos/seed/bp_comm/160/160',     banner: 'https://picsum.photos/seed/bp_banner/1200/300',     members: 15300, posts: 4520, color: 'from-pink-500 to-rose-600',      description: 'BLACKPINKのブリンクたちのコミュニティ💖' },
  'lesserafim':  { name: 'LE SSERAFIM',   genre: 'K-POP',  img: 'https://picsum.photos/seed/lsf_comm/160/160',    banner: 'https://picsum.photos/seed/lsf_banner/1200/300',    members: 6740,  posts: 1893, color: 'from-amber-400 to-orange-500',   description: 'LE SSERAFIMのグッズ交換・情報交換コミュニティ' },
  'twice':       { name: 'TWICE',         genre: 'K-POP',  img: 'https://picsum.photos/seed/twice_comm/160/160',  banner: 'https://picsum.photos/seed/twice_banner/1200/300',  members: 9210,  posts: 2654, color: 'from-rose-400 to-pink-600',      description: 'TWICEのONCEが集まるファンルーム💗' },
  'aespa':       { name: 'aespa',         genre: 'K-POP',  img: 'https://picsum.photos/seed/aespa_comm/160/160',  banner: 'https://picsum.photos/seed/aespa_banner/1200/300',  members: 7630,  posts: 2011, color: 'from-cyan-400 to-teal-600',      description: 'aespaのMYs（マイズ）コミュニティ✨' },
  'stray-kids':  { name: 'Stray Kids',    genre: 'K-POP',  img: 'https://picsum.photos/seed/skz_comm/160/160',    banner: 'https://picsum.photos/seed/skz_banner/1200/300',    members: 5480,  posts: 1542, color: 'from-yellow-400 to-orange-500',  description: 'Stray KidsのSTAYコミュニティ' },
  'nogizaka46':  { name: '乃木坂46',      genre: 'J-POP',  img: 'https://picsum.photos/seed/nogi_comm/160/160',   banner: 'https://picsum.photos/seed/nogi_banner/1200/300',   members: 11200, posts: 3890, color: 'from-green-400 to-teal-600',     description: '乃木坂46のファンコミュニティ。生写真・グッズ交換など。' },
  'akb48':       { name: 'AKB48',         genre: 'J-POP',  img: 'https://picsum.photos/seed/akb_comm/160/160',    banner: 'https://picsum.photos/seed/akb_banner/1200/300',    members: 13400, posts: 5100, color: 'from-red-400 to-rose-600',       description: 'AKB48グループのファンコミュニティ' },
  'niziu':       { name: 'NiziU',         genre: 'J-POP',  img: 'https://picsum.photos/seed/niziu_comm/160/160',  banner: 'https://picsum.photos/seed/niziu_banner/1200/300',  members: 4320,  posts: 1201, color: 'from-violet-400 to-fuchsia-600', description: 'NiziUのファンルーム🌈' },
  'seventeen':   { name: 'SEVENTEEN',     genre: 'K-POP',  img: 'https://picsum.photos/seed/svt_comm/160/160',    banner: 'https://picsum.photos/seed/svt_banner/1200/300',    members: 7890,  posts: 2340, color: 'from-blue-400 to-indigo-600',    description: 'SEVENTEENのCARAT（캐럿）コミュニティ💎' },
  'enhypen':     { name: 'ENHYPEN',       genre: 'K-POP',  img: 'https://picsum.photos/seed/en_comm/160/160',     banner: 'https://picsum.photos/seed/en_banner/1200/300',     members: 3210,  posts: 987,  color: 'from-slate-500 to-gray-700',     description: 'ENHYPENのENGENEコミュニティ' },
}

interface Props { params: Promise<{ slug: string }> }

export default async function CommunityRoomPage({ params }: Props) {
  const { slug } = await params
  const community = COMMUNITY_DATA[slug] ?? {
    name: slug, genre: 'その他',
    img: `https://picsum.photos/seed/${slug}/160/160`,
    banner: `https://picsum.photos/seed/${slug}_banner/1200/300`,
    members: 100, posts: 10, color: 'from-gray-400 to-slate-500',
    description: `${slug}のファンコミュニティ`,
  }

  const relatedCommunities = Object.entries(COMMUNITY_DATA)
    .filter(([s]) => s !== slug)
    .slice(0, 4)
    .map(([s, c]) => ({ slug: s, ...c }))

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ─── バナー ─── */}
      <div className="relative h-40 md:h-52 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={community.banner} alt={community.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        {/* バナー上のルーム名 */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${community.color}
                           overflow-hidden ring-3 ring-white/80 shadow-xl flex-shrink-0`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={community.img} alt={community.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-white/70 text-xs font-medium">🚪 ファンルーム</span>
              <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                {community.genre}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white drop-shadow-md">
              {community.name} <span className="text-white/80">部屋</span>
            </h1>
            <p className="text-white/60 text-xs mt-0.5">{community.description}</p>
          </div>
        </div>
        {/* 入室ボタン（バナー右下） */}
        <button className={`absolute bottom-4 right-4 bg-gradient-to-r ${community.color} text-white
                            font-bold px-5 py-2 rounded-full text-sm shadow-lg hover:shadow-xl
                            transition-all hidden md:flex items-center gap-1.5`}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          入室する
        </button>
      </div>

      {/* ─── 統計バー ─── */}
      <div className={`bg-gradient-to-r ${community.color}`}>
        <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center gap-6 text-white text-sm">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 opacity-80" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <strong>{community.members.toLocaleString()}</strong>名が入室中
          </span>
          <span className="opacity-30">|</span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            投稿 <strong>{community.posts.toLocaleString()}</strong>件
          </span>
          <button className={`md:hidden ml-auto bg-white/20 text-white font-bold px-4 py-1 rounded-full text-xs`}>
            入室する
          </button>
        </div>
      </div>

      {/* ─── タブ付きメインエリア ─── */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-4" />

        {/* ─── タブ付きメインエリア（クライアント） ─── */}
        <CommunityRoom
          slug={slug}
          communityName={community.name}
          communityColor={community.color}
          relatedCommunities={relatedCommunities}
        />
      </div>

      {/* 戻るリンク */}
      <div className="max-w-4xl mx-auto px-4 pb-10">
        <Link href="/community"
          className="inline-flex items-center gap-1.5 text-sm text-violet-500 hover:text-violet-700 font-medium">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          コミュニティ一覧へ戻る
        </Link>
      </div>
    </div>
  )
}
