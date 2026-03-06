const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:1337'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://vietnam-magazine.vercel.app'

export async function GET() {
  let items = ''

  try {
    const res = await fetch(
      `${CMS_URL}/api/posts?fields[0]=slug&fields[1]=title&fields[2]=summary_5lines&fields[3]=published_at&fields[4]=category&pagination[limit]=50&sort[0]=published_at:desc`,
      { cache: 'no-store' }
    )
    const json = await res.json()
    const posts = json.data || []

    items = posts
      .map((p: any) => {
        const attr = p.attributes
        const title = attr.title || ''
        const desc = attr.summary_5lines || ''
        const link = `${SITE_URL}/posts/${attr.slug}`
        const pubDate = attr.published_at
          ? new Date(attr.published_at).toUTCString()
          : new Date().toUTCString()
        const category = attr.category || ''

        return `    <item>
      <title><![CDATA[${title}]]></title>
      <link>${link}</link>
      <description><![CDATA[${desc}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid>${link}</guid>${category ? `\n      <category>${category}</category>` : ''}
    </item>`
      })
      .join('\n')
  } catch {
    // Return empty feed on error
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Vietnam Travel Magazine</title>
    <link>${SITE_URL}</link>
    <description>베트남 현지 거주자가 추천하는 찐 로컬 여행 가이드</description>
    <language>ko</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
