const logModel = require('../models/logModel');

/**
 * List all audit logs
 */
const listLogs = async (req, res, next) => {
  try {
    const { page, limit, userId, action, dateFrom, dateTo } = req.query;
    
    const logs = await logModel.findAll({ page, limit, userId, action, dateFrom, dateTo });
    const totalCount = await logModel.count({ userId, action, dateFrom, dateTo });

    res.json({
      success: true,
      data: logs,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / (limit || 20)),
        currentPage: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 20
      },
      message: 'تم جلب سجلات التدقيق بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listLogs
};
