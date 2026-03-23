import api from './axiosInstance';

export const getLogs = (params) => api.get('/logs', { params });
