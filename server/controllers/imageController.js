const imageService = require('../services/imageService');
const propertyService = require('../services/propertyService');

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

module.exports = {
  getImages
};
