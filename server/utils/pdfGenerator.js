const puppeteer = require('puppeteer');

/**
 * Generate PDF Report using Puppeteer for native browser rendering of Arabic text
 * and better layout control.
 */
const generatePDF = async (data, title, columns) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      timeout: 30000,
    });
    const page = await browser.newPage();

    const formatDate = (dateStr) => {
      if (!dateStr || dateStr === '-') return '-';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('ar-JO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    // Escape HTML to prevent injection
    const escapeHtml = (str) => {
      if (!str) return '-';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };

    // Build table rows
    const rows = data.map(item => {
      const cells = columns.map(col => {
        let val = item[col.key] != null ? item[col.key] : '-';
        if (col.key === 'created_at' || col.key === 'time' || col.key.includes('date')) {
          val = formatDate(val);
        }
        return `<td>${escapeHtml(val)}</td>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('\n');

    // Build HTML string
    const html = `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', 'Tahoma', 'Arial', sans-serif;
      margin: 0;
      padding: 30px;
      color: #333;
      direction: rtl;
    }
    h1 {
      text-align: center;
      color: #1a56db;
      margin-bottom: 24px;
      font-size: 22px;
    }
    .meta {
      text-align: center;
      color: #6b7280;
      font-size: 11px;
      margin-bottom: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 8px 10px;
      text-align: right;
      font-size: 11px;
      word-wrap: break-word;
    }
    th {
      background-color: #e5e7eb;
      font-weight: bold;
      color: #1f2937;
    }
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .footer {
      text-align: center;
      color: #9ca3af;
      font-size: 9px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="meta">تاريخ التقرير: ${new Date().toLocaleDateString('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' })} — عدد السجلات: ${data.length}</p>
  <table>
    <thead>
      <tr>
        ${columns.map(col => `<th>${escapeHtml(col.header)}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
  <p class="footer">نظام إدارة الملفات العقارية — تقرير آلي</p>
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'load', timeout: 15000 });

    const pdfUint8 = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    });

    // IMPORTANT: Convert Uint8Array to Node.js Buffer for proper res.send()
    return Buffer.from(pdfUint8);
  } catch (err) {
    console.error('PDF Generation Error:', err);
    throw err;
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
};

module.exports = { generatePDF };
