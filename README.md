# QR-Order Pro

B2B2B 다중 테넌트 QR 주문 시스템 — 공급사 / 프랜차이즈 본사 / 가맹점 / 고객 4계층 구조를 지원하는 하이브리드 QR 주문 플랫폼

## 데모 계정 정보

| 역할 | 이름 | 이메일 | 비밀번호 | 소속 |
|------|------|--------|----------|------|
| 시스템 관리자 | 이성재 | `admin@co.com` | `12345678` | - |
| 브랜드 관리자 | 홍길동 | `test@co.com` | `12345678` | 프랜차이즈1 |
| 브랜드 관리자 | 인천공항 브랜드 관리자 | `tt@co.com` | `12345678` | 프랜차이즈1 |
| 매장 관리자 (점주) | 점주 | `test2@co.com` | `12345678` | 프랜차이즈1 |
| 매장 관리자 (주방) | 주방원 | `test3@co.com` | `12345678` | 프랜차이즈1 |

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Storage, RLS) |
| State | Zustand (클라이언트), TanStack Query v5 (서버) |
| Form | React Hook Form + Zod |
| Chart | Recharts |
| DnD | @dnd-kit |

## 프로젝트 구조

[Feature-Sliced Design (FSD)](https://feature-sliced.design/) 아키텍처를 적용하여 단방향 의존성을 준수합니다.

```
src/
├── app/                    # Next.js 라우트 및 레이아웃
│   ├── (admin)/            #   관리자 페이지 (시스템/브랜드/매장)
│   ├── (auth)/             #   인증 (로그인/회원가입)
│   └── (customer)/         #   고객 주문 페이지
├── views/                  # 페이지 단위 뷰 컴포지션
│   ├── admin/              #   관리자 뷰 (분석, KDS)
│   └── customer/           #   고객 뷰 (메뉴, 주문상태)
├── widgets/                # 독립적 UI 블록
│   ├── admin/              #   사이드바, 분석 차트, KDS
│   ├── customer/           #   장바구니, 메뉴 상세, 주문 확인
│   └── landing/            #   랜딩 페이지 섹션
├── features/               # 사용자 인터랙션 및 비즈니스 로직
│   ├── customer-order/     #   고객 주문 (장바구니, 결제)
│   ├── menu-management/    #   메뉴 CRUD
│   ├── order-management/   #   주문 상태 관리
│   ├── store-management/   #   매장 관리
│   └── ...                 #   14개 기능 모듈
├── entities/               # 도메인 엔티티 및 데이터 조회
│   ├── franchise/          #   프랜차이즈
│   ├── store/              #   매장
│   ├── menu/               #   메뉴
│   ├── order/              #   주문
│   ├── user/               #   사용자
│   └── promotion/          #   프로모션
└── shared/                 # 공용 모듈
    ├── api/                #   Supabase 클라이언트, Axios
    ├── ui/                 #   공통 UI 컴포넌트 (20+)
    ├── hooks/              #   실시간 구독 훅
    ├── providers/          #   인증 프로바이더
    ├── types/              #   DB 타입 정의
    ├── lib/                #   유틸리티
    └── config/             #   환경 설정
```

## 주요 기능

### 시스템 관리자
- 프랜차이즈 본사 계정(Tenant) 생성 및 관리
- 플랫폼 전체 사용자 관리

### 브랜드 관리자 (프랜차이즈 본사)
- 마스터 메뉴 관리 (카테고리, 메뉴, 옵션, 세트메뉴)
- 산하 가맹점 관리 및 통합 매출 분석
- 배너, 쿠폰, 스케줄 관리

### 매장 관리자 (가맹점)
- 본사 메뉴 품절/숨김 토글 + 자체 메뉴(Local Menu) CRUD
- 실시간 주문 접수 및 KDS(주방 디스플레이)
- 테이블 관리 및 QR 코드 생성
- 재고 관리, 매출 분석

### 고객
- QR 스캔으로 앱 설치 없이 모바일 웹 주문
- 장바구니, 쿠폰 적용, 주문 내역 조회
- 직원 호출

## 핵심 기술 포인트

- **다중 테넌트 격리 (RLS)**: Supabase Row Level Security로 DB 단에서 테넌트 간 데이터 완전 격리
- **실시간 주문 알림**: Supabase Realtime 채널을 통한 즉시 알림 (폴링 없음)
- **하이브리드 메뉴**: 본사 마스터 메뉴 + 가맹점 자체 메뉴 통합 노출
- **FSD 아키텍처**: 단방향 의존성 규칙으로 모듈 간 결합도 최소화

## 시작하기

```bash
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev
```

`http://localhost:3000` 에서 확인할 수 있습니다.

### 환경 변수

`.env.local` 파일에 다음 변수를 설정합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## DB 스키마

Supabase 마이그레이션 파일 15개로 구성:

```
supabase/migrations/
├── 001_auth_and_permissions.sql      # 인증 및 권한
├── 002_fix_rls_recursion.sql         # RLS 재귀 수정
├── 003_franchise_store_rls.sql       # 프랜차이즈/매장 RLS
├── 004_storage_franchise_logos.sql   # 스토리지 (로고)
├── 005_menu_management.sql           # 메뉴 관리
├── 006_store_admin.sql               # 매장 관리자
├── 007_customer_anon_rls.sql         # 고객 익명 접근 RLS
├── 008_override_sort_order.sql       # 정렬 순서
├── 009_customer_experience.sql       # 고객 경험
├── 010_table_sessions.sql            # 테이블 세션
├── 011_cost_management.sql           # 원가 관리
├── 012_time_based_menus.sql          # 시간대별 메뉴
├── 013_inventory_management.sql      # 재고 관리
├── 014_set_menus.sql                 # 세트 메뉴
└── 015_promotions.sql                # 프로모션
```
