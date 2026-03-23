const propertyModel = require('../models/propertyModel');
const logModel = require('../models/logModel');
const { generatePDF } = require('../utils/pdfGenerator');
const { generateExcel } = require('../utils/excelGenerator');
const { ROLES, PROPERTY_STATUS } = require('../config/constants');

/**
 * Get property report data and generate file
 */
const getPropertyReport = async (user, format) => {
  // Fetch all active properties (not paginated for report)
  let properties = await propertyModel.findAll({ page: 1, limit: 1000 }); // Large limit for report

  // Filter for employee
  if (user.role === ROLES.EMPLOYEE) {
    properties = properties.map(p => {
      if (p.status === PROPERTY_STATUS.RESERVED) {
        return {
          property_file_number: p.property_file_number,
          owner_name: '*** محجوز ***',
          national_number: '**********',
          location: '*** محجوز ***',
          area: '-',
          status: p.status,
          created_at: p.created_at
        };
      }
      return p;
    });
  }

  const columns = [
    { header: 'رقم الملف', key: 'property_file_number', width: 60 },
    { header: 'اسم المالك', key: 'owner_name', width: 80 },
    { header: 'الرقم الوطني', key: 'national_number', width: 75 },
    { header: 'الموقع', key: 'location', width: 80 },
    { header: 'المساحة', key: 'area', width: 45 },
    { header: 'الحالة', key: 'status', width: 55 },
    { header: 'تاريخ الإنشاء', key: 'created_at', width: 75 }
  ];

  if (format === 'pdf') {
    return await generatePDF(properties, 'تقرير العقارات', columns);
  } else {
    return await generateExcel(properties, 'العقارات', columns);
  }
};

/**
 * Get log report (Admin only)
 */
const getLogReport = async (format, filters) => {
  const logs = await logModel.findAll({ page: 1, limit: 5000, ...filters });
  
  const columns = [
    { header: 'المستخدم', key: 'username', width: 100 },
    { header: 'الإجراء', key: 'action', width: 100 },
    { header: 'الهدف', key: 'target', width: 150 },
    { header: 'الوقت', key: 'time', width: 150 }
  ];

  if (format === 'pdf') {
    return await generatePDF(logs, 'سجل التدقيق', columns);
  } else {
    return await generateExcel(logs, 'السجلات', columns);
  }
};

module.exports = {
  getPropertyReport,
  getLogReport
};
