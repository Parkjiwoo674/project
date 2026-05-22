const router = require("express").Router();
const { saveProgress, getMyProgress } = require("../controllers/progressController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.post("/:lectureId", saveProgress);  // 진도 저장
router.get ("/",           getMyProgress); // 내 진도 전체 조회

module.exports = router;
