import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'Vietnam Travel Magazine 개인정보처리방침',
}

export default function PrivacyPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1 className="text-3xl font-serif">개인정보처리방침</h1>
      <p className="text-sm text-gray-500">최종 수정일: 2026년 3월 6일</p>

      <h2>1. 수집하는 개인정보</h2>
      <p>
        Vietnam Travel Magazine(이하 "본 사이트")은 서비스 제공을 위해 최소한의 정보를 수집합니다.
        본 사이트는 별도의 회원가입 절차가 없으며, 방문자의 개인정보를 직접 수집하지 않습니다.
      </p>

      <h2>2. 쿠키 및 자동 수집 정보</h2>
      <p>
        본 사이트는 서비스 개선 및 광고 제공을 위해 다음 정보를 자동으로 수집할 수 있습니다.
      </p>
      <ul>
        <li>방문자의 IP 주소, 브라우저 종류, 운영체제</li>
        <li>방문 일시, 페이지 조회 기록</li>
        <li>쿠키(Cookie)를 통한 이용 패턴 분석</li>
      </ul>

      <h2>3. 광고 서비스</h2>
      <p>
        본 사이트는 Google AdSense를 포함한 제3자 광고 서비스를 사용할 수 있습니다.
        이러한 광고 서비스는 관심 기반 광고를 제공하기 위해 쿠키를 사용할 수 있습니다.
        방문자는 <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-travel-green">Google 광고 설정</a>에서
        맞춤 광고를 비활성화할 수 있습니다.
      </p>

      <h2>4. 분석 도구</h2>
      <p>
        본 사이트는 방문자 통계 분석을 위해 Google Analytics 등의 분석 도구를 사용할 수 있습니다.
        이 도구는 쿠키를 통해 익명화된 데이터를 수집하며, 개인을 식별할 수 없습니다.
      </p>

      <h2>5. 개인정보의 제3자 제공</h2>
      <p>
        본 사이트는 법령에 의한 경우를 제외하고, 방문자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
      </p>

      <h2>6. 개인정보의 보유 및 파기</h2>
      <p>
        자동 수집된 정보는 분석 목적으로만 사용되며, 수집일로부터 1년 후 자동 삭제됩니다.
      </p>

      <h2>7. 문의</h2>
      <p>
        개인정보 관련 문의사항은 <a href="/contact" className="text-travel-green">문의 페이지</a>를 통해 연락해 주세요.
      </p>
    </article>
  )
}
