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

const pagination = require('../middleware/pagination');

// Routes
router.get('/', authorize(ROLES.ADMIN), pagination, requestController.listRequests);
router.get('/my', authorize(ROLES.EMPLOYEE), pagination, requestController.listMyRequests);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.EMPLOYEE), requestController.getRequest);

// Employee submits a request (with optional image uploads via multipart/form-data)
router.post(
  '/',
  authorize(ROLES.EMPLOYEE),
  createUpload(tempUploadDest),
  // Parse string fields from multipart before Zod validation
  (req, res, next) => {
    if (typeof req.body.propertyFileNumber === 'string') {
      req.body.propertyFileNumber = parseInt(req.body.propertyFileNumber, 10);
    }
    if (typeof req.body.newData === 'string') {
      try {
        req.body.newData = JSON.parse(req.body.newData);
      } catch (e) {
        // Let Zod validation handle the malformed JSON
      }
    }
    next();
  },
  validate(submitRequestSchema),
  requestController.submitRequest
);

// Admin only routes
router.patch('/:id/approve', authorize(ROLES.ADMIN), requestController.approveRequest);
router.patch('/:id/reject', authorize(ROLES.ADMIN), requestController.rejectRequest);

// Cleanup middleware for errors during request creation
router.use((err, req, res, next) => {
  if (req.files && req.files.length > 0) {
    const tempDir = req.files[0].destination;
    const fs = require('fs');
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (rmErr) {
        console.error('Failed to cleanup temp upload directory:', rmErr);
      }
    }
  }
  next(err);
});

module.exports = router;
