const userModel = require('../models/userModel');
const logModel = require('../models/logModel');
const { comparePassword } = require('../utils/passwordUtils');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/tokenUtils');
const { LOG_ACTIONS, MAX_LOGIN_ATTEMPTS } = require('../config/constants');
const AppError = require('../utils/AppError');

/**
 * Handle user login
 */
const login = async (username, password) => {
  const user = await userModel.findByUsername(username);

  if (!user) {
    throw new AppError(401, 'اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  if (user.is_locked) {
    throw new AppError(403, 'هذا الحساب مغلق، يرجى التواصل مع المدير');
  }

  const isPasswordValid = await comparePassword(password, user.password_hash);

  if (!isPasswordValid) {
    const failedAttempts = await userModel.incrementFailedAttempts(user.user_id);
    const count = failedAttempts.rows[0].failed_login_attempts;

    if (count >= MAX_LOGIN_ATTEMPTS) {
      await userModel.lockAccount(user.user_id);
      throw new AppError(403, 'تم إغلاق الحساب بسبب كثرة المحاولات الخاطئة');
    }

    throw new AppError(401, 'اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  // Success: Reset attempts
  await userModel.resetFailedAttempts(user.user_id);

  // Generate tokens
  const payload = { userId: user.user_id, username: user.username, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ userId: user.user_id });

  // Store refresh token hash in database (SEC-02)
  const jwt = require('jsonwebtoken');
  const crypto = require('crypto');
  const refreshTokenModel = require('../models/refreshTokenModel');
  
  const decodedRefresh = jwt.decode(refreshToken);
  const expiresAt = new Date(decodedRefresh.exp * 1000);
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await refreshTokenModel.create(user.user_id, tokenHash, expiresAt);

  // Audit log
  await logModel.createLog({
    userId: user.user_id,
    action: LOG_ACTIONS.LOGIN
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.user_id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    }
  };
};

/**
 * Handle user logout
 */
const logout = async (userId, token) => {
  if (token) {
    const crypto = require('crypto');
    const refreshTokenModel = require('../models/refreshTokenModel');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await refreshTokenModel.revoke(tokenHash);
  }

  await logModel.createLog({
    userId,
    action: LOG_ACTIONS.LOGOUT
  });
};

/**
 * Refresh access token
 */
const refreshAccessToken = async (token) => {
  try {
    const crypto = require('crypto');
    const refreshTokenModel = require('../models/refreshTokenModel');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Check database to see if token is valid and not revoked
    const activeToken = await refreshTokenModel.findActiveByHash(tokenHash);
    if (!activeToken) {
      throw new Error('Refresh token is invalid, expired, or revoked');
    }

    const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);
    const user = await userModel.findById(decoded.userId);

    if (!user || user.is_locked) {
      throw new Error('User not found or locked');
    }

    const payload = { userId: user.user_id, username: user.username, role: user.role };
    const accessToken = generateAccessToken(payload);

    return {
      accessToken,
      user: {
        id: user.user_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    };
  } catch (err) {
    throw new AppError(401, 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى');
  }
};

module.exports = {
  login,
  logout,
  refreshAccessToken
};
