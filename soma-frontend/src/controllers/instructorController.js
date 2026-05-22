const db = require("../config/db");

// ── 강사 목록 조회 ───────────────────────────────────────────
const getInstructors = async (req, res) => {
  try {
    const [instructors] = await db.query(
      `SELECT i.id, i.name, i.bio, i.avatar_url, i.certifications,
              COUNT(DISTINCT c.id)  AS course_count,
              COUNT(DISTINCT e.user_id)  AS student_count,
              ROUND(AVG(r.rating), 1) AS avg_rating
         FROM instructors i
    LEFT JOIN courses c     ON c.instructor_id = i.id AND c.is_published = 1
    LEFT JOIN enrollments e ON e.course_id = c.id
    LEFT JOIN reviews r     ON r.course_id = c.id
        GROUP BY i.id
        ORDER BY student_count DESC`
    );
    return res.json({ success: true, data: instructors });
  } catch (err) {
    console.error("[getInstructors]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 강사 상세 + 강의 목록 ────────────────────────────────────
const getInstructorById = async (req, res) => {
  const { id } = req.params;
  try {
    const [[instructor]] = await db.query(
      `SELECT i.id, i.name, i.bio, i.avatar_url, i.certifications,
              COUNT(DISTINCT c.id)  AS course_count,
              COUNT(DISTINCT e.user_id)  AS student_count,
              ROUND(AVG(r.rating), 1) AS avg_rating
         FROM instructors i
    LEFT JOIN courses c     ON c.instructor_id = i.id AND c.is_published = 1
    LEFT JOIN enrollments e ON e.course_id = c.id
    LEFT JOIN reviews r     ON r.course_id = c.id
        WHERE i.id = ?
        GROUP BY i.id`,
      [id]
    );

    if (!instructor) {
      return res.status(404).json({ success: false, message: "강사를 찾을 수 없습니다." });
    }

    const [courses] = await db.query(
      `SELECT c.id, c.title, c.level, c.price, c.thumbnail_url,
              COUNT(DISTINCT l.id)       AS lecture_count,
              ROUND(AVG(r.rating), 1)    AS avg_rating,
              COUNT(DISTINCT e.user_id)       AS enrollment_count
         FROM courses c
    LEFT JOIN lectures    l ON l.course_id = c.id
    LEFT JOIN reviews     r ON r.course_id = c.id
    LEFT JOIN enrollments e ON e.course_id = c.id
        WHERE c.instructor_id = ? AND c.is_published = 1
        GROUP BY c.id`,
      [id]
    );

    return res.json({ success: true, data: { ...instructor, courses } });
  } catch (err) {
    console.error("[getInstructorById]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

module.exports = { getInstructors, getInstructorById };