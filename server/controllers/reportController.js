const reportService = require('../services/reportService');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/AppError');

/**
 * Export properties report
 */
const exportProperties = async (req, res, next) => {
  try {
    const format = req.params.format; // 'pdf' or 'excel'
    if (!['pdf', 'excel'].includes(format)) {
      throw new AppError(400, 'صيغة التقرير غير صحيحة، يجب أن تكون pdf أو excel');
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
      throw new AppError(400, 'صيغة التقرير غير صحيحة، يجب أن تكون pdf أو excel');
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

/**
 * Export filtered/searched properties report
 */
const exportSearchProperties = async (req, res, next) => {
  try {
    const format = req.params.format;
    if (!['pdf', 'excel'].includes(format)) {
      throw new AppError(400, 'صيغة التقرير غير صحيحة، يجب أن تكون pdf أو excel');
    }

    const { search, status, location, propertyFileNumber, ownerName, nationalNumber } = req.query;

    const timeoutMs = 60000;
    const buffer = await Promise.race([
      reportService.getSearchPropertyReport(req.user, format, { search, status, location, propertyFileNumber, ownerName, nationalNumber }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('انتهت مهلة إنشاء التقرير. يرجى المحاولة لاحقاً.')), timeoutMs)
      )
    ]);

    const fileName = `search_results_${Date.now()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
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
 * Get static printable form file securely
 */
const getFormFile = async (req, res, next) => {
  try {
    const { filename } = req.params;

    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);
    
    const filePath = path.join(__dirname, '..', 'assets', 'forms', safeFilename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'الملف غير موجود'
      });
    }

    // Set headers to serve PDF inline (print in browser rather than download)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(safeFilename)}"`);

    // Stream the file response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  exportProperties,
  exportLogs,
  exportSearchProperties,
  getFormFile
};

