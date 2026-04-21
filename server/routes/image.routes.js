const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { createUpload } = require('../middleware/uploadMiddleware');
const { ROLES } = require('../config/constants');
const path = require('path');

// Apply auth to all routes
router.use(authMiddleware);

// Destination resolver for admin direct upload to properties folder
const propertyUploadDest = (req) =>
  path.join(__dirname, '..', 'uploads', 'properties', String(req.params.fileNumber));

// Get all images for a property (scans filesystem)
router.get(
  '/properties/:fileNumber/images',
  authorize(ROLES.ADMIN, ROLES.EMPLOYEE),
  imageController.getImages
);

// Upload images for a property (Admin only)
router.post(
  '/properties/:fileNumber/images',
  authorize(ROLES.ADMIN),
  createUpload(propertyUploadDest),
  imageController.uploadImages
);

// Delete a single image from a property (Admin only)
router.delete(
  '/properties/:fileNumber/images/:filename',
  authorize(ROLES.ADMIN),
  imageController.deleteImage
);

// Get pending images for a request (Admin review)
router.get(
  '/requests/:id/images',
  authorize(ROLES.ADMIN),
  imageController.getPendingImages
);

module.exports = router;
