const db = require("../config/db");

// ── 후기 작성 ────────────────────────────────────────────────
const createReview = async (req, res) => {
  const userId   = req.user.id;
  const courseId = Number(req.params.courseId);
  const { rating, content } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: "평점은 1~5 사이여야 합니다." });
  }

  try {
    // 수강 여부 확인
    const [[enroll]] = await db.query(
      "SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?",
      [userId, courseId]
    );
    if (!enroll) {
      return res.status(403).json({ success: false, message: "수강 중인 강의에만 후기를 작성할 수 있습니다." });
    }

    // 중복 후기 확인
    const [[existing]] = await db.query(
      "SELECT id FROM reviews WHERE user_id = ? AND course_id = ?",
      [userId, courseId]
    );
    if (existing) {
      return res.status(409).json({ success: false, message: "이미 후기를 작성하셨습니다." });
    }

    const [result] = await db.query(
      "INSERT INTO reviews (user_id, course_id, rating, content) VALUES (?, ?, ?, ?)",
      [userId, courseId, rating, content || ""]
    );

    const [[review]] = await db.query(
      `SELECT r.id, r.rating, r.content, r.created_at, u.nickname AS reviewer_nickname
         FROM reviews r JOIN users u ON u.id = r.user_id
        WHERE r.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({ success: true, data: review });
  } catch (err) {
    console.error("[createReview]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 후기 목록 조회 ───────────────────────────────────────────
const getReviews = async (req, res) => {
  const courseId = Number(req.params.courseId);
  const { page = 1, limit = 10 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM reviews WHERE course_id = ?",
      [courseId]
    );

    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.content, r.created_at, u.nickname AS reviewer_nickname, u.avatar_url AS reviewer_avatar
         FROM reviews r JOIN users u ON u.id = r.user_id
        WHERE r.course_id = ?
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?`,
      [courseId, Number(limit), offset]
    );

    return res.json({ success: true, data: reviews, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error("[getReviews]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 후기 삭제 ────────────────────────────────────────────────
const deleteReview = async (req, res) => {
  const userId   = req.user.id;
  const userRole = req.user.role;
  const reviewId = Number(req.params.reviewId);

  try {
    const [[review]] = await db.query(
      "SELECT id, user_id FROM reviews WHERE id = ?",
      [reviewId]
    );
    if (!review) {
      return res.status(404).json({ success: false, message: "후기를 찾을 수 없습니다." });
    }

    if (review.user_id !== userId && userRole !== "admin") {
      return res.status(403).json({ success: false, message: "삭제 권한이 없습니다." });
    }

    await db.query("DELETE FROM reviews WHERE id = ?", [reviewId]);
    return res.json({ success: true, message: "후기가 삭제되었습니다." });
  } catch (err) {
    console.error("[deleteReview]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

module.exports = { createReview, getReviews, deleteReview };

// ── 베스트 후기 (랜딩용) ─────────────────────────────────────
const getBestReviews = async (_req, res) => {
  try {
    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.content, r.created_at,
              u.nickname   AS reviewer_nickname,
              u.avatar_url AS reviewer_avatar,
              c.title      AS course_title
        FROM reviews r
        JOIN users u   ON u.id = r.user_id
        JOIN courses c ON c.id = r.course_id
      ORDER BY r.rating DESC, LENGTH(r.content) DESC
      LIMIT 3`
    );
    return res.json({ success: true, data: reviews });
  } catch (err) {
    console.error("[getBestReviews]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

module.exports = { createReview, getReviews, deleteReview, getBestReviews };