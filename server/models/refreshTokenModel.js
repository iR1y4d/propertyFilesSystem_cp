const { query } = require('../config/db');

/**
 * Store a new refresh token hash in database
 * @param {number} userId
 * @param {string} tokenHash
 * @param {Date} expiresAt
 */
const create = async (userId, tokenHash, expiresAt) => {
  const result = await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING *',
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0];
};

/**
 * Find active (non-revoked, non-expired) token by hash
 * @param {string} tokenHash
 */
const findActiveByHash = async (tokenHash) => {
  const result = await query(
    'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP',
    [tokenHash]
  );
  return result.rows[0];
};

/**
 * Revoke a refresh token
 * @param {string} tokenHash
 */
const revoke = async (tokenHash) => {
  const result = await query(
    'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = $1 RETURNING *',
    [tokenHash]
  );
  return result.rows[0];
};

/**
 * Revoke all refresh tokens for a user
 * @param {number} userId
 */
const revokeAllForUser = async (userId) => {
  const result = await query(
    'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revoked_at IS NULL RETURNING *',
    [userId]
  );
  return result.rows;
};

module.exports = {
  create,
  findActiveByHash,
  revoke,
  revokeAllForUser,
};
