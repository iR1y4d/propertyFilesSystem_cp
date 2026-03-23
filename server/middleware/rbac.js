/**
 * Role-Based Access Control middleware factory
 * @param {...string} allowedRoles - Roles allowed to access the route
 */
module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح به'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية للقيام بهذا الإجراء'
      });
    }

    next();
  };
};
