const bcrypt = require('bcrypt');
const { BCRYPT_SALT_ROUNDS } = require('../config/constants');

/**
 * Hash a plaintext password
 * @param {string} password
 * @returns {Promise<string>} hashed password
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

/**
 * Compare plaintext password with hash
 * @param {string} password - plaintext
 * @param {string} hash - stored hash
 * @returns {Promise<boolean>}
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

module.exports = { hashPassword, comparePassword };
