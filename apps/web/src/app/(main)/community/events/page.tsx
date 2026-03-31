import Link from 'next/link'

const DUMMY_EVENTS = [
  {
    id: 'ev1', artist: 'BTS', tag: 'K-POP',
    title: 'BTS ARMY 東京オフ会 2026春',
    date: '2026年3月15日（土）', time: '14:00〜17:00',
    place: '東京・渋谷カフェ（詳細は参加者にDM）',
    organizer: 'army_haruka', organizerAvatar: 'A',
    capacity: 20, joined: 14, waitlist: 3,
    desc: 'BTS好きな方なら誰でも参加OK！トレカ交換・推し語り・ミニゲームなど楽しみましょう✨ 初参加の方も大歓迎です！',
    tags: ['トレカ交換', '推し語り', '初心者歓迎'],
    img: 'https://picsum.photos/seed/bts-event/600/300',
    hot: true, isFree: true,
  },
  {
    id: 'ev2', artist: 'NewJeans', tag: 'K-POP',
    title: 'NewJeans Bunnies 大阪交換会',
    date: '2026年3月22日（土）', time: '13:00〜16:00',
    place: '大阪・梅田カフェ',
    organizer: 'nj_mina', organizerAvatar: 'N',
    capacity: 15, joined: 9, waitlist: 0,
    desc: 'NewJeansのグッズ交換メインのオフ会！OMG・SUPER SHY・ETA周りのグッズを中心に交換しましょう。',
    tags: ['グッズ交換', 'K-POP'],
    img: 'https://picsum.photos/seed/nj-event/600/300',
    hot: true, isFree: true,
  },
  {
    id: 'ev3', artist: 'aespa', tag: 'K-POP',
    title: 'aespa MYs 名古屋ファンミ',
    date: '2026年4月5日（土）', time: '14:00〜17:00',
    place: '名古屋・栄エリア',
    organizer: 'aespa_karina_fan', organizerAvatar: 'K',
    capacity: 10, joined: 6, waitlist: 0,
    desc: 'aespaのMYsが集まってグッズ交換＋推し語りしましょう！カリナ・ジゼル・ウィンター・NingNing全推し歓迎。',
    tags: ['グッズ交換', 'まったり'],
    img: 'https://picsum.photos/seed/aespa-event/600/300',
    hot: false, isFree: true,
  },
  {
    id: 'ev4', artist: 'SEVENTEEN', tag: 'K-POP',
    title: 'CARAT 東京トレカ交換会',
    date: '2026年4月12日（日）', time: '12:00〜15:00',
    place: '東京・新宿エリア',
    organizer: 'carat_jh', organizerAvatar: 'C',
    capacity: 25, joined: 18, waitlist: 5,
    desc: 'SEVENTEEN CARATのトレカ交換オフ会！FML・Spill The Feels・MAESTRO周りを中心に。全メンバー推し歓迎！',
    tags: ['トレカ交換', '大人数OK'],
    img: 'https://picsum.photos/seed/svt-event/600/300',
    hot: false, isFree: true,
  },
  {
    id: 'ev5', artist: 'IVE', tag: 'K-POP',
    title: 'IVE DIVE 福岡オフ会',
    date: '2026年4月19日（土）', time: '14:00〜17:00',
    place: '福岡・天神エリア',
    organizer: 'dive_wonyoung', organizerAvatar: 'D',
    capacity: 12, joined: 4, waitlist: 0,
    desc: 'IVEのDIVEが集まるオフ会！グッズ交換・ウォニョン・ガウン・レイ・リズ・イソ・イェソ全員推し歓迎。',
    tags: ['グッズ交換', '九州初'],
    img: 'https://picsum.photos/seed/ive-event/600/300',
    hot: false, isFree: true,
  },
  {
    id: 'ev6', artist: '乃木坂46', tag: 'J-POP',
    title: '乃木坂46 ファン交流会 東京',
    date: '2026年3月29日（日）', time: '15:00〜18:00',
    place: '東京・池袋エリア',
    organizer: 'nogifan46', organizerAvatar: 'M',
    capacity: 30, joined: 22, waitlist: 2,
    desc: '乃木坂46のファン交流会！特典会券・生写真・グッズ交換ほかなんでも語りましょう。',
    tags: ['特典交換', '生写真'],
    img: 'https://picsum.photos/seed/nogi-event/600/300',
    hot: false, isFree: true,
  },
]

const ARTIST_TABS = ['すべて', 'BTS', 'NewJeans', 'aespa', 'SEVENTEEN', 'IVE', 'J-POP']

export default function EventsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/community"
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black text-[#333333]">オフ会・イベント</h1>
          <p className="text-xs text-gray-400 mt-0.5">ファン同士でリアルに会おう！</p>
        </div>
        <Link href="/community/events/new"
          className="flex-shrink-0 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-black text-xs px-4 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-md flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          イベントを作る
        </Link>
      </div>

      {/* ヒーロー（近日開催） */}
      <div className="relative bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-3xl overflow-hidden mb-6">
        <div className="absolute inset-0 opacity-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={DUMMY_EVENTS[0].img} alt="" className="w-full h-full object-cover"/>
        </div>
        <div className="relative z-10 px-6 py-6">
          <span className="inline-flex items-center gap-1 bg-yellow-400 text-yellow-900 text-[11px] font-black px-2.5 py-1 rounded-full mb-3">
            🔥 注目イベント
          </span>
          <h2 className="text-xl font-black text-white mb-1">{DUMMY_EVENTS[0].title}</h2>
          <p className="text-white/80 text-sm mb-3">
            {DUMMY_EVENTS[0].date}　{DUMMY_EVENTS[0].time}<br/>
            {DUMMY_EVENTS[0].place}
          </p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
              <span className="text-white text-xs font-bold">{DUMMY_EVENTS[0].joined}/{DUMMY_EVENTS[0].capacity}名参加</span>
            </div>
            <Link href={`/community/events/${DUMMY_EVENTS[0].id}`}
              className="bg-white text-violet-600 font-black text-xs px-5 py-2 rounded-full hover:bg-violet-50 transition-colors shadow-md">
              詳細を見る →
            </Link>
          </div>
        </div>
      </div>

      {/* タブ（フィルター） */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide mb-5">
        {ARTIST_TABS.map((tab, i) => (
          <button key={tab}
            className={`flex-shrink-0 text-xs font-bold px-4 py-2 rounded-full transition-all
              ${i === 0
                ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* イベント一覧 */}
      <div className="space-y-4">
        {DUMMY_EVENTS.map(ev => {
          const spotsLeft = ev.capacity - ev.joined
          const isFull = spotsLeft <= 0
          const isAlmost = !isFull && spotsLeft <= 3
          return (
            <div key={ev.id}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-violet-200 hover:shadow-md transition-all group">
              <div className="flex gap-0">
                {/* 画像 */}
                <div className="w-24 sm:w-36 flex-shrink-0 bg-gray-100 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ev.img} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                  {ev.hot && (
                    <span className="absolute top-2 left-2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">🔥HOT</span>
                  )}
                </div>

                {/* コンテンツ */}
                <div className="flex-1 min-w-0 p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold bg-pink-100 text-pink-600 px-1.5 py-0.5 rounded-full">{ev.artist}</span>
                      {ev.isFree && <span className="text-[10px] font-bold bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">無料</span>}
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-[#333333] mb-1 leading-snug">{ev.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
                    </svg>
                    <span>{ev.date}　{ev.time}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0z"/>
                    </svg>
                    <span className="truncate">{ev.place}</span>
                  </div>

                  {/* 参加状況・ボタン */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-violet-400 to-pink-400 rounded-full"
                            style={{ width: `${Math.min(100, (ev.joined / ev.capacity) * 100)}%` }}/>
                        </div>
                        <span className={`text-[11px] font-bold flex-shrink-0
                          ${isFull ? 'text-red-500' : isAlmost ? 'text-amber-500' : 'text-gray-400'}`}>
                          {isFull ? '満員' : `残り${spotsLeft}枠`}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{ev.joined}/{ev.capacity}名参加</p>
                    </div>
                    <Link href={`/community/events/${ev.id}`}
                      className={`flex-shrink-0 text-xs font-black px-4 py-2 rounded-full transition-opacity
                        ${isFull
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:opacity-90 shadow-sm'}`}>
                      {isFull ? '満員' : '参加する'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 主催ガイド */}
      <div className="mt-8 bg-gradient-to-r from-violet-50 to-pink-50 border border-violet-100 rounded-2xl p-5">
        <h3 className="text-sm font-black text-[#333333] mb-2">🎉 イベントを主催してみよう</h3>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          推し仲間を集めてオフ会・交換会を開こう！参加者の本人確認は推しかつが行うので安心して開催できます。
        </p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { step: '1', text: 'イベント情報を入力' },
            { step: '2', text: '参加者を募集' },
            { step: '3', text: '当日楽しむだけ！' },
          ].map(s => (
            <div key={s.step} className="flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-violet-400 text-white font-black text-sm flex items-center justify-center mb-1.5">{s.step}</div>
              <p className="text-xs text-[#555555] font-medium">{s.text}</p>
            </div>
          ))}
        </div>
        <Link href="/community/events/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-black text-xs px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-md">
          イベントを作る →
        </Link>
      </div>
    </div>
  )
}



