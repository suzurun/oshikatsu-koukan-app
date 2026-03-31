import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import './globals.css'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: '推し活マーケット | AI相場分析で安心取引',
  description:
    'AIが全プラットフォームの相場をリアルタイム分析。コンサートグッズ・推し活グッズを安心・安全に売買・交換できるC2Cマーケット。',
  openGraph: {
    title: '推し活マーケット',
    description: 'AI相場分析で安心取引。推し活グッズのC2Cマーケット。',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={notoSansJP.className}>{children}</body>
    </html>
  )
}
