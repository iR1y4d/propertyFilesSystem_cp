exports.up = (pgm) => {
  pgm.addTypeValue('request_type', 'حذف_صور', { ifNotExists: true });
  pgm.addTypeValue('log_action', 'حذف_صور', { ifNotExists: true });
};

exports.down = (pgm) => {
  // PostgreSQL does not support removing values from an enum type easily.
  // We leave this as a no-op because it's not a breaking change to keep the enum values.
};
