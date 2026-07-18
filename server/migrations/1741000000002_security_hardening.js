exports.up = (pgm) => {
  // Create refresh_tokens table
  pgm.createTable('refresh_tokens', {
    id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"(user_id)',
      onDelete: 'CASCADE',
    },
    token_hash: {
      type: 'varchar(128)',
      notNull: true,
      unique: true,
    },
    expires_at: {
      type: 'timestamp',
      notNull: true,
    },
    revoked_at: {
      type: 'timestamp',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create index on refresh_tokens token_hash
  pgm.createIndex('refresh_tokens', 'token_hash');

  // Create recommended performance indexes
  pgm.sql('CREATE INDEX idx_properties_status ON properties(status) WHERE deleted_at IS NULL');
  pgm.sql('CREATE INDEX idx_properties_location ON properties(location) WHERE deleted_at IS NULL');
  
  // Composite index on logs(user_id, action)
  pgm.sql('CREATE INDEX idx_logs_user_action ON logs(user_id, action)');
};

exports.down = (pgm) => {
  pgm.sql('DROP INDEX IF EXISTS idx_logs_user_action');
  pgm.sql('DROP INDEX IF EXISTS idx_properties_location');
  pgm.sql('DROP INDEX IF EXISTS idx_properties_status');
  pgm.dropTable('refresh_tokens');
};
