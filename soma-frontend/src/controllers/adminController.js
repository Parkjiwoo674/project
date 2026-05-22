const db = require("../config/db");

// ── 회원 목록 ─────────────────────────────────────────────────
const getUsers = async (_req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.name, u.nickname, u.email, u.role, u.created_at,
              COALESCE(i.avatar_url, u.avatar_url) AS avatar_url
         FROM users u
    LEFT JOIN instructors i ON i.user_id = u.id AND u.role = 'instructor'
        WHERE u.role != 'admin'
        ORDER BY u.created_at DESC`
    );
    return res.json({ success: true, data: users });
  } catch (err) {
    console.error("[getUsers]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 전체 통계 ─────────────────────────────────────────────────
const getStats = async (_req, res) => {
  try {
    const [[{ total_users }]]       = await db.query("SELECT COUNT(*) AS total_users FROM users WHERE role != 'admin'");
    const [[{ total_instructors }]] = await db.query("SELECT COUNT(*) AS total_instructors FROM users WHERE role = 'instructor'");
    const [[{ total_students }]]    = await db.query("SELECT COUNT(DISTINCT user_id) AS total_students FROM enrollments");
    const [[{ total_courses }]]     = await db.query("SELECT COUNT(*) AS total_courses FROM courses WHERE is_published = 1");
    const [[{ total_reviews }]]     = await db.query("SELECT COUNT(*) AS total_reviews FROM reviews");
    const [[{ total_revenue }]]     = await db.query("SELECT COALESCE(SUM(amount), 0) AS total_revenue FROM payment_orders WHERE status = 'done'");

    const [monthlyRevenue] = await db.query(
      `SELECT DATE_FORMAT(paid_at, '%Y-%u') AS week,
          SUM(amount) AS revenue,
          COUNT(*) AS count
         FROM payment_orders
        WHERE status = 'done'
          AND paid_at >= DATE_SUB(NOW(), INTERVAL 4 WEEK)
        GROUP BY week
        ORDER BY week ASC`
    );

    return res.json({
      success: true,
      data: {
        total_users,
        total_instructors,
        total_students,
        total_courses,
        total_reviews,
        total_revenue,
        monthly_revenue: monthlyRevenue,
      },
    });
  } catch (err) {
    console.error("[getStats]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 전체 후기 목록 ────────────────────────────────────────────
const getAllReviews = async (_req, res) => {
  try {
    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.content, r.created_at,
              u.nickname  AS reviewer_nickname,
              c.title     AS course_title,
              c.id        AS course_id
         FROM reviews r
         JOIN users u   ON u.id = r.user_id
         JOIN courses c ON c.id = r.course_id
        ORDER BY r.created_at DESC`
    );
    return res.json({ success: true, data: reviews });
  } catch (err) {
    console.error("[getAllReviews]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 후기 삭제 (관리자) ────────────────────────────────────────
const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  try {
    const [[review]] = await db.query("SELECT id FROM reviews WHERE id = ?", [reviewId]);
    if (!review) return res.status(404).json({ success: false, message: "후기를 찾을 수 없습니다." });

    await db.query("DELETE FROM reviews WHERE id = ?", [reviewId]);
    return res.json({ success: true, message: "후기가 삭제되었습니다." });
  } catch (err) {
    console.error("[deleteReview]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

module.exports = { getUsers, getStats, getAllReviews, deleteReview };