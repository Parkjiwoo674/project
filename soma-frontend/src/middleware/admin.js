const { authenticate } = require("./auth");

const requireAdmin = (req, res, next) => {
  authenticate(req, res, () => {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "관리자 권한이 필요합니다." });
    }
    next();
  });
};

module.exports = { requireAdmin };