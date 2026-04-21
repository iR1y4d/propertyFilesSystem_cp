require('dotenv').config();

module.exports = {
  // Roles
  ROLES: {
    ADMIN: 'مدير',
    EMPLOYEE: 'موظف',
  },

  // Property statuses
  PROPERTY_STATUS: {
    TEMPORARY: 'مؤقت',
    CERTIFIED: 'مصدق',
    RESERVED: 'محجوز',
  },

  // Request types
  REQUEST_TYPE: {
    ADD: 'إضافة',
    EDIT: 'تعديل',
    DELETE: 'حذف',
  },

  // Request statuses
  REQUEST_STATUS: {
    PENDING: 'في الانتظار',
    APPROVED: 'مقبول',
    REJECTED: 'مرفوض',
  },

  // Log actions
  LOG_ACTIONS: {
    LOGIN: 'تسجيل_دخول',
    LOGOUT: 'تسجيل_خروج',
    ADD: 'إضافة',
    DELETE: 'حذف',
    EDIT: 'تعديل',
    SEARCH: 'بحث',
    REQUEST: 'طلب',
    APPROVE: 'موافقة',
    REJECT: 'رفض',
    DELETE_IMAGE: 'حذف_صور',
  },

  // Security
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5,
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  ACCESS_TOKEN_EXPIRY: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',

  // Pagination defaults
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,

  // Rate Limiting
  RATE_LIMIT_AUTH_MAX: 30,
};
