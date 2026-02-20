import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Vietnam Travel Magazine — 홈',
  description: '현지 팁과 일정, 예산을 담은 프리미엄 베트남 여행 가이드',
  openGraph: { title: 'Vietnam Travel Magazine', description: '현지 팁과 일정, 예산을 담은 프리미엄 베트남 여행 가이드', url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000' }
}

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:1337'

export default async function Home() {
  const res = await fetch(`${CMS_URL}/api/posts?populate=*&pagination[limit]=12&sort[0]=published_at:desc`, { cache: 'no-store' })
  const json = await res.json()
  const posts = json.data || []

  return (
    <>
      <section className="mb-8">
        <div className="space-y-4">
          <h2 className="text-3xl font-serif">최신 기사</h2>
          <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p: any) => (
              <article key={p.id} className="card p-4">
                {p.attributes.hero_image?.url ? (
                  <Image src={p.attributes.hero_image.url} alt={p.attributes.title} width={600} height={300} className="w-full h-40 object-cover rounded-md mb-3" />
                ) : (
                  <div className="w-full h-40 bg-gray-200 rounded-md mb-3" />
                )}
                <div className="text-sm text-gray-500">{p.attributes.category}</div>
                <h3 className="text-lg font-semibold">{p.attributes.title}</h3>
                <p className="text-sm text-gray-600 mt-2">{p.attributes.summary_5lines}</p>
                <Link href={`/posts/${p.attributes.slug}`} className="text-travel-green mt-3 inline-block">더보기 →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
