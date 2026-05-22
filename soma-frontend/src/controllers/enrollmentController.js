const db = require("../config/db");

// ── 수강 신청 ────────────────────────────────────────────────
const enroll = async (req, res) => {
  const userId   = req.user.id;
  const courseId = Number(req.params.courseId);

  try {
    // 강의 존재 & 공개 여부 확인
    const [[course]] = await db.query(
      "SELECT id, price FROM courses WHERE id = ? AND is_published = 1",
      [courseId]
    );
    if (!course) {
      return res.status(404).json({ success: false, message: "강의를 찾을 수 없습니다." });
    }

    // 중복 수강 신청 방지
    const [[existing]] = await db.query(
      "SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?",
      [userId, courseId]
    );
    if (existing) {
      return res.status(409).json({ success: false, message: "이미 수강 신청한 강의입니다." });
    }

    // 수강 신청 등록
    const [result] = await db.query(
      "INSERT INTO enrollments (user_id, course_id, paid_price) VALUES (?, ?, ?)",
      [userId, courseId, course.price]
    );

    return res.status(201).json({
      success: true,
      message: "수강 신청이 완료되었습니다.",
      data: { enrollmentId: result.insertId },
    });
  } catch (err) {
    console.error("[enroll]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 내 수강 목록 조회 ────────────────────────────────────────
const getMyEnrollments = async (req, res) => {
  const userId = req.user.id;

  try {
    const [enrollments] = await db.query(
      `SELECT
          e.id          AS enrollment_id,
          e.enrolled_at,
          e.paid_price,
          c.id          AS course_id,
          c.title,
          c.level,
          c.thumbnail_url,
          i.name        AS instructor_name,
          COUNT(DISTINCT l.id)  AS lecture_count,
          (SELECT COUNT(DISTINCT p2.id)
           FROM progress p2
           INNER JOIN lectures l2 ON l2.id = p2.lecture_id
           WHERE p2.user_id = ?
             AND l2.course_id = c.id
             AND p2.is_completed = 1) AS completed_lectures
       FROM enrollments e
       JOIN courses     c ON c.id = e.course_id
       JOIN instructors i ON i.id = c.instructor_id
  LEFT JOIN lectures   l ON l.course_id = c.id
      WHERE e.user_id = ?
   GROUP BY e.id, e.enrolled_at, e.paid_price, c.id, c.title, c.level, c.thumbnail_url, i.name
   ORDER BY e.enrolled_at DESC`,
      [userId, userId]
    );

    const data = enrollments.map((e) => ({
      ...e,
      progress_rate:
        e.lecture_count > 0
          ? Math.round((e.completed_lectures / e.lecture_count) * 100)
          : 0,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error("[getMyEnrollments]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 찜하기 / 찜 취소 (토글) ──────────────────────────────────
const toggleWishlist = async (req, res) => {
  const userId   = req.user.id;
  const courseId = Number(req.params.courseId);

  try {
    const [[existing]] = await db.query(
      "SELECT 1 FROM wishlists WHERE user_id = ? AND course_id = ?",
      [userId, courseId]
    );

    if (existing) {
      await db.query("DELETE FROM wishlists WHERE user_id = ? AND course_id = ?", [userId, courseId]);
      return res.json({ success: true, data: { wishlisted: false }, message: "찜 목록에서 제거되었습니다." });
    } else {
      await db.query("INSERT INTO wishlists (user_id, course_id) VALUES (?, ?)", [userId, courseId]);
      return res.json({ success: true, data: { wishlisted: true }, message: "찜 목록에 추가되었습니다." });
    }
  } catch (err) {
    console.error("[toggleWishlist]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 수강 취소 ────────────────────────────────────────────────
const cancelEnrollment = async (req, res) => {
  const userId   = req.user.id;
  const courseId = Number(req.params.courseId);

  try {
    const [[existing]] = await db.query(
      "SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?",
      [userId, courseId]
    );
    if (!existing) {
      return res.status(404).json({ success: false, message: "수강 신청 내역이 없습니다." });
    }

    const [[completedCheck]] = await db.query(
      `SELECT COUNT(*) AS cnt FROM progress
        WHERE user_id = ? AND is_completed = 1
          AND lecture_id IN (SELECT id FROM lectures WHERE course_id = ?)`,
      [userId, courseId]
    );
    if (completedCheck.cnt > 0) {
      return res.status(403).json({ success: false, message: "완료한 강의가 있어 수강 취소가 불가합니다." });
    }
    return res.json({ success: true, message: "수강이 취소되었습니다." });
  } catch (err) {
    console.error("[cancelEnrollment]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

module.exports = { enroll, getMyEnrollments, toggleWishlist, cancelEnrollment };
