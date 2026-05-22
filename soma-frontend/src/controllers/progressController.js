const db = require("../config/db");

// ── 진도 저장 (upsert) ───────────────────────────────────────
const saveProgress = async (req, res) => {
  const userId    = req.user.id;
  const lectureId = Number(req.params.lectureId);
  const { watched_sec = 0, is_completed = 0 } = req.body;

  // ✅ 유효성 검사
  if (!lectureId || lectureId === 0) {
    return res.status(400).json({ success: false, message: "유효하지 않은 강의 ID입니다." });
  }

  try {
    // ✅ lecture_id가 실제로 존재하는지 확인
    const [[lecture]] = await db.query("SELECT id FROM lectures WHERE id = ?", [lectureId]);
    if (!lecture) {
      return res.status(404).json({ success: false, message: "강의를 찾을 수 없습니다." });
    }

    await db.query(
      `INSERT INTO progress (user_id, lecture_id, watched_sec, is_completed)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         watched_sec  = VALUES(watched_sec),
         is_completed = VALUES(is_completed),
         last_watched = CURRENT_TIMESTAMP`,
      [userId, lectureId, watched_sec, is_completed ? 1 : 0]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("[saveProgress]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 내 진도 전체 조회 ────────────────────────────────────────
const getMyProgress = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.query(
      `SELECT lecture_id, watched_sec, is_completed, last_watched
         FROM progress
        WHERE user_id = ?`,
      [userId]
    );
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error("[getMyProgress]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

module.exports = { saveProgress, getMyProgress };
