import api, { setAccessToken, clearAccessToken } from './axiosInstance';
import axios from 'axios';
import { API_BASE } from '../constants';

export const loginApi = async (username, password) => {
  const { data } = await api.post('/auth/login', { username, password });
  setAccessToken(data.data.accessToken);
  return data.data;
};

export const logoutApi = async () => {
  await api.post('/auth/logout');
  clearAccessToken();
};

export const refreshTokenApi = async () => {
  const { data } = await axios.post(`${API_BASE}/auth/refresh-token`, {}, { withCredentials: true });
  setAccessToken(data.data.accessToken);
  return data.data;
};
export const changePasswordApi = async (username, currentPassword, newPassword, confirmPassword) => {
  const { data } = await api.patch('/auth/change-password', { username, currentPassword, newPassword, confirmPassword });
  return data;
};
