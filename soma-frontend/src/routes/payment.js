const router = require("express").Router();
const { preparePayment, confirmPayment, cancelPayment, getMyPayments } = require("../controllers/paymentController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.post("/prepare/:courseId", preparePayment);  // 결제 준비
router.post("/confirm",           confirmPayment);  // 결제 승인
router.post("/cancel/:courseId",  cancelPayment);   // 결제 취소 (환불)
router.get ("/",                  getMyPayments);   // 내 결제 내역

module.exports = router;
