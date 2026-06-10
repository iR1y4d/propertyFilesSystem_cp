const userModel = require('../models/userModel');
const logModel = require('../models/logModel');
const { hashPassword } = require('../utils/passwordUtils');
const { LOG_ACTIONS } = require('../config/constants');
const AppError = require('../utils/AppError');

/**
 * List all users
 */
const listUsers = async ({ page = 1, limit = 20 }) => {
  // Parallel query performance optimization (PERF-02)
  const [users, totalCount] = await Promise.all([
    userModel.findAll({ page, limit }),
    userModel.count()
  ]);

  return {
    users,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page, 10),
      limit: parseInt(limit, 10)
    }
  };
};

/**
 * Get user by ID
 */
const getUser = async (id) => {
  const user = await userModel.findById(id);
  if (!user) {
    throw new AppError(404, 'المستخدم غير موجود');
  }
  return user;
};

/**
 * Create user
 */
const createUser = async (adminUserId, data) => {
  // Check if username unique
  const existing = await userModel.findByUsername(data.username);
  if (existing) {
    throw new AppError(409, 'اسم المستخدم موجود مسبقاً');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);
  
  const user = await userModel.create({
    ...data,
    passwordHash
  });

  // Log action
  await logModel.createLog({
    userId: adminUserId,
    action: LOG_ACTIONS.ADD,
    target: `User: ${user.username}`
  });

  return user;
};

/**
 * Update user
 */
const updateUser = async (adminUserId, userId, data) => {
  const user = await userModel.update(userId, data);
  if (!user) {
    throw new AppError(404, 'المستخدم غير موجود');
  }

  // Log action
  await logModel.createLog({
    userId: adminUserId,
    action: LOG_ACTIONS.EDIT,
    target: `User: ${user.username}`
  });

  return user;
};

/**
 * Delete user (soft delete)
 */
const deleteUser = async (adminUserId, userId) => {
  if (String(adminUserId) === String(userId)) {
    throw new AppError(400, 'لا يمكنك حذف حسابك الخاص');
  }
  const user = await userModel.softDelete(userId);
  if (!user) {
    throw new AppError(404, 'المستخدم غير موجود');
  }

  // Log action
  await logModel.createLog({
    userId: adminUserId,
    action: LOG_ACTIONS.DELETE,
    target: `User ID: ${userId}`
  });

  return { success: true, message: 'تم حذف المستخدم بنجاح' };
};

/**
 * Reset password
 */
const resetPassword = async (adminUserId, userId, newPassword) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new AppError(404, 'المستخدم غير موجود');
  }

  const passwordHash = await hashPassword(newPassword);
  await userModel.resetPassword(userId, passwordHash);

  // Log action
  await logModel.createLog({
    userId: adminUserId,
    action: LOG_ACTIONS.EDIT,
    target: `Password reset for: ${user.username}`
  });

  return { success: true, message: 'تم إعادة تعيين كلمة المرور بنجاح' };
};

/**
 * Unlock account
 */
const unlockAccount = async (adminUserId, userId) => {
  const result = await userModel.unlockAccount(userId);
  if (!result) {
    throw new AppError(404, 'المستخدم غير موجود');
  }

  // Log action
  await logModel.createLog({
    userId: adminUserId,
    action: LOG_ACTIONS.EDIT,
    target: `Unlocked account ID: ${userId}`
  });

  return { success: true, message: 'تم إلغاء قفل الحساب بنجاح' };
};

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  unlockAccount
};
