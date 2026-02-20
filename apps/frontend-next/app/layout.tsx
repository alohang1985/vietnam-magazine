import './globals.css'
import React from 'react'

export const metadata = {
  title: 'Vietnam Travel Magazine',
  description: 'Premium Vietnam travel guides — 현지 팁과 일정, 예산을 담은 프리미엄 가이드',
  openGraph: {
    title: 'Vietnam Travel Magazine',
    description: 'Premium Vietnam travel guides — 현지 팁과 일정, 예산을 담은 프리미엄 가이드',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="theme-color" content="#1a6b54" />
        {/* AdSense placeholder */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js" crossOrigin="anonymous"></script>
        {/* GA4 placeholder */}
        {process.env.NEXT_PUBLIC_GA_ID ? (<script async src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}></script>) : null}
        {process.env.NEXT_PUBLIC_GA_ID ? (<script dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');` }}></script>) : null}
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
