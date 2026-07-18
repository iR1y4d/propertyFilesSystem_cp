const { Pool } = require('c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/node_modules/pg');
require('c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/node_modules/dotenv').config({ path: 'c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sql = `UPDATE properties SET area = $2, status = $3, location = $4, owner_name = $5, national_number = $6, updated_at = CURRENT_TIMESTAMP WHERE property_file_number = $1 AND deleted_at IS NULL RETURNING *`;
    const params = [8787, '777', 'مؤقت', 'us', 'ali', 123456789123];
    console.log('Running query inside transaction...');
    const res = await client.query(sql, params);
    console.log('Rows updated:', res.rows.length);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error running update inside transaction:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
