export async function generateMetadata({ params }: any) {
  const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:1337'
  const slug = params.slug
  const res = await fetch(`${CMS_URL}/api/posts?filters[slug][$eq]=${slug}&populate=*&pagination[limit]=1`, { cache: 'no-store' })
  const json = await res.json()
  const p = json.data && json.data[0]
  if (!p) return { title: '게시물' }
  const attr = p.attributes
  return {
    title: attr.meta_title || attr.title,
    description: attr.meta_description || attr.summary_5lines,
    openGraph: {
      title: attr.meta_title || attr.title,
      description: attr.meta_description || attr.summary_5lines,
      images: [attr.hero_image?.url],
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/posts/${attr.slug}`
    }
  }
}
