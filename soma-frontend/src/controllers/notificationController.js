const db = require("../config/db");

// ── 내 알림 목록 조회 ────────────────────────────────────────
const getMyNotifications = async (req, res) => {
  const userId = req.user.id;
  const { limit = 20 } = req.query;

  try {
    const [notifications] = await db.query(
      `SELECT id, type, title, message, link, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, Number(limit)]
    );

    // 읽지 않은 알림 개수
    const [[{ unreadCount }]] = await db.query(
      "SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = 0",
      [userId]
    );

    return res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (err) {
    console.error("[getMyNotifications]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 알림 읽음 처리 ───────────────────────────────────────────
const markAsRead = async (req, res) => {
  const userId = req.user.id;
  const notificationId = Number(req.params.id);

  try {
    await db.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [notificationId, userId]
    );
    return res.json({ success: true });
  } catch (err) {
    console.error("[markAsRead]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 모든 알림 읽음 처리 ──────────────────────────────────────
const markAllAsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    await db.query("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0", [userId]);
    return res.json({ success: true, message: "모든 알림을 읽음 처리했습니다." });
  } catch (err) {
    console.error("[markAllAsRead]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 알림 생성 (헬퍼 함수) ────────────────────────────────────
const createNotification = async (userId, type, title, message, link = null) => {
  try {
    await db.query(
      "INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)",
      [userId, type, title, message, link]
    );
  } catch (err) {
    console.error("[createNotification]", err);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
};
