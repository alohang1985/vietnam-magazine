import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Vietnam Travel Magazine — 홈',
  description: '현지 팁과 일정, 예산을 담은 프리미엄 베트남 여행 가이드',
  openGraph: { title: 'Vietnam Travel Magazine', description: '현지 팁과 일정, 예산을 담은 프리미엄 베트남 여행 가이드', url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' }
}

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:1337'

const categoryLabels: Record<string, string> = {
  'phu-quoc': '푸꾸옥', 'nha-trang': '나트랑', 'da-nang': '다낭',
  'ho-chi-minh': '호치민', 'hanoi': '하노이', 'ha-long': '하롱베이',
  'dalat': '달랏', 'hoi-an': '호이안', 'sapa': '사파', 'mui-ne': '무이네',
}

// 마크다운에서 첫 번째 이미지 URL 추출
function extractFirstImage(markdown: string): string | null {
  if (!markdown) return null
  const match = markdown.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/)
  return match ? match[1] : null
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}.${m}.${day}`
}

export default async function Home() {
  let posts: any[] = []
  try {
    const res = await fetch(`${CMS_URL}/api/posts?populate=*&pagination[pageSize]=100`, { cache: 'no-store' })
    const json = await res.json()
    const rawPosts = json.data || []
    // published_at 기준으로 최신순 정렬 (프론트에서 확실하게)
    posts = rawPosts.sort((a: any, b: any) => {
      const dateA = a.attributes.published_at || a.attributes.createdAt || ''
      const dateB = b.attributes.published_at || b.attributes.createdAt || ''
      return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
  } catch {
    posts = []
  }

  return (
    <>
      <section className="mb-8">
        <div className="space-y-4">
          <h2 className="text-3xl font-serif">최신 기사</h2>
          <p className="text-gray-500">총 {posts.length}개의 가이드</p>
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p: any) => {
              const attr = p.attributes
              const date = attr.published_at || attr.publishedAt || attr.createdAt
              const categoryLabel = categoryLabels[attr.category] || attr.category
              const imageUrl = attr.hero_image?.url || extractFirstImage(attr.article_markdown)
              return (
                <article key={p.id} className="card p-4 flex flex-col">
                  {imageUrl ? (
                    <img src={imageUrl} alt={attr.title} loading="lazy" className="w-full h-40 object-cover rounded-md mb-3" />
                  ) : (
                    <div className="w-full h-40 bg-gray-200 rounded-md mb-3" />
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{categoryLabel}</span>
                    {date && <span>{formatDate(date)}</span>}
                  </div>
                  <h3 className="text-lg font-semibold">{attr.title}</h3>
                  {attr.summary_5lines && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-3">{attr.summary_5lines}</p>
                  )}
                  <Link href={`/posts/${attr.slug}`} className="text-travel-green mt-auto pt-3 inline-block">더보기 →</Link>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
