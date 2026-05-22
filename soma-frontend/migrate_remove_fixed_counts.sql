-- courses 테이블에서 고정값 컬럼 제거
-- lecture_count, total_hours는 lectures 테이블에서 동적으로 계산

USE soma_db;

ALTER TABLE courses
  DROP COLUMN lecture_count,
  DROP COLUMN total_hours;
