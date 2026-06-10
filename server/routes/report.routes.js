const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

// Apply auth
router.use(authMiddleware);

// Property reports (Available to both, but filtered in service)
router.get('/properties/:format', authorize(ROLES.ADMIN, ROLES.EMPLOYEE), reportController.exportProperties);

// Filtered/searched property reports
router.get('/properties-search/:format', authorize(ROLES.ADMIN, ROLES.EMPLOYEE), reportController.exportSearchProperties);

// Log reports (Admin only)
router.get('/logs/:format', authorize(ROLES.ADMIN), reportController.exportLogs);

// Serves static printable forms securely (Available to Admin and Employee)
router.get('/forms/:filename', authorize(ROLES.ADMIN, ROLES.EMPLOYEE), reportController.getFormFile);

module.exports = router;
