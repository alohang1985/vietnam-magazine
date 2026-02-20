# Project Structure (Top 3 levels)

/workspace — 프로젝트 루트

- apps/ — 애플리케이션 폴더
  - frontend-next/ — Next.js 프론트엔드 앱
    - app/ — Next App Router 소스 (layout, pages)
      - page.tsx — 홈 페이지 구현
      - posts/[slug]/page.tsx — 글 상세 페이지
      - search/page.tsx — 검색 페이지
      - globals.css — 전역 스타일 및 폰트 로드
    - components/ — 재사용 컴포넌트
      - Image.tsx — CMS 이미지 렌더러 (Next Image)
    - public/ — 정적 파일 (robots.xml, sitemap.xml)
    - package.json — 프론트엔드 의존성 및 스크립트
    - tailwind.config.js — Tailwind 설정
  - strapi-cms/ — Strapi v5 CMS 프로젝트(헤드리스)
    - src/api/post/content-types/post/schema.json — Post 컬렉션 스키마
    - src/api/post/controllers/post.js — 커스텀 publish 엔드포인트 컨트롤러
    - src/api/post/routes/custom-publish.json — publish 라우트 정의
    - src/components/media/hero-image.json — 이미지 컴포넌트 스키마
    - package.json — CMS 스크립트 및 의존성
    - scripts/ — 배포 및 파이프라인 스크립트
      - daily_pipeline.js — 수집→생성→CMS 저장 파이프라인
      - publish_job.js — 승인된 글 발행 스크립트
      - scheduler.js — node-cron 통합 스케줄러
      - generate_sitemap.js — 동적 sitemap 생성
      - seed_posts.js — 샘플 포스트 시드 스크립트
      - test_pipeline.js — T1~T8 테스트 러너 (mock/live)
      - utils/ — 유틸리티 라이브러리
        - ai_client.js — OpenAI 호출 (rate-limit, timeout, retry)
        - extractor.js — AI 기반 구조화 추출
        - image_client.js — Unsplash/Pexels 검색 클라이언트
        - http.js — fetch 래퍼
        - logger.js — 로그 및 daily report 생성
- docs/ — 프로젝트 문서
  - README.md — 프로젝트 개요 + 아키텍처 다이어그램
  - SETUP.md — 로컬 실행 방법
  - ENV.md — 환경변수 목록
  - DEPLOY.md — 배포 가이드 및 CI cron 설정
  - TROUBLESHOOT.md — 장애 대응 체크리스트
  - PHASE4_REPORT.md — Phase4 최종 보고서
  - FINAL_REPORT.md — (생성됨) 종합 최종 보고서
  - PROJECT_STRUCTURE.md — (이 파일)
- .github/workflows/cron.yml — GitHub Actions cron workflow
- Procfile — Railway/Heroku 시작 명세
- railway.toml — Railway 구성 파일
- logs/ — 파이프라인 로그 및 daily_report_YYYY-MM-DD.json

(각 파일은 프로젝트 루트의 실제 경로에 있습니다.)
