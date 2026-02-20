export const dynamic = 'force-dynamic';
export const revalidate = 0;
import React from 'react'
import Image from 'next/image'

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:1337'

export default async function PostPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  let p = null
  try {
    if (typeof CMS_URL !== 'string' || !CMS_URL) throw new Error('CMS_URL missing')
    const res = await fetch(`${CMS_URL}/api/posts?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*&pagination[limit]=1`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Bad response')
    const json = await res.json()
    p = json.data && json.data[0]
  } catch (e) {
    p = null
  }
  if (!p) return <div>게시물을 찾을 수 없습니다.</div>
  const attr = p.attributes

  return (
    <article>
      <div className="w-full h-[60vh] relative mb-6">
        {attr.hero_image?.url ? (
          <Image src={attr.hero_image.url} alt={attr.title} fill style={{ objectFit: 'cover' }} />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
        <div className="absolute inset-0 hero-gradient flex items-end p-8">
          <div>
            <div className="bg-black/40 text-white inline-block px-3 py-1 rounded">{attr.category}</div>
            <h1 className="text-4xl font-serif text-white mt-3">{attr.title}</h1>
          </div>
        </div>
      </div>

      <div className="bg-cream-bg dark:bg-gray-800 p-4 rounded mb-6">
        <p className="text-sm">{attr.summary_5lines}</p>
      </div>

      <nav className="mb-6">
        <ul className="flex gap-3 text-sm">
          {attr.outline && attr.outline.map((o: string, i: number) => (
            <li key={i}><a href={`#section-${i}`} className="text-travel-green">{o}</a></li>
          ))}
        </ul>
      </nav>

      <section className="prose dark:prose-invert">
        <div dangerouslySetInnerHTML={{ __html: attr.article_markdown }} />
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-serif mb-4">추천 일정</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="card p-4">
            <h3 className="font-semibold">반나절</h3>
            <p className="text-sm mt-2">{attr.itinerary_blocks?.half_day}</p>
          </div>
          <div className="card p-4">
            <h3 className="font-semibold">1일</h3>
            <p className="text-sm mt-2">{attr.itinerary_blocks?.one_day}</p>
          </div>
          <div className="card p-4">
            <h3 className="font-semibold">2일</h3>
            <p className="text-sm mt-2">{attr.itinerary_blocks?.two_day}</p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-serif mb-4">예산 비교</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th></th>
                <th>저</th>
                <th>중</th>
                <th>고</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>숙소</td>
                <td>{attr.budget_table?.low?.accommodation}</td>
                <td>{attr.budget_table?.mid?.accommodation}</td>
                <td>{attr.budget_table?.high?.accommodation}</td>
              </tr>
              <tr>
                <td>식비</td>
                <td>{attr.budget_table?.low?.food}</td>
                <td>{attr.budget_table?.mid?.food}</td>
                <td>{attr.budget_table?.high?.food}</td>
              </tr>
              <tr>
                <td>교통</td>
                <td>{attr.budget_table?.low?.transport}</td>
                <td>{attr.budget_table?.mid?.transport}</td>
                <td>{attr.budget_table?.high?.transport}</td>
              </tr>
              <tr>
                <td>액티비티</td>
                <td>{attr.budget_table?.low?.activity}</td>
                <td>{attr.budget_table?.mid?.activity}</td>
                <td>{attr.budget_table?.high?.activity}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-serif mb-4">FAQ</h2>
        <div>
          {attr.faq && attr.faq.map((f: any, i: number) => (
            <details key={i} className="mb-2">
              <summary className="font-medium">{f.q}</summary>
              <div className="mt-2 text-sm">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-serif mb-4">참고 출처</h2>
        <ul className="text-sm list-disc pl-6">
          {attr.sources && attr.sources.map((s: any, i: number) => (
            <li key={i}><a href={s.url} className="text-travel-green">{s.title}</a></li>
          ))}
        </ul>
      </section>
    </article>
  )
}
