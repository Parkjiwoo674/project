const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
const db     = require("../config/db");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = (pwd) =>
  pwd.length >= 8 && /[a-zA-Z]/.test(pwd) && /[0-9]/.test(pwd);

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

// ── 회원가입 ────────────────────────────────────────────────
const signup = async (req, res) => {
  const { name, nickname, email, password, role = "user", adminCode } = req.body;

  if (!name?.trim() || !nickname?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ success: false, message: "모든 필드를 입력해 주세요." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, message: "올바른 이메일 형식이 아닙니다." });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ success: false, message: "비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다." });
  }

  let finalRole = role;
  if (adminCode) {
    if (adminCode !== process.env.ADMIN_SECRET_CODE) {
      return res.status(400).json({ success: false, message: "관리자 코드가 올바르지 않습니다." });
    }
    finalRole = "admin";
  }

  const allowedRoles = ["user", "instructor", "admin"];
  if (!allowedRoles.includes(finalRole)) {
    return res.status(400).json({ success: false, message: "올바른 역할을 선택해 주세요." });
  }

  try {
    const [rows] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (rows.length > 0) {
      return res.status(409).json({ success: false, message: "이미 사용 중인 이메일입니다." });
    }

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query(
      "INSERT INTO users (name, nickname, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
      [name, nickname, email, hash, finalRole]
    );

    const userId = result.insertId;
    const user   = { id: userId, email, role: finalRole };
    const token  = signToken(user);

    // ✅ 강사 가입 시 user_id 포함 등록
    if (finalRole === "instructor") {
      await db.query(
        "INSERT INTO instructors (name, bio, user_id) VALUES (?, ?, ?)",
        [name, "", userId]
      );
    }

    return res.status(201).json({
      success: true,
      message: "회원가입이 완료되었습니다.",
      token,
      user: { id: userId, name, nickname, email, role: finalRole },
    });
  } catch (err) {
    console.error("[signup]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 로그인 ──────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "이메일과 비밀번호를 입력해 주세요." });
  }

  try {
    const [rows] = await db.query(
  `SELECT u.id, u.name, u.nickname, u.email, u.password_hash, u.role,
          COALESCE(i.avatar_url, u.avatar_url) AS avatar_url
     FROM users u
LEFT JOIN instructors i ON i.user_id = u.id
    WHERE u.email = ?`,
  [email]
);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    }

    const token = signToken(user);

    return res.json({
  success: true,
  token,
  user: { id: user.id, name: user.name, nickname: user.nickname, email: user.email, role: user.role, avatar_url: user.avatar_url },
});
  } catch (err) {
    console.error("[login]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 내 정보 조회 ────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.name, u.nickname, u.email, u.role, u.avatar_url, u.created_at,
              i.avatar_url AS instructor_avatar_url
         FROM users u
    LEFT JOIN instructors i ON i.user_id = u.id
        WHERE u.id = ?`,
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: "사용자를 찾을 수 없습니다." });

    const user = rows[0];
    if (user.role === "instructor" && user.instructor_avatar_url) {
      user.avatar_url = user.instructor_avatar_url;
    }
    delete user.instructor_avatar_url;

    return res.json({ success: true, data: user });
  } catch (err) {
    console.error("[getMe]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

module.exports = { signup, login, getMe };