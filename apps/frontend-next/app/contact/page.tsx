import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '문의',
  description: 'Vietnam Travel Magazine에 문의하기',
}

export default function ContactPage() {
  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <h1 className="text-3xl font-serif">문의하기</h1>

      <p>
        Vietnam Travel Magazine에 대한 문의, 제보, 협업 제안을 환영합니다.
      </p>

      <div className="not-prose bg-cream-bg dark:bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">연락 방법</h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-medium">이메일</h3>
            <p className="text-gray-600 dark:text-gray-400">
              <a href="mailto:alohang1985@gmail.com" className="text-travel-green hover:underline">
                alohang1985@gmail.com
              </a>
            </p>
          </div>

          <div>
            <h3 className="font-medium">문의 가능 내용</h3>
            <ul className="mt-2 space-y-1 text-gray-600 dark:text-gray-400">
              <li>- 여행 정보 제보 및 수정 요청</li>
              <li>- 광고 및 협업 문의</li>
              <li>- 콘텐츠 관련 피드백</li>
              <li>- 개인정보 관련 문의</li>
            </ul>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-6">
        보내주신 문의는 확인 후 빠른 시일 내 답변 드리겠습니다.
      </p>
    </article>
  )
}
