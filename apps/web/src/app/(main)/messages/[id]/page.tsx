import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChatRoom } from './ChatRoom'

interface Props { params: Promise<{ id: string }> }

const DUMMY_ROOM = {
  id: 'r1',
  otherUser: 'army_haruka',
  itemId: 'demo',
  itemTitle: 'BTS RM フォトカード Indigo ver.',
  itemImg: 'https://picsum.photos/seed/bts-rm-card/300/300',
  itemPrice: 3500,
  status: 'shipping',
  messages: [
    { id: 'm1', senderId: 'other', text: 'はじめまして！こちらの商品、購入申請させていただきました😊', sentAt: '2026-02-22T10:00:00Z', isSystem: false },
    { id: 'm2', senderId: 'me',    text: 'ありがとうございます！確認しました。\n状態は新品未使用です。発送は翌日を予定しています。', sentAt: '2026-02-22T10:15:00Z', isSystem: false },
    { id: 'm3', senderId: 'other', text: 'ありがとうございます！ぜひよろしくお願いします🙏\n梱包はプチプチなどで丁寧にしていただけますか？', sentAt: '2026-02-22T10:20:00Z', isSystem: false },
    { id: 'm4', senderId: 'me',    text: 'もちろんです！二重梱包でお送りします📦', sentAt: '2026-02-22T10:25:00Z', isSystem: false },
    { id: 'm5', senderId: 'system', text: '取引が成立しました。エスクロー決済が完了しています。', sentAt: '2026-02-22T11:00:00Z', isSystem: true },
    { id: 'm6', senderId: 'me',    text: '発送しました！追跡番号：1234-5678-9012\nヤマト運輸 宅急便コンパクトで発送しています。', sentAt: '2026-02-23T09:30:00Z', isSystem: false },
    { id: 'm7', senderId: 'other', text: 'ありがとうございます！届くのが楽しみです💜\n追跡番号確認しました！', sentAt: '2026-02-23T10:05:00Z', isSystem: false },
    { id: 'm8', senderId: 'system', text: '出品者が発送済みにしました。配達をお待ちください。', sentAt: '2026-02-23T09:30:00Z', isSystem: true },
    { id: 'm9', senderId: 'other', text: 'ありがとうございます！発送しました📦', sentAt: '2026-02-24T14:32:00Z', isSystem: false },
  ],
}

const STATUS_STEPS = [
  { key: 'requested',   label: '申請中' },
  { key: 'agreed',      label: '合意済み' },
  { key: 'paid',        label: '決済完了' },
  { key: 'shipping',    label: '発送中' },
  { key: 'completed',   label: '取引完了' },
]

export default async function MessageRoomPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const room = DUMMY_ROOM
  const currentStep = STATUS_STEPS.findIndex(s => s.key === room.status)

  return (
    <div className="max-w-2xl mx-auto px-0 sm:px-4 py-0 sm:py-6 flex flex-col h-[calc(100vh-64px)]">

      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <Link href="/messages"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>

        {/* 商品サムネ */}
        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
          <img src={room.itemImg} alt="" className="w-full h-full object-cover"/>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#333333] truncate">{room.itemTitle}</p>
          <p className="text-[11px] text-gray-400">@{room.otherUser}</p>
        </div>

        <Link href={`/listings/${room.itemId}`}
          className="text-[11px] text-sky-500 font-bold flex-shrink-0 hover:text-sky-600">
          商品を見る →
        </Link>
      </div>

      {/* 取引ステータスバー */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between">
          {STATUS_STEPS.map((step, i) => (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-0.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-colors
                  ${i < currentStep ? 'bg-sky-400 text-white'
                    : i === currentStep ? 'bg-sky-500 text-white ring-2 ring-sky-200'
                    : 'bg-gray-200 text-gray-400'}`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className={`text-[9px] whitespace-nowrap ${i === currentStep ? 'text-sky-600 font-bold' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-3 ${i < currentStep ? 'bg-sky-400' : 'bg-gray-200'}`}/>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 価格バー */}
      <div className="px-4 py-2.5 bg-white border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
        <span className="text-xs text-gray-400">取引金額</span>
        <span className="text-sm font-black text-[#333333]">¥{room.itemPrice.toLocaleString()}</span>
        <span className="ml-auto text-[11px] bg-green-100 text-green-600 font-bold px-2 py-0.5 rounded-full">
          エスクロー決済済み
        </span>
      </div>

      {/* チャットエリア（クライアントコンポーネント） */}
      <ChatRoom
        roomId={id}
        myUserId={user.id}
        otherUser={room.otherUser}
        initialMessages={room.messages}
        txStatus={room.status}
      />
    </div>
  )
}



