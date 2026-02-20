# Phase 4 — 최종 보고서

날짜: 2026-02-20

요약
- 모든 Phase 4 요구사항을 구현 완료했습니다. 주요 변경은 다음과 같습니다.

주요 구현 항목
1) Strapi custom publish endpoint
- 위치: apps/strapi-cms/src/api/post/controllers/post.js
- 엔드포인트: PUT /api/posts/:id/publish
- 동작: status==='approved' && publish_lock===false 검증 → publish_lock 설정 → 게시(status->published, published_at 설정) → publish_lock 해제
- HTTP 응답: 200 성공, 409 충돌(락 획득 실패/상태 불일치), 500 서버 오류

2) publish_job.js 업데이트
- 이전의 editor_note 기반 락을 제거하고 custom publish endpoint를 호출하도록 변경
- 재시도 로직(지수 백오프) 및 상세 로깅 포함

3) AI 기반 구조화 추출
- 위치: apps/strapi-cms/scripts/utils/extractor.js
- 동작: 크롤링한 본문을 OpenAI에 보내 JSON으로 추출(extractStructuredNotesAI)
- 모델 호출은 apps/strapi-cms/scripts/utils/ai_client.js를 사용

4) 검색 API 폴백
- DuckDuckGo → SerpAPI(SEARCH_API_KEY) 순으로 시도
- ENV에 SEARCH_API_KEY 추가(.env.example 업데이트)

5) OpenAI 클라이언트 개선
- 파일: apps/strapi-cms/scripts/utils/ai_client.js
- 기능: rate-limit(OPENAI_RATE_LIMIT calls/min), timeout(OPENAI_TIMEOUT_MS ms, default 30000), retry with exponential backoff(최대 4 attempts)

6) 테스트 및 모니터링
- 테스트 스크립트: apps/strapi-cms/scripts/test_pipeline.js
  - Mock 모드(TEST_MODE=mock): T1~T8를 외부 의존 없이 판정 가능하도록 강화
  - Live 모드(TEST_MODE=live): 실제 서비스 호출 테스트 실행
- 로그: apps/strapi-cms/logs/ 에 pipeline-info.log, pipeline-error.log, daily_report_YYYY-MM-DD.json 생성
- daily_report: pipeline 성공 시 간단 요약(json 형태로 기록)

7) Scheduler 및 Sitemap
- scheduler.js: node-cron 통합(파이프라인 07:00, publish PUBLISH_TIME)
- generate_sitemap.js: published posts를 읽어 apps/frontend-next/public/sitemap.xml 생성

실행 방법 (필요한 입력값만)
- 필수 환경변수
  - CMS_ADMIN_TOKEN: Strapi 관리자 토큰 (필수)
  - CMS_URL (기본 http://localhost:1337)
- 권장/테스트용 환경변수
  - OPENAI_API_KEY (AI 추출/생성)
  - OPENAI_RATE_LIMIT (예: 60)
  - OPENAI_TIMEOUT_MS (ms, 기본 30000)
  - UNSPLASH_API_KEY, PEXELS_API_KEY (이미지)
  - SEARCH_API_KEY (SerpAPI)
  - PUBLISH_TIME (예: 09:30)
  - SITE_BASE_URL (sitemap)

검증 방법 (로컬)
1. Strapi 적용
   - cd apps/strapi-cms
   - npm install
   - npm run apply-schema
   - npm run build
   - npm run develop
2. 프론트엔드
   - cd apps/frontend-next
   - npm install
   - NEXT_PUBLIC_CMS_URL=http://localhost:1337 npm run dev
3. 테스트
   - MOCK 모드: TEST_MODE=mock node apps/strapi-cms/scripts/test_pipeline.js
   - LIVE 모드: set env keys then node apps/strapi-cms/scripts/test_pipeline.js
4. 수동 실행
   - node apps/strapi-cms/scripts/daily_pipeline.js
   - node apps/strapi-cms/scripts/publish_job.js
   - node apps/strapi-cms/scripts/generate_sitemap.js

주의사항
- Strapi 스키마 변경 후 반드시 `npm run build` 및 재시작이 필요합니다.
- OpenAI/SerpAPI/Unsplash 등 API 키는 환경변수로 제공해 주십시오.

변경된 파일 (주요)
- apps/strapi-cms/src/api/post/content-types/post/schema.json
- apps/strapi-cms/src/api/post/controllers/post.js
- apps/strapi-cms/src/api/post/routes/custom-publish.json
- apps/strapi-cms/scripts/daily_pipeline.js
- apps/strapi-cms/scripts/publish_job.js
- apps/strapi-cms/scripts/scheduler.js
- apps/strapi-cms/scripts/generate_sitemap.js
- apps/strapi-cms/scripts/test_pipeline.js
- apps/strapi-cms/scripts/utils/* (ai_client.js, extractor.js, image_client.js, http.js, logger.js)
- apps/frontend-next/public/sitemap.xml
- docs/DEPLOY.md (CI cron 내용 추가)

완료: Phase 4 모든 요구사항 구현 및 테스트용 mock 모드 포함. 모든 변경은 workspace에 저장되었습니다.

다음: 배포 전 실제 키를 .env에 입력하시면 제가 로그/실행 결과를 분석해 추가 패치 및 운영 튜닝(속도/비용/신뢰성 최적화)을 수행하겠습니다.
