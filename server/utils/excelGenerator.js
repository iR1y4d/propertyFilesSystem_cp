const ExcelJS = require('exceljs');

/**
 * Generate Excel Report
 */
const generateExcel = async (data, sheetName, columns) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ rightToLeft: true }] // Arabic RTL support
  });

  // Set columns
  worksheet.columns = columns.map(col => ({
    header: col.header,
    key: col.key,
    width: col.width / 5 // Adjusting width for Excel
  }));

  // Add rows
  worksheet.addRows(data);

  // Style header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  return await workbook.xlsx.writeBuffer();
};

module.exports = { generateExcel };
