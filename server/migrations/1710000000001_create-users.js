exports.up = (pgm) => {
  pgm.createTable('users', {
    user_id: 'id',
    first_name: { type: 'varchar(100)', notNull: true },
    last_name: { type: 'varchar(100)', notNull: true },
    username: { type: 'varchar(100)', notNull: true, unique: true },
    password_hash: { type: 'text', notNull: true },
    role: { type: 'user_role', notNull: true },
    failed_login_attempts: { type: 'integer', default: 0 },
    is_locked: { type: 'boolean', default: false },
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

  pgm.createIndex('users', 'username');
};

exports.down = (pgm) => {
  pgm.dropTable('users');
};
