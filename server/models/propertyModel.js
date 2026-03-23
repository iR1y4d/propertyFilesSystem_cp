const { query } = require('../config/db');

/**
 * Find all properties with pagination and filtering
 */
const findAll = async ({ page = 1, limit = 20, status, location, propertyFileNumber, ownerName, nationalNumber, search }) => {
  const offset = (page - 1) * limit;
  let sql = 'SELECT * FROM properties WHERE deleted_at IS NULL';
  const params = [];
  let paramIdx = 1;

  if (status) {
    sql += ` AND status = $${paramIdx++}`;
    params.push(status);
  }

  if (search) {
    sql += ` AND (
      owner_name ILIKE $${paramIdx} OR 
      location ILIKE $${paramIdx} OR 
      CAST(property_file_number AS TEXT) ILIKE $${paramIdx} OR 
      CAST(national_number AS TEXT) ILIKE $${paramIdx} OR
      area ILIKE $${paramIdx}
    )`;
    params.push(`%${search}%`);
    paramIdx++;
  } else {
    if (location) {
      sql += ` AND location ILIKE $${paramIdx++}`;
      params.push(`%${location}%`);
    }

    if (propertyFileNumber) {
      sql += ` AND property_file_number = $${paramIdx++}`;
      params.push(propertyFileNumber);
    }

    if (ownerName) {
      sql += ` AND owner_name ILIKE $${paramIdx++}`;
      params.push(`%${ownerName}%`);
    }

    if (nationalNumber) {
      sql += ` AND national_number = $${paramIdx++}`;
      params.push(nationalNumber);
    }
  }

  sql += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
};

/**
 * Count properties for pagination
 */
const count = async ({ status, location, propertyFileNumber, ownerName, nationalNumber, search }) => {
  let sql = 'SELECT COUNT(*) FROM properties WHERE deleted_at IS NULL';
  const params = [];
  let paramIdx = 1;

  if (status) {
    sql += ` AND status = $${paramIdx++}`;
    params.push(status);
  }

  if (search) {
    sql += ` AND (
      owner_name ILIKE $${paramIdx} OR 
      location ILIKE $${paramIdx} OR 
      CAST(property_file_number AS TEXT) ILIKE $${paramIdx} OR 
      CAST(national_number AS TEXT) ILIKE $${paramIdx} OR
      area ILIKE $${paramIdx}
    )`;
    params.push(`%${search}%`);
    paramIdx++;
  } else {
    if (location) {
      sql += ` AND location ILIKE $${paramIdx++}`;
      params.push(`%${location}%`);
    }

    if (propertyFileNumber) {
      sql += ` AND property_file_number = $${paramIdx++}`;
      params.push(propertyFileNumber);
    }

    if (ownerName) {
      sql += ` AND owner_name ILIKE $${paramIdx++}`;
      params.push(`%${ownerName}%`);
    }

    if (nationalNumber) {
      sql += ` AND national_number = $${paramIdx++}`;
      params.push(nationalNumber);
    }
  }

  const result = await query(sql, params);
  return parseInt(result.rows[0].count, 10);
};

/**
 * Find property by file number
 */
const findByFileNumber = async (fileNumber) => {
  const result = await query(
    'SELECT * FROM properties WHERE property_file_number = $1 AND deleted_at IS NULL',
    [fileNumber]
  );
  return result.rows[0];
};

/**
 * Create new property
 */
const create = async (data, client) => {
  const { propertyFileNumber, ownerName, nationalNumber, location, area, status } = data;
  const q = client ? client.query.bind(client) : query;
  const result = await q(
    `INSERT INTO properties 
    (property_file_number, owner_name, national_number, location, area, status) 
    VALUES ($1, $2, $3, $4, $5, $6) 
    RETURNING *`,
    [propertyFileNumber, ownerName, nationalNumber, location, area, status]
  );
  return result.rows[0];
};

/**
 * Update property
 */
const update = async (fileNumber, data, client) => {
  const fields = [];
  const params = [fileNumber];
  let paramIdx = 2;
  const q = client ? client.query.bind(client) : query;

  // Map camelCase to snake_case for DB
  const mappings = {
    ownerName: 'owner_name',
    nationalNumber: 'national_number',
    location: 'location',
    area: 'area',
    status: 'status'
  };

  for (const [key, value] of Object.entries(data)) {
    if (mappings[key]) {
      fields.push(`${mappings[key]} = $${paramIdx++}`);
      params.push(value);
    }
  }

  if (fields.length === 0) return null;

  const sql = `UPDATE properties SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE property_file_number = $1 AND deleted_at IS NULL RETURNING *`;
  const result = await q(sql, params);
  return result.rows[0];
};

/**
 * Soft delete property
 */
const softDelete = async (fileNumber, client) => {
  const q = client ? client.query.bind(client) : query;
  const result = await q(
    'UPDATE properties SET deleted_at = CURRENT_TIMESTAMP WHERE property_file_number = $1 AND deleted_at IS NULL RETURNING *',
    [fileNumber]
  );
  return result.rows[0];
};

module.exports = {
  findAll,
  count,
  findByFileNumber,
  create,
  update,
  softDelete
};
