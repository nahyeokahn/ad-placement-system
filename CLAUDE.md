@AGENTS.md

# 프로젝트 컨텍스트 — 광고 게재 원표 시스템

세계일보 광고국 사내용 광고 게재 관리 시스템. 운영 중이며 자동 배포되고 있습니다.

## 운영 정보
- **운영 사이트**: https://ad-nextjs-blush.vercel.app
- **저장소**: https://github.com/nahyeokahn/ad-placement-system
- **Supabase 프로젝트**: `bvqtklqvfneeevhfezve`
- **관리자 이메일**: `anh0125@segye.com`

## 디렉토리 구조 (중요)
- 프로젝트 루트: `c:\Users\segye\Desktop\광고국AI` (git 저장소 **아님**)
- Next.js 앱 = git repo: `c:\Users\segye\Desktop\광고국AI\ad-nextjs`
- Supabase 마이그레이션: `c:\Users\segye\Desktop\광고국AI\supabase\migrations` (git 추적 안 됨, `npx supabase db push`로만 적용)

## 환경/비밀
- `광고국AI/.env` — `VERCEL_API_KEY`, `SUPABASE_ACCESS_TOKEN` (PAT)
- `ad-nextjs/.env.local` — `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_SITE_URL`
- 모두 git ignore.

## 핵심 코드
- `lib/supabase.js` — Supabase 클라이언트 (세션 영속화 명시)
- `lib/siteUrl.js` — 매직링크 redirect URL 헬퍼 (`NEXT_PUBLIC_SITE_URL` 우선)
- `app/login/page.js` — 가입 신청 / pending / sent / requested 분기
- `app/auth/callback/page.js` — 콜백에서 `allowed_emails.status='approved'` 재검증
- `app/dashboard/page.js` — 관리자에게만 "가입 승인" 탭 노출
- `components/TabInput.js` — 게재 입력 (수주자 다중 입력 포함)
- `components/TabSearch.js` — 검색·조회·상세 시트
- `components/TabStats.js` — 통계 (월별/매체/카테고리/담당자/수주자)
- `components/TabSignupRequests.js` — 가입 승인 관리 UI

## 상수 동기화 주의
다음 두 상수는 **3곳에 중복**되어 있어 한 곳만 수정하면 안 됩니다:
- `MANAGERS` (담당자) — `TabInput.js`, `TabSearch.js`, `app/dashboard/page.js`
- `AGENTS` (수주자) — `TabInput.js`, `TabSearch.js`

## 알려진 주의사항
1. **React 19 / Next 16의 `react-hooks/set-state-in-effect` 룰**: `useEffect` 안에서 `setState` 직접 호출 금지. lazy initializer + `key` prop 또는 비동기 콜백 패턴 사용.
2. 한글 경로(`광고국AI`)는 일부 셸/도구에서 깨질 수 있음. 절대경로 + 따옴표 사용 권장.
3. 잠금파일이 루트와 `ad-nextjs/` 양쪽에 있어 Turbopack 경고가 날 수 있음 → `next.config.mjs`의 `turbopack.root`로 해결됨.
4. **GitHub Actions 이메일 자동 동기화는 사실상 비활성** — 가입 승인 워크플로우가 대체.

## 보안
- 비밀번호 미사용 (Magic Link OTP)
- `allowed_emails` 화이트리스트 + `status` 컬럼으로 승인 게이트
- RLS: SELECT는 anon 허용, INSERT는 `status='pending'`만, UPDATE/DELETE는 관리자 JWT만

## 작업 메모
세부 인수인계 / 작업 이력은 `../notes/0430-세션메모리.md` 참조.
정식 보고서: `../notes/광고게재원표-프로젝트-보고서.md` (또는 `.docx`).
