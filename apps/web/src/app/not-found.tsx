import Link from 'next/link'

export default function NotFound() {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#f9fafb' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: '20px' }}>
          <h1 style={{ fontSize: '4rem', fontWeight: 'bold', color: '#ec4899', margin: 0 }}>404</h1>
          <p style={{ fontSize: '1.2rem', color: '#6b7280', margin: '16px 0' }}>ページが見つかりませんでした</p>
          <a href="/" style={{ backgroundColor: '#ec4899', color: 'white', padding: '12px 24px', borderRadius: '9999px', textDecoration: 'none', fontWeight: 'bold' }}>
            トップへ戻る
          </a>
        </div>
      </body>
    </html>
  )
}
