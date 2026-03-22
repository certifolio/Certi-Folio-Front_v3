# 🎯 Certi-Folio

> **AI 기반 커리어 스펙 분석 & 멘토링 플랫폼**

취업 준비생과 커리어 전환자를 위한 올인원 스펙 관리 서비스입니다.  
AI가 나의 스펙을 분석하고, 경쟁력 점수를 계산하여 맞춤형 커리어 로드맵과 멘토링을 제공합니다.

---

## 📋 목차

- [서비스 소개](#-서비스-소개)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [시작하기](#-시작하기)
- [환경 변수](#-환경-변수)

---

## 🌟 서비스 소개

**Certi-Folio**는 학력, 자격증, 프로젝트, 경력, 활동 등 다양한 스펙 데이터를 입력하면 AI가 종합적으로 분석하여 경쟁력 점수(Spec Score)와 상위 퍼센타일을 제공하는 서비스입니다.

- 📊 **스펙 진단** — AI와의 단계별 플로우로 내 스펙 데이터를 구조화
- 🏆 **경쟁력 분석** — 동일 목표군 내 상위 몇 %인지 실시간 확인
- 👨‍🏫 **멘토 연결** — 현직 멘토와 1:1 채팅 멘토링 신청
- 💼 **채용 정보** — 스펙에 맞는 채용공고 추천
- 🔔 **알림** — 멘토링 신청·승인 실시간 알림

---

## ✨ 주요 기능

### 1. 스펙 입력 플로우 (AI Flow Test)
단계별 가이드를 통해 아래 항목을 구조적으로 입력합니다.
- 기본 정보 (학력, 전공, GPA)
- 자격증 및 어학 성적
- 프로젝트 경험
- 경력 사항
- 대외활동 / 수상 내역
- 목표 직군 설정

### 2. Spec Score 대시보드
- AI가 계산한 스펙 점수 (0~100) 시각화
- 목표 직군 내 상위 퍼센타일 표시
- 자격증·스킬 역량 포트폴리오 요약

### 3. AI 스펙 리포트
- 강점 / 보완점 / 추천 액션 3단계 분석
- 목표 직군별 맞춤 조언

### 4. 멘토링 시스템
- 멘토 프로필 탐색 및 필터링
- 멘토 신청 / 승인 / 거절 워크플로우
- WebSocket 기반 실시간 1:1 채팅
- 멘토 등록 신청 기능

### 5. 채용공고 대시보드
- 스펙 기반 맞춤 채용공고 탐색

### 6. 관리자 기능
- 사용자 관리, 멘토 승인, 플랫폼 통계

---

## 🛠 기술 스택

| 분류 | 기술 |
|------|------|
| **Framework** | React 19, TypeScript 5.8 |
| **Build Tool** | Vite 6 |
| **AI** | Google Gemini API (`@google/genai`) |
| **실시간 통신** | WebSocket, STOMP (`@stomp/stompjs`), SockJS |
| **인증** | Google OAuth2 (소셜 로그인) |
| **스타일링** | TailwindCSS (via CDN) |

---

## 📁 프로젝트 구조

```
src/
├── api/                    # 백엔드 API 모듈
│   ├── client.ts           # Axios 기반 HTTP 클라이언트 (인터셉터 포함)
│   ├── userApi.ts          # 유저·포트폴리오 API
│   ├── mentoringApi.ts     # 멘토링 신청·관리 API
│   ├── chatApi.ts          # 채팅 API
│   ├── analyticsApi.ts     # 스펙 분석 API
│   └── notificationApi.ts  # 알림 API
│
├── components/
│   ├── Admin/              # 관리자 대시보드, 컨트롤 모달
│   ├── Auth/               # 로그인 페이지, OAuth 콜백
│   ├── Dashboard/          # Spec Score 컴포넌트
│   ├── Jobs/               # 채용공고 대시보드
│   ├── Layout/             # Navbar
│   ├── Mentors/            # 멘토 그리드, 카드, 채팅, 멘토링 페이지, 멘토 등록
│   ├── Notifications/      # 알림 페이지
│   ├── Spec/               # 스펙 입력 플로우, 정보 관리, AI 리포트
│   └── UI/                 # 공통 컴포넌트 (Button, Modal, TypingEffect 등)
│
├── contexts/
│   ├── AuthContext.tsx      # 인증 상태 전역 관리
│   └── AppContext.tsx       # 앱 뷰 네비게이션 상태 관리
│
├── types/                  # 공통 TypeScript 타입 정의
├── App.tsx                 # 루트 컴포넌트 (뷰 라우팅)
└── index.tsx               # 앱 진입점
```

---

## 🚀 시작하기

### 사전 요구사항

- **Node.js** 18 이상
- 백엔드 서버 실행 중 (기본: `http://localhost:8080`)

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정 (.env.local 파일 생성)
cp .env.example .env.local

# 3. 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 빌드

```bash
npm run build
```

---

## 🔑 환경 변수

`.env.local` 파일을 생성하고 아래 변수를 설정하세요.

```env
# Gemini AI API 키
VITE_GEMINI_API_KEY=your_gemini_api_key

# 백엔드 API 서버 주소
VITE_API_BASE_URL=http://localhost:8080
```

---

## 📄 라이선스

© 2025 Certi-Folio Inc. All rights reserved.
