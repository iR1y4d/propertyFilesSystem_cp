const { Pool } = require('c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/node_modules/pg');
require('c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/node_modules/dotenv').config({ path: 'c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  try {
    const requests = await pool.query('SELECT request_id, property_file_number, requested_by, status, request_type FROM edit_requests');
    console.log('\n--- Edit Requests ---');
    console.table(requests.rows);
  } catch (err) {
    console.error('Error querying DB:', err);
  } finally {
    await pool.end();
  }
}

main();
