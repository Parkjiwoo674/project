const router = require("express").Router();
const { getBestReviews } = require("../controllers/reviewController");

router.get("/", getBestReviews);

module.exports = router;