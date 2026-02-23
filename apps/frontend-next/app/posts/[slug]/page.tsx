export const dynamic = 'force-dynamic';
export const revalidate = 0;
import React from 'react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'

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

export default async function PostPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  let p = null
  try {
    const res = await fetch(`${CMS_URL}/api/posts?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*&pagination[limit]=1`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Bad response')
    const json = await res.json()
    p = json.data && json.data[0]
  } catch (e) { p = null }
  if (!p) return <div className="not-found">게시물을 찾을 수 없습니다.</div>
  const attr = p.attributes
  const img = attr.hero_image?.url || unsplash[attr.category] || unsplash['phu-quoc']

  const content = attr.article_markdown || ''
  const creditMatch = content.match(/\*\[Photo by .+? on Unsplash\]\(.+?\)\*/)
  const creditLine = creditMatch ? creditMatch[0] : null
  const cleanContent = content.replace(/!\[.*?\]\(.*?\) \*\[Photo by .+? on Unsplash\]\(.+?\)\* /, '')

  // Server-side fetch 2 images from Unsplash (uses UNSPLASH_ACCESS_KEY env var)
  let unsplashImgs: { url: string; credit: string }[] = [];
  try {
    const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
    if (UNSPLASH_KEY) {
      const q = encodeURIComponent(`${attr.category} vietnam`);
      const ures = await fetch(`https://api.unsplash.com/search/photos?query=${q}&per_page=2&orientation=landscape`, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }, cache: 'no-store' });
      if (ures.ok) {
        const uj = await ures.json();
        unsplashImgs = (uj.results || []).slice(0,2).map((r: any) => ({ url: (r.urls && r.urls.regular) || r.url, credit: `Photo by ${r.user && r.user.name} on Unsplash` }));
      }
    }
  } catch (e) { console.error('Unsplash fetch error', e.message); }

  // Inject images into content: after first paragraph
  let renderedContent = cleanContent;
  if (unsplashImgs.length) {
    const parts = cleanContent.split('\n\n');
    if (parts.length > 1) {
      parts.splice(1, 0, unsplashImgs.map(i => `![](${i.url})`).join('\n\n'))
      renderedContent = parts.join('\n\n')
    } else {
      renderedContent = cleanContent + '\n\n' + unsplashImgs.map(i => `![](${i.url})`).join('\n\n')
    }
  }

  return (
    <article className="post-article">
      <div style={{width:'100%',height:400,overflow:'hidden'}}>
        <Image src={img} alt={attr.title} width={1200} height={400} style={{objectFit:'cover',width:'100%',height:'400px'}} />
      </div>

      <div style={{maxWidth:720,margin:'18px auto 0',padding:'0 18px'}}>
        <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:8}}>
          <div style={{background:'#e8f9ee',color: 'var(--travel-green)',padding:'6px 10px',borderRadius:999,fontWeight:700,fontSize:12}}>{attr.category}</div>
          <div style={{color:'#666',fontSize:13}}>{attr.published_at ? new Date(attr.published_at).toLocaleDateString('ko-KR') : ''}</div>
        </div>
        <h1 style={{fontSize:32,fontWeight:800,color:'#000',margin:'8px 0 18px'}}>{attr.title}</h1>
      </div>

      <div className="post-content">
        <div className="post-meta">{attr.published_at ? new Date(attr.published_at).toLocaleDateString('ko-KR') : ''}</div>
        <div className="prose-area" style={{background:'#fff',color:'#222',padding:'12px',borderRadius:8}}>
          <section style={{maxWidth: '720px', margin: '0 auto', fontSize: '17px', lineHeight: '1.9', color: '#333'}}>
        <ReactMarkdown components={{ h2: ({children}) => <h2 style={{fontSize: '22px', fontWeight: 'bold', color: '#000', borderLeft: '4px solid #1a6b54', paddingLeft: '12px', margin: '32px 0 16px'}}>{children}</h2>, h3: ({children}) => <h3 style={{fontSize: '18px', fontWeight: 'bold', margin: '24px 0 12px'}}>{children}</h3>, p: ({children}) => <p style={{marginBottom: '20px', lineHeight: '1.9'}}>{children}</p>, strong: ({children}) => <strong style={{color: '#000', fontWeight: 'bold'}}>{children}</strong>, ul: ({children}) => <ul style={{paddingLeft: '24px', marginBottom: '20px'}}>{children}</ul>, li: ({children}) => <li style={{marginBottom: '8px', lineHeight: '1.8'}}>{children}</li>, img: ({src, alt}) => <img src={src} alt={alt} style={{width: '100%', borderRadius: '12px', margin: '24px 0', objectFit: 'cover'}} />, a: ({href, children}) => <a href={href} style={{color: '#000', textDecoration: 'underline'}} target="_blank" rel="noopener noreferrer">{children}</a>, }} >{cleanContent}</ReactMarkdown>
      </section>
        </div>
        <div className="other-links">
          <a href="/" className="btn">다른 여행지 보기</a>
        </div>
        {creditLine && (
          <p style={{fontSize: '11px', color: '#bbb', marginTop: '40px', textAlign: 'right'}}>
            <ReactMarkdown>{creditLine}</ReactMarkdown>
          </p>
        )}
      </div>

    </article>
  )
}
