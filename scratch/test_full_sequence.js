const { Pool } = require('c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/node_modules/pg');
require('c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/node_modules/dotenv').config({ path: 'c:/Users/Admin/Desktop/propertyFilesSystem_cp/server/.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Query 1: Find request for update
    console.log('Query 1: findById for update');
    const q1 = 'SELECT r.*, u.username as requester_name FROM edit_requests r LEFT JOIN users u ON r.requested_by = u.user_id WHERE r.request_id = $1 FOR UPDATE OF r';
    const r1 = await client.query(q1, [1]);
    console.log('Query 1 succeeded. Row count:', r1.rows.length);

    // Query 2: Update property
    console.log('Query 2: update property');
    const q2 = `UPDATE properties SET area = $2, status = $3, location = $4, owner_name = $5, national_number = $6, updated_at = CURRENT_TIMESTAMP WHERE property_file_number = $1 AND deleted_at IS NULL RETURNING *`;
    const params2 = [8787, '777', 'مؤقت', 'us', 'ali', 123456789123];
    const r2 = await client.query(q2, params2);
    console.log('Query 2 succeeded. Row count:', r2.rows.length);

    // Query 3: Update request status
    console.log('Query 3: update request status');
    const q3 = 'UPDATE edit_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE request_id = $2 RETURNING *';
    const params3 = ['مقبول', 1];
    const r3 = await client.query(q3, params3);
    console.log('Query 3 succeeded. Row count:', r3.rows.length);

    // Query 4: Insert audit log
    console.log('Query 4: insert audit log');
    const q4 = 'INSERT INTO logs (user_id, action, target) VALUES ($1, $2, $3)';
    const params4 = [1, 'موافقة', 8787];
    const r4 = await client.query(q4, params4);
    console.log('Query 4 succeeded. Row count:', r4.rowCount);

    await client.query('COMMIT');
    console.log('Transaction COMMITTED successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Transaction failed with error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
