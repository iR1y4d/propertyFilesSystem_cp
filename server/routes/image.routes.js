const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

// Apply auth to all routes
router.use(authMiddleware);

// Get all images for a property (scans filesystem)
router.get(
  '/properties/:fileNumber/images',
  authorize(ROLES.ADMIN, ROLES.EMPLOYEE),
  imageController.getImages
);

module.exports = router;
