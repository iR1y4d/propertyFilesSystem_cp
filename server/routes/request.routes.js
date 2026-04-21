const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { submitRequestSchema } = require('../validators/requestValidator');
const { createUpload } = require('../middleware/uploadMiddleware');
const { ROLES } = require('../config/constants');
const path = require('path');

// Apply auth to all routes
router.use(authMiddleware);

// Temporary destination for employee uploads — files will be renamed after request is created
const tempUploadDest = (req) =>
  path.join(__dirname, '..', 'uploads', 'pending', 'temp-' + Date.now());

// Routes
router.get('/', authorize(ROLES.ADMIN), requestController.listRequests);
router.get('/my', authorize(ROLES.EMPLOYEE), requestController.listMyRequests);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.EMPLOYEE), requestController.getRequest);

// Employee submits a request (with optional image uploads via multipart/form-data)
router.post(
  '/',
  authorize(ROLES.EMPLOYEE),
  createUpload(tempUploadDest),
  requestController.submitRequest
);

// Admin only routes
router.patch('/:id/approve', authorize(ROLES.ADMIN), requestController.approveRequest);
router.patch('/:id/reject', authorize(ROLES.ADMIN), requestController.rejectRequest);

module.exports = router;
