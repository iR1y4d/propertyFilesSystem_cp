const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../config/constants');

/**
 * Middleware to parse, sanitize, and validate pagination query parameters
 */
module.exports = (req, res, next) => {
  const page = parseInt(req.query.page, 10);
  const limit = parseInt(req.query.limit, 10);

  req.query.page = isNaN(page) || page < 1 ? DEFAULT_PAGE : page;
  req.query.limit = isNaN(limit) || limit < 1 ? DEFAULT_LIMIT : Math.min(limit, MAX_LIMIT);

  next();
};
