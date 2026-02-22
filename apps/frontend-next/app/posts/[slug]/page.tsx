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

  return (
    <article className="post-article">
      <div className="post-hero">
        <Image src={img} alt={attr.title} fill style={{ objectFit: 'cover' }} />
        <div className="hero-overlay">
          <div className="hero-inner">
            <div className="hero-badge">{attr.category}</div>
            <h1 className="hero-title">{attr.title}</h1>
          </div>
        </div>
      </div>

      <div className="post-content">
        <div className="post-meta">{attr.published_at ? new Date(attr.published_at).toLocaleDateString('ko-KR') : ''}</div>
        <div className="prose-area">
          <ReactMarkdown>{attr.article_markdown || ''}</ReactMarkdown>
        </div>
        <div className="other-links">
          <a href="/" className="btn">다른 여행지 보기</a>
        </div>
      </div>
    </article>
  )
}
