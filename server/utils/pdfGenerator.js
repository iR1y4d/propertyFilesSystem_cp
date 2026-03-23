const PDFDocument = require('pdfkit');

/**
 * Generate PDF Report
 * Note: For Arabic support, a TTF font is required. 
 * This implementation assumes a font will be provided at 'fonts/Amiri-Regular.ttf'
 * or uses a fallback that might not render Arabic correctly without the font.
 */
const generatePDF = (data, title, columns) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Title
      doc.fontSize(20).text(title, { align: 'center' });
      doc.moveDown();

      // Table Header
      const tableTop = 150;
      doc.fontSize(12);
      
      let x = 50;
      columns.forEach(col => {
        doc.text(col.header, x, tableTop, { width: col.width, align: 'right' });
        x += col.width;
      });

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table Rows
      let y = tableTop + 25;
      data.forEach(item => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        let rowX = 50;
        columns.forEach(col => {
          const val = item[col.key] ? String(item[col.key]) : '-';
          doc.text(val, rowX, y, { width: col.width, align: 'right' });
          rowX += col.width;
        });
        
        y += 20;
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generatePDF };
