'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  senderId: string
  text: string
  sentAt: string
  isSystem: boolean
}

interface Props {
  roomId: string
  myUserId: string
  otherUser: string
  initialMessages: Message[]
  txStatus: string
}

const QUICK_REPLIES = [
  'ありがとうございます！',
  '確認しました🙏',
  '発送しました📦',
  '受け取りました！',
  '少々お待ちください',
]

export function ChatRoom({ myUserId, otherUser, initialMessages, txStatus }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })
  }

  const isSameDay = (a: string, b: string) => {
    return new Date(a).toDateString() === new Date(b).toDateString()
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return
    const text = input.trim()
    setInput('')
    setSending(true)

    const newMsg: Message = {
      id: `m-${Date.now()}`,
      senderId: 'me',
      text,
      sentAt: new Date().toISOString(),
      isSystem: false,
    }
    setMessages(prev => [...prev, newMsg])

    // 本番: Supabase message_logs テーブルに INSERT + Realtime
    await new Promise(r => setTimeout(r, 300))
    setSending(false)
  }

  const handleQuickReply = (text: string) => {
    setInput(text)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50">
        {messages.map((msg, idx) => {
          const isMe = msg.senderId === 'me'
          const showDate = idx === 0 || !isSameDay(messages[idx - 1].sentAt, msg.sentAt)

          return (
            <div key={msg.id}>
              {/* 日付区切り */}
              {showDate && (
                <div className="flex items-center gap-2 my-4">
                  <div className="flex-1 h-px bg-gray-200"/>
                  <span className="text-[11px] text-gray-400 font-medium px-2">{formatDate(msg.sentAt)}</span>
                  <div className="flex-1 h-px bg-gray-200"/>
                </div>
              )}

              {/* システムメッセージ */}
              {msg.isSystem ? (
                <div className="flex justify-center my-3">
                  <span className="text-[11px] bg-sky-100 text-sky-600 font-medium px-3 py-1.5 rounded-full">
                    {msg.text}
                  </span>
                </div>
              ) : (
                /* 通常メッセージ */
                <div className={`flex items-end gap-2 mb-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* アバター（相手のみ） */}
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-purple-500
                                    flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 mb-0.5">
                      {otherUser[0].toUpperCase()}
                    </div>
                  )}

                  <div className={`flex flex-col gap-0.5 max-w-[72%] ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                      ${isMe
                        ? 'bg-gradient-to-br from-sky-400 to-blue-500 text-white rounded-br-md'
                        : 'bg-white border border-gray-200 text-[#333333] rounded-bl-md shadow-sm'}`}>
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-gray-400">{formatTime(msg.sentAt)}</span>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>

      {/* 取引完了済みの場合 */}
      {txStatus === 'completed' && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-200 text-center">
          <p className="text-xs text-green-600 font-bold">✅ この取引は完了しています</p>
          <p className="text-xs text-green-500 mt-0.5">引き続きメッセージの送受信は可能です</p>
        </div>
      )}

      {/* クイックリプライ */}
      <div className="px-4 pt-3 pb-1 bg-white border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_REPLIES.map(reply => (
            <button key={reply}
              onClick={() => handleQuickReply(reply)}
              className="flex-shrink-0 text-[11px] bg-gray-100 hover:bg-sky-100 hover:text-sky-600 text-gray-600 font-medium px-3 py-1.5 rounded-full transition-colors">
              {reply}
            </button>
          ))}
        </div>
      </div>

      {/* 入力欄 */}
      <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-end gap-2 flex-shrink-0">
        {/* 添付ボタン */}
        <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 mb-0.5">
          <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"/>
          </svg>
        </button>

        {/* テキスト入力 */}
        <div className="flex-1 min-h-[40px] max-h-28 relative">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="メッセージを入力..."
            rows={1}
            className="w-full resize-none border border-gray-200 rounded-2xl px-3.5 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-sky-300 focus:border-transparent
                       overflow-y-auto leading-relaxed"
            style={{ minHeight: '40px' }}
          />
        </div>

        {/* 送信ボタン */}
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-500
                     flex items-center justify-center flex-shrink-0 mb-0.5
                     hover:opacity-90 disabled:opacity-40 transition-opacity shadow-sm"
        >
          <svg className="w-4 h-4 text-white translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}



