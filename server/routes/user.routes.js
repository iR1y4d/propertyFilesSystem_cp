const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { createUserSchema, updateUserSchema, resetPasswordSchema } = require('../validators/userValidator');
const { ROLES } = require('../config/constants');

// Apply auth + admin check to all user management routes
router.use(authMiddleware);
router.use(authorize(ROLES.ADMIN));

const pagination = require('../middleware/pagination');

router.get('/', pagination, userController.listUsers);
router.get('/:id', userController.getUser);
router.post('/', validate(createUserSchema), userController.createUser);
router.put('/:id', validate(updateUserSchema), userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/reset-password', validate(resetPasswordSchema), userController.resetPassword);
router.patch('/:id/unlock', userController.unlockAccount);

module.exports = router;
