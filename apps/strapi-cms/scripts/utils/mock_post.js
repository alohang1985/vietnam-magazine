module.exports = function mockPostData(topic) {
  const slug = (topic || 'mock-topic').toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,120);
  return {
    title: (topic || 'Mock Topic') + ' — 자동 초안',
    slug,
    category: 'other',
    tags: [slug,'mock'],
    status: 'review',
    meta_title: (topic || 'Mock Topic'),
    meta_description: '자동 생성된 데모 초안입니다.',
    hero_image: { source:'unsplash', url:'https://images.unsplash.com/photo-1507525428034-b723cf961d3e', photographer:'Unsplash', license_url:'https://unsplash.com' },
    section_images: [],
    outline: ['도입','오전','점심','오후','저녁','팁'],
    article_markdown: '데모 콘텐츠입니다. '.repeat(400),
    summary_5lines: '데모 요약입니다.',
    itinerary_blocks: { half_day: '반나절 코스', one_day: '1일 코스', two_day: '2일 코스' },
    budget_table: { low: { accommodation:20, food:10, transport:5, activity:10, total:45 }, mid:{accommodation:50,food:30,transport:10,activity:30,total:120}, high:{accommodation:150,food:80,transport:40,activity:150,total:420} },
    faq: [{q:'Q1',a:'A1'},{q:'Q2',a:'A2'},{q:'Q3',a:'A3'},{q:'Q4',a:'A4'},{q:'Q5',a:'A5'}],
    sources: [],
    editor_note: 'mock-generated'
  };
}
