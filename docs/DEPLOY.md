# DEPLOY — Vercel (Frontend) + Railway/Render (Strapi)

1. Frontend (Vercel)
   - Git 레포 연결 후 `apps/frontend-next`를 빌드 경로로 설정
   - Environment Variables에 NEXT_PUBLIC_SITE_URL 등을 입력
   - 빌드 명령: `npm run build`
   - 출력 디렉토리: (default)

2. Strapi (Railway / Render)
   - 새 서비스 생성 후 Git 레포 연결 (apps/strapi-cms)
   - 환경변수: CMS_ADMIN_TOKEN, DATABASE_URL (Postgres), UNSPLASH_API_KEY, PEXELS_API_KEY, PUBLISH_TIME, TIMEZONE, SEARCH_API_KEY, OPENAI_API_KEY, OPENAI_RATE_LIMIT
   - 마이그레이션: Strapi는 런타임에 컬렉션을 생성합니다. 컬렉션 스키마 변경 후 `npm run build` 및 재시작이 필요합니다.

3. Scheduler: 두 가지 방식
   - Railway cron: 생성한 스크립트(scheduler.js)를 백그라운드 프로세스로 실행하세요.
   - GitHub Actions: .github/workflows/cron.yml 파일로 daily_pipeline 및 publish_job을 cron에 맞춰 호출 가능.

4. CI cron (Railway + GitHub Actions)

Railway (작동 방식)
- Railway에서 프로젝트 생성 → Environment Variables 입력
- Service에서 `apps/strapi-cms` repo를 배포 대상으로 설정
- Railway의 Scheduled Jobs를 사용해 다음을 호출:
  - `node scripts/daily_pipeline.js` — 매일 07:00
  - `node scripts/publish_job.js` — 매일 $PUBLISH_TIME

GitHub Actions (예시)
- 저장소 루트에 `.github/workflows/cron.yml`를 생성하고 아래 예시를 사용:

```yaml
name: Daily pipeline cron
on:
  schedule:
    - cron: '0 0 * * *' # UTC cron - 조정 필요
jobs:
  daily:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Run pipeline
        run: |
          cd apps/strapi-cms
          npm ci
          node scripts/daily_pipeline.js
    env:
      CMS_URL: ${{ secrets.CMS_URL }}
      CMS_ADMIN_TOKEN: ${{ secrets.CMS_ADMIN_TOKEN }}
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      UNSPLASH_API_KEY: ${{ secrets.UNSPLASH_API_KEY }}
      PEXELS_API_KEY: ${{ secrets.PEXELS_API_KEY }}
      SEARCH_API_KEY: ${{ secrets.SEARCH_API_KEY }}
      PUBLISH_TIME: ${{ secrets.PUBLISH_TIME }}
```

- publish_job도 비슷한 워크플로로 추가하세요.

5. 주의
- Strapi 스키마 파일 변경 시 반드시 `npm run build` 후 재시작이 필요합니다.
- 환경변수(특히 API 키)는 GitHub Secrets / Railway Environment에 안전하게 저장하세요.
