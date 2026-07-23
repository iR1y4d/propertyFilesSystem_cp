import api, { setAccessToken, clearAccessToken } from './axiosInstance';
import axios from 'axios';
import { API_BASE } from '../constants';

export const loginApi = async (username, password) => {
  // Use raw axios (not interceptor-wrapped `api`) so 401 errors from wrong
  // credentials propagate to the caller instead of triggering token-refresh.
  const { data } = await axios.post(`${API_BASE}/auth/login`, { username, password }, { withCredentials: true });
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
