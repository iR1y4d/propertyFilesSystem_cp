const { Pool } = require('c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/node_modules/pg');
require('c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/node_modules/dotenv').config({ path: 'c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    await pool.query("UPDATE edit_requests SET status = 'في الانتظار' WHERE request_id = 1");
    await pool.query("UPDATE properties SET status = 'محجوز' WHERE property_file_number = 8787");
    console.log('Reset completed successfully.');
  } catch (err) {
    console.error('Reset failed:', err);
  } finally {
    await pool.end();
  }
}

main();
