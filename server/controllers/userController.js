const userService = require('../services/userService');

/**
 * List all users
 */
const listUsers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await userService.listUsers({ page, limit });
    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination,
      message: 'تم جلب قائمة المستخدمين بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single user
 */
const getUser = async (req, res, next) => {
  try {
    const user = await userService.getUser(req.params.id);
    res.json({
      success: true,
      data: user,
      message: 'تم جلب بيانات المستخدم بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create user
 */
const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.user.userId, req.body);
    res.status(201).json({
      success: true,
      data: user,
      message: 'تم إنشاء المستخدم بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update user
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.user.userId, req.params.id, req.body);
    res.json({
      success: true,
      data: user,
      message: 'تم تحديث بيانات المستخدم بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete user
 */
const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.user.userId, req.params.id);
    res.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Reset password
 */
const resetPassword = async (req, res, next) => {
  try {
    const result = await userService.resetPassword(req.user.userId, req.params.id, req.body.password);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Unlock account
 */
const unlockAccount = async (req, res, next) => {
  try {
    const result = await userService.unlockAccount(req.user.userId, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Change own password (self-service, public endpoint from Login UI)
 */
const changePassword = async (req, res, next) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const result = await userService.changePassword(username, currentPassword, newPassword);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
  unlockAccount,
  changePassword
};
