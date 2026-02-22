export const dynamic = 'force-dynamic';
export const revalidate = 0;
import Link from 'next/link'

export const metadata = {
  title: 'Vietnam Travel Magazine — 베트남 여행 매거진',
  description: '현지 팁과 일정, 예산을 담은 프리미엄 베트남 여행 가이드',
}

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:1337'

const categoryLabels: Record<string, string> = {
  'phu-quoc': '🏝 푸꾸옥',
  'nha-trang': '🌊 나트랑',
  'da-nang': '🌉 다낭',
  'ho-chi-minh': '🏙 호치민',
  'hanoi': '🏛 하노이',
  'ha-long': '⛵ 하롱베이',
  'dalat': '🌸 달랏',
  'hoi-an': '🏮 호이안',
  'sapa': '🏔 사파',
  'mui-ne': '🏜 무이네',
}

export default async function Home() {
  let posts: any[] = []
  try {
    const res = await fetch(`${CMS_URL}/api/posts?populate=*&pagination[limit]=12&sort[0]=createdAt:desc`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Bad response')
    const json = await res.json()
    posts = json.data || []
  } catch (e) {
    posts = []
  }

  return (
    <main style={{ maxWidth: '860px', margin: '0 auto', padding: '20px', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <header style={{ borderBottom: '3px solid #03c75a', paddingBottom: '16px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#03c75a' }}>🇻🇳 베트남 여행 매거진</h1>
        <p style={{ color: '#888', marginTop: '6px', fontSize: '14px' }}>현지인처럼 즐기는 베트남 여행 가이드</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {posts.map((p: any) => {
          const attr = p.attributes
          const category = categoryLabels[attr.category] || attr.category
          const date = attr.createdAt ? new Date(attr.createdAt).toLocaleDateString('ko-KR') : ''
          const preview = attr.article_markdown ? attr.article_markdown.replace(/[#*`>-]/g, '').slice(0, 200) + '...' : ''

          return (
            <article key={p.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '28px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ background: '#e8f9ee', color: '#03c75a', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{category}</span>
                <span style={{ color: '#bbb', fontSize: '12px' }}>{date}</span>
              </div>

              <Link href={`/posts/${attr.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#222', marginBottom: '10px', lineHeight: '1.4' }}>{attr.title}</h2>
                <p style={{ color: '#555', fontSize: '14px', lineHeight: '1.8' }}>{preview}</p>
              </Link>

              <Link href={`/posts/${attr.slug}`} style={{ display: 'inline-block', marginTop: '12px', color: '#03c75a', fontSize: '13px', fontWeight: 'bold' }}>자세히 보기 →</Link>
            </article>
          )
        })}
      </div>
    </main>
  )
}
