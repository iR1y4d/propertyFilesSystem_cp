const { query } = require('../config/db');

/**
 * Create a new audit log entry
 * @param {Object} logData
 * @param {number} logData.userId - ID of the user performing the action
 * @param {string} logData.action - Action constant from LOG_ACTIONS
 * @param {string|number} [logData.target] - Target of the action (e.g. propertyFileNumber)
 */
const createLog = async ({ userId, action, target }) => {
  return await query(
    'INSERT INTO logs (user_id, action, target) VALUES ($1, $2, $3)',
    [userId, action, target]
  );
};

/**
 * Find all audit logs (Admin only)
 */
const findAll = async ({ page = 1, limit = 20, userId, action, dateFrom, dateTo }) => {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT l.*, u.username 
    FROM logs l 
    JOIN users u ON l.user_id = u.user_id 
    WHERE 1=1
  `;
  const params = [];
  let paramIdx = 1;

  if (userId) {
    sql += ` AND l.user_id = $${paramIdx++}`;
    params.push(userId);
  }

  if (action) {
    sql += ` AND l.action = $${paramIdx++}`;
    params.push(action);
  }

  if (dateFrom) {
    sql += ` AND l.time >= $${paramIdx++}`;
    params.push(dateFrom);
  }

  if (dateTo) {
    sql += ` AND l.time <= $${paramIdx++}`;
    params.push(dateTo);
  }

  sql += ` ORDER BY l.time DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Count logs for pagination
 */
const count = async ({ userId, action, dateFrom, dateTo }) => {
  let sql = 'SELECT COUNT(*) FROM logs WHERE 1=1';
  const params = [];
  let paramIdx = 1;

  if (userId) {
    sql += ` AND user_id = $${paramIdx++}`;
    params.push(userId);
  }

  if (action) {
    sql += ` AND action = $${paramIdx++}`;
    params.push(action);
  }

  if (dateFrom) {
    sql += ` AND time >= $${paramIdx++}`;
    params.push(dateFrom);
  }

  if (dateTo) {
    sql += ` AND time <= $${paramIdx++}`;
    params.push(dateTo);
  }

  const result = await query(sql, params);
  return parseInt(result.rows[0].count, 10);
};

module.exports = {
  createLog,
  findAll,
  count
};
