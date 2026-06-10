const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

const pagination = require('../middleware/pagination');

// Admin only module
router.get('/', authMiddleware, authorize(ROLES.ADMIN), pagination, logController.listLogs);

module.exports = router;
