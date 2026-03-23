exports.up = (pgm) => {
  pgm.createTable('properties', {
    property_id: 'id',
    property_file_number: { type: 'integer', notNull: true, unique: true },
    owner_name: { type: 'varchar(255)', notNull: true },
    national_number: { type: 'bigint', notNull: true },
    location: { type: 'varchar(255)', notNull: true },
    area: { type: 'varchar(100)', notNull: true },
    status: { type: 'property_status', notNull: true },
    deleted_at: { type: 'timestamp' },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('properties', 'property_file_number');
  pgm.createIndex('properties', 'national_number');
  pgm.createIndex('properties', 'status');
  pgm.createIndex('properties', 'created_at');
};

exports.down = (pgm) => {
  pgm.dropTable('properties');
};
