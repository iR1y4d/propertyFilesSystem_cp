const { verifyToken } = require('../utils/tokenUtils');

/**
 * Authentication middleware for static uploads
 * Checks both Authorization header (Bearer token) and refreshToken cookie (for direct browser <img> tags)
 */
module.exports = (req, res, next) => {
  try {
    // 1. Check Authorization header (standard access token verification)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role
      };
      return next();
    }

    // 2. Check HttpOnly refreshToken cookie (cookie containing the refresh token is sent automatically by browser <img> requests)
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
      req.user = {
        userId: decoded.userId
      };
      return next();
    }

    return res.status(401).json({
      success: false,
      message: 'يجب تسجيل الدخول للوصول إلى هذا المورد'
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'يجب تسجيل الدخول للوصول إلى هذا المورد'
    });
  }
};
