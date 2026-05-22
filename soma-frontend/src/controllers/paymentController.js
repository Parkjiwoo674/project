const axios = require("axios");
const db    = require("../config/db");

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || "test_sk_demo_key";
const TOSS_API_URL    = "https://api.tosspayments.com/v1/payments";

// Base64 인코딩 (Toss 인증)
const tossAuth = () =>
  "Basic " + Buffer.from(TOSS_SECRET_KEY + ":").toString("base64");

// ── 결제 준비 (주문 생성) ────────────────────────────────────
const preparePayment = async (req, res) => {
  const userId   = req.user.id;
  const courseId = Number(req.params.courseId);

  try {
    const [[course]] = await db.query(
      "SELECT id, title, price FROM courses WHERE id = ? AND is_published = 1",
      [courseId]
    );
    if (!course) {
      return res.status(404).json({ success: false, message: "강의를 찾을 수 없습니다." });
    }

    // 이미 수강 중인지 확인
    const [[existing]] = await db.query(
      "SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?",
      [userId, courseId]
    );
    if (existing) {
      return res.status(409).json({ success: false, message: "이미 수강 신청한 강의입니다." });
    }

    // 주문 ID 생성 (고유값)
    const orderId = `SOMA-${userId}-${courseId}-${Date.now()}`;

    // 주문 임시 저장
    await db.query(
      `INSERT INTO payment_orders (order_id, user_id, course_id, amount, status)
       VALUES (?, ?, ?, ?, 'pending')
       ON DUPLICATE KEY UPDATE amount = VALUES(amount), status = 'pending'`,
      [orderId, userId, courseId, course.price]
    );

    return res.json({
      success: true,
      data: {
        orderId,
        orderName: course.title,
        amount:    course.price,
        customerName: req.user.email,
      },
    });
  } catch (err) {
    console.error("[preparePayment]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 결제 승인 (Toss 콜백) ────────────────────────────────────
const confirmPayment = async (req, res) => {
  const { paymentKey, orderId, amount } = req.body;
  const userId = req.user.id;

  if (!paymentKey || !orderId || !amount) {
    return res.status(400).json({ success: false, message: "결제 정보가 올바르지 않습니다." });
  }

  try {
    const [[order]] = await db.query(
      "SELECT * FROM payment_orders WHERE order_id = ? AND user_id = ?",
      [orderId, userId]
    );
    if (!order) {
      return res.status(404).json({ success: false, message: "주문 정보를 찾을 수 없습니다." });
    }
    if (order.status === "done") {
      return res.json({ success: true, message: "이미 처리된 결제입니다.", data: { paymentKey, orderId, amount: order.amount, method: "" } });
    }
    if (order.status !== "pending") {
      return res.status(400).json({ success: false, message: "처리할 수 없는 주문입니다." });
    }

    // 금액 위변조 검증
    if (Number(order.amount) !== Number(amount)) {
      return res.status(400).json({ success: false, message: "결제 금액이 일치하지 않습니다." });
    }

    // Toss 결제 승인 API 호출
    const tossRes = await axios.post(
      `${TOSS_API_URL}/confirm`,
      { paymentKey, orderId, amount: Number(amount) },
      {
        headers: {
          Authorization: tossAuth(),
          "Content-Type": "application/json",
        },
      }
    );

    const payment = tossRes.data;

    // 트랜잭션: 결제 완료 + 수강 신청
    await db.query("START TRANSACTION");
    try {
      // 결제 상태 업데이트
      await db.query(
        "UPDATE payment_orders SET status = 'done', payment_key = ?, paid_at = NOW() WHERE order_id = ?",
        [paymentKey, orderId]
      );

      // 수강 신청 등록
      await db.query(
        "INSERT INTO enrollments (user_id, course_id, paid_price) VALUES (?, ?, ?)",
        [userId, order.course_id, order.amount]
      );

      await db.query("COMMIT");
    } catch (txErr) {
      await db.query("ROLLBACK");
      throw txErr;
    }

    return res.json({
      success: true,
      message: "결제가 완료되었습니다.",
      data: {
        paymentKey: payment.paymentKey,
        orderId:    payment.orderId,
        amount:     payment.totalAmount,
        method:     payment.method,
      },
    });
  } catch (err) {
    // Toss API 에러 처리
    if (err.response?.data) {
      const { code, message } = err.response.data;
      console.error("[confirmPayment] Toss error:", code, message);
      return res.status(400).json({ success: false, message: message || "결제에 실패했습니다." });
    }
    console.error("[confirmPayment]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 결제 취소 (환불) ─────────────────────────────────────────
const cancelPayment = async (req, res) => {
  const userId   = req.user.id;
  const courseId = Number(req.params.courseId);
  const { cancelReason = "수강 취소" } = req.body;

  try {
    // 결제 내역 조회
    const [[order]] = await db.query(
      "SELECT * FROM payment_orders WHERE user_id = ? AND course_id = ? AND status = 'done'",
      [userId, courseId]
    );
    if (!order) {
      // 결제 없이 수강 신청한 경우 (무료 강의 등) 그냥 취소
      await db.query("DELETE FROM enrollments WHERE user_id = ? AND course_id = ?", [userId, courseId]);
      await db.query(
        `DELETE FROM progress WHERE user_id = ? AND lecture_id IN (SELECT id FROM lectures WHERE course_id = ?)`,
        [userId, courseId]
      );
      return res.json({ success: true, message: "수강이 취소되었습니다." });
    }

    // Toss 결제 취소 API 호출
    await axios.post(
      `${TOSS_API_URL}/${order.payment_key}/cancel`,
      { cancelReason },
      { headers: { Authorization: tossAuth(), "Content-Type": "application/json" } }
    );

    // 트랜잭션: 환불 + 수강 취소
    await db.query("START TRANSACTION");
    try {
      await db.query(
        "UPDATE payment_orders SET status = 'canceled' WHERE order_id = ?",
        [order.order_id]
      );
      await db.query("DELETE FROM enrollments WHERE user_id = ? AND course_id = ?", [userId, courseId]);
      await db.query(
        `DELETE FROM progress WHERE user_id = ? AND lecture_id IN (SELECT id FROM lectures WHERE course_id = ?)`,
        [userId, courseId]
      );
      await db.query("COMMIT");
    } catch (txErr) {
      await db.query("ROLLBACK");
      throw txErr;
    }

    return res.json({ success: true, message: "결제가 취소되고 환불이 처리되었습니다." });
  } catch (err) {
    if (err.response?.data) {
      const { message } = err.response.data;
      return res.status(400).json({ success: false, message: message || "환불에 실패했습니다." });
    }
    console.error("[cancelPayment]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

// ── 내 결제 내역 조회 ────────────────────────────────────────
const getMyPayments = async (req, res) => {
  const userId = req.user.id;
  try {
    const [payments] = await db.query(
      `SELECT po.order_id, po.amount, po.status, po.paid_at,
              c.title AS course_title, c.id AS course_id
         FROM payment_orders po
         JOIN courses c ON c.id = po.course_id
        WHERE po.user_id = ?
        ORDER BY po.paid_at DESC`,
      [userId]
    );
    return res.json({ success: true, data: payments });
  } catch (err) {
    console.error("[getMyPayments]", err);
    return res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};

module.exports = { preparePayment, confirmPayment, cancelPayment, getMyPayments };
