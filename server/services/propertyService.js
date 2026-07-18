const propertyModel = require('../models/propertyModel');
const logModel = require('../models/logModel');
const imageService = require('./imageService');
const { LOG_ACTIONS, ROLES, PROPERTY_STATUS } = require('../config/constants');
const AppError = require('../utils/AppError');

/**
 * List properties with role-based filtering
 */
const listProperties = async (user, { page = 1, limit = 20, status, location, propertyFileNumber, ownerName, nationalNumber, search }) => {
  // Parallel query performance optimization (PERF-02)
  const [properties, totalCount] = await Promise.all([
    propertyModel.findAll({ page, limit, status, location, propertyFileNumber, ownerName, nationalNumber, search }),
    propertyModel.count({ status, location, propertyFileNumber, ownerName, nationalNumber, search })
  ]);

  // Role-based filtering: employees see restricted info for RESERVED (محجوز) properties
  const filteredProperties = properties.map(p => {
    if (user.role === ROLES.EMPLOYEE && p.status === PROPERTY_STATUS.RESERVED) {
      return {
        property_file_number: p.property_file_number,
        status: p.status,
        is_restricted: true,
        message: 'التفاصيل محجوزة للمدراء فقط'
      };
    }
    return p;
  });

  // Enrich properties with has_images flag from filesystem in a single batch (PERF-01)
  const fileNumbers = filteredProperties
    .filter(p => !p.is_restricted)
    .map(p => p.property_file_number);
  const imagesStatus = await imageService.hasImagesBatch(fileNumbers);

  const enrichedProperties = filteredProperties.map(p => {
    if (p.is_restricted) return p;
    return { ...p, has_images: !!imagesStatus[p.property_file_number] };
  });

  return {
    properties: enrichedProperties,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page, 10),
      limit: parseInt(limit, 10)
    }
  };
};

/**
 * Get single property detail
 */
const getProperty = async (user, fileNumber) => {
  const property = await propertyModel.findByFileNumber(fileNumber);
  
  if (!property) {
    throw new AppError(404, 'العقار غير موجود');
  }

  // Block employee access to RESERVED details
  if (user.role === ROLES.EMPLOYEE && property.status === PROPERTY_STATUS.RESERVED) {
    throw new AppError(403, 'لا تملك صلاحية عرض تفاصيل هذا العقار المحجوز');
  }

  return property;
};

/**
 * Create property (Admin only)
 */
const createProperty = async (userId, data) => {
  // Check if file number exists
  const existing = await propertyModel.findByFileNumber(data.propertyFileNumber);
  if (existing) {
    throw new AppError(409, 'رقم ملف العقار موجود مسبقاً');
  }

  const property = await propertyModel.create(data);

  // Audit log
  await logModel.createLog({
    userId,
    action: LOG_ACTIONS.ADD,
    target: property.property_file_number
  });

  return property;
};

/**
 * Update property (Admin only)
 */
const updateProperty = async (userId, fileNumber, data) => {
  const property = await propertyModel.update(fileNumber, data);
  
  if (!property) {
    throw new AppError(404, 'العقار غير موجود');
  }

  // Audit log
  await logModel.createLog({
    userId,
    action: LOG_ACTIONS.EDIT,
    target: fileNumber
  });

  return property;
};

/**
 * Soft delete property (Admin only)
 */
const deleteProperty = async (userId, fileNumber) => {
  const property = await propertyModel.softDelete(fileNumber);
  
  if (!property) {
    throw new AppError(404, 'العقار غير موجود');
  }

  // Audit log
  await logModel.createLog({
    userId,
    action: LOG_ACTIONS.DELETE,
    target: fileNumber
  });

  return property;
};

/**
 * Search properties specifically with logging
 */
const searchProperties = async (user, queryParams) => {
  const result = await listProperties(user, queryParams);

  // Create a readable summary of search criteria
  const { propertyFileNumber, ownerName, nationalNumber, location, status, search } = queryParams;
  const terms = [];
  if (search) terms.push(`بحث شامل: ${search}`);
  if (propertyFileNumber) terms.push(`رقم الملف: ${propertyFileNumber}`);
  if (ownerName) terms.push(`المالك: ${ownerName}`);
  if (nationalNumber) terms.push(`الرقم الوطني: ${nationalNumber}`);
  if (location) terms.push(`الموقع: ${location}`);
  if (status) terms.push(`الحالة: ${status}`);

  const target = terms.length > 0 ? terms.join(' | ') : 'بحث عام';

  // Audit log search
  await logModel.createLog({
    userId: user.userId,
    action: LOG_ACTIONS.SEARCH,
    target: target
  });

  return result;
};

module.exports = {
  listProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  searchProperties
};
