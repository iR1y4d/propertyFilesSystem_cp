import { createContext, useState, useEffect, useCallback } from 'react';
import { refreshTokenApi, logoutApi } from '../api/authApi';
import { clearAccessToken } from '../api/axiosInstance';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // { userId, username, firstName, lastName, role }
  const [loading, setLoading] = useState(true);  // Initial load

  // Try to restore session on mount via refresh token cookie
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const data = await refreshTokenApi();
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    tryRefresh();
  }, []);

  const login = useCallback((userData) => {
    setUser(userData.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } catch { /* ignore */ }
    clearAccessToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === 'مدير' }}>
      {children}
    </AuthContext.Provider>
  );
};
