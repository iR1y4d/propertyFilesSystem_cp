const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const rateLimiter = require('../middleware/rateLimiter');
const { loginSchema } = require('../validators/authValidator');
const { changePasswordSchema } = require('../validators/userValidator');

router.post('/login', rateLimiter, validate(loginSchema), authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.post('/refresh-token', authController.refreshToken);
router.patch('/change-password', rateLimiter, validate(changePasswordSchema), userController.changePassword);

module.exports = router;
