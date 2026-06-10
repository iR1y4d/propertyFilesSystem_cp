const { query } = require('../config/db');

/**
 * Shared helper to build WHERE clause dynamically for log queries
 */
const buildLogWhereClause = ({ userId, action, dateFrom, dateTo }, alias = '') => {
  const prefix = alias ? `${alias}.` : '';
  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (userId) {
    conditions.push(`${prefix}user_id = $${paramIdx++}`);
    params.push(userId);
  }

  if (action) {
    conditions.push(`${prefix}action = $${paramIdx++}`);
    params.push(action);
  }

  if (dateFrom) {
    conditions.push(`${prefix}time >= $${paramIdx++}`);
    params.push(dateFrom);
  }

  if (dateTo) {
    conditions.push(`${prefix}time <= $${paramIdx++}`);
    params.push(dateTo);
  }

  const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params, nextParamIdx: paramIdx };
};

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
  const where = buildLogWhereClause({ userId, action, dateFrom, dateTo }, 'l');
  
  let sql = `
    SELECT l.*, u.username 
    FROM logs l 
    JOIN users u ON l.user_id = u.user_id
    ${where.whereClause}
  `;
  const params = [...where.params];
  let paramIdx = where.nextParamIdx;

  sql += ` ORDER BY l.time DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Count logs for pagination
 */
const count = async ({ userId, action, dateFrom, dateTo }) => {
  const where = buildLogWhereClause({ userId, action, dateFrom, dateTo });
  const sql = `SELECT COUNT(*) FROM logs${where.whereClause}`;
  
  const result = await query(sql, where.params);
  return parseInt(result.rows[0].count, 10);
};

module.exports = {
  createLog,
  findAll,
  count
};
