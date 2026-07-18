exports.up = (pgm) => {
  pgm.addTypeValue('user_role', 'رئيس قسم', { ifNotExists: true });
};

exports.down = (pgm) => {
  // PostgreSQL does not support removing values from an enum type easily.
};
