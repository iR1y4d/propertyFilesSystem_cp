const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createPropertySchema, updatePropertySchema } = require('../validators/propertyValidator');
const { ROLES } = require('../config/constants');

const pagination = require('../middleware/pagination');

// Apply auth to all routes
router.use(authMiddleware);

// List properties (Admin, Employee and Department Head)
router.get('/', authorize(ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD), pagination, propertyController.listProperties);

// Search properties (Logged)
router.get('/search', authorize(ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD), pagination, propertyController.searchProperties);

// Get property detail (Admin, Employee and Department Head)
router.get('/:fileNumber', authorize(ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD), propertyController.getProperty);

// Direct property modification (Admin and Department Head)
router.post('/', authorize(ROLES.ADMIN, ROLES.DEPARTMENT_HEAD), validate(createPropertySchema), propertyController.createProperty);
router.put('/:fileNumber', authorize(ROLES.ADMIN, ROLES.DEPARTMENT_HEAD), validate(updatePropertySchema), propertyController.updateProperty);
router.delete('/:fileNumber', authorize(ROLES.ADMIN, ROLES.DEPARTMENT_HEAD), propertyController.deleteProperty);

module.exports = router;
