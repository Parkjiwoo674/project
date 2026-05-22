const db = require("../config/db");

const getMyProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT name, nickname, avatar_url FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });
    return res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("[getMyProfile]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

const updateMyProfile = async (req, res) => {
  const { nickname, avatar_url } = req.body;
  if (!nickname?.trim()) {
    return res.status(400).json({ success: false, message: "닉네임을 입력해주세요." });
  }
  try {
    await db.query(
      "UPDATE users SET nickname = ?, avatar_url = ? WHERE id = ?",
      [nickname.trim(), avatar_url ?? null, req.user.id]
    );
    return res.json({ success: true, message: "프로필이 저장되었습니다." });
  } catch (err) {
    console.error("[updateMyProfile]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

module.exports = { getMyProfile, updateMyProfile };