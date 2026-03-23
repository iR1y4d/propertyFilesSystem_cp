const { query } = require('../config/db');

/**
 * Find user by username
 * @param {string} username 
 */
const findByUsername = async (username) => {
  const result = await query(
    'SELECT * FROM users WHERE username = $1 AND deleted_at IS NULL',
    [username]
  );
  return result.rows[0];
};

/**
 * Find user by ID
 * @param {number} userId 
 */
const findById = async (userId) => {
  const result = await query(
    'SELECT user_id, first_name, last_name, username, role, is_locked, failed_login_attempts FROM users WHERE user_id = $1 AND deleted_at IS NULL',
    [userId]
  );
  return result.rows[0];
};

/**
 * Increment failed login attempts
 * @param {number} userId 
 */
const incrementFailedAttempts = async (userId) => {
  return await query(
    'UPDATE users SET failed_login_attempts = failed_login_attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING failed_login_attempts',
    [userId]
  );
};

/**
 * Reset failed login attempts
 * @param {number} userId 
 */
const resetFailedAttempts = async (userId) => {
  return await query(
    'UPDATE users SET failed_login_attempts = 0, is_locked = false, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
    [userId]
  );
};

/**
 * Lock user account
 * @param {number} userId 
 */
const lockAccount = async (userId) => {
  return await query(
    'UPDATE users SET is_locked = true, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
    [userId]
  );
};

/**
 * Unlock user account
 * @param {number} userId 
 */
const unlockAccount = async (userId) => {
  const result = await query(
    'UPDATE users SET is_locked = false, failed_login_attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING user_id',
    [userId]
  );
  return result.rows[0];
};

/**
 * Find all users with pagination (Admin)
 */
const findAll = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const result = await query(
    'SELECT user_id, first_name, last_name, username, role, is_locked, failed_login_attempts, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return result.rows;
};

/**
 * Count active users 
 */
const count = async () => {
  const result = await query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL');
  return parseInt(result.rows[0].count, 10);
};

/**
 * Create new user
 */
const create = async (data) => {
  const { firstName, lastName, username, passwordHash, role } = data;
  const result = await query(
    'INSERT INTO users (first_name, last_name, username, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, first_name, last_name, username, role',
    [firstName, lastName, username, passwordHash, role]
  );
  return result.rows[0];
};

/**
 * Update user basic info
 */
const update = async (userId, data) => {
  const fields = [];
  const params = [userId];
  let paramIdx = 2;

  const mappings = {
    firstName: 'first_name',
    lastName: 'last_name',
    role: 'role'
  };

  for (const [key, value] of Object.entries(data)) {
    if (mappings[key]) {
      fields.push(`${mappings[key]} = $${paramIdx++}`);
      params.push(value);
    }
  }

  if (fields.length === 0) return null;

  const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND deleted_at IS NULL RETURNING user_id, first_name, last_name, username, role`;
  const result = await query(sql, params);
  return result.rows[0];
};

/**
 * Soft delete user
 */
const softDelete = async (userId) => {
  const result = await query(
    'UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING user_id',
    [userId]
  );
  return result.rows[0];
};

/**
 * Reset user password
 */
const resetPassword = async (userId, passwordHash) => {
  return await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
    [passwordHash, userId]
  );
};

module.exports = {
  findByUsername,
  findById,
  incrementFailedAttempts,
  resetFailedAttempts,
  lockAccount,
  unlockAccount,
  findAll,
  count,
  create,
  update,
  softDelete,
  resetPassword
};
