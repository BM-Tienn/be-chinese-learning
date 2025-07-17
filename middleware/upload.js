const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// File upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dir = 'uploads';
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedTypes.includes(ext));
  }
});

module.exports = upload; 