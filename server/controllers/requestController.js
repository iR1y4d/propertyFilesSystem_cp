const requestService = require('../services/requestService');

/**
 * Submit a new request
 */
const submitRequest = async (req, res, next) => {
  try {
    const result = await requestService.submitRequest(req.user.userId, req.body, req.files);
    res.status(201).json({
      success: true,
      data: result,
      message: 'تم تقديم طلب التعديل بنجاح، بانتظار موافقة المدير'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List requests
 */
const listRequests = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await requestService.listRequests(req.user, { page, limit, status });
    res.json({
      success: true,
      data: result.requests,
      pagination: result.pagination,
      message: 'تم جلب الطلبات بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List own requests (Employee)
 */
const listMyRequests = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await requestService.listRequests(req.user, { page, limit, status, forceOwn: true });
    res.json({
      success: true,
      data: result.requests,
      pagination: result.pagination,
      message: 'تم جلب طلباتي بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get request detail
 */
const getRequest = async (req, res, next) => {
  try {
    const result = await requestService.getRequest(req.user, req.params.id);
    res.json({
      success: true,
      data: result,
      message: 'تم جلب تفاصيل الطلب بنجاح'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Approve request
 */
const approveRequest = async (req, res, next) => {
  try {
    const result = await requestService.approveRequest(req.user.userId, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Reject request
 */
const rejectRequest = async (req, res, next) => {
  try {
    const result = await requestService.rejectRequest(req.user.userId, req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitRequest,
  listRequests,
  listMyRequests,
  getRequest,
  approveRequest,
  rejectRequest
};
