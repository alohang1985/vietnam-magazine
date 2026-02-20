export const dynamic = 'force-dynamic';
export const revalidate = 0;
import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:1337'

async function fetchPosts(filters: any) {
  const qs: string[] = []
  if (filters.category) qs.push(`filters[category][$eq]=${filters.category}`)
  if (filters.days) {
    // map days to itinerary_blocks presence - use simple tag filter on tags for demo
    if (filters.days === 'half_day') qs.push(`filters[tags][$contains]=half_day`)
    if (filters.days === 'one_day') qs.push(`filters[tags][$contains]=one_day`)
    if (filters.days === 'two_day') qs.push(`filters[tags][$contains]=two_day`)
    if (filters.days === 'three_plus') qs.push(`filters[tags][$contains]=long_trip`)
  }
  if (filters.budget) qs.push(`filters[tags][$contains]=budget_${filters.budget}`)
  const q = qs.length ? `?${qs.join('&')}` : ''
  const res = await fetch(`${CMS_URL}/api/posts${q ? q + '&' : '?'}populate=*&pagination[limit]=30`, { cache: 'no-store' })
  return res.json()
}

export default async function SearchPage({ searchParams }: any) {
  // read query params from URL (Next App Router passes searchParams)
  const category = searchParams.category || ''
  const days = searchParams.days || ''
  const budget = searchParams.budget || ''

  const json = await fetchPosts({ category, days, budget })
  const posts = json.data || []

  return (
    <div>
      <h2 className="text-2xl font-serif mb-4">검색</h2>
      <form className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3" action="/search" method="get">
        <select name="category" defaultValue={category} className="p-2 border rounded">
          <option value="">지역 전체</option>
          <option value="phu-quoc">푸꾸옥</option>
          <option value="nha-trang">나트랑</option>
          <option value="da-nang">다낭</option>
          <option value="ho-chi-minh">호치민</option>
          <option value="hanoi">하노이</option>
          <option value="ha-long">하롱</option>
          <option value="dalat">달랏</option>
          <option value="hoi-an">호이안</option>
          <option value="sapa">사파</option>
          <option value="mui-ne">무이네</option>
          <option value="other">기타</option>
        </select>

        <select name="days" defaultValue={days} className="p-2 border rounded">
          <option value="">여행일수</option>
          <option value="half_day">반나절</option>
          <option value="one_day">1일</option>
          <option value="two_day">2일</option>
          <option value="three_plus">3일+</option>
        </select>

        <select name="budget" defaultValue={budget} className="p-2 border rounded">
          <option value="">예산</option>
          <option value="low">저예산</option>
          <option value="mid">중간</option>
          <option value="high">럭셔리</option>
        </select>

        <button type="submit" className="bg-travel-green text-white px-4 py-2 rounded">검색</button>
      </form>

      {posts.length === 0 ? (
        <div className="p-6 bg-cream-bg rounded">조건에 맞는 결과가 없습니다. 조건을 변경해보세요.</div>
      ) : (
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
      )}
    </div>
  )
}
