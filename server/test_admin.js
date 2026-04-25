const { query } = require('./config/db');

async function test() {
  try {
    const res = await query('SELECT * FROM users WHERE role = $1', ['مدير']);
    console.log(res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
