# Local Run Guide — Vietnam Travel Magazine

이 파일은 로컬(맥/리눅스)에서 프로젝트를 그대로 실행해 검증하는 단계별 복붙 가능한 명령 모음입니다. 각 단계에서 예상 오류와 해결 방법도 함께 적었습니다.

전제 조건
- Node.js 18+ 설치
- npm 또는 pnpm 사용 가능 (문서에선 npm 사용)
- Git
- 권한: 로컬에서 포트 1337(Strapi), 3000(Next) 사용 가능

1) 저장소 받기
$ git clone <repo-url> workspace
$ cd workspace

2) 환경변수 준비
- 복사하여 각 앱에서 사용할 .env 파일을 만듭니다.

$ cp apps/strapi-cms/.env.example apps/strapi-cms/.env
$ cp apps/frontend-next/.env.example apps/frontend-next/.env  # (없으면 생성)

- 편집 (예시)
  - apps/strapi-cms/.env:
    CMS_URL=http://localhost:1337
    CMS_ADMIN_TOKEN=enter_admin_token_here
    SITE_BASE_URL=http://localhost:3000
    UNSPLASH_API_KEY=your_unsplash_key
    PEXELS_API_KEY=your_pexels_key
    SEARCH_API_KEY=your_serpapi_key
    PUBLISH_TIME=09:30
    TIMEZONE=Asia/Ho_Chi_Minh
    OPENAI_API_KEY=your_openai_key
    OPENAI_RATE_LIMIT=60
    OPENAI_TIMEOUT_MS=30000

  - apps/frontend-next/.env (example):
    NEXT_PUBLIC_CMS_URL=http://localhost:1337
    NEXT_PUBLIC_SITE_URL=http://localhost:3000

3) Strapi: 의존성 설치 → 스키마 적용 → 빌드 → 개발 서버
$ cd apps/strapi-cms
$ npm install
$ npm run apply-schema         # checks schema.json and writes marker
$ npm run build                # Strapi requires build after schema changes
$ npm run develop              # 개발 모드 (admin UI: http://localhost:1337/admin)

검증 포인트
- 관리자 UI 접속 후 Content-Types에서 `Post` 컬렉션 확인
- 필드 확인: publish_lock (boolean), lock_acquired_at (datetime) 가 보이는지 확인

발생 가능한 에러 & 해결
- npm install 실패 (레지스트리 접근 불가)
  - 원인: 사내 프록시/방화벽 또는 레지스트리 설정
  - 해결: 인터넷 연결/registry 설정 점검, `npm config get registry`, 필요 시 `npm config set registry https://registry.npmjs.org/` 또는 회사 프록시 설정
- strapi build 실패
  - 원인: 잘못된 파일 경로나 권한 문제
  - 해결: 변경한 schema.json 문법 확인, `npm run apply-schema` 재실행, 로그 확인

4) 시드 데이터 삽입 (샘플 포스트 2편)
(別 터미널)
$ cd apps/strapi-cms
$ npm run seed

검증 포인트
- Strapi Admin > Collection Types > Posts 에 샘플 2편(상태 review) 확인

발생 가능한 에러 & 해결
- CMS_ADMIN_TOKEN missing / 401
  - .env에 CMS_ADMIN_TOKEN을 넣어주세요(관리자 토큰). 로컬 개발 중이라면 Strapi Admin에서 API 토큰을 생성 후 복사
- 네트워크/HTTP 에러
  - 로그 확인: apps/strapi-cms/logs/pipeline-error.log

5) Frontend: 의존성 설치 → 빌드 → 개발 서버
$ cd ../../apps/frontend-next
$ npm install
$ npm run build
$ NEXT_PUBLIC_CMS_URL=http://localhost:1337 npm run dev

검증 포인트
- http://localhost:3000 접속 → 홈 최신 기사 카드 렌더링
- 카드 클릭 → /posts/[slug] 상세 페이지 표시
- /search 페이지 접속 → 필터(지역/일수/예산) 선택 후 결과 업데이트

발생 가능한 에러 & 해결
- Next build 실패: 의존성 문제 또는 Node 버전 불일치
  - 실행: `node -v` 확인 (18+ 권장)
- 이미지 로딩 오류: remotePatterns 설정 확인(next.config.js)
- CORS/API 호출 실패: Strapi가 응답하는지 curl로 확인: `curl http://localhost:1337/api/posts?populate=*`

6) Test Pipeline (Mock mode)
$ cd ../strapi-cms
$ TEST_MODE=mock node scripts/test_pipeline.js

기대 결과: 로그에 T1~T8 MOCK passed 메시지 표시

발생 가능한 에러 & 해결
- 권한 문제: 스크립트에서 .env 파일 로딩 실패시 .env 환경변수 확인
- 스크립트 예외: apps/strapi-cms/logs/pipeline-error.log 확인

7) Sitemap 생성
$ node scripts/generate_sitemap.js
- 생성 파일: apps/frontend-next/public/sitemap.xml

8) Scheduler 테스트 (옵션)
$ node scripts/scheduler.js
- scheduler는 백그라운드에서 daily_pipeline 및 publish_job을 예약 실행

9) 로그 및 리포트
- 로그 위치: apps/strapi-cms/logs/
  - pipeline-info.log, pipeline-error.log
  - daily_report_YYYY-MM-DD.json (일별 요약)

추가 팁
- 실서비스 API 키(OPENAI/UNSPLASH/PEXELS/SEARCH_API_KEY)는 Secrets로 보관하세요
- Strapi 스키마 변경 시마다 `npm run build` 및 재시작 필요합니다

문제가 발생하면 아래 정보를 붙여서 알려주십시오
- 터미널 명령과 전체 출력(에러 포함)
- apps/strapi-cms/logs/pipeline-error.log 마지막 200줄
- apps/strapi-cms/logs/pipeline-info.log 마지막 200줄

끝.
