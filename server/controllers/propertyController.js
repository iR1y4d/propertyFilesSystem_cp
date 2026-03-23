const propertyService = require('../services/propertyService');

/**
 * List all properties
 */
const listProperties = async (req, res, next) => {
  try {
    const { page, limit, status, location, propertyFileNumber, ownerName, nationalNumber, search } = req.query;
    const result = await propertyService.listProperties(req.user, { page, limit, status, location, propertyFileNumber, ownerName, nationalNumber, search });
    
    res.json({
      success: true,
      data: result.properties,
      pagination: result.pagination,
      message: 'تم جلب العقارات بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get property detail
 */
const getProperty = async (req, res, next) => {
  try {
    const { fileNumber } = req.params;
    const property = await propertyService.getProperty(req.user, fileNumber);
    
    res.json({
      success: true,
      data: property,
      message: 'تم جلب تفاصيل العقار بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create property
 */
const createProperty = async (req, res, next) => {
  try {
    const property = await propertyService.createProperty(req.user.userId, req.body);
    
    res.status(201).json({
      success: true,
      data: property,
      message: 'تم إنشاء العقار بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update property
 */
const updateProperty = async (req, res, next) => {
  try {
    const { fileNumber } = req.params;
    const property = await propertyService.updateProperty(req.user.userId, fileNumber, req.body);
    
    res.json({
      success: true,
      data: property,
      message: 'تم تحديث العقار بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete property
 */
const deleteProperty = async (req, res, next) => {
  try {
    const { fileNumber } = req.params;
    await propertyService.deleteProperty(req.user.userId, fileNumber);
    
    res.json({
      success: true,
      message: 'تم حذف العقار بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Search properties with logging
 */
const searchProperties = async (req, res, next) => {
  try {
    const result = await propertyService.searchProperties(req.user, req.query);
    
    res.json({
      success: true,
      data: result.properties,
      pagination: result.pagination,
      message: 'نتائج البحث'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  searchProperties
};
