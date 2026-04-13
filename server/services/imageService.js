const fs = require('fs');
const path = require('path');

// Base directory for property images
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'properties');

// Allowed image extensions
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Ensure base directory exists
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

/**
 * Get all images for a property by scanning the filesystem.
 * Looks for folder: uploads/properties/{propertyFileNumber}/
 * @param {number|string} propertyFileNumber
 * @returns {Array<{filename: string, url: string}>}
 */
const getImages = (propertyFileNumber) => {
  const folderPath = path.join(UPLOADS_DIR, String(propertyFileNumber));

  // If folder doesn't exist, return empty
  if (!fs.existsSync(folderPath)) {
    return [];
  }

  const files = fs.readdirSync(folderPath);

  return files
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext);
    })
    .map(file => ({
      filename: file,
      url: `/uploads/properties/${propertyFileNumber}/${file}`
    }));
};

module.exports = {
  getImages,
  UPLOADS_DIR
};
