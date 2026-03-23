import api from './axiosInstance';

export const exportProperties = (format) =>
  api.get(`/reports/properties/${format}`, { responseType: 'blob' });
export const exportLogs = (format) =>
  api.get(`/reports/logs/${format}`, { responseType: 'blob' });
