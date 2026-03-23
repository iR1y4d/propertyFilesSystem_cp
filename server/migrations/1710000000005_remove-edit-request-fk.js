exports.up = (pgm) => {
  // Remove the foreign key constraint that requires the property to exist
  // This allows "Add" requests for new properties
  pgm.dropConstraint('edit_requests', 'edit_requests_property_file_number_fkey');
};

exports.down = (pgm) => {
  // Restore the constraint if needed
  pgm.addConstraint('edit_requests', 'edit_requests_property_file_number_fkey', {
    foreignKeys: {
      columns: 'property_file_number',
      references: 'properties(property_file_number)',
      onDelete: 'CASCADE',
    }
  });
};
