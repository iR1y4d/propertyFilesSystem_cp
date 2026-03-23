exports.up = (pgm) => {
  pgm.createTable('edit_requests', {
    request_id: 'id',
    property_file_number: {
      type: 'integer',
      notNull: true,
      references: { name: 'properties', column: 'property_file_number' },
      onDelete: 'CASCADE',
    },
    requested_by: {
      type: 'integer',
      notNull: true,
      references: '"users"(user_id)',
      onDelete: 'CASCADE',
    },
    request_description: { type: 'varchar(255)', notNull: true },
    old_data: { type: 'jsonb' },
    new_data: { type: 'jsonb' },
    status: { type: 'request_status', notNull: true, default: 'في الانتظار' },
    request_type: { type: 'request_type', notNull: true },
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

  pgm.createIndex('edit_requests', 'status');
  pgm.createIndex('edit_requests', 'requested_by');
};

exports.down = (pgm) => {
  pgm.dropTable('edit_requests');
};
