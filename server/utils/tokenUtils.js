const jwt = require('jsonwebtoken');

/**
 * Generate a short-lived access token
 * @param {{ userId: number, username: string, role: string }} payload
 * @returns {string}
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  });
};

/**
 * Generate a long-lived refresh token
 * @param {{ userId: number }} payload
 * @returns {string}
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  });
};

/**
 * Verify a JWT token
 * @param {string} token
 * @param {string} secret
 * @returns {object} decoded payload
 * @throws {jwt.JsonWebTokenError}
 */
const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

module.exports = { generateAccessToken, generateRefreshToken, verifyToken };
