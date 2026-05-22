// src/routes/auth.js
const router = require("express").Router();
const { signup, login, getMe } = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");

router.post("/signup", signup);
router.post("/login",  login);
router.get ("/me",     authenticate, getMe);

module.exports = router;
