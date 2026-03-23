const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_AUTH_MAX } = require('../config/constants');

/**
 * Rate limiter for authentication routes to prevent brute force
 */
module.exports = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: RATE_LIMIT_AUTH_MAX, // Limit each IP to configured auth rate limit
  message: {
    success: false,
    message: 'لقد تجاوزت عدد محاولات تسجيل الدخول المسموح بها، يرجى المحاولة لاحقاً بعد 15 دقيقة'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
