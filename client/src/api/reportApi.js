import api from './axiosInstance';

export const exportProperties = (format) =>
  api.get(`/reports/properties/${format}`, { responseType: 'arraybuffer' });
export const exportLogs = (format) =>
  api.get(`/reports/logs/${format}`, { responseType: 'arraybuffer' });
export const exportSearchProperties = (format, params) =>
  api.get(`/reports/properties-search/${format}`, { params, responseType: 'arraybuffer' });
export const getFormFile = (filename) =>
  api.get(`/reports/forms/${filename}`, { responseType: 'blob' });

