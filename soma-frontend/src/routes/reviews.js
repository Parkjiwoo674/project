const router = require("express").Router({ mergeParams: true });
const { createReview, getReviews, deleteReview } = require("../controllers/reviewController");
const { authenticate } = require("../middleware/auth");

router.get   ("/",           getReviews);
router.post  ("/",           authenticate, createReview);
router.delete("/:reviewId",  authenticate, deleteReview);

module.exports = router;
