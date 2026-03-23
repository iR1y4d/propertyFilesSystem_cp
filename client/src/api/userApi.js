import api from './axiosInstance';

export const getUsers = (params) => api.get('/users', { params });
export const getUser = (id) => api.get(`/users/${id}`);
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);
export const resetPassword = (id, data) => api.patch(`/users/${id}/reset-password`, data);
export const unlockAccount = (id) => api.patch(`/users/${id}/unlock`);
