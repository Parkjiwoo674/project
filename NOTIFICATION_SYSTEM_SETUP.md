# 알림 시스템 구현 완료 ✅

## 📋 개요
수강생이 강의 삭제, 환불, Q&A 답변 등의 이벤트를 실시간으로 받을 수 있는 알림 시스템이 구현되었습니다.

---

## ✅ 완료된 작업

### 1. 백엔드 구현
- ✅ `notifications` 테이블 스키마 생성 (`add_notifications.sql`)
- ✅ 알림 컨트롤러 구현 (`notificationController.js`)
  - 내 알림 목록 조회
  - 알림 읽음 처리
  - 모든 알림 읽음 처리
  - 알림 생성 헬퍼 함수
- ✅ 알림 라우트 구현 (`/api/notifications`)
- ✅ 강의 삭제 시 자동 알림 생성 (환불 여부에 따라 다른 메시지)

### 2. 프론트엔드 구현
- ✅ 알림 API 함수 추가 (`api/index.ts`)
- ✅ Nav 컴포넌트에 알림 벨 UI 구현
  - 🔔 벨 아이콘 + 읽지 않은 알림 개수 배지
  - 드롭다운 알림 목록
  - 30초마다 자동 폴링
  - 알림 읽음 처리
  - 모두 읽음 처리
  - 알림 타입별 아이콘 (🗑️ 삭제, 💰 환불, 💬 Q&A, 📢 공지)
  - 상대 시간 표시 (방금 전, 5분 전, 2시간 전 등)

---

## 🚀 배포 전 필수 작업

### ⚠️ 데이터베이스 마이그레이션 실행 필요!

알림 시스템이 작동하려면 `notifications` 테이블을 생성해야 합니다.

#### MySQL 실행 방법:

**방법 1: MySQL Workbench 사용**
1. MySQL Workbench 실행
2. 데이터베이스 연결 (soma_db)
3. `soma-backend/add_notifications.sql` 파일 열기
4. 전체 선택 후 실행 (⚡ 아이콘 클릭)

**방법 2: 명령줄 사용**
```bash
# MySQL이 PATH에 있는 경우
mysql -u root -p soma_db < soma-backend/add_notifications.sql

# 또는 MySQL 전체 경로 사용
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p soma_db < soma-backend/add_notifications.sql
```

**방법 3: SQL 직접 실행**
MySQL 클라이언트에서 다음 SQL을 직접 실행:

```sql
-- 알림 테이블 추가
CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type ENUM('course_deleted', 'refund', 'qna_answer', 'announcement') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255),
  is_read TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX idx_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_created_at ON notifications(created_at DESC);
```

---

## 🧪 테스트 방법

### 1. 강의 삭제 알림 테스트
1. **강사 계정**으로 로그인
2. 강의 관리 페이지에서 수강생이 있는 강의 삭제
3. **수강생 계정**으로 로그인
4. 상단 네비게이션 바에 🔔 아이콘 확인
5. 빨간 배지에 읽지 않은 알림 개수 표시 확인
6. 벨 아이콘 클릭하여 알림 드롭다운 확인
7. 알림 내용 확인:
   - 유료 강의: "수강 중이던 [강의명] 강의가 삭제되어 환불 처리되었습니다."
   - 무료 강의: "수강 중이던 [강의명] 강의가 삭제되었습니다."

### 2. 알림 읽음 처리 테스트
1. 알림 항목 클릭
2. 배경색이 연한 초록색에서 흰색으로 변경 확인
3. 읽지 않은 알림 개수 배지 감소 확인

### 3. 모두 읽음 처리 테스트
1. 여러 개의 읽지 않은 알림이 있는 상태
2. "모두 읽음" 버튼 클릭
3. 모든 알림이 읽음 상태로 변경 확인
4. 배지 사라짐 확인

### 4. 자동 폴링 테스트
1. 수강생 계정으로 로그인한 상태 유지
2. 다른 브라우저/시크릿 모드에서 강사 계정으로 강의 삭제
3. 30초 이내에 수강생 화면에 자동으로 알림 표시 확인

---

## 📊 알림 타입

| 타입 | 아이콘 | 설명 | 현재 구현 상태 |
|------|--------|------|----------------|
| `course_deleted` | 🗑️ | 수강 중인 강의가 삭제됨 | ✅ 구현됨 |
| `refund` | 💰 | 환불 처리 완료 | ✅ 구현됨 |
| `qna_answer` | 💬 | Q&A 답변 등록 | ⏳ 미구현 |
| `announcement` | 📢 | 공지사항 | ⏳ 미구현 |

---

## 🔮 향후 확장 가능 기능

### 1. Q&A 답변 알림
`qnaController.js`의 `createAnswer` 함수에 알림 생성 추가:

```javascript
const { createNotification } = require("./notificationController");

// Q&A 답변 생성 후
await createNotification(
  question.user_id,  // 질문 작성자
  'qna_answer',
  'Q&A 답변이 등록되었습니다',
  `"${question.content.substring(0, 30)}..." 질문에 답변이 달렸습니다.`,
  `/courses/${courseId}`
);
```

### 2. 실시간 알림 (WebSocket)
현재는 30초마다 폴링하지만, Socket.io를 사용하여 실시간 푸시 알림 구현 가능:
- 서버에서 알림 생성 시 즉시 클라이언트에 전송
- 더 빠른 알림 전달
- 서버 부하 감소

### 3. 이메일 알림
중요한 알림(환불, 강의 삭제)은 이메일로도 전송

### 4. 알림 설정
사용자가 받고 싶은 알림 타입을 선택할 수 있는 설정 페이지

---

## 📁 수정된 파일 목록

### 백엔드
- `soma-backend/add_notifications.sql` (신규)
- `soma-backend/src/controllers/notificationController.js` (신규)
- `soma-backend/src/routes/notifications.js` (신규)
- `soma-backend/src/index.js` (알림 라우트 추가)
- `soma-backend/src/controllers/instructorCourseController.js` (알림 생성 로직 추가)

### 프론트엔드
- `soma-frontend/src/api/index.ts` (알림 API 추가)
- `soma-frontend/src/components/Nav.tsx` (알림 UI 구현)

---

## 🎨 UI 디자인 특징

- **미니멀하고 우아한 디자인**: SOMA의 전체적인 디자인 톤과 일치
- **직관적인 UX**: 
  - 읽지 않은 알림은 연한 초록색 배경
  - 읽은 알림은 흰색 배경
  - 읽지 않은 알림에는 초록색 점 표시
- **반응형**: 드롭다운 외부 클릭 시 자동 닫힘
- **성능 최적화**: 
  - 30초 폴링으로 서버 부하 최소화
  - 최대 20개 알림만 표시
  - 인덱스를 통한 빠른 쿼리

---

## ✅ 체크리스트

배포 전 확인사항:

- [ ] `add_notifications.sql` 마이그레이션 실행 완료
- [ ] 백엔드 서버 재시작
- [ ] 프론트엔드 빌드 및 재시작
- [ ] 강의 삭제 → 알림 생성 테스트
- [ ] 알림 읽음 처리 테스트
- [ ] 모두 읽음 처리 테스트
- [ ] 자동 폴링 동작 확인

---

## 🐛 문제 해결

### 알림이 표시되지 않는 경우
1. 데이터베이스에 `notifications` 테이블이 생성되었는지 확인
2. 백엔드 콘솔에서 에러 로그 확인
3. 브라우저 개발자 도구 Network 탭에서 `/api/notifications` 요청 확인
4. 사용자 role이 "user"인지 확인 (강사/관리자에게는 알림 벨이 표시되지 않음)

### 알림 개수가 업데이트되지 않는 경우
1. 30초 대기 (폴링 주기)
2. 페이지 새로고침
3. 브라우저 콘솔에서 에러 확인

---

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. MySQL 서버 실행 상태
2. 백엔드 서버 로그
3. 브라우저 개발자 도구 콘솔
4. 네트워크 요청/응답

---

**구현 완료일**: 2026-05-18
**구현자**: Kiro AI Assistant
