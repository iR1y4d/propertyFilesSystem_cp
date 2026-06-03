/**
 * Global error handling middleware
 */
module.exports = (err, req, res, next) => {
  console.error('❌ Error:', err.stack || err.message || err);

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'خطأ في التحقق من البيانات',
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'رمز الوصول غير صالح'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'انتهت صلاحية رمز الوصول'
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'حدث خطأ داخلي في الخادم';

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'حدث خطأ داخلي في الخادم' : message
  });
};
