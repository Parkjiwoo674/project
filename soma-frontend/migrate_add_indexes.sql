USE soma_db;

-- 강의 조회 성능 개선
CREATE INDEX IF NOT EXISTS idx_courses_instructor  ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_published   ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_level       ON courses(level);

-- 수강 신청 조회
CREATE INDEX IF NOT EXISTS idx_enrollments_user    ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course  ON enrollments(course_id);

-- 진도 조회
CREATE INDEX IF NOT EXISTS idx_progress_user       ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_lecture    ON progress(lecture_id);

-- 후기 조회
CREATE INDEX IF NOT EXISTS idx_reviews_course      ON reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user        ON reviews(user_id);

-- 찜 조회
CREATE INDEX IF NOT EXISTS idx_wishlists_user      ON wishlists(user_id);

-- Q&A 조회
CREATE INDEX IF NOT EXISTS idx_qna_questions_course ON qna_questions(course_id);
CREATE INDEX IF NOT EXISTS idx_qna_answers_question ON qna_answers(question_id);

-- 강의 커리큘럼 조회
CREATE INDEX IF NOT EXISTS idx_lectures_course     ON lectures(course_id);
