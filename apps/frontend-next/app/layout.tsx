import './globals.css'
import React from 'react'

export const metadata = {
  title: {
    default: 'Vietnam Travel Magazine | 베트남 여행 가이드',
    template: '%s | Vietnam Travel Magazine',
  },
  description: '베트남 현지 거주자가 추천하는 다낭, 나트랑, 푸꾸옥, 호치민, 하노이 맛집, 여행코스, 숙소 가이드. 현지인만 아는 찐 로컬 정보.',
  keywords: ['베트남 여행', '다낭 맛집', '나트랑 여행', '푸꾸옥 여행', '호치민 맛집', '하노이 여행', '베트남 자유여행', '다낭 여행코스', '베트남 가볼만한곳'],
  openGraph: {
    title: 'Vietnam Travel Magazine | 베트남 여행 가이드',
    description: '베트남 현지 거주자가 추천하는 찐 로컬 여행 가이드',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://vietnam-magazine.vercel.app',
    siteName: 'Vietnam Travel Magazine',
    locale: 'ko_KR',
    type: 'website',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || '',
    other: {
      'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_VERIFICATION || '',
    },
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://vietnam-magazine.vercel.app',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="theme-color" content="#1a6b54" />
      </head>
      <body className="bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 font-sans">
        <header className="border-b bg-cream-bg dark:bg-gray-800">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-serif text-travel-green">Vietnam Travel Magazine</h1>
            <nav>
              <a href="/" className="mr-4">홈</a>
              <a href="/search" className="mr-4">검색</a>
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t py-6 mt-12 text-center text-sm text-gray-500">
          © Vietnam Travel Magazine
        </footer>
      </body>
    </html>
  )
}
