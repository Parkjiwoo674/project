# SOMA 프로젝트 실행 가이드

## 필요 환경
- Node.js 18 이상
- MySQL 8.0 이상

## 1. DB 설정

MySQL에서 데이터베이스 생성 후 schema.sql 실행:

```sql
CREATE DATABASE soma_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

```bash
mysql -u root -p soma_db < schema.sql
```

## 2. 백엔드 설정

`soma-backend/` 폴더에 `.env` 파일 생성 (제출된 zip의 .env 파일 사용):

```
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=본인MySQL비밀번호
DB_NAME=soma_db
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

```bash
cd soma-backend
npm install
npm run dev
```

## 3. 프론트엔드 실행

```bash
cd soma-frontend
npm install
npm run dev
```

## 4. 접속

브라우저에서 http://localhost:5173 접속
