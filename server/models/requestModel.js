const { query } = require('../config/db');

/**
 * Find all requests with pagination and filtering (Admin)
 */
const findAll = async ({ page = 1, limit = 20, status }) => {
  const offset = (page - 1) * limit;
  let sql = 'SELECT r.*, u.username as requester_name FROM edit_requests r LEFT JOIN users u ON r.requested_by = u.user_id';
  const params = [];
  let paramIdx = 1;

  if (status) {
    sql += ` WHERE r.status = $${paramIdx++}`;
    params.push(status);
  }

  sql += ` ORDER BY r.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Count requests for pagination
 */
const count = async ({ status, userId }) => {
  let sql = 'SELECT COUNT(*) FROM edit_requests';
  const params = [];
  let paramIdx = 1;

  if (status || userId) {
    sql += ' WHERE';
    if (status) {
      sql += ` status = $${paramIdx++}`;
      params.push(status);
    }
    if (userId) {
      if (status) sql += ' AND';
      sql += ` requested_by = $${paramIdx++}`;
      params.push(userId);
    }
  }

  const result = await query(sql, params);
  return parseInt(result.rows[0].count, 10);
};

/**
 * Find own requests (Employee)
 */
const findByUser = async (userId, { page = 1, limit = 20, status }) => {
  const offset = (page - 1) * limit;
  let sql = 'SELECT * FROM edit_requests WHERE requested_by = $1';
  const params = [userId];
  let paramIdx = 2;

  if (status) {
    sql += ` AND status = $${paramIdx++}`;
    params.push(status);
  }

  sql += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Find request by ID
 */
const findById = async (id, client) => {
  const q = client ? client.query.bind(client) : query;
  const queryText = client
    ? 'SELECT r.*, u.username as requester_name FROM edit_requests r LEFT JOIN users u ON r.requested_by = u.user_id WHERE r.request_id = $1 FOR UPDATE OF r'
    : 'SELECT r.*, u.username as requester_name FROM edit_requests r LEFT JOIN users u ON r.requested_by = u.user_id WHERE r.request_id = $1';
  const result = await q(queryText, [id]);
  return result.rows[0];
};

/**
 * Create new request
 */
const create = async (client, data) => {
  const { propertyFileNumber, requestedBy, requestDescription, oldData, newData, requestType } = data;
  const q = client ? client.query.bind(client) : query;
  
  const result = await q(
    `INSERT INTO edit_requests 
    (property_file_number, requested_by, request_description, old_data, new_data, request_type) 
    VALUES ($1, $2, $3, $4, $5, $6) 
    RETURNING *`,
    [propertyFileNumber, requestedBy, requestDescription, oldData ? JSON.stringify(oldData) : null, newData ? JSON.stringify(newData) : null, requestType]
  );
  return result.rows[0];
};

/**
 * Update request status
 */
const updateStatus = async (client, id, status) => {
  const q = client ? client.query.bind(client) : query;
  const result = await q(
    'UPDATE edit_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE request_id = $2 RETURNING *',
    [status, id]
  );
  return result.rows[0];
};

module.exports = {
  findAll,
  count,
  findByUser,
  findById,
  create,
  updateStatus
};
