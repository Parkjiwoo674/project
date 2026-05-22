const db = require("../config/db");

// 현재 로그인한 강사의 instructor_id 조회
const getInstructorId = async (userId) => {
  const [[row]] = await db.query(
    "SELECT id FROM instructors WHERE name = (SELECT name FROM users WHERE id = ?)",
    [userId]
  );
  return row?.id ?? null;
};

// ── 내 강의 목록 ─────────────────────────────────────────────
const getMyCourses = async (req, res) => {
  const instructorId = await getInstructorId(req.user.id);
  if (!instructorId) return res.status(403).json({ success: false, message: "강사 정보를 찾을 수 없습니다." });

  try {
    const [courses] = await db.query(
      `SELECT
          c.id, c.title, c.level, c.price, c.is_live, c.is_published,
          c.duration_weeks, c.thumbnail_url, c.created_at,
          COUNT(DISTINCT l.id)          AS lecture_count,
          ROUND(COALESCE(SUM(DISTINCT l.duration_sec)/3600,0),1) AS total_hours,
          COUNT(DISTINCT e.user_id)          AS enrollment_count,
          ROUND(AVG(r.rating),1)        AS avg_rating,
          COUNT(DISTINCT r.id)          AS review_count
       FROM courses c
  LEFT JOIN lectures    l ON l.course_id = c.id
  LEFT JOIN enrollments e ON e.course_id = c.id
  LEFT JOIN reviews     r ON r.course_id = c.id
      WHERE c.instructor_id = ?
   GROUP BY c.id
   ORDER BY c.created_at DESC`,
      [instructorId]
    );
    return res.json({ success: true, data: courses });
  } catch (err) {
    console.error("[getMyCourses]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 강의 등록 ────────────────────────────────────────────────
const createCourse = async (req, res) => {
  const instructorId = await getInstructorId(req.user.id);
  if (!instructorId) return res.status(403).json({ success: false, message: "강사 정보를 찾을 수 없습니다." });

  const { title, description, level, price, is_live, duration_weeks, thumbnail_url } = req.body;
  if (!title || !level || price == null) {
    return res.status(400).json({ success: false, message: "제목, 레벨, 가격은 필수입니다." });
  }

  try {
    // 레벨에 맞는 category_id 조회
    const [[cat]] = await db.query("SELECT id FROM categories WHERE name = ?", [level]);
    const categoryId = cat?.id ?? 1;

    const [result] = await db.query(
      `INSERT INTO courses
         (instructor_id, category_id, title, description, level, price, is_live, duration_weeks, thumbnail_url, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [instructorId, categoryId, title, description ?? "", level, price, is_live ? 1 : 0, duration_weeks ?? null, thumbnail_url ?? null]
    );
    return res.status(201).json({ success: true, data: { id: result.insertId }, message: "강의가 등록되었습니다." });
  } catch (err) {
    console.error("[createCourse]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 강의 수정 ────────────────────────────────────────────────
const updateCourse = async (req, res) => {
  const instructorId = await getInstructorId(req.user.id);
  const courseId = Number(req.params.courseId);

  try {
    const [[course]] = await db.query(
      "SELECT id FROM courses WHERE id = ? AND instructor_id = ?",
      [courseId, instructorId]
    );
    if (!course) return res.status(403).json({ success: false, message: "권한이 없습니다." });

    const { title, description, level, price, is_live, duration_weeks, thumbnail_url, is_published } = req.body;

    const [[cat]] = await db.query("SELECT id FROM categories WHERE name = ?", [level]);
    const categoryId = cat?.id ?? 1;

    await db.query(
      `UPDATE courses SET
         title=?, description=?, level=?, category_id=?, price=?,
         is_live=?, duration_weeks=?, thumbnail_url=?, is_published=?
       WHERE id=?`,
      [title, description ?? "", level, categoryId, price,
       is_live ? 1 : 0, duration_weeks ?? null, thumbnail_url ?? null,
       is_published ? 1 : 0, courseId]
    );
    return res.json({ success: true, message: "강의가 수정되었습니다." });
  } catch (err) {
    console.error("[updateCourse]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 강의 삭제 ────────────────────────────────────────────────
const deleteCourse = async (req, res) => {
  const instructorId = await getInstructorId(req.user.id);
  const courseId = Number(req.params.courseId);

  try {
    const [[course]] = await db.query(
      "SELECT id, title FROM courses WHERE id = ? AND instructor_id = ?",
      [courseId, instructorId]
    );
    if (!course) return res.status(403).json({ success: false, message: "권한이 없습니다." });

    // ✅ 수강생 목록 조회 (알림 전송용)
    const [enrollments] = await db.query(
      "SELECT user_id FROM enrollments WHERE course_id = ?",
      [courseId]
    );

    // ✅ 결제 내역이 있는 수강생들에게 자동 환불 처리
    const [payments] = await db.query(
      `SELECT po.payment_key, po.order_id, po.amount, po.user_id, u.email
       FROM payment_orders po
       JOIN users u ON u.id = po.user_id
       WHERE po.course_id = ? AND po.status = 'done'`,
      [courseId]
    );

    // Toss Payments API로 환불 처리
    const axios = require("axios");
    const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "test_sk_demo_key";
    const TOSS_API_URL = "https://api.tosspayments.com/v1/payments";
    const tossAuth = () => "Basic " + Buffer.from(TOSS_SECRET_KEY + ":").toString("base64");

    let refundedCount = 0;
    let refundErrors = [];

    for (const payment of payments) {
      try {
        // Toss API 환불 요청
        await axios.post(
          `${TOSS_API_URL}/${payment.payment_key}/cancel`,
          { cancelReason: `강의 삭제로 인한 자동 환불 (${course.title})` },
          { headers: { Authorization: tossAuth(), "Content-Type": "application/json" } }
        );

        // payment_orders 상태 업데이트
        await db.query(
          "UPDATE payment_orders SET status = 'canceled' WHERE order_id = ?",
          [payment.order_id]
        );

        refundedCount++;
      } catch (err) {
        console.error(`[환불 실패] ${payment.order_id}:`, err.response?.data || err.message);
        refundErrors.push({ email: payment.email, orderId: payment.order_id });
      }
    }

    // 환불 실패가 있으면 경고 메시지와 함께 삭제 중단
    if (refundErrors.length > 0) {
      return res.status(500).json({
        success: false,
        message: `환불 처리 중 오류가 발생했습니다. (성공: ${refundedCount}건, 실패: ${refundErrors.length}건)\n실패한 주문은 수동으로 환불 처리 후 다시 시도해주세요.`,
        data: { refundErrors }
      });
    }

    // ✅ 모든 수강생에게 알림 생성
    const { createNotification } = require("./notificationController");
    for (const enrollment of enrollments) {
      const wasRefunded = payments.some(p => p.user_id === enrollment.user_id);
      const message = wasRefunded
        ? `수강 중이던 "${course.title}" 강의가 삭제되어 환불 처리되었습니다.`
        : `수강 중이던 "${course.title}" 강의가 삭제되었습니다.`;
      
      await createNotification(
        enrollment.user_id,
        wasRefunded ? 'refund' : 'course_deleted',
        '강의 삭제 안내',
        message,
        null
      );
    }

    console.log(`[강의 삭제] ${enrollments.length}명에게 알림 전송 완료`);

    // 관련 데이터 순서대로 삭제 (FK 제약 순서 고려)
    const lectureIds = await db.query(
      "SELECT id FROM lectures WHERE course_id = ?", [courseId]
    ).then(([rows]) => rows.map(r => r.id));

    if (lectureIds.length > 0) {
      await db.query("DELETE FROM progress WHERE lecture_id IN (?)", [lectureIds]);
    }

    await db.query("DELETE FROM qna_answers WHERE question_id IN (SELECT id FROM qna_questions WHERE course_id = ?)", [courseId]);
    await db.query("DELETE FROM qna_questions WHERE course_id = ?", [courseId]);
    await db.query("DELETE FROM reviews WHERE course_id = ?", [courseId]);
    await db.query("DELETE FROM wishlists WHERE course_id = ?", [courseId]);
    await db.query("DELETE FROM enrollments WHERE course_id = ?", [courseId]);
    await db.query("DELETE FROM payment_orders WHERE course_id = ?", [courseId]);
    await db.query("DELETE FROM lectures WHERE course_id = ?", [courseId]);
    await db.query("DELETE FROM courses WHERE id = ?", [courseId]);

    return res.json({
      success: true,
      message: enrollments.length > 0
        ? `강의가 삭제되었습니다. (${enrollments.length}명에게 알림 전송)`
        : "강의가 삭제되었습니다."
    });
  } catch (err) {
    console.error("[deleteCourse]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 커리큘럼(강의 영상) 목록 조회 ───────────────────────────
const getLectures = async (req, res) => {
  const courseId = Number(req.params.courseId);
  try {
    const [lectures] = await db.query(
      "SELECT * FROM lectures WHERE course_id = ? ORDER BY week, sort_order",
      [courseId]
    );
    return res.json({ success: true, data: lectures });
  } catch (err) {
    console.error("[getLectures]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 강의 영상 추가 ───────────────────────────────────────────
const addLecture = async (req, res) => {
  const instructorId = await getInstructorId(req.user.id);
  const courseId = Number(req.params.courseId);
  const { week, title, duration_sec, is_preview, video_url } = req.body;

  if (!title) return res.status(400).json({ success: false, message: "강의 제목은 필수입니다." });

  try {
    const [[course]] = await db.query(
      "SELECT id FROM courses WHERE id = ? AND instructor_id = ?",
      [courseId, instructorId]
    );
    if (!course) return res.status(403).json({ success: false, message: "권한이 없습니다." });

    // sort_order 자동 계산
    const [[{ maxOrder }]] = await db.query(
      "SELECT COALESCE(MAX(sort_order),0) AS maxOrder FROM lectures WHERE course_id = ? AND week = ?",
      [courseId, week ?? 1]
    );

    const [result] = await db.query(
      `INSERT INTO lectures (course_id, week, sort_order, title, duration_sec, is_preview, video_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [courseId, week ?? 1, maxOrder + 1, title, duration_sec ?? 0, is_preview ? 1 : 0, video_url ?? null]
    );
    return res.status(201).json({ success: true, data: { id: result.insertId }, message: "강의가 추가되었습니다." });
  } catch (err) {
    console.error("[addLecture]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 강의 영상 수정 ───────────────────────────────────────────
const updateLecture = async (req, res) => {
  const instructorId = await getInstructorId(req.user.id);
  const { courseId, lectureId } = req.params;
  const { week, title, duration_sec, is_preview, video_url } = req.body;

  try {
    const [[course]] = await db.query(
      "SELECT id FROM courses WHERE id = ? AND instructor_id = ?",
      [courseId, instructorId]
    );
    if (!course) return res.status(403).json({ success: false, message: "권한이 없습니다." });

    await db.query(
      "UPDATE lectures SET week=?, title=?, duration_sec=?, is_preview=?, video_url=? WHERE id=? AND course_id=?",
      [week, title, duration_sec ?? 0, is_preview ? 1 : 0, video_url ?? null, lectureId, courseId]
    );
    return res.json({ success: true, message: "강의가 수정되었습니다." });
  } catch (err) {
    console.error("[updateLecture]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 강의 영상 삭제 ───────────────────────────────────────────
const deleteLecture = async (req, res) => {
  const instructorId = await getInstructorId(req.user.id);
  const { courseId, lectureId } = req.params;

  try {
    const [[course]] = await db.query(
      "SELECT id FROM courses WHERE id = ? AND instructor_id = ?",
      [courseId, instructorId]
    );
    if (!course) return res.status(403).json({ success: false, message: "권한이 없습니다." });

    await db.query("DELETE FROM lectures WHERE id = ? AND course_id = ?", [lectureId, courseId]);
    return res.json({ success: true, message: "강의가 삭제되었습니다." });
  } catch (err) {
    console.error("[deleteLecture]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 강의 공개/비공개 토글 ────────────────────────────────────
const togglePublish = async (req, res) => {
  const instructorId = await getInstructorId(req.user.id);
  const courseId = Number(req.params.courseId);

  try {
    const [[course]] = await db.query(
      "SELECT id, is_published FROM courses WHERE id = ? AND instructor_id = ?",
      [courseId, instructorId]
    );
    if (!course) return res.status(403).json({ success: false, message: "권한이 없습니다." });

    const newVal = course.is_published ? 0 : 1;
    await db.query("UPDATE courses SET is_published = ? WHERE id = ?", [newVal, courseId]);
    return res.json({ success: true, data: { is_published: newVal }, message: newVal ? "강의가 공개되었습니다." : "강의가 비공개 처리되었습니다." });
  } catch (err) {
    console.error("[togglePublish]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 강사 프로필 조회 ─────────────────────────────────────────
const getMyProfile = async (req, res) => {
  const instructorId = await getInstructorId(req.user.id);
  if (!instructorId) return res.status(403).json({ success: false, message: "강사 정보를 찾을 수 없습니다." });

  try {
    const [[instructor]] = await db.query(
      "SELECT id, name, bio, avatar_url, certifications FROM instructors WHERE id = ?",
      [instructorId]
    );
    return res.json({ success: true, data: instructor });
  } catch (err) {
    console.error("[getMyProfile]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 강사 프로필 수정 ─────────────────────────────────────────
const updateMyProfile = async (req, res) => {
  const instructorId = await getInstructorId(req.user.id);
  if (!instructorId) return res.status(403).json({ success: false, message: "강사 정보를 찾을 수 없습니다." });

  const { name, bio, avatar_url } = req.body;
  try {
    await db.query(
      "UPDATE instructors SET name = ?, bio = ?, avatar_url = ? WHERE id = ?",
      [name, bio ?? "", avatar_url ?? null, instructorId]
    );
    // users 테이블 name도 동기화
    if (name) await db.query("UPDATE users SET name = ? WHERE id = ?", [name, req.user.id]);
    return res.json({ success: true, message: "프로필이 수정되었습니다." });
  } catch (err) {
    console.error("[updateMyProfile]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

module.exports = { getMyCourses, createCourse, updateCourse, deleteCourse, getLectures, addLecture, updateLecture, deleteLecture, togglePublish, getMyProfile, updateMyProfile };