exports.up = (pgm) => {
  pgm.alterColumn('edit_requests', 'request_description', {
    allowNull: true,
  });
};

exports.down = (pgm) => {
  pgm.alterColumn('edit_requests', 'request_description', {
    allowNull: false,
  });
};
