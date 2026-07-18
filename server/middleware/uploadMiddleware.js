const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 20; // 20 files

/**
 * Create multer upload middleware for a given destination resolver.
 * @param {function} destinationResolver - (req) => string (folder path)
 */
const createUpload = (destinationResolver) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Cache the resolved destination per request so all files in a
      // single upload go to the same directory (the resolver may use
      // Date.now() which would differ between per-file invocations).
      if (!req._uploadDest) {
        req._uploadDest = destinationResolver(req);
      }
      const dest = req._uploadDest;
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      // Strip path components, keep only the base filename and sanitize it
      const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._\u0600-\u06FF-]/g, '_');
      const uniqueName = `${Date.now()}-${safeName}`;
      cb(null, uniqueName);
    }
  });

  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    if (ALLOWED_TYPES.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. يُسمح فقط بـ JPG, PNG, WEBP'), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE }
  }).array('images', MAX_FILES);
};

module.exports = { createUpload, MAX_FILES, MAX_FILE_SIZE };
