import './globals.css'
import React from 'react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_BASE_URL || 'http://localhost:3000'
export const metadata = {
  title: 'Vietnam Travel Magazine',
  description: 'Premium Vietnam travel guides — 현지 팁과 일정, 예산을 담은 프리미엄 가이드',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: 'Vietnam Travel Magazine',
    description: 'Premium Vietnam travel guides — 현지 팁과 일정, 예산을 담은 프리미엄 가이드',
    url: SITE_URL
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="theme-color" content="#1a6b54" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 font-sans">
        <header className="site-header">
          <div className="container header-inner">
            <div className="brand">
              <span className="logo">🇻🇳</span>
              <div>
                <div className="site-title">Vietnam Travel Magazine</div>
                <div className="site-sub">베트남 여행의 모든 것</div>
              </div>
            </div>
            <nav className="nav">
              <a href="/" className="nav-link">홈</a>
              <a href="/search" className="nav-link">검색</a>
            </nav>
          </div>
        </header>

        <main className="container main-content">{children}</main>

        <footer className="site-footer">
          <div className="container">© Vietnam Travel Magazine — 제작</div>
        </footer>
      </body>
    </html>
  )
}
