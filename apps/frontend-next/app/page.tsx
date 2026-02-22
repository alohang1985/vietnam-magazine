export const dynamic = 'force-dynamic';
export const revalidate = 0;
import Link from 'next/link'
import Image from 'next/image'

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:1337'

const unsplash = {
  'phu-quoc': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600',
  'nha-trang': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600',
  'da-nang': 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=600',
  'ho-chi-minh': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600',
  'hanoi': 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=600',
  'ha-long': 'https://images.unsplash.com/photo-1528127269322-539801943592?w=600',
  'dalat': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600',
  'hoi-an': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600',
  'sapa': 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=600',
  'mui-ne': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=600'
}

const categoryColor: Record<string,string> = {
  'phu-quoc':'bg-amber-200 text-amber-800',
  'nha-trang':'bg-sky-100 text-sky-800',
  'da-nang':'bg-indigo-100 text-indigo-800',
  'ho-chi-minh':'bg-rose-100 text-rose-800',
  'hanoi':'bg-lime-100 text-lime-800',
  'ha-long':'bg-cyan-100 text-cyan-800',
  'dalat':'bg-pink-100 text-pink-800',
  'hoi-an':'bg-orange-100 text-orange-800',
  'sapa':'bg-emerald-100 text-emerald-800',
  'mui-ne':'bg-yellow-100 text-yellow-800'
}

export default async function Home() {
  let posts: any[] = []
  try {
    const res = await fetch(`${CMS_URL}/api/posts?populate=*&pagination[limit]=12&sort[0]=published_at:desc`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Bad response')
    const json = await res.json()
    posts = json.data || []
  } catch (e) { posts = [] }

  return (
    <>
      <section className="hero-banner">
        <div className="hero-inner">
          <h1>베트남 여행의 모든 것</h1>
          <p>현지 에디터가 전하는 일정, 맛집, 숨은 명소와 예산 팁</p>
        </div>
      </section>

      <section className="posts-grid container">
        {posts.length === 0 ? (<div className="empty">게시물이 없습니다.</div>) : (
          <div className="grid">
            {posts.map((p:any)=>{
              const attr = p.attributes
              const img = attr.hero_image?.url || unsplash[attr.category] || unsplash['phu-quoc']
              const preview = (attr.article_markdown || '').replace(/[#*>`]/g,'').slice(0,160)
              const date = attr.published_at ? new Date(attr.published_at).toLocaleDateString('ko-KR') : ''
              return (
                <article key={p.id} className="card-article">
                  <div className="card-media">
                    <Image src={img} alt={attr.title} width={600} height={360} className="card-img" />
                  </div>
                  <div className="card-body">
                    <div className={`badge ${categoryColor[attr.category] || 'bg-gray-100 text-gray-800'}`}>{attr.category}</div>
                    <h3 className="card-title">{attr.title}</h3>
                    <p className="card-excerpt">{preview}...</p>
                    <div className="card-meta">
                      <span className="date">{date}</span>
                      <Link href={`/posts/${attr.slug}`} className="read-more">자세히 보기 →</Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
