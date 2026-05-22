const router = require("express").Router();
const { getMyNotifications, markAsRead, markAllAsRead } = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

router.get("/", getMyNotifications);
router.patch("/:id/read", markAsRead);
router.patch("/read-all", markAllAsRead);

module.exports = router;
