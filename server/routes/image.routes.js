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
  authorize(ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD),
  imageController.getImages
);

// Upload images for a property (Admin and Department Head)
router.post(
  '/properties/:fileNumber/images',
  authorize(ROLES.ADMIN, ROLES.DEPARTMENT_HEAD),
  createUpload(propertyUploadDest),
  imageController.uploadImages
);

// Delete a single image from a property (Admin and Department Head)
router.delete(
  '/properties/:fileNumber/images/:filename',
  authorize(ROLES.ADMIN, ROLES.DEPARTMENT_HEAD),
  imageController.deleteImage
);

// Get pending images for a request (Admin and Department Head review, employee self-view)
router.get(
  '/requests/:id/images',
  authorize(ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD),
  imageController.getPendingImages
);

module.exports = router;
