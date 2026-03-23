const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createPropertySchema, updatePropertySchema } = require('../validators/propertyValidator');
const { ROLES } = require('../config/constants');

// Apply auth to all routes
router.use(authMiddleware);

// List properties (Admin and Employee)
router.get('/', authorize(ROLES.ADMIN, ROLES.EMPLOYEE), propertyController.listProperties);

// Search properties (Logged)
router.get('/search', authorize(ROLES.ADMIN, ROLES.EMPLOYEE), propertyController.searchProperties);

// Get property detail (Admin and Employee)
router.get('/:fileNumber', authorize(ROLES.ADMIN, ROLES.EMPLOYEE), propertyController.getProperty);

// Admin only routes
router.post('/', authorize(ROLES.ADMIN), validate(createPropertySchema), propertyController.createProperty);
router.put('/:fileNumber', authorize(ROLES.ADMIN), validate(updatePropertySchema), propertyController.updateProperty);
router.delete('/:fileNumber', authorize(ROLES.ADMIN), propertyController.deleteProperty);

module.exports = router;
