# SOMA 백엔드 API

Node.js + Express + MySQL + JWT 기반 요가 인강 플랫폼 백엔드

---

## 🚀 시작하기

```bash
# 1. 패키지 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일에서 DB 정보, JWT_SECRET 수정

# 3. DB 스키마 & 시드 데이터 적용
mysql -u root -p < schema.sql

# 4. 서버 실행
npm run dev       # 개발 (nodemon)
npm start         # 프로덕션
```

---

## 📡 API 명세

### Base URL
```
http://localhost:4000/api
```

### 인증 헤더
```
Authorization: Bearer <JWT_TOKEN>
```

---

### 🔐 Auth

| Method | Endpoint        | 인증 | 설명          |
|--------|----------------|------|--------------|
| POST   | /auth/signup   | ❌   | 회원가입      |
| POST   | /auth/login    | ❌   | 로그인        |
| GET    | /auth/me       | ✅   | 내 정보 조회  |

#### POST /auth/signup
```json
// Request
{
  "name":     "홍길동",
  "nickname": "요가러버",
  "email":    "hong@example.com",
  "password": "pass1234"
}

// Response 201
{
  "success": true,
  "token": "eyJ...",
  "user": { "id": 1, "name": "홍길동", "nickname": "요가러버", "email": "hong@example.com" }
}
```

#### POST /auth/login
```json
// Request
{ "email": "hong@example.com", "password": "pass1234" }

// Response 200
{ "success": true, "token": "eyJ...", "user": { ... } }
```

---

### 📚 Courses

| Method | Endpoint         | 인증       | 설명           |
|--------|-----------------|-----------|---------------|
| GET    | /courses        | ❌         | 강의 목록 조회  |
| GET    | /courses/:id    | 선택       | 강의 상세 조회  |

#### GET /courses (쿼리 파라미터)
| 파라미터    | 타입    | 설명                        |
|-----------|--------|---------------------------|
| level     | string | 입문 / 중급 / 심화           |
| is_live   | bool   | true = 라이브 강의만          |
| search    | string | 강의명 검색                  |
| page      | number | 페이지 (기본 1)              |
| limit     | number | 페이지당 개수 (기본 12)       |

```bash
GET /courses?level=입문&is_live=true&page=1&limit=6
```

```json
// Response
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "아침을 여는 하타 요가",
      "level": "입문",
      "price": 89000,
      "is_live": 1,
      "instructor_name": "김소라",
      "avg_rating": 4.9,
      "enrollment_count": 3247
    }
  ],
  "pagination": { "total": 6, "page": 1, "limit": 6, "totalPages": 1 }
}
```

#### GET /courses/:id
```json
// Response (로그인 시 isEnrolled, isWishlisted 포함)
{
  "success": true,
  "data": {
    "id": 1,
    "title": "아침을 여는 하타 요가",
    "description": "...",
    "instructor_name": "김소라",
    "avg_rating": 4.9,
    "review_count": 847,
    "enrollment_count": 3247,
    "curriculum": {
      "1": [ { "id": 1, "title": "오리엔테이션", "duration_sec": 480, "is_preview": 1 } ],
      "2": [ ... ]
    },
    "reviews": [ { "reviewer_nickname": "박지은", "rating": 5, "content": "..." } ],
    "isEnrolled": false,
    "isWishlisted": false
  }
}
```

---

### 🎓 Enrollments (인증 필요)

| Method | Endpoint                        | 설명           |
|--------|---------------------------------|---------------|
| POST   | /enrollments/:courseId          | 수강 신청      |
| GET    | /enrollments                    | 내 수강 목록   |
| POST   | /enrollments/:courseId/wishlist | 찜 토글        |

#### POST /enrollments/:courseId
```json
// Response 201
{
  "success": true,
  "message": "수강 신청이 완료되었습니다.",
  "enrollmentId": 42
}
```

#### GET /enrollments
```json
// Response
{
  "success": true,
  "data": [
    {
      "enrollment_id": 42,
      "course_id": 1,
      "title": "아침을 여는 하타 요가",
      "instructor_name": "김소라",
      "enrolled_at": "2025-03-01T09:00:00.000Z",
      "lecture_count": 32,
      "completed_lectures": 22,
      "progress_rate": 69
    }
  ]
}
```

---

## 🗄 DB 테이블 구조

```
users          — 회원
instructors    — 강사
categories     — 카테고리 (입문/중급/심화)
courses        — 강의
lectures       — 강의 내 개별 영상 (커리큘럼)
enrollments    — 수강 신청
progress       — 수강 진도
reviews        — 수강 후기
wishlists      — 찜 목록
```

---

## 📁 폴더 구조

```
soma-backend/
├── schema.sql              # DB 스키마 & 시드 데이터
├── .env.example
├── package.json
└── src/
    ├── index.js            # 서버 진입점
    ├── config/
    │   └── db.js           # MySQL 커넥션 풀
    ├── middleware/
    │   └── auth.js         # JWT 인증 미들웨어
    ├── controllers/
    │   ├── authController.js
    │   ├── courseController.js
    │   └── enrollmentController.js
    └── routes/
        ├── auth.js
        ├── courses.js
        └── enrollments.js
```
