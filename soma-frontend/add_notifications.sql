-- 데이터베이스 선택
USE soma_db;

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
