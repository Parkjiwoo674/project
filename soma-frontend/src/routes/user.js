const express = require("express");
const router  = express.Router();
const { authenticate } = require("../middleware/auth");
const { getMyProfile, updateMyProfile } = require("../controllers/userController");

router.get("/profile", authenticate, getMyProfile);
router.put("/profile", authenticate, updateMyProfile);

module.exports = router;