const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const AppError = require('../utils/AppError');

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
 * Validate and sanitize property folder path
 * @param {number|string} propertyFileNumber
 * @returns {string} resolved safe folder path
 */
const validatePropertyPath = (propertyFileNumber) => {
  const sanitized = String(propertyFileNumber).replace(/[^0-9]/g, '');
  if (!sanitized || sanitized !== String(propertyFileNumber)) {
    throw new AppError(400, 'رقم ملف العقار غير صالح');
  }
  const folderPath = path.join(UPLOADS_DIR, sanitized);
  // Ensure resolved path is inside UPLOADS_DIR
  if (!path.resolve(folderPath).startsWith(path.resolve(UPLOADS_DIR))) {
    throw new AppError(400, 'مسار غير صالح');
  }
  return folderPath;
};

/**
 * Validate and sanitize pending request folder path
 * @param {number|string} requestId
 * @returns {string} resolved safe folder path
 */
const validatePendingPath = (requestId) => {
  const sanitized = String(requestId).replace(/[^0-9]/g, '');
  if (!sanitized || sanitized !== String(requestId)) {
    throw new AppError(400, 'رقم طلب غير صالح');
  }
  const folderPath = path.join(PENDING_DIR, sanitized);
  // Ensure resolved path is inside PENDING_DIR
  if (!path.resolve(folderPath).startsWith(path.resolve(PENDING_DIR))) {
    throw new AppError(400, 'مسار غير صالح');
  }
  return folderPath;
};

/**
 * Get all images for a property by scanning the filesystem asynchronously.
 * Looks for folder: uploads/properties/{propertyFileNumber}/
 * @param {number|string} propertyFileNumber
 * @returns {Promise<Array<{filename: string, url: string}>>}
 */
const getImages = async (propertyFileNumber) => {
  const folderPath = validatePropertyPath(propertyFileNumber);

  try {
    const files = await fsPromises.readdir(folderPath);
    return files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext);
      })
      .map(file => ({
        filename: file,
        url: `/uploads/properties/${propertyFileNumber}/${file}`
      }));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
};

/**
 * Check if a property has any images asynchronously
 * @param {number|string} propertyFileNumber
 * @returns {Promise<boolean>}
 */
const hasImages = async (propertyFileNumber) => {
  const folderPath = validatePropertyPath(propertyFileNumber);
  try {
    const files = await fsPromises.readdir(folderPath);
    return files.some(file => IMAGE_EXTENSIONS.includes(path.extname(file).toLowerCase()));
  } catch {
    return false;
  }
};

/**
 * Check if multiple properties have images in a batch (parallelised) (PERF-01)
 * @param {Array<number|string>} fileNumbers
 * @returns {Promise<Record<string|number, boolean>>} Map of fileNumber -> hasImages
 */
const hasImagesBatch = async (fileNumbers) => {
  const results = {};
  await Promise.all(
    fileNumbers.map(async (num) => {
      results[num] = await hasImages(num);
    })
  );
  return results;
};

/**
 * Delete a single image from a property's folder.
 * @param {number|string} propertyFileNumber
 * @param {string} filename
 * @returns {Promise<boolean>} true if file was deleted
 */
const deleteImage = async (propertyFileNumber, filename) => {
  const folderPath = validatePropertyPath(propertyFileNumber);
  // Sanitize filename to prevent path traversal
  const safeName = path.basename(filename);
  const filePath = path.join(folderPath, safeName);

  try {
    await fsPromises.unlink(filePath);
    return true;
  } catch (err) {
    if (err.code === 'ENOENT') {
      return false;
    }
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
const movePendingImages = async (requestId, propertyFileNumber) => {
  const srcDir = validatePendingPath(requestId);
  const destDir = validatePropertyPath(propertyFileNumber);

  try {
    await fsPromises.access(srcDir);
  } catch {
    return; // Source directory does not exist
  }

  await fsPromises.mkdir(destDir, { recursive: true });

  const files = await fsPromises.readdir(srcDir);
  for (const file of files) {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    await fsPromises.rename(srcPath, destPath);
  }

  // Clean up empty pending folder — use rm instead of deprecated rmdirSync
  await fsPromises.rm(srcDir, { recursive: true, force: true });
};

/**
 * Delete pending images folder (called on rejection)
 * @param {number|string} requestId
 */
const deletePendingImages = async (requestId) => {
  const dir = validatePendingPath(requestId);
  try {
    await fsPromises.rm(dir, { recursive: true, force: true });
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`[deletePendingImages] Error deleting dir ${dir}:`, err.message);
    }
  }
};

/**
 * Get pending images for a request
 * @param {number|string} requestId
 * @returns {Promise<Array<{filename: string, url: string}>>}
 */
const getPendingImages = async (requestId) => {
  const folderPath = validatePendingPath(requestId);
  try {
    const files = await fsPromises.readdir(folderPath);
    return files
      .filter(f => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
      .map(f => ({
        filename: f,
        url: `/uploads/pending/${requestId}/${f}`
      }));
  } catch {
    return [];
  }
};

module.exports = {
  getImages,
  hasImages,
  hasImagesBatch,
  deleteImage,
  movePendingImages,
  deletePendingImages,
  getPendingImages,
  UPLOADS_DIR,
  PENDING_DIR
};
