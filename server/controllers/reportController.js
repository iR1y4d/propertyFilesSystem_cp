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

    // Timeout protection for PDF generation (60 seconds)
    const timeoutMs = 60000;
    const buffer = await Promise.race([
      reportService.getPropertyReport(req.user, format),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('انتهت مهلة إنشاء التقرير. يرجى المحاولة لاحقاً.')), timeoutMs)
      )
    ]);

    const fileName = `properties_report_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
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
    
    // Timeout protection for PDF generation (60 seconds)
    const timeoutMs = 60000;
    const buffer = await Promise.race([
      reportService.getLogReport(format, { userId, action, dateFrom, dateTo }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('انتهت مهلة إنشاء التقرير. يرجى المحاولة لاحقاً.')), timeoutMs)
      )
    ]);

    const fileName = `audit_logs_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    const contentType = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  exportProperties,
  exportLogs
};
