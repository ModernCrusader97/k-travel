# K-travel - 금융 서비스 플랫폼

🌐 **Live Demo:** https://konda-app.lazzy.chat

AI 코딩 툴(Claude Code)을 활용해 개발한 1인 풀스택 프로젝트입니다.

---

## PRD (Product Requirements Document)

### 개요
K-travel은 사용자가 잔액 충전, 카드 신청, 거래 내역 확인을 할 수 있는 금융 서비스 플랫폼입니다.

### 타겟 유저
- 간편한 금융 서비스를 원하는 일반 사용자
- 디지털 카드 발급 및 관리가 필요한 유저

### 주요 기능
| 기능 | 설명 |
|------|------|
| 회원가입 / 로그인 | JWT 기반 인증, 이메일/비밀번호 |
| 잔액 관리 | KRW/USD 잔액 조회 및 충전 |
| 카드 신청 | 카드 종류 선택, 컬러 선택 후 신청 |
| 거래 내역 | 충전/사용 내역 조회 |
| 마이페이지 | 프로필 수정, 카드 신청 현황 |
| 다국어 지원 | 한국어 / 영어 전환 |

### 기술 스택
- **Frontend:** React 19, TypeScript, Vite, React Router v7
- **Backend:** Node.js, Express.js, PostgreSQL
- **Auth:** JWT (30일 유효)
- **Deploy:** nginx reverse proxy, HTTPS

### 개발 방식
AI 코딩 툴(Claude Code)을 활용하여 요구사항 정의부터 배포까지 1인 개발

---

## 실행 방법

```bash
# 의존성 설치
npm install

# 프론트엔드 개발 서버
npm run dev

# 백엔드 실행
node api.cjs
```

## 환경 변수

```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
```
