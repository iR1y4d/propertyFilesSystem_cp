exports.up = (pgm) => {
  pgm.createTable('logs', {
    log_id: 'id',
    user_id: {
      type: 'integer',
      notNull: true,
      references: '"users"(user_id)',
      onDelete: 'CASCADE',
    },
    action: { type: 'log_action', notNull: true },
    target: { type: 'varchar(255)' },
    time: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('logs', 'user_id');
  pgm.createIndex('logs', 'time');
};

exports.down = (pgm) => {
  pgm.dropTable('logs');
};
