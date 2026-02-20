# Vietnam Travel Magazine — Project README

간단 소개 및 아키텍처 다이어그램

```mermaid
flowchart LR
  A[Next.js Frontend (Vercel)] --> B[Strapi v5 CMS (Railway/Render)]
  B --> C[SQLite (local) / PostgreSQL (prod)]
  A -->|fetch| B
  D[Image APIs: Unsplash / Pexels] --> B
  E[Scheduler / Worker (cron)] --> B
  E --> A
```

프로젝트 목표: 베트남 여행 프리미엄 매거진 사이트 + 매일 1편 자동 초안 생성 + 승인 후 발행

구성 요소 요약은 SETUP.md, ENV.md, DEPLOY.md에 자세히 기록되어 있습니다.
