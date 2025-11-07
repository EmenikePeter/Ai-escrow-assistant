import express from "express";
import multer from "multer";
import path from "path";

const router = express.Router();

// store files in "uploads/"
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// POST /upload/file
router.post("/file", upload.single("file"), (req, res) => {
  if (!req.file) {
    console.error('[UPLOAD] No file uploaded. req.body:', req.body, 'req.files:', req.files, 'req.file:', req.file);
    return res.status(400).json({ error: "No file uploaded" });
  }
  console.log(`[UPLOAD] File received:`, {
    originalname: req.file.originalname,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
  res.json({
    fileUrl: `/uploads/${req.file.filename}`,
    fileType: req.file.mimetype.startsWith("image") ? "image" : "file",
  });
});

export default router;
