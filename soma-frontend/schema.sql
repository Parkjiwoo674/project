-- ============================================================
--  SOMA 요가 인강 — MySQL 스키마
-- ============================================================

CREATE DATABASE IF NOT EXISTS soma_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE soma_db;

-- ── 사용자 ──────────────────────────────────────────────────
CREATE TABLE users (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  name          VARCHAR(50)     NOT NULL,
  nickname      VARCHAR(50)     NOT NULL,
  email         VARCHAR(100)    NOT NULL UNIQUE,
  password_hash VARCHAR(255)    NOT NULL,
  role          ENUM('user','instructor','admin') NOT NULL DEFAULT 'user',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ── 강사 ──────────────────────────────────────────────────
CREATE TABLE instructors (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name        VARCHAR(50)   NOT NULL,
  bio         TEXT,
  avatar_url  VARCHAR(255),
  certifications JSON,         -- ["RYT 500","아쉬탕가 수련", ...]
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ── 카테고리 ───────────────────────────────────────────────
CREATE TABLE categories (
  id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name  VARCHAR(50)  NOT NULL UNIQUE,      -- 입문 / 중급 / 심화
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ── 강의 ──────────────────────────────────────────────────
CREATE TABLE courses (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  instructor_id INT UNSIGNED    NOT NULL,
  category_id   INT UNSIGNED    NOT NULL,
  title         VARCHAR(200)    NOT NULL,
  description   TEXT,
  level         ENUM('입문','중급','심화') NOT NULL DEFAULT '입문',
  duration_weeks INT UNSIGNED,
  lecture_count  INT UNSIGNED   NOT NULL DEFAULT 0,
  total_hours    DECIMAL(5,1)   NOT NULL DEFAULT 0,
  thumbnail_url  VARCHAR(255),
  price          INT UNSIGNED   NOT NULL DEFAULT 0,  -- 원 단위
  is_live        TINYINT(1)     NOT NULL DEFAULT 0,
  is_published   TINYINT(1)     NOT NULL DEFAULT 0,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_course_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id),
  CONSTRAINT fk_course_category   FOREIGN KEY (category_id)   REFERENCES categories(id)
) ENGINE=InnoDB;

-- ── 강의 커리큘럼 (주차별 강의 목록) ────────────────────────
CREATE TABLE lectures (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  course_id   INT UNSIGNED  NOT NULL,
  week        TINYINT UNSIGNED NOT NULL DEFAULT 1,
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 1,
  title       VARCHAR(200)  NOT NULL,
  duration_sec INT UNSIGNED NOT NULL DEFAULT 0,  -- 초 단위
  is_preview  TINYINT(1)    NOT NULL DEFAULT 0,  -- 무료 미리보기 여부
  video_url   VARCHAR(255),
  PRIMARY KEY (id),
  CONSTRAINT fk_lecture_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── 수강 신청 ─────────────────────────────────────────────
CREATE TABLE enrollments (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  course_id   INT UNSIGNED  NOT NULL,
  paid_price  INT UNSIGNED  NOT NULL DEFAULT 0,
  enrolled_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_enrollment (user_id, course_id),
  CONSTRAINT fk_enroll_user   FOREIGN KEY (user_id)   REFERENCES users(id),
  CONSTRAINT fk_enroll_course FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB;

-- ── 수강 진도 ─────────────────────────────────────────────
CREATE TABLE progress (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED  NOT NULL,
  lecture_id   INT UNSIGNED  NOT NULL,
  watched_sec  INT UNSIGNED  NOT NULL DEFAULT 0,
  is_completed TINYINT(1)    NOT NULL DEFAULT 0,
  last_watched DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_progress (user_id, lecture_id),
  CONSTRAINT fk_progress_user    FOREIGN KEY (user_id)    REFERENCES users(id),
  CONSTRAINT fk_progress_lecture FOREIGN KEY (lecture_id) REFERENCES lectures(id)
) ENGINE=InnoDB;

-- ── 리뷰 ──────────────────────────────────────────────────
CREATE TABLE reviews (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  course_id   INT UNSIGNED  NOT NULL,
  rating      TINYINT       NOT NULL CHECK (rating BETWEEN 1 AND 5),
  content     TEXT,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_review (user_id, course_id),
  CONSTRAINT fk_review_user   FOREIGN KEY (user_id)   REFERENCES users(id),
  CONSTRAINT fk_review_course FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB;

-- ── 찜 목록 ───────────────────────────────────────────────
CREATE TABLE wishlists (
  user_id    INT UNSIGNED NOT NULL,
  course_id  INT UNSIGNED NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id),
  CONSTRAINT fk_wish_user   FOREIGN KEY (user_id)   REFERENCES users(id),
  CONSTRAINT fk_wish_course FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB;

-- ── 시드 데이터 ───────────────────────────────────────────
INSERT INTO categories (name) VALUES ('입문'), ('중급'), ('심화');

INSERT INTO instructors (name, bio, certifications) VALUES
  ('김소라', '인도 리시케시에서 요가를 수련한 뒤, 10년간 5,000명 이상의 수강생을 가르쳐온 강사입니다.', '["RYT 500 인증","아쉬탕가 수련","명상 지도사"]'),
  ('이지현', '인 요가 전문 강사. 깊은 스트레칭과 호흡법으로 편안한 수면을 돕습니다.',                '["RYT 200 인증","인 요가 전문"]'),
  ('박민지', '명상과 호흡 전문 강사.',                                                               '["명상 지도사","호흡 코치"]');

INSERT INTO courses (instructor_id, category_id, title, description, level, duration_weeks, lecture_count, total_hours, price, is_live, is_published) VALUES
  (1, 1, '아침을 여는 하타 요가',   '하루를 상쾌하게 시작하는 30분 루틴.',          '입문', 4,  32, 16.0, 89000,  1, 1),
  (1, 2, '파워 빈야사 플로우',      '전신 근력을 키우는 역동적인 빈야사 과정.',      '중급', 8,  56, 28.0, 119000, 0, 1),
  (2, 1, '숙면을 위한 인 요가',     '하루의 긴장을 풀어주는 저녁 루틴.',            '입문', NULL, 24, 12.0, 69000, 0, 1),
  (3, 1, '선라이즈 명상 호흡',      '이른 아침 호흡과 마음을 정돈하는 명상 클래스.','입문', 3,  18,  9.0, 59000, 0, 1),
  (1, 3, '아쉬탕가 심화 수련',      '전통 아쉬탕가 시리즈 심화 과정.',              '심화', 10, 40, 20.0, 149000, 1, 1),
  (1, 2, '코어 & 밸런스 필라테스', '코어 근력과 밸런스를 동시에 강화.',             '중급', 6,  36, 18.0, 99000, 0, 1);

-- ── lectures 시드 데이터 (course_id=1 기준, video_url = 유튜브 ID) ──
INSERT INTO lectures (course_id, week, sort_order, title, duration_sec, is_preview, video_url) VALUES
  (1, 1, 1, '오리엔테이션 · 요가 매트와 준비물',       480,  1, '0Ad4j-qlG04'),
  (1, 1, 2, '산 자세 (타다사나)와 호흡',               1320, 1, 'SfcJ9lK4QTs'),
  (1, 1, 3, '전굴 자세 (우타나사나)',                   1080, 0, 'VyCth_x8oE4'),
  (1, 2, 1, '전사 자세 1 (비라바드라사나 I)',            1440, 0, 'VCiBHbYRp3k'),
  (1, 2, 2, '전사 자세 2 (비라바드라사나 II)',           1380, 0, 'af9TZv2lgw8'),
  (1, 2, 3, '삼각 자세 (트리코나사나)',                  1200, 0, '0Ad4j-qlG04'),
  (1, 3, 1, '나무 자세 (브릭샤사나) 밸런스',             960,  0, 'SfcJ9lK4QTs'),
  (1, 3, 2, '독수리 자세 (가루다사나)',                  1020, 0, 'VyCth_x8oE4'),
  (1, 4, 1, '아기 자세 (발라사나) 이완',                 720,  0, 'VCiBHbYRp3k'),
  (1, 4, 2, '시체 자세 (사바사나) 마무리 명상',           900,  0, 'af9TZv2lgw8');

-- ── Q&A 질문 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qna_questions (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  course_id  INT UNSIGNED NOT NULL,
  content    TEXT         NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_qna_user   FOREIGN KEY (user_id)   REFERENCES users(id),
  CONSTRAINT fk_qna_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Q&A 답변 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS qna_answers (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  question_id INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  content     TEXT         NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_ans_question FOREIGN KEY (question_id) REFERENCES qna_questions(id) ON DELETE CASCADE,
  CONSTRAINT fk_ans_user     FOREIGN KEY (user_id)     REFERENCES users(id)
) ENGINE=InnoDB;

-- ── 결제 주문 ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_orders (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  order_id    VARCHAR(100)  NOT NULL UNIQUE,
  user_id     INT UNSIGNED  NOT NULL,
  course_id   INT UNSIGNED  NOT NULL,
  amount      INT UNSIGNED  NOT NULL,
  status      ENUM('pending','done','canceled','failed') NOT NULL DEFAULT 'pending',
  payment_key VARCHAR(200),
  paid_at     DATETIME,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_payment_user   FOREIGN KEY (user_id)   REFERENCES users(id),
  CONSTRAINT fk_payment_course FOREIGN KEY (course_id) REFERENCES courses(id)
) ENGINE=InnoDB;
