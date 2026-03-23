import api from './axiosInstance';

export const getRequests = (params) => api.get('/requests', { params });
export const getMyRequests = (params) => api.get('/requests/my', { params });
export const getRequest = (id) => api.get(`/requests/${id}`);
export const submitRequest = (data) => api.post('/requests', data);
export const approveRequest = (id) => api.patch(`/requests/${id}/approve`);
export const rejectRequest = (id) => api.patch(`/requests/${id}/reject`);
