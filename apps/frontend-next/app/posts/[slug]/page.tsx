import React from 'react'
import Image from 'next/image'
import type { Metadata } from 'next'
import { marked } from 'marked'

function renderContent(content: string): string {
  if (!content) return ''
  const trimmed = content.trim()
  // Already HTML
  if (trimmed.startsWith('<')) return trimmed
  // Markdown → HTML
  return marked.parse(trimmed) as string
}

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:1337'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vietnam-magazine.vercel.app'

async function getPost(slug: string) {
  try {
    const res = await fetch(
      `${CMS_URL}/api/posts?filters[slug][$eq]=${slug}&populate=*&pagination[limit]=1`,
      { cache: 'no-store' }
    )
    const json = await res.json()
    return json.data?.[0] ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPost(params.slug)
  if (!p) return { title: 'Vietnam Travel Magazine' }
  const attr = p.attributes
  const title = attr.meta_title || attr.title || 'Vietnam Travel Magazine'
  const description = attr.meta_description || attr.summary_5lines || '베트남 여행 가이드'
  const ogImage = attr.hero_image?.url
  const url = `${SITE_URL}/posts/${params.slug}`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'article',
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    alternates: { canonical: url },
  }
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const p = await getPost(params.slug)
  if (!p) return <div className="py-12 text-center text-gray-500">게시물을 찾을 수 없습니다.</div>
  const attr = p.attributes

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: attr.title,
    description: attr.meta_description || attr.summary_5lines || '',
    datePublished: attr.publishedAt || attr.createdAt,
    dateModified: attr.updatedAt || attr.publishedAt,
    url: `${SITE_URL}/posts/${params.slug}`,
    author: { '@type': 'Organization', name: 'Vietnam Travel Magazine' },
    publisher: {
      '@type': 'Organization',
      name: 'Vietnam Travel Magazine',
      url: SITE_URL,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/posts/${params.slug}` },
    ...(attr.hero_image?.url ? { image: attr.hero_image.url } : {}),
  }

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="w-full h-[60vh] relative mb-6">
        {attr.hero_image?.url ? (
          <Image src={attr.hero_image.url} alt={attr.title} fill style={{ objectFit: 'cover' }} priority />
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
        <ul className="flex gap-3 text-sm flex-wrap">
          {attr.outline && attr.outline.map((o: string, i: number) => (
            <li key={i}><a href={`#section-${i}`} className="text-travel-green hover:underline">{o}</a></li>
          ))}
        </ul>
      </nav>

      <section className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-serif prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:leading-relaxed prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-img:rounded-lg prose-a:text-travel-green">
        <div dangerouslySetInnerHTML={{ __html: renderContent(attr.article_markdown || '') }} />
      </section>

      {(attr.itinerary_blocks?.half_day || attr.itinerary_blocks?.one_day || attr.itinerary_blocks?.two_day) && (
        <section className="mt-8">
          <h2 className="text-2xl font-serif mb-4">추천 일정</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {attr.itinerary_blocks?.half_day && (
              <div className="card p-4">
                <h3 className="font-semibold">반나절</h3>
                <p className="text-sm mt-2">{attr.itinerary_blocks.half_day}</p>
              </div>
            )}
            {attr.itinerary_blocks?.one_day && (
              <div className="card p-4">
                <h3 className="font-semibold">1일</h3>
                <p className="text-sm mt-2">{attr.itinerary_blocks.one_day}</p>
              </div>
            )}
            {attr.itinerary_blocks?.two_day && (
              <div className="card p-4">
                <h3 className="font-semibold">2일</h3>
                <p className="text-sm mt-2">{attr.itinerary_blocks.two_day}</p>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-2xl font-serif mb-4">예산 비교</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2"></th>
                <th className="p-2">저</th>
                <th className="p-2">중</th>
                <th className="p-2">고</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: '숙소', key: 'accommodation' },
                { label: '식비', key: 'food' },
                { label: '교통', key: 'transport' },
                { label: '액티비티', key: 'activity' },
              ].map(row => (
                <tr key={row.key} className="border-t">
                  <td className="p-2 font-medium">{row.label}</td>
                  <td className="p-2 text-center">{(attr.budget_table?.low as any)?.[row.key] || '-'}</td>
                  <td className="p-2 text-center">{(attr.budget_table?.mid as any)?.[row.key] || '-'}</td>
                  <td className="p-2 text-center">{(attr.budget_table?.high as any)?.[row.key] || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {attr.faq && attr.faq.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-serif mb-4">FAQ</h2>
          <div>
            {attr.faq.map((f: any, i: number) => (
              <details key={i} className="mb-2 border rounded p-3">
                <summary className="font-medium cursor-pointer">{f.q}</summary>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">{f.a}</div>
              </details>
            ))}
          </div>
        </section>
      )}

      {attr.sources && attr.sources.length > 0 && (
        <section className="mt-8">
          <h2 className="text-2xl font-serif mb-4">참고 출처</h2>
          <ul className="text-sm list-disc pl-6">
            {attr.sources.map((s: any, i: number) => (
              <li key={i}><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-travel-green hover:underline">{s.title}</a></li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
