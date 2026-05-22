const router = require("express").Router();
const { getCourses, getCourseById } = require("../controllers/courseController");
const { optionalAuth } = require("../middleware/auth");

router.get("/",    getCourses);
router.get("/:id", optionalAuth, getCourseById);   // 로그인 시 수강 여부 포함

module.exports = router;
