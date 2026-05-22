const router   = require("express").Router();
const multer   = require("multer");
const path     = require("path");
const fs       = require("fs");
const axios    = require("axios");
const FormData = require("form-data");
const { authenticate } = require("../middleware/auth");

// 업로드 폴더 생성
const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("이미지 파일만 업로드 가능합니다."));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// remove.bg로 배경 제거
const removeBackground = async (filePath) => {
  try {
    const form = new FormData();
    form.append("image_file", fs.createReadStream(filePath));
    form.append("size", "auto");

    const res = await axios.post("https://api.remove.bg/v1.0/removebg", form, {
      headers: {
        ...form.getHeaders(),
        "X-Api-Key": process.env.REMOVE_BG_API_KEY,
      },
      responseType: "arraybuffer",
    });

    const newPath = filePath.replace(/\.[^.]+$/, ".png");
    fs.writeFileSync(newPath, res.data);
    if (newPath !== filePath) fs.unlinkSync(filePath);

    return newPath;
  } catch (e) {
    console.error("[removeBackground] 실패, 원본 사용:", e.message);
    return filePath;
  }
};

// POST /api/upload/thumbnail — 썸네일, 배경 제거 없이 그냥 업로드
router.post("/thumbnail", authenticate, upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "파일이 없습니다." });
  const url = `/uploads/${req.file.filename}`;
  return res.json({ success: true, data: { url } });
});

// POST /api/upload/avatar — 프로필 사진, 배경 제거 후 업로드
router.post("/avatar", authenticate, upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "파일이 없습니다." });
  const finalPath = await removeBackground(req.file.path);
  const filename  = path.basename(finalPath);
  const url       = `/uploads/${filename}`;
  return res.json({ success: true, data: { url } });
});

module.exports = router;