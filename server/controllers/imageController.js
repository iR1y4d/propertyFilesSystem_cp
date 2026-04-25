const imageService = require('../services/imageService');
const propertyService = require('../services/propertyService');
const logModel = require('../models/logModel');

/**
 * Get all images for a property (reads from filesystem)
 */
const getImages = async (req, res, next) => {
  try {
    const { fileNumber } = req.params;

    // Check access (reuses existing role-based restriction for محجوز)
    await propertyService.getProperty(req.user, fileNumber);

    const images = imageService.getImages(fileNumber);

    res.json({
      success: true,
      data: images,
      message: images.length > 0 ? 'تم جلب الصور بنجاح' : 'لا توجد صور لهذا العقار'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Upload images for a property (Admin direct upload).
 * Files are already saved to disk by multer middleware.
 */
const uploadImages = async (req, res, next) => {
  try {
    const { fileNumber } = req.params;

    // Verify property exists
    await propertyService.getProperty(req.user, fileNumber);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم رفع أي صور'
      });
    }

    const images = imageService.getImages(fileNumber);

    res.json({
      success: true,
      data: images,
      message: `تم رفع ${req.files.length} صورة بنجاح`
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a single image from a property (Admin only).
 * Logs the action as حذف_صور.
 */
const deleteImage = async (req, res, next) => {
  try {
    const { fileNumber, filename } = req.params;
    console.log('--- DELETE IMAGE ATTEMPT ---');
    console.log('fileNumber:', fileNumber);
    console.log('filename:', filename);

    // Verify property exists
    await propertyService.getProperty(req.user, fileNumber);
    console.log('Property verified');

    const deleted = imageService.deleteImage(fileNumber, filename);
    console.log('Deleted status:', deleted);

    if (!deleted) {
      return res.status(400).json({
        success: false,
        message: 'تعذر حذف الصورة، قد تكون غير موجودة أو قيد الاستخدام'
      });
    }

    // Audit log — log as حذف_صور
    await logModel.createLog({
      userId: req.user.userId,
      action: 'حذف_صور',
      target: `ملف ${fileNumber} - ${filename}`
    });

    res.json({
      success: true,
      message: 'تم حذف الصورة بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get pending images for a request (Admin review)
 */
const getPendingImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const images = imageService.getPendingImages(id);

    res.json({
      success: true,
      data: images,
      message: images.length > 0 ? 'صور مرفقة بالطلب' : 'لا توجد صور مرفقة'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getImages,
  uploadImages,
  deleteImage,
  getPendingImages
};
