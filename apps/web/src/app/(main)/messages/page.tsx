import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const DUMMY_ROOMS = [
  {
    id: 'r1',
    otherUser: 'army_haruka',
    otherAvatar: null,
    itemTitle: 'BTS RM フォトカード Indigo ver.',
    itemImg: 'https://picsum.photos/seed/bts-rm-card/80/80',
    lastMessage: 'ありがとうございます！発送しました📦',
    lastAt: '14:32',
    unread: 2,
    status: 'shipping',
  },
  {
    id: 'r2',
    otherUser: 'kpop_mina',
    otherAvatar: null,
    itemTitle: 'BTS JIMIN アクリルスタンド Face ver.',
    itemImg: 'https://picsum.photos/seed/bts-jimin/80/80',
    lastMessage: '交換条件について確認させてください',
    lastAt: '昨日',
    unread: 0,
    status: 'negotiating',
  },
  {
    id: 'r3',
    otherUser: 'hoshi_fan99',
    otherAvatar: null,
    itemTitle: 'BTS V タワレコ 特典ポスター',
    itemImg: 'https://picsum.photos/seed/bts-v/80/80',
    lastMessage: '受け取りました！ありがとうございました😊',
    lastAt: '2/20',
    unread: 0,
    status: 'completed',
  },
  {
    id: 'r4',
    otherUser: 'suga_lover',
    otherAvatar: null,
    itemTitle: 'BTS SUGA 缶バッジ Agust D ver.',
    itemImg: 'https://picsum.photos/seed/bts-suga/80/80',
    lastMessage: 'はじめまして！購入申請させていただきました',
    lastAt: '2/18',
    unread: 0,
    status: 'requested',
  },
]

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  requested:   { label: '申請中',   color: 'bg-yellow-100 text-yellow-700' },
  negotiating: { label: '交渉中',   color: 'bg-blue-100 text-blue-700' },
  shipping:    { label: '発送中',   color: 'bg-indigo-100 text-indigo-700' },
  completed:   { label: '取引完了', color: 'bg-gray-100 text-gray-500' },
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // 本番: message_rooms テーブルから取得
  // const { data: rooms } = await supabase.from('message_rooms')...
  const rooms = DUMMY_ROOMS

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-[#333333]">メッセージ</h1>
          <p className="text-xs text-gray-400 mt-0.5">取引相手とのやりとり</p>
        </div>
        {rooms.filter(r => r.unread > 0).length > 0 && (
          <span className="text-xs bg-rose-500 text-white font-bold px-2.5 py-1 rounded-full">
            未読 {rooms.reduce((sum, r) => sum + r.unread, 0)}
          </span>
        )}
      </div>

      {/* タブ */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {['すべて', '取引中', '完了'].map((tab, i) => (
          <button key={tab}
            className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors
              ${i === 0 ? 'bg-white text-[#333333] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* ルーム一覧 */}
      {rooms.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
            </svg>
          </div>
          <p className="text-sm text-gray-400">メッセージはまだありません</p>
          <Link href="/search"
            className="inline-block mt-4 text-xs text-sky-500 hover:text-sky-600 font-medium">
            グッズを探して取引を始める →
          </Link>
        </div>
      ) : (
        <div className="space-y-1.5">
          {rooms.map(room => {
            const badge = STATUS_BADGE[room.status] ?? STATUS_BADGE.requested
            return (
              <Link key={room.id} href={`/messages/${room.id}`}
                className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4
                           hover:border-sky-200 hover:shadow-sm transition-all group">

                {/* 商品サムネ + ユーザーアバター */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100">
                    <img src={room.itemImg} alt="" className="w-full h-full object-cover"/>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-500
                                  flex items-center justify-center text-white text-[10px] font-black border-2 border-white">
                    {room.otherUser[0].toUpperCase()}
                  </div>
                </div>

                {/* テキスト */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-bold text-gray-700 truncate">@{room.otherUser}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mb-0.5">{room.itemTitle}</p>
                  <p className={`text-xs truncate ${room.unread > 0 ? 'font-bold text-[#333333]' : 'text-gray-400'}`}>
                    {room.lastMessage}
                  </p>
                </div>

                {/* 右：時刻・未読 */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[11px] text-gray-400">{room.lastAt}</span>
                  {room.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                      {room.unread}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}



