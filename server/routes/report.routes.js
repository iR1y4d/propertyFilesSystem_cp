const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { ROLES } = require('../config/constants');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const { propertySearchSchema, logQuerySchema } = require('../validators/queryValidator');

// Apply auth
router.use(authMiddleware);

// Report endpoints rate limiting (SEC-11)
const reportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 reports per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'لقد تجاوزت الحد المسموح به من طلبات التقارير. يرجى الانتظار دقيقة قبل المحاولة مرة أخرى.' }
});

// Property reports (Available to both, but filtered in service)
router.get('/properties/:format', reportLimiter, authorize(ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD), reportController.exportProperties);

// Filtered/searched property reports
router.get('/properties-search/:format', reportLimiter, validate(propertySearchSchema), authorize(ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD), reportController.exportSearchProperties);

// Log reports (Admin only)
router.get('/logs/:format', reportLimiter, validate(logQuerySchema), authorize(ROLES.ADMIN), reportController.exportLogs);

// Serves static printable forms securely (Available to Admin and Employee)
router.get('/forms/:filename', authorize(ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.DEPARTMENT_HEAD), reportController.getFormFile);

module.exports = router;
