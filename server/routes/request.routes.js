const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { submitRequestSchema } = require('../validators/requestValidator');
const { ROLES } = require('../config/constants');

// Apply auth to all routes
router.use(authMiddleware);

// Routes
router.get('/', authorize(ROLES.ADMIN), requestController.listRequests);
router.get('/my', authorize(ROLES.EMPLOYEE), requestController.listMyRequests);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.EMPLOYEE), requestController.getRequest);
router.post('/', authorize(ROLES.EMPLOYEE), validate(submitRequestSchema), requestController.submitRequest);

// Admin only routes
router.patch('/:id/approve', authorize(ROLES.ADMIN), requestController.approveRequest);
router.patch('/:id/reject', authorize(ROLES.ADMIN), requestController.rejectRequest);

module.exports = router;
