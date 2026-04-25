const fs = require('fs');
const path = require('path');

// Base directory for property images
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'properties');

// Base directory for pending (employee) images
const PENDING_DIR = path.join(__dirname, '..', 'uploads', 'pending');

// Allowed image extensions
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

// Ensure base directories exist
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
fs.mkdirSync(PENDING_DIR, { recursive: true });

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

/**
 * Check if a property has any images
 * @param {number|string} propertyFileNumber
 * @returns {boolean}
 */
const hasImages = (propertyFileNumber) => {
  const folderPath = path.join(UPLOADS_DIR, String(propertyFileNumber));
  if (!fs.existsSync(folderPath)) return false;
  const files = fs.readdirSync(folderPath);
  return files.some(file => IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase()));
};

/**
 * Delete a single image from a property's folder.
 * @param {number|string} propertyFileNumber
 * @param {string} filename
 * @returns {boolean} true if file was deleted
 */
const deleteImage = (propertyFileNumber, filename) => {
  // Sanitize filename to prevent path traversal
  const safeName = path.basename(filename);
  const filePath = path.join(UPLOADS_DIR, String(propertyFileNumber), safeName);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (err) {
    console.error(`[deleteImage] Error deleting file ${filePath}:`, err.message);
    return false;
  }
};

/**
 * Move images from pending folder to the main properties folder.
 * Called when admin approves a request that has attached images.
 * @param {number|string} requestId - The request ID (pending folder name)
 * @param {number|string} propertyFileNumber - Destination folder name
 */
const movePendingImages = (requestId, propertyFileNumber) => {
  const srcDir = path.join(PENDING_DIR, String(requestId));
  const destDir = path.join(UPLOADS_DIR, String(propertyFileNumber));

  if (!fs.existsSync(srcDir)) return;

  fs.mkdirSync(destDir, { recursive: true });

  const files = fs.readdirSync(srcDir);
  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    fs.renameSync(srcPath, destPath);
  }

  // Clean up empty pending folder
  fs.rmdirSync(srcDir);
};

/**
 * Delete pending images folder (called on rejection)
 * @param {number|string} requestId
 */
const deletePendingImages = (requestId) => {
  const dir = path.join(PENDING_DIR, String(requestId));
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

/**
 * Get pending images for a request
 * @param {number|string} requestId
 * @returns {Array<{filename: string, url: string}>}
 */
const getPendingImages = (requestId) => {
  const folderPath = path.join(PENDING_DIR, String(requestId));
  if (!fs.existsSync(folderPath)) return [];

  return fs.readdirSync(folderPath)
    .filter(f => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .map(f => ({
      filename: f,
      url: `/uploads/pending/${requestId}/${f}`
    }));
};

module.exports = {
  getImages,
  hasImages,
  deleteImage,
  movePendingImages,
  deletePendingImages,
  getPendingImages,
  UPLOADS_DIR,
  PENDING_DIR
};
