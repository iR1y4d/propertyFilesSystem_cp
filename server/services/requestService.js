const requestModel = require('../models/requestModel');
const propertyModel = require('../models/propertyModel');
const logModel = require('../models/logModel');
const imageService = require('./imageService');
const { getClient } = require('../config/db');
const { LOG_ACTIONS, REQUEST_STATUS, REQUEST_TYPE, ROLES } = require('../config/constants');
const AppError = require('../utils/AppError');
const fs = require('fs');
const path = require('path');

/**
 * Submit a new change request
 */
const submitRequest = async (userId, data, files = []) => {
  const { propertyFileNumber, requestType, requestDescription, newData } = data;

  // 1. Fetch current property for snapshot
  const property = await propertyModel.findByFileNumber(propertyFileNumber);
  if (!property && requestType !== REQUEST_TYPE.ADD) {
    throw new AppError(404, 'العقار غير موجود');
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

    // 1. Get request inside transaction and lock the row
    const request = await requestModel.findById(requestId, client);
    if (!request) {
      throw new AppError(404, 'الطلب غير موجود');
    }

    if (request.status !== REQUEST_STATUS.PENDING) {
      throw new AppError(400, 'هذا الطلب تم التعامل معه مسبقاً');
    }

    // 2. Apply mutation to property
    if (request.request_type === REQUEST_TYPE.ADD) {
      await propertyModel.create({ ...request.new_data, propertyFileNumber: request.property_file_number }, client);
    } else if (request.request_type === REQUEST_TYPE.EDIT) {
      await propertyModel.update(request.property_file_number, request.new_data, client);
    } else if (request.request_type === REQUEST_TYPE.DELETE) {
      await propertyModel.softDelete(request.property_file_number, client);
    } else if (request.request_type === REQUEST_TYPE.DELETE_IMAGE) {
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

    // 5. Post-transaction file operations (async)
    if (request.request_type === REQUEST_TYPE.DELETE_IMAGE) {
      const imagesToDelete = request.new_data?.imagesToDelete || [];
      await Promise.all(
        imagesToDelete.map(filename => imageService.deleteImage(request.property_file_number, filename))
      );
    } else {
      // Move pending images to final location (async)
      await imageService.movePendingImages(requestId, request.property_file_number);
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
 * Reject a request with transaction
 */
const rejectRequest = async (adminUserId, requestId) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Fetch and lock request inside transaction
    const existing = await requestModel.findById(requestId, client);
    if (!existing) throw new AppError(404, 'الطلب غير موجود');
    
    if (existing.status !== REQUEST_STATUS.PENDING) {
      throw new AppError(400, 'هذا الطلب تم التعامل معه مسبقاً');
    }

    const request = await requestModel.updateStatus(client, requestId, REQUEST_STATUS.REJECTED);

    // 2. Audit log
    await client.query(
      'INSERT INTO logs (user_id, action, target) VALUES ($1, $2, $3)',
      [adminUserId, LOG_ACTIONS.REJECT, request.property_file_number]
    );

    await client.query('COMMIT');

    // 3. Delete pending images (async, outside transaction)
    await imageService.deletePendingImages(requestId);

    return { success: true, message: 'تم رفض الطلب بنجاح' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * List requests
 */
const listRequests = async (user, { page = 1, limit = 20, status, forceOwn = false }) => {
  let requests;
  let totalCount;

  if ((user.role === ROLES.ADMIN || user.role === ROLES.DEPARTMENT_HEAD) && !forceOwn) {
    [requests, totalCount] = await Promise.all([
      requestModel.findAll({ page, limit, status }),
      requestModel.count({ status })
    ]);
  } else {
    [requests, totalCount] = await Promise.all([
      requestModel.findByUser(user.userId, { page, limit, status }),
      requestModel.count({ userId: user.userId, status })
    ]);
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
 * Get request by ID with ownership checks
 */
const getRequest = async (user, id) => {
  const request = await requestModel.findById(id);
  if (!request) {
    throw new AppError(404, 'الطلب غير موجود');
  }
  // Employees can only view their own requests, whereas Admin and Department Head can view all
  if (user.role !== ROLES.ADMIN && user.role !== ROLES.DEPARTMENT_HEAD && request.requested_by !== user.userId) {
    throw new AppError(403, 'لا تملك صلاحية عرض هذا الطلب');
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
