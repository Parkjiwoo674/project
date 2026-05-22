const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const db = require("../config/db");

// ── 찜 목록 조회 ─────────────────────────────────────────────
router.get("/", authenticate, async (req, res) => {
  const userId = req.user.id;
  try {
    const [courses] = await db.query(
      `SELECT c.id, c.title, c.level, c.price,
              c.thumbnail_url, c.is_live, c.duration_weeks,
              i.name AS instructor_name,
              COUNT(DISTINCT l.id)          AS lecture_count,
              ROUND(COALESCE(SUM(DISTINCT l.duration_sec)/3600,0),1) AS total_hours,
              ROUND(AVG(r.rating), 1)       AS avg_rating,
              COUNT(DISTINCT e.user_id)          AS enrollment_count
         FROM wishlists w
         JOIN courses c     ON c.id = w.course_id
         JOIN instructors i ON i.id = c.instructor_id
    LEFT JOIN lectures l    ON l.course_id = c.id
    LEFT JOIN reviews r     ON r.course_id = c.id
    LEFT JOIN enrollments e ON e.course_id = c.id
        WHERE w.user_id = ?
        GROUP BY c.id
        ORDER BY w.created_at DESC`,
      [userId]
    );
    return res.json({ success: true, data: courses });
  } catch (err) {
    console.error("[getWishlist]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;