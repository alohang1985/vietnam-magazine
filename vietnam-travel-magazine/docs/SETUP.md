# SETUP — 로컬 실행 가이드

1. 요구사항 설치
   - Node.js 18+ 설치
   - pnpm 또는 npm
   - Git

2. 레포 클론 및 이동
   $ git clone <repo> workspace
   $ cd workspace

3. 프론트엔드 초기화
   $ cd apps/frontend-next
   $ npm install
   $ npm run dev

4. Strapi CMS 초기화
   $ cd ../../apps/strapi-cms
   $ npm install
   $ npm run develop
   - 초기 관리자 계정 생성 후 /admin 접속

5. 환경변수 설정
   - .env.local 파일에 ENV.md 예시값 참조하여 입력

6. 테스트
   - 프론트에서 Strapi API 호출 확인: curl http://localhost:1337/api/posts

7. 추가
   - Tailwind 초기설정은 이미 포함되어 있습니다. 필요시 styles/globals.css에 Tailwind 지시문 추가.
