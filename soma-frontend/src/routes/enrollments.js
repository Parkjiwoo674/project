const router = require("express").Router();
const { enroll, getMyEnrollments, toggleWishlist, cancelEnrollment } = require("../controllers/enrollmentController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.post  ("/:courseId",          enroll);            // 수강 신청
router.get   ("/",                   getMyEnrollments);  // 내 수강 목록
router.post  ("/:courseId/wishlist", toggleWishlist);    // 찜 토글
router.delete("/:courseId",          cancelEnrollment);  // 수강 취소

module.exports = router;
