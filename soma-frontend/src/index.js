require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const authRoutes            = require("./routes/auth");
const courseRoutes          = require("./routes/courses");
const enrollmentRoutes      = require("./routes/enrollments");
const progressRoutes        = require("./routes/progress");
const reviewRoutes          = require("./routes/reviews");
const qnaRoutes             = require("./routes/qna");
const instructorRoutes      = require("./routes/instructors");
const wishlistRoutes        = require("./routes/wishlist");
const instructorCourseRoutes = require("./routes/instructorCourses");
const uploadRoutes          = require("./routes/upload");
const paymentRoutes         = require("./routes/payment");
const userRoutes            = require("./routes/user");
const bestReviewRoutes      = require("./routes/bestreviews");
const adminRoutes           = require("./routes/admin");
const notificationRoutes    = require("./routes/notifications");

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",")
    : ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use("/api/auth",                    authRoutes);
app.use("/api/courses",                 courseRoutes);
app.use("/api/courses/:courseId/reviews", reviewRoutes);
app.use("/api/courses/:courseId/qna",   qnaRoutes);
app.use("/api/enrollments",             enrollmentRoutes);
app.use("/api/progress",                progressRoutes);
app.use("/api/instructors",             instructorRoutes);
app.use("/api/wishlist",                wishlistRoutes);
app.use("/api/instructor/courses",      instructorCourseRoutes);
app.use("/api/upload",                  uploadRoutes);
app.use("/api/payment",                 paymentRoutes);
app.use("/api/user",                    userRoutes);
app.use("/api/reviews/best",            bestReviewRoutes);
app.use("/api/admin",                   adminRoutes);
app.use("/api/notifications",           notificationRoutes);

// 업로드된 파일 정적 서빙
const path = require("path");
app.use("/uploads", require("express").static(path.join(__dirname, "../uploads")));

app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date() }));
app.use((_req, res) => res.status(404).json({ success: false, message: "요청한 경로를 찾을 수 없습니다." }));
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err);
  res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
});

app.listen(PORT, () => {
  console.log(`🧘 SOMA API 서버 실행 중 → http://localhost:${PORT}`);
});
