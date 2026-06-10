exports.up = (pgm) => {
  pgm.createIndex('logs', 'action');
  pgm.createIndex('edit_requests', 'property_file_number');
  
  // Trigram index for properties search by owner_name
  pgm.sql('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  pgm.sql('CREATE INDEX idx_properties_owner_name_trgm ON properties USING gin (owner_name gin_trgm_ops)');
};

exports.down = (pgm) => {
  pgm.sql('DROP INDEX IF EXISTS idx_properties_owner_name_trgm');
  pgm.dropIndex('edit_requests', 'property_file_number');
  pgm.dropIndex('logs', 'action');
};
