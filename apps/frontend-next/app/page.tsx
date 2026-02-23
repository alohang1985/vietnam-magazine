export const dynamic = 'force-dynamic';
export const revalidate = 0;
import Link from 'next/link'
import Image from 'next/image'

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:1337'

const unsplash = {
  'phu-quoc': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200',
  'nha-trang': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200',
  'da-nang': 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=1200',
  'ho-chi-minh': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1200',
  'hanoi': 'https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=1200',
  'ha-long': 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200',
  'dalat': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=1200',
  'hoi-an': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1200',
  'sapa': 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?w=1200',
  'mui-ne': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1200'
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
    <main style={{background:'#ffffff',minHeight:'100vh',color:'#1a1a2e',fontFamily:'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial'}}>
      <section style={{background:'#1a1a2e',color:'#fff',padding:'84px 20px'}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <h1 style={{fontSize:48,margin:0,fontWeight:800}}>베트남 여행의 모든 것</h1>
          <p style={{marginTop:12,fontSize:18,color:'#cfd8dc'}}>현지 에디터가 전하는 일정, 맛집, 숨은 명소와 예산 팁</p>
        </div>
      </section>

      <section style={{maxWidth:1100,margin:'40px auto',padding:'0 20px'}}>
        <h2 style={{color:'#1a1a2e',fontSize:22,marginBottom:18}}>추천 게시물</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}>
          {posts.length === 0 ? (<div style={{gridColumn:'1/-1',padding:40,textAlign:'center'}}>게시물이 없습니다.</div>) : (
            posts.map((p:any)=>{
              const attr = p.attributes
              const img = attr.hero_image?.url || unsplash[attr.category] || unsplash['phu-quoc']
              const preview = attr.article_markdown ? attr.article_markdown.replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[.*?\]\(.*?\)/g, '').replace(/[#*`>\-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140) : ''
              const date = attr.published_at ? new Date(attr.published_at).toLocaleDateString('ko-KR') : ''
              return (
                <article key={p.id} style={{background:'#fff',borderRadius:12,boxShadow:'0 4px 12px rgba(26,26,46,0.06)',overflow:'hidden',transition:'transform 180ms ease',display:'flex',flexDirection:'column'}}>
                  <Link href={`/posts/${attr.slug}`} style={{textDecoration:'none',color:'inherit'}}>
                    <div style={{height:240,overflow:'hidden'}}>
                      <Image src={img} alt={attr.title} width={1200} height={240} style={{objectFit:'cover',width:'100%',height:'240px'}} />
                    </div>
                    <div style={{padding:18,flex:1,display:'flex',flexDirection:'column'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                        <div style={{background:'#2a9d8f',color:'#fff,padding:'"6px 10px"',borderRadius:999,fontWeight:700,fontSize:12,padding:'6px 10px'}}>{attr.category}</div>
                        <div style={{color:'#666',fontSize:13}}>{date}</div>
                      </div>
                      <h3 style={{margin:'6px 0 12px',fontSize:20,color:'#1a1a2e'}}>{attr.title}</h3>
                      <p style={{color:'#444',flex:1,marginBottom:12}}>{preview}...</p>
                      <div style={{marginTop:'auto',display:'flex',justifyContent:'flex-end'}}>
                        <span style={{background:'#2a9d8f',color:'#fff,padding:'"8px 12px"',borderRadius:8,fontWeight:700,fontSize:14,padding:'8px 12px'}}>자세히 보기</span>
                      </div>
                    </div>
                  </Link>
                </article>
              )
            })
          )}
        </div>
      </section>
    </main>
  )
}
