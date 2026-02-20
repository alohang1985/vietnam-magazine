# FINAL REPORT — Vietnam Travel Magazine Pipeline

작성일: 2026-02-20

개요
- 목표: 베트남 여행 프리미엄 매거진 사이트 + 매일 1편 자동 초안 생성 + 승인 후 발행 파이프라인 구축
- 구현 범위: Phase 1~4 완전 구현 (프론트엔드, CMS, 자동화 파이프라인, 안전장치, 테스트, CI/배포)

아키텍처 (Mermaid)

```mermaid
flowchart LR
  subgraph Frontend
    A[Next.js (Vercel)]
  end
  subgraph CMS
    B[Strapi v5]
    B --> DB[SQLite/Postgres]
  end
  subgraph Pipeline
    C[Scheduler (node-cron)] --> D[Daily Pipeline Script]
    D --> B
    E[Publish Job] --> B
  end
  A -- fetch --> B
  D -- images --> F[Unsplash / Pexels]
  D -- search --> G[SerpAPI / DuckDuckGo]
  D -- ai --> H[OpenAI]
```

Phase별 완료 항목

Phase 1 — 뼈대
- Next.js + Tailwind 초기 앱 생성
- Strapi 프로젝트 구조 및 Post 컬렉션 스키마 작성
- 운영 문서(/docs) 기본 작성
- 생성 파일 예: apps/frontend-next/*, apps/strapi-cms/src/api/post/content-types/post/schema.json

Phase 2 — 프론트엔드
- 홈(/) 페이지, 글 상세(/posts/[slug]), 검색(/search) 구현
- 디자인: Noto Serif KR + Pretendard(CDN), 색상(#1a6b54, #f5f0eb), 다크모드, 반응형
- Next Image 적용, SEO 메타(OG) 기본 구현
- 샘플 포스트 2편 시드 스크립트 추가

Phase 3 — 파이프라인 초기
- daily_pipeline: 웹 검색·크롤링·AI 생성·이미지 확보·CMS 저장
- publish_job: approved -> published (락 방지 기본 구현)
- scheduler: node-cron 통합
- dynamic sitemap generator
- 테스트 스크립트(test_pipeline.js)

Phase 4 — 안전장치 & 테스트 (완료)
- Strapi 스키마에 publish_lock, lock_acquired_at 필드 추가
- Strapi custom publish endpoint 구현 (check-and-set + publish)
- AI 기반 추출(extractor uses OpenAI)
- ai_client: rate-limit, timeout(30s), retry with exponential backoff
- test_pipeline: mock/live 모드, T1~T8 검증, concurrency test, daily report logging
- CI: GitHub Actions cron workflow + Railway Procfile & railway.toml

필요한 환경변수 (실행에 반드시 필요)
- CMS_ADMIN_TOKEN (필수)
- CMS_URL (기본 http://localhost:1337)

추가 환경변수 (기능 활성화/성능)
- OPENAI_API_KEY
- OPENAI_RATE_LIMIT (calls per minute)
- OPENAI_TIMEOUT_MS (ms)
- UNSPLASH_API_KEY, PEXELS_API_KEY
- SEARCH_API_KEY (SerpAPI)
- PUBLISH_TIME (HH:MM)
- SITE_BASE_URL

로컬 실행 요약
1. Strapi
   - cd apps/strapi-cms
   - npm install
   - npm run apply-schema
   - npm run build
   - npm run develop
2. Frontend
   - cd apps/frontend-next
   - npm install
   - NEXT_PUBLIC_CMS_URL=http://localhost:1337 npm run dev
3. Scheduler
   - cd apps/strapi-cms
   - node scripts/scheduler.js
4. Manual ops
   - node scripts/daily_pipeline.js
   - node scripts/publish_job.js
   - node scripts/generate_sitemap.js
5. Tests
   - TEST_MODE=mock node scripts/test_pipeline.js

생성된 주요 파일 (요약)
- apps/frontend-next/* — frontend app (layout, pages, styles)
- apps/strapi-cms/src/api/post/* — Post schema, controller, custom route
- apps/strapi-cms/scripts/* — pipeline, publish job, scheduler, test scripts, utils
- .github/workflows/cron.yml — GitHub Actions cron
- Procfile, railway.toml — Railway deployment files
- docs/PHASE4_REPORT.md, docs/FINAL_REPORT.md, docs/PROJECT_STRUCTURE.md

운영 가이드 (핵심)
- 스키마 변경 후: strapi build -> restart Strapi
- 크론: scheduler.js 또는 GitHub Actions / Railway scheduled jobs 사용
- 로그 위치: workspace/logs/ (pipeline-info.log, pipeline-error.log, daily_report_YYYY-MM-DD.json)

마무리
- 모든 파일을 workspace에 생성 및 저장 완료했습니다.
- 지금 환경에서 실제 외부 API 키가 필요합니다. CMS_ADMIN_TOKEN 및 API 키를 제공하시고 실제 실행 로그를 붙여주시면, 발생한 실행 오류를 실시간으로 패치하겠습니다.
