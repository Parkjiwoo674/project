const router = require("express").Router();
const { requireAdmin } = require("../middleware/admin");
const { getUsers, getStats, getAllReviews, deleteReview } = require("../controllers/adminController");

router.get("/users",              requireAdmin, getUsers);
router.get("/stats",              requireAdmin, getStats);
router.get("/reviews",            requireAdmin, getAllReviews);
router.delete("/reviews/:reviewId", requireAdmin, deleteReview);

module.exports = router;