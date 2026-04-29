# 광고 게재 원표 관리 시스템

ERP 시스템이 사내 네트워크에만 접속 가능한 상황에서, 외부에서도 광고 게재 원표를 등록, 검색, 통계할 수 있는 웹 애플리케이션입니다.

## 🎯 주요 기능

- **게재 입력**: 새로운 광고 게재 정보 등록 및 수정/삭제
- **검색/조회**: 광고주, 대행사, 기간, 담당자, 분류별 필터링 및 조회
- **통계**: 기간별 광고주별, 분류별, 담당자별, 수주자별 집계 분석
- **사용자 인증**: Supabase Auth를 통한 안전한 로그인
- **반응형 UI**: 데스크톱(테이블) + 모바일(카드) 레이아웃

## 🛠 기술 스택

- **Frontend**: Next.js 16.2.4, React 19.2.4, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, REST API)
- **Authentication**: Supabase Auth (JWT)
- **Security**: Row Level Security (RLS) - 인증된 사용자만 접근

## 📋 시작하기

### 1. 환경 설정

```bash
# .env.local 파일 생성 (Supabase 프로젝트 정보 입력)
cp .env.example .env.local
```

`.env.local`에 다음 정보를 입력하세요:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. 의존성 설치 및 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### 3. 로그인

테스트 계정으로 로그인:
- **이메일**: admin@adplacement.kr
- **비밀번호**: AdPlacement2024!

## 📁 프로젝트 구조

```
ad-nextjs/
├── app/
│   ├── layout.js              # 루트 레이아웃
│   ├── page.js                # 홈 페이지 (대시보드로 리디렉트)
│   ├── login/page.js          # 로그인 페이지
│   ├── dashboard/page.js      # 메인 대시보드
│   └── globals.css            # 전역 스타일
├── components/
│   ├── TabInput.js            # 게재 입력 탭
│   ├── TabSearch.js           # 검색 탭
│   ├── TabStats.js            # 통계 탭
│   └── ... (기타 컴포넌트)
├── lib/
│   └── supabase.js            # Supabase 클라이언트 & 유틸
├── package.json
└── .env.example               # 환경 변수 템플릿
```

## 🚀 배포

### Vercel 배포 (권장)

```bash
npm install -g vercel
vercel
```

## 🔒 보안

- ✅ Supabase RLS (Row Level Security) 적용
- ✅ 인증된 사용자만 데이터 접근 가능
- ✅ JWT 토큰 기반 인증
- ✅ 환경 변수로 민감 정보 관리

## 📞 지원

문제가 발생하면 이슈를 등록해주세요.

---

**개발자**: 광고국 AI 팀
