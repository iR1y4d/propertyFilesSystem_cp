import api from './axiosInstance';

export const getProperties = (params) => api.get('/properties', { params });
export const searchProperties = (params) => api.get('/properties/search', { params });
export const getProperty = (fileNumber) => api.get(`/properties/${fileNumber}`);
export const createProperty = (data) => api.post('/properties', data);
export const updateProperty = (fileNumber, data) => api.put(`/properties/${fileNumber}`, data);
export const deleteProperty = (fileNumber) => api.delete(`/properties/${fileNumber}`);

// Image API — reads from filesystem, no upload needed
export const getPropertyImages = (fileNumber) =>
  api.get(`/properties/${fileNumber}/images`);
