const jwt = require("jsonwebtoken");

/**
 * 인증 미들웨어 — Authorization: Bearer <token> 헤더 검증
 */
const authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "인증 토큰이 없습니다." });
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;   // { id, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "유효하지 않은 토큰입니다." });
  }
};

/**
 * 선택적 인증 — 토큰 있으면 req.user 세팅, 없어도 통과
 */
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    } catch (_) {}
  }
  next();
};

module.exports = { authenticate, optionalAuth };
