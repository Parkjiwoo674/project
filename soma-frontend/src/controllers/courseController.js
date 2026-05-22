const db = require("../config/db");

// ── 강의 목록 조회 ──────────────────────────────────────────
const getCourses = async (req, res) => {
  const { level, category_id, is_live, search, page = 1, limit = 12 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    const conditions = ["c.is_published = 1"];
    const params     = [];

    if (level)       { conditions.push("c.level = ?");       params.push(level); }
    if (category_id) { conditions.push("c.category_id = ?"); params.push(category_id); }
    if (is_live !== undefined) {
      conditions.push("c.is_live = ?");
      params.push(is_live === "true" ? 1 : 0);
    }
    if (search) { conditions.push("c.title LIKE ?"); params.push(`%${search}%`); }

    const where = conditions.join(" AND ");

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM courses c WHERE ${where}`,
      params
    );

    const [courses] = await db.query(
      `SELECT
          c.id,
          c.title,
          c.description,
          c.level,
          c.duration_weeks,
          c.price,
          c.is_live,
          c.thumbnail_url,
          i.name                        AS instructor_name,
          i.avatar_url                  AS instructor_avatar,
          cat.name                      AS category,
          COUNT(DISTINCT l.id)          AS lecture_count,
          ROUND(COALESCE(SUM(DISTINCT l.duration_sec) / 3600, 0), 1) AS total_hours,
          ROUND(AVG(r.rating), 1)       AS avg_rating,
          COUNT(DISTINCT e.user_id)          AS enrollment_count
       FROM courses c
       JOIN instructors i   ON i.id   = c.instructor_id
       JOIN categories  cat ON cat.id = c.category_id
  LEFT JOIN lectures   l   ON l.course_id = c.id
  LEFT JOIN reviews    r   ON r.course_id = c.id
  LEFT JOIN enrollments e  ON e.course_id = c.id
      WHERE ${where}
   GROUP BY c.id
   ORDER BY enrollment_count DESC
      LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    return res.json({
      success: true,
      data: courses,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[getCourses]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 강의 상세 조회 ──────────────────────────────────────────
const getCourseById = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  try {
    const [[course]] = await db.query(
      `SELECT
          c.id, c.title, c.description, c.level, c.duration_weeks,
          c.price, c.is_live, c.thumbnail_url, c.instructor_id,
          i.name            AS instructor_name,
          i.bio             AS instructor_bio,
          i.avatar_url      AS instructor_avatar,
          i.certifications  AS instructor_certifications,
          cat.name     AS category,
          COUNT(DISTINCT l.id)          AS lecture_count,
          ROUND(COALESCE(SUM(DISTINCT l.duration_sec) / 3600, 0), 1) AS total_hours,
          ROUND(AVG(r.rating), 1)       AS avg_rating,
          COUNT(DISTINCT r.id)          AS review_count,
          COUNT(DISTINCT e.user_id)          AS enrollment_count
       FROM courses c
       JOIN instructors i   ON i.id   = c.instructor_id
       JOIN categories  cat ON cat.id = c.category_id
  LEFT JOIN lectures   l   ON l.course_id = c.id
  LEFT JOIN reviews    r   ON r.course_id = c.id
  LEFT JOIN enrollments e  ON e.course_id = c.id
      WHERE c.id = ? AND c.is_published = 1
   GROUP BY c.id`,
      [id]
    );

    if (!course) {
      return res.status(404).json({ success: false, message: "강의를 찾을 수 없습니다." });
    }

    // 커리큘럼 (video_url 포함)
    const [lectures] = await db.query(
      `SELECT id, week, sort_order, title, duration_sec, is_preview, video_url
         FROM lectures
        WHERE course_id = ?
        ORDER BY week, sort_order`,
      [id]
    );

    const curriculum = lectures.reduce((acc, lec) => {
      if (!acc[lec.week]) acc[lec.week] = [];
      acc[lec.week].push(lec);
      return acc;
    }, {});

    // 리뷰 (최신 10개)
    const [reviews] = await db.query(
      `SELECT r.id, r.rating, r.content, r.created_at,
              u.nickname AS reviewer_nickname,
              u.avatar_url AS reviewer_avatar
         FROM reviews r
         JOIN users u ON u.id = r.user_id
        WHERE r.course_id = ?
        ORDER BY r.created_at DESC
        LIMIT 10`,
      [id]
    );

    let isEnrolled = false;
    let isWishlisted = false;
    if (userId) {
      const [[enroll]] = await db.query(
        "SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?",
        [userId, id]
      );
      const [[wish]] = await db.query(
        "SELECT 1 FROM wishlists WHERE user_id = ? AND course_id = ?",
        [userId, id]
      );
      isEnrolled   = !!enroll;
      isWishlisted = !!wish;
    }

    return res.json({
      success: true,
      data: { ...course, curriculum, reviews, isEnrolled, isWishlisted },
    });
  } catch (err) {
    console.error("[getCourseById]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

module.exports = { getCourses, getCourseById };