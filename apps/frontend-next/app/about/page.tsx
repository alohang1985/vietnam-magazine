import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '소개',
  description: 'Vietnam Travel Magazine - 베트남 현지 거주자가 전하는 찐 로컬 여행 가이드',
}

export default function AboutPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1 className="text-3xl font-serif">Vietnam Travel Magazine 소개</h1>

      <p>
        Vietnam Travel Magazine은 베트남 현지에서 직접 생활하며 쌓은 경험을 바탕으로,
        한국인 여행자에게 실질적으로 도움이 되는 여행 정보를 전하는 온라인 매거진입니다.
      </p>

      <h2>우리가 다루는 것</h2>
      <p>
        다낭, 나트랑, 푸꾸옥, 호치민, 하노이, 호이안, 달랏, 사파, 하롱베이, 무이네 등
        베트남 주요 여행지의 맛집, 숙소, 여행코스, 현지 팁을 다룹니다.
      </p>
      <ul>
        <li>현지인이 실제로 가는 맛집과 카페</li>
        <li>예산별 숙소 추천 (가성비부터 럭셔리까지)</li>
        <li>일정별 여행코스 (반나절, 1일, 2일+)</li>
        <li>교통, 환전, 유심 등 실용 정보</li>
        <li>계절별 여행 팁과 주의사항</li>
      </ul>

      <h2>우리의 원칙</h2>
      <ul>
        <li>실제 존재하는 장소만 소개합니다. 가본 곳, 검증된 곳만 추천합니다.</li>
        <li>가격은 베트남 동과 한화를 함께 표기합니다.</li>
        <li>광고성 리뷰가 아닌, 솔직한 경험을 공유합니다.</li>
        <li>최신 정보를 유지하기 위해 콘텐츠를 정기적으로 업데이트합니다.</li>
      </ul>

      <h2>연락처</h2>
      <p>
        제안, 제보, 협업 문의는 <a href="/contact" className="text-travel-green">문의 페이지</a>를 이용해 주세요.
      </p>
    </article>
  )
}
