const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES = 500;

/**
 * Create multer upload middleware for a given destination resolver.
 * @param {function} destinationResolver - (req) => string (folder path)
 */
const createUpload = (destinationResolver) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = destinationResolver(req);
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      // Preserve original name, add timestamp prefix to avoid collisions
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    }
  });

  const fileFilter = (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. يُسمح فقط بـ JPG, PNG, WEBP'), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES }
  }).array('images', MAX_FILES);
};

module.exports = { createUpload, MAX_FILES, MAX_FILE_SIZE };
