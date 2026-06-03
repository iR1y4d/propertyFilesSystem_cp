export const ROLES = {
  ADMIN: 'مدير',
  EMPLOYEE: 'موظف'
};

export const PROPERTY_STATUS = {
  TEMPORARY: 'مؤقت',
  CERTIFIED: 'مصدق',
  RESERVED: 'محجوز'
};

export const REQUEST_STATUS = {
  PENDING: 'في الانتظار',
  APPROVED: 'مقبول',
  REJECTED: 'مرفوض'
};

export const REQUEST_TYPE = {
  ADD: 'إضافة',
  EDIT: 'تعديل',
  DELETE: 'حذف',
  DELETE_IMAGE: 'حذف_صور',
};

export const LOG_ACTIONS = {
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
};

export const STATUS_COLORS = {
  'مؤقت': 'bg-yellow-100 text-yellow-800',
  'مصدق': 'bg-green-100 text-green-800',
  'محجوز': 'bg-red-100 text-red-800',
  'في الانتظار': 'bg-blue-100 text-blue-800',
  'مقبول': 'bg-green-100 text-green-800',
  'مرفوض': 'bg-red-100 text-red-800',
  'مدير': 'bg-purple-100 text-purple-800',
  'موظف': 'bg-indigo-100 text-indigo-800',
  'تسجيل_دخول': 'bg-blue-100 text-blue-800',
  'تسجيل_خروج': 'bg-gray-100 text-gray-800',
  'إضافة': 'bg-green-100 text-green-800',
  'تعديل': 'bg-yellow-100 text-yellow-800',
  'حذف': 'bg-red-100 text-red-800',
  'بحث': 'bg-cyan-100 text-cyan-800',
  'طلب': 'bg-indigo-100 text-indigo-800',
  'موافقة': 'bg-teal-100 text-teal-800',
  'رفض': 'bg-rose-100 text-rose-800',
  'حذف_صور': 'bg-orange-100 text-orange-800',
};

export const API_BASE = import.meta.env.VITE_API_URL;
