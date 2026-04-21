import api from './axiosInstance';

export const getRequests = (params) => api.get('/requests', { params });
export const getMyRequests = (params) => api.get('/requests/my', { params });
export const getRequest = (id) => api.get(`/requests/${id}`);

// Submit request — supports both JSON and FormData (with images)
export const submitRequest = (data) => {
  if (data instanceof FormData) {
    return api.post('/requests', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  return api.post('/requests', data);
};

export const approveRequest = (id) => api.patch(`/requests/${id}/approve`);
export const rejectRequest = (id) => api.patch(`/requests/${id}/reject`);

// Get pending images for a request (Admin review)
export const getRequestImages = (requestId) =>
  api.get(`/requests/${requestId}/images`);
