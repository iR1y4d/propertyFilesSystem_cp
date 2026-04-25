const requestModel = require('../models/requestModel');
const propertyModel = require('../models/propertyModel');
const logModel = require('../models/logModel');
const imageService = require('./imageService');
const { getClient } = require('../config/db');
const { LOG_ACTIONS, REQUEST_STATUS } = require('../config/constants');
const fs = require('fs');
const path = require('path');

/**
 * Submit a new change request
 */
const submitRequest = async (userId, data, files = []) => {
  const { propertyFileNumber, requestType, requestDescription, newData } = data;

  // 1. Fetch current property for snapshot
  const property = await propertyModel.findByFileNumber(propertyFileNumber);
  if (!property && requestType !== 'إضافة') {
    throw { statusCode: 404, message: 'العقار غير موجود' };
  }

  // 2. Create request
  const request = await requestModel.create(null, {
    propertyFileNumber,
    requestedBy: userId,
    requestDescription,
    oldData: property || null,
    newData,
    requestType
  });

  // 3. If images were uploaded, rename temp folder to use request ID
  if (files && files.length > 0 && files[0]?.destination) {
    const tempDir = files[0].destination;
    const pendingDir = path.join(__dirname, '..', 'uploads', 'pending', String(request.request_id));
    if (fs.existsSync(tempDir)) {
      fs.renameSync(tempDir, pendingDir);
    }
  }

  // 4. Audit log
  await logModel.createLog({
    userId,
    action: LOG_ACTIONS.REQUEST,
    target: propertyFileNumber
  });

  return request;
};

/**
 * Approve a request with transaction
 */
const approveRequest = async (adminUserId, requestId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Get request
    const request = await requestModel.findById(requestId);
    if (!request) {
      throw { statusCode: 404, message: 'الطلب غير موجود' };
    }

    if (request.status !== REQUEST_STATUS.PENDING) {
      throw { statusCode: 400, message: 'هذا الطلب تم التعامل معه مسبقاً' };
    }

    // 2. Apply mutation to property
    if (request.request_type === 'إضافة') {
      await propertyModel.create({ ...request.new_data, propertyFileNumber: request.property_file_number }, client);
    } else if (request.request_type === 'تعديل') {
      await propertyModel.update(request.property_file_number, request.new_data, client);
    } else if (request.request_type === 'حذف') {
      await propertyModel.softDelete(request.property_file_number, client);
    } else if (request.request_type === 'حذف_صور') {
      // No property mutation needed, handled outside transaction
    }

    // 3. Update request status
    await requestModel.updateStatus(client, requestId, REQUEST_STATUS.APPROVED);

    // 4. Audit log
    await client.query(
      'INSERT INTO logs (user_id, action, target) VALUES ($1, $2, $3)',
      [adminUserId, LOG_ACTIONS.APPROVE, request.property_file_number]
    );

    await client.query('COMMIT');

    // 5. Post-transaction file operations
    if (request.request_type === 'حذف_صور') {
      const imagesToDelete = request.new_data?.imagesToDelete || [];
      imagesToDelete.forEach(filename => {
        imageService.deleteImage(request.property_file_number, filename);
      });
    } else {
      // Move pending images to final location (outside transaction — filesystem ops)
      imageService.movePendingImages(requestId, request.property_file_number);
    }

    return { success: true, message: 'تم قبول الطلب وتطبيق التغييرات بنجاح' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Reject a request
 */
const rejectRequest = async (adminUserId, requestId) => {
  const existing = await requestModel.findById(requestId);
  if (!existing) throw { statusCode: 404, message: 'الطلب غير موجود' };
  
  if (existing.status !== REQUEST_STATUS.PENDING) {
    throw { statusCode: 400, message: 'هذا الطلب تم التعامل معه مسبقاً' };
  }

  const request = await requestModel.updateStatus(null, requestId, REQUEST_STATUS.REJECTED);

  // Delete pending images
  imageService.deletePendingImages(requestId);

  // Audit log
  await logModel.createLog({
    userId: adminUserId,
    action: LOG_ACTIONS.REJECT,
    target: request.property_file_number
  });

  return { success: true, message: 'تم رفض الطلب بنجاح' };
};

/**
 * List requests
 */
const listRequests = async (user, { page = 1, limit = 20, status }) => {
  let requests;
  let totalCount;

  if (user.role === 'مدير') {
    requests = await requestModel.findAll({ page, limit, status });
    totalCount = await requestModel.count({ status });
  } else {
    requests = await requestModel.findByUser(user.userId, { page, limit });
    totalCount = await requestModel.count({ userId: user.userId });
  }

  return {
    requests,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page, 10),
      limit: parseInt(limit, 10)
    }
  };
};

/**
 * Get request by ID
 */
const getRequest = async (id) => {
  const request = await requestModel.findById(id);
  if (!request) {
    throw { statusCode: 404, message: 'الطلب غير موجود' };
  }
  return request;
};

module.exports = {
  submitRequest,
  approveRequest,
  rejectRequest,
  listRequests,
  getRequest
};
