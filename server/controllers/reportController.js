const reportService = require('../services/reportService');

/**
 * Export properties report
 */
const exportProperties = async (req, res, next) => {
  try {
    const format = req.params.format; // 'pdf' or 'excel'
    if (!['pdf', 'excel'].includes(format)) {
      throw { statusCode: 400, message: 'صيغة التقرير غير صحيحة، يجب أن تكون pdf أو excel' };
    }
    const buffer = await reportService.getPropertyReport(req.user, format);

    const fileName = `properties_report_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

/**
 * Export logs report
 */
const exportLogs = async (req, res, next) => {
  try {
    const format = req.params.format;
    if (!['pdf', 'excel'].includes(format)) {
      throw { statusCode: 400, message: 'صيغة التقرير غير صحيحة، يجب أن تكون pdf أو excel' };
    }
    const { userId, action, dateFrom, dateTo } = req.query;
    
    const buffer = await reportService.getLogReport(format, { userId, action, dateFrom, dateTo });

    const fileName = `audit_logs_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  exportProperties,
  exportLogs
};
