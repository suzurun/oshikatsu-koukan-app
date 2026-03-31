'use client'

import { useState, useTransition } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

const DUMMY_LISTING = {
  id: 'demo',
  title: 'BTS RM フォトカード Indigo ver.',
  img: 'https://picsum.photos/seed/bts-rm-card/300/300',
  price: 3500,
  isExchangeOnly: false,
  condition: '未使用',
  seller: 'army_haruka',
  sellerScore: 98,
  aiScore: 97,
}

const STEPS = ['確認', '支払い', '完了']

function PurchaseInner() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const isExchange = searchParams.get('type') === 'exchange'
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [address, setAddress] = useState('')
  const [myItem, setMyItem] = useState('')
  const listing = DUMMY_LISTING

  const handleConfirm = () => {
    startTransition(async () => {
      await new Promise(r => setTimeout(r, 800))
      setStep(2)
    })
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">

      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/listings/${params.id}`}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-black text-[#333333]">
            {isExchange ? '交換申請' : '購入確認'}
          </h1>
          <p className="text-xs text-gray-400">内容をご確認ください</p>
        </div>
      </div>

      {/* ステッパー */}
      <div className="flex items-center mb-7">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-colors
                ${i < step ? 'bg-sky-400 text-white'
                  : i === step ? 'bg-sky-500 text-white ring-2 ring-sky-200'
                  : 'bg-gray-200 text-gray-400'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] whitespace-nowrap ${i === step ? 'text-sky-600 font-bold' : 'text-gray-400'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < step ? 'bg-sky-400' : 'bg-gray-200'}`}/>
            )}
          </div>
        ))}
      </div>

      {step === 2 ? (
        /* 完了 */
        <div className="text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-[#333333]">
              {isExchange ? '交換申請しました！' : '購入申請しました！'}
            </h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              出品者の承認をお待ちください。<br />
              メッセージで詳細を確認できます。
            </p>
          </div>
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-left space-y-2">
            <p className="text-xs font-bold text-sky-700">次のステップ</p>
            {[
              '出品者が申請を確認・承認',
              isExchange ? '双方がグッズを発送' : 'エスクロー決済で安全に支払い',
              '受取確認で取引完了',
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-sky-600">
                <span className="w-4 h-4 rounded-full bg-sky-200 text-sky-700 font-black text-[10px] flex items-center justify-center flex-shrink-0">{i+1}</span>
                {s}
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Link href="/messages"
              className="flex-1 bg-gradient-to-r from-sky-400 to-blue-500 text-white font-black py-3.5 rounded-xl text-sm hover:opacity-90 transition-opacity shadow-md text-center">
              メッセージを見る
            </Link>
            <Link href="/"
              className="flex-1 border border-gray-200 text-gray-600 font-bold py-3.5 rounded-xl text-sm hover:bg-gray-50 transition-colors text-center">
              TOPに戻る
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* 商品カード */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={listing.img} alt={listing.title} className="w-full h-full object-cover"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">{listing.condition}</p>
              <p className="text-sm font-bold text-[#333333] leading-tight">{listing.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">@{listing.seller}</span>
                <span className="text-xs bg-green-100 text-green-600 font-bold px-1.5 py-0.5 rounded-full">★ {listing.sellerScore}</span>
              </div>
            </div>
          </div>

          {/* AI鑑定バッジ */}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-500 flex-shrink-0">
              <path d="M12 1l-9 4v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
            </svg>
            <div>
              <p className="text-xs font-bold text-amber-700">AI鑑定済み（本物スコア {listing.aiScore}点）</p>
              <p className="text-[11px] text-amber-600">AIによる画像・価格・出品者の多角審査済み</p>
            </div>
          </div>

          {step === 0 && (
            /* ステップ1：確認 */
            <>
              {isExchange ? (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    交換に出すグッズを選ぶ
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'my1', title: 'BTS JIMIN フォトカード（出品中）', condition: '未使用' },
                      { id: 'my2', title: 'BTS V ブロマイド（出品中）', condition: '美品' },
                    ].map(item => (
                      <label key={item.id}
                        className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all
                          ${myItem === item.id ? 'border-pink-400 bg-pink-50' : 'border-gray-200 hover:border-pink-200'}`}>
                        <input type="radio" name="myItem" value={item.id}
                          checked={myItem === item.id} onChange={e => setMyItem(e.target.value)}
                          className="accent-pink-500"/>
                        <div>
                          <p className="text-sm font-medium text-[#333333]">{item.title}</p>
                          <p className="text-xs text-gray-400">{item.condition}</p>
                        </div>
                      </label>
                    ))}
                    <Link href="/listings/new"
                      className="flex items-center gap-2 p-3.5 border border-dashed border-pink-300 rounded-xl text-sm text-pink-500 font-medium hover:bg-pink-50 transition-colors">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                      </svg>
                      新しいグッズを出品して交換に使う
                    </Link>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    お届け先住所
                  </label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)}
                    rows={3} placeholder="〒000-0000&#10;東京都渋谷区..."
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-300"/>
                </div>
              )}

              {/* 金額 */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>商品代金</span>
                  <span>{isExchange ? '¥0（交換）' : `¥${listing.price.toLocaleString()}`}</span>
                </div>
                {!isExchange && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>取引手数料（2%）</span>
                    <span>¥{Math.round(listing.price * 0.02).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-[#333333] pt-2 border-t border-gray-200">
                  <span>合計</span>
                  <span className={isExchange ? 'text-rose-500 text-lg' : ''}>
                    {isExchange ? '¥0' : `¥${Math.round(listing.price * 1.02).toLocaleString()}`}
                  </span>
                </div>
              </div>

              {/* エスクロー説明 */}
              {!isExchange && (
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9-3.75h.008v.008H12V8.25z"/>
                  </svg>
                  <p className="text-xs text-sky-700 leading-relaxed">
                    <strong>エスクロー決済：</strong>支払い金額は一時預かりされ、商品受取確認後に出品者へ振り込まれます。安心してお取引できます。
                  </p>
                </div>
              )}

              <button
                onClick={() => isExchange ? setStep(2) : setStep(1)}
                disabled={isExchange && !myItem}
                className="w-full bg-gradient-to-r from-sky-400 to-blue-500 hover:opacity-90 disabled:opacity-40 text-white font-black py-4 rounded-xl text-sm transition-opacity shadow-md"
              >
                {isExchange ? '交換を申し込む（¥0）' : '支払い画面へ進む →'}
              </button>
            </>
          )}

          {step === 1 && (
            /* ステップ2：支払い */
            <>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 border-2 border-sky-400 rounded-xl bg-sky-50 cursor-pointer">
                  <input type="radio" defaultChecked className="accent-sky-500"/>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-5 bg-blue-700 rounded flex items-center justify-center">
                      <span className="text-white text-[9px] font-black">VISA</span>
                    </div>
                    <span className="text-sm font-medium text-[#333333]">クレジットカード</span>
                  </div>
                </label>
                <div className="p-4 border border-gray-200 rounded-xl space-y-3">
                  <input placeholder="カード番号" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"/>
                  <div className="flex gap-3">
                    <input placeholder="有効期限 MM/YY" className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"/>
                    <input placeholder="CVV" className="w-20 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"/>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="w-full bg-gradient-to-r from-sky-400 to-blue-500 hover:opacity-90 disabled:opacity-60 text-white font-black py-4 rounded-xl text-sm transition-opacity shadow-md"
              >
                {isPending ? '処理中...' : `¥${Math.round(listing.price * 1.02).toLocaleString()} を支払う`}
              </button>
              <button onClick={() => setStep(0)}
                className="w-full text-center text-xs text-gray-400 hover:text-gray-600 font-medium">
                ← 前に戻る
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function PurchasePage() {
  return (
    <Suspense>
      <PurchaseInner />
    </Suspense>
  )
}



