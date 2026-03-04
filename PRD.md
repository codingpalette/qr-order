# 📄 [프로젝트 명세서] QR-Order Pro (B2B2B 다중 테넌트 시스템)

## 1. 서비스 개요
* **서비스명:** QR-Order Pro
* **목적:** 공급사 - 프랜차이즈 본사 - 개별 가맹점 3계층 구조를 지원하는 하이브리드 QR 주문/결제 시스템.
* **핵심 가치:** 프랜차이즈의 통일성을 유지하면서 가맹점의 독립적인 영업 환경 보장.

## 2. 핵심 비즈니스 정책

### 💳 2.1. 결제 및 정산 정책 (가맹점 직접 정산)
* **방식:** 고객 결제 시 플랫폼을 거치지 않고 해당 가맹점의 PG사 하위 계정(Sub-mall)으로 직접 승인/입금.
* **장점:** 본사의 정산 업무 제로화, 가맹점의 빠른 자금 회전.

### 🍔 2.2. 메뉴 관리 정책 (하이브리드형)
* **본사 메뉴 (Master Menu):** 본사가 일괄 관리. 가맹점은 가격 수정 불가, '품절/숨김' 처리만 가능.
* **가맹점 자체 메뉴 (Local Menu):** 가맹점주가 직접 등록 및 관리. 고객 QR 화면에서는 본사 메뉴와 통합 노출.

---

## 3. 기술 스택 (Tech Stack)

### 🚀 Core Framework & Backend (Supabase 추가)
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | App Router, SSR, API Routes, Server Actions |
| React | 19.x | UI Library |
| TypeScript | 5.x | Type Safety |
| **Supabase** | Latest | **DB (PostgreSQL), Auth, Storage, Realtime, RLS** |

### 🧠 State Management
| Technology | Purpose |
|------------|---------|
| Zustand | Client-side state (persist 지원, 예: 장바구니 상태) |
| TanStack Query v5 | Server state, 캐싱, 데이터 동기화 |

### 🎨 Styling & UI
| Technology | Purpose |
|------------|---------|
| Tailwind CSS v4 | Utility-first CSS |
| shadcn/ui | Radix UI 기반 접근성 높은 컴포넌트 |
| Lucide React | 벡터 아이콘 |
| class-variance-authority | 컴포넌트 variants 관리 |

### 📡 Data Fetching
| Technology | Purpose |
|------------|---------|
| Supabase JS / SSR | DB 직접 통신 및 인증 상태 관리 |
| Axios | 외부 API 통신 (PG사 결제 연동, 알림톡 등) |
| TanStack Query | Query(조회) / Mutation(생성·수정·삭제) 훅 관리 |

### 📝 Forms & Validation
| Technology | Purpose |
|------------|---------|
| React Hook Form | 복잡한 Form 상태(메뉴 등록 등) 관리 |
| Zod | 스키마 기반 데이터 유효성 검증 |

### 🌍 i18n (다국어 지원)
| Technology | Purpose |
|------------|---------|
| Paraglide JS | 컴파일 타임 다국어 처리 (zero runtime, 성능 최적화) |

---

## 4. 아키텍처 및 코딩 규칙 (Strict Rules)

본 프로젝트는 **Feature-Sliced Design (FSD)** 방법론을 엄격히 준수합니다.

1. **FSD 레이어 규칙 준수 (단방향 의존성):** * `app` → `views` → `widgets` → `features` → `entities` → `shared`
   * 상위 레이어는 하위 레이어만 import 가능하며, 동일 레이어 내 슬라이스 간 교차 참조는 엄격히 금지합니다.
2. **Barrel Exports 사용:** * 각 폴더/슬라이스 최상단에 `index.ts`를 배치하여 캡슐화를 강제하고 외부 노출 인터페이스를 명확히 합니다.
3. **Query / Mutation 분리 (TanStack Query):**
   * **Query (조회):** 도메인 데이터 자체를 다루므로 `entities/{domain}/api` 에 위치.
   * **Mutation (변경):** 사용자 상호작용 및 비즈니스 로직이 수반되므로 `features/{action}/api` 에 위치.
4. **서버 / 클라이언트 API 분리:** * 컴포넌트 및 로직 최상단에 `"use client"` 또는 `import 'server-only'`를 명시하여 실행 환경을 격리합니다.
5. **타입 우선 (Type-First Development):** * Supabase에서 추출한 DB 타입을 기반으로 비즈니스 타입을 우선 정의한 후, 로직과 UI를 구현합니다.
6. **테스트 작성 (Co-location):** * 모든 주요 로직과 컴포넌트는 동일한 폴더 내 `__tests__/` 디렉토리에 테스트 코드를 함께 배치합니다.
7. **i18n (다국어 하드코딩 금지):** * UI 내의 모든 텍스트는 하드코딩을 금지하며, 반드시 Paraglide의 `m.key()` 함수를 사용하여 렌더링합니다.

---

## 5. 계층별 핵심 기능 명세

### 🏢 [Level 1] 공급사 (System Admin)
* **프랜차이즈 관리:** 본사 계정(Tenant) 생성 및 비활성화.
* **글로벌 설정:** 플랫폼 전체 PG 설정 및 시스템 이용료 정산 관리.

### 🏛️ [Level 2] 프랜차이즈 본사 (Brand Admin)
* **마스터 메뉴:** 공통 카테고리 및 메뉴(이미지, 가격, 설명) CUD.
* **가맹점 관리:** 산하 가맹점(Store) 계정 생성 및 조회.
* **대시보드:** 소속 가맹점 통합 매출 통계.

### 🏪 [Level 3] 가맹점 (Store Admin)
* **매장 설정:** PG 하위 가맹점 Key 세팅, 테이블 번호 및 QR 코드 생성/출력.
* **하이브리드 메뉴 관리:** 본사 메뉴 '품절' 토글, 매장 자체 메뉴(Local Menu) CRUD.
* **주문 처리:** Supabase Realtime을 활용한 실시간 주문 알림 및 상태 변경(조리 중 -> 완료).

### 📱 [Level 4] 고객 (Customer Web)
* **주문/결제:** QR 스캔 진입 (App 다운로드 불필요), 장바구니, PG 연동 결제.
* **다국어:** Paraglide를 통한 한국어/영어/일본어 등 다국어 메뉴판 지원.

---

## 6. Supabase 핵심 활용 전략 (DB & Auth)

* **다중 테넌트 격리 (RLS):** Supabase의 Row Level Security를 적용하여, A 가맹점 사장은 B 가맹점의 주문 데이터를 절대 조회하거나 수정할 수 없도록 DB 단에서 원천 차단합니다.
* **실시간 주문 알림 (Realtime):** 고객이 모바일에서 결제를 완료하면, Supabase Realtime 채널을 통해 가맹점 포스기(웹)에 즉시 알림음과 주문서가 팝업됩니다. 폴링(Polling) 방식보다 서버 부하가 적고 즉각적입니다.
* **이미지 스토리지 (Storage):** 메뉴 사진 업로드 시 Supabase Storage 버킷을 활용하며, Next.js Image 컴포넌트와 결합하여 최적화된 이미지를 서빙합니다.
