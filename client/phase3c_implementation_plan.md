# Phase 3C — Frontend Foundation: Implementation Plan

> **Audience:** AI agents executing this plan.
> **Prerequisite:** Phase 3B backend is complete and running on `http://localhost:3000`.
> **Scope:** React project setup, auth flow, layout shell, and API infrastructure.

---

## 1. Project Initialization

### 1.1 Create Vite + React Project

```bash
cd c:\Users\User\Desktop\IT_CAPSTONE_PROJECT
npx -y create-vite@latest client --template react
cd client
npm install
```

### 1.2 Install Dependencies

```bash
npm install react-router-dom@6 axios react-hot-toast react-icons
npm install -D tailwindcss @tailwindcss/vite
```

### 1.3 Configure Tailwind CSS v4

In `vite.config.js`:
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
```

In `src/index.css` (replace all content):
```css
@import "tailwindcss";

/* Google Fonts - Cairo (Arabic-compatible) */
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap');

/* ===== Design Tokens ===== */
@theme {
  --color-primary: #1e3a5f;
  --color-primary-light: #2c5282;
  --color-primary-dark: #152a45;
  --color-accent: #3182ce;
  --color-accent-light: #63b3ed;
  --color-success: #38a169;
  --color-warning: #d69e2e;
  --color-danger: #e53e3e;
  --color-bg: #f7fafc;
  --color-surface: #ffffff;
  --color-sidebar: #1a202c;
  --color-text: #2d3748;
  --color-text-light: #718096;
  --color-border: #e2e8f0;
}

/* ===== Global Styles ===== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  direction: rtl;
}

body {
  font-family: 'Cairo', sans-serif;
  background-color: var(--color-bg);
  color: var(--color-text);
  min-height: 100vh;
}
```

---

## 2. File Structure

Create the following directory tree inside `client/src/`:

```
src/
├── api/
│   ├── axiosInstance.js      ← Axios config + interceptors
│   └── authApi.js            ← Login/logout/refresh calls
├── components/
│   ├── common/
│   │   ├── Button.jsx        ← Reusable styled button
│   │   ├── Input.jsx         ← Reusable form input
│   │   ├── Spinner.jsx       ← Loading spinner
│   │   └── Modal.jsx         ← Confirmation dialog
│   └── layout/
│       ├── Sidebar.jsx       ← Navigation sidebar
│       ├── Header.jsx        ← Top header bar
│       └── AppLayout.jsx     ← Main layout wrapper
├── context/
│   └── AuthContext.jsx       ← Auth state provider
├── guards/
│   ├── ProtectedRoute.jsx    ← Requires authentication
│   └── RoleGuard.jsx         ← Requires specific role
├── hooks/
│   └── useAuth.js            ← useContext(AuthContext) shortcut
├── pages/
│   ├── Login.jsx             ← Login page
│   └── NotFound.jsx          ← 404 page
├── constants/
│   └── index.js              ← Roles, statuses, labels
├── App.jsx                   ← Root component with routes
├── main.jsx                  ← Entry point
└── index.css                 ← Tailwind + global styles
```

---

## 3. File Specifications

### 3.1 `src/constants/index.js`

```js
export const ROLES = {
  ADMIN: 'مدير',
  EMPLOYEE: 'موظف'
};

export const PROPERTY_STATUS = {
  TEMPORARY: 'مؤقت',
  CERTIFIED: 'مصدق',
  RESERVED: 'محجوز'
};

export const REQUEST_STATUS = {
  PENDING: 'معلق',
  APPROVED: 'مقبول',
  REJECTED: 'مرفوض'
};

export const STATUS_COLORS = {
  'مؤقت': 'bg-yellow-100 text-yellow-800',
  'مصدق': 'bg-green-100 text-green-800',
  'محجوز': 'bg-red-100 text-red-800',
  'معلق': 'bg-blue-100 text-blue-800',
  'مقبول': 'bg-green-100 text-green-800',
  'مرفوض': 'bg-red-100 text-red-800'
};

export const API_BASE = '/api/v1';
```

---

### 3.2 `src/api/axiosInstance.js`

```js
import axios from 'axios';
import { API_BASE } from '../constants';

let accessToken = null;

export const setAccessToken = (token) => { accessToken = token; };
export const getAccessToken = () => accessToken;
export const clearAccessToken = () => { accessToken = null; };

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Send cookies (refresh token)
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor — handle 401 with silent refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh-token`, {}, { withCredentials: true });
        setAccessToken(data.data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAccessToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### 3.3 `src/api/authApi.js`

```js
import api, { setAccessToken, clearAccessToken } from './axiosInstance';

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
  const { data } = await api.post('/auth/refresh-token');
  setAccessToken(data.data.accessToken);
  return data.data;
};
```

---

### 3.4 `src/context/AuthContext.jsx`

```jsx
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
```

---

### 3.5 `src/hooks/useAuth.js`

```js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

---

### 3.6 `src/guards/ProtectedRoute.jsx`

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/common/Spinner';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <Spinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
```

---

### 3.7 `src/guards/RoleGuard.jsx`

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RoleGuard = ({ roles, children }) => {
  const { user } = useAuth();

  if (!roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleGuard;
```

---

### 3.8 `src/components/common/Button.jsx`

```jsx
const variants = {
  primary: 'bg-primary text-white hover:bg-primary-light',
  danger: 'bg-danger text-white hover:bg-red-600',
  outline: 'border border-primary text-primary hover:bg-primary hover:text-white',
  ghost: 'text-text-light hover:bg-gray-100'
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
};

const Button = ({ children, variant = 'primary', size = 'md', disabled, loading, className = '', ...props }) => {
  return (
    <button
      className={`rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />}
      {children}
    </button>
  );
};

export default Button;
```

---

### 3.9 `src/components/common/Input.jsx`

```jsx
const Input = ({ label, error, id, type = 'text', ...props }) => {
  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
          error
            ? 'border-danger focus:ring-danger/30'
            : 'border-border focus:ring-accent/30 focus:border-accent'
        }`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
};

export default Input;
```

---

### 3.10 `src/components/common/Spinner.jsx`

```jsx
const Spinner = ({ fullScreen = false }) => {
  const spinner = (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
    </div>
  );

  if (fullScreen) {
    return <div className="fixed inset-0 flex items-center justify-center bg-bg/80 z-50">{spinner}</div>;
  }

  return spinner;
};

export default Spinner;
```

---

### 3.11 `src/components/common/Modal.jsx`

```jsx
import Button from './Button';

const Modal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'تأكيد', cancelText = 'إلغاء', variant = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-bold text-text mb-2">{title}</h3>
        <p className="text-text-light mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onCancel}>{cancelText}</Button>
          <Button variant={variant} onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
```

---

### 3.12 `src/components/layout/Sidebar.jsx`

```jsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants';
import { FiHome, FiFileText, FiSend, FiUsers, FiList, FiBarChart2, FiLogOut } from 'react-icons/fi';

const navItems = [
  { to: '/', label: 'لوحة التحكم', icon: FiHome, roles: [ROLES.ADMIN, ROLES.EMPLOYEE] },
  { to: '/properties', label: 'العقارات', icon: FiFileText, roles: [ROLES.ADMIN, ROLES.EMPLOYEE] },
  { to: '/requests', label: 'الطلبات', icon: FiSend, roles: [ROLES.ADMIN, ROLES.EMPLOYEE] },
  { to: '/users', label: 'المستخدمين', icon: FiUsers, roles: [ROLES.ADMIN] },
  { to: '/logs', label: 'سجل التدقيق', icon: FiList, roles: [ROLES.ADMIN] },
  { to: '/reports', label: 'التقارير', icon: FiBarChart2, roles: [ROLES.ADMIN, ROLES.EMPLOYEE] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed right-0 top-0 h-screen w-64 bg-sidebar text-white flex flex-col z-40">
      {/* Logo Area */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-lg font-bold">إدارة الملفات العقارية</h1>
        <p className="text-xs text-gray-400 mt-1">هيئة التسجيل العقاري</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems
          .filter(item => item.roles.includes(user?.role))
          .map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-white border-l-4 border-accent-light'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
      </nav>

      {/* User Info + Logout */}
      <div className="p-4 border-t border-white/10">
        <div className="text-sm mb-3">
          <p className="font-medium">{user?.firstName} {user?.lastName}</p>
          <p className="text-xs text-gray-400">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors w-full cursor-pointer"
        >
          <FiLogOut size={16} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
```

---

### 3.13 `src/components/layout/Header.jsx`

```jsx
import { useAuth } from '../../hooks/useAuth';

const Header = ({ title }) => {
  const { user } = useAuth();

  return (
    <header className="bg-surface border-b border-border px-8 py-4 flex items-center justify-between">
      <h2 className="text-xl font-bold text-text">{title}</h2>
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-light">
          مرحباً، {user?.firstName}
        </span>
        <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
          {user?.role}
        </span>
      </div>
    </header>
  );
};

export default Header;
```

---

### 3.14 `src/components/layout/AppLayout.jsx`

```jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const AppLayout = () => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 mr-64">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
```

---

### 3.15 `src/pages/Login.jsx`

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors = {};
    if (!username.trim()) newErrors.username = 'اسم المستخدم مطلوب';
    if (!password) newErrors.password = 'كلمة المرور مطلوبة';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const data = await loginApi(username, password);
      login(data);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'حدث خطأ في تسجيل الدخول';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark to-primary p-4">
      <div className="bg-surface rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏛️</span>
          </div>
          <h1 className="text-2xl font-bold text-text">نظام إدارة الملفات العقارية</h1>
          <p className="text-text-light text-sm mt-1">هيئة التسجيل العقاري</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            id="username"
            label="اسم المستخدم"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={errors.username}
            autoFocus
          />
          <Input
            id="password"
            label="كلمة المرور"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <Button type="submit" loading={loading} className="w-full mt-4">
            تسجيل الدخول
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
```

---

### 3.16 `src/pages/NotFound.jsx`

```jsx
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-xl text-text-light mb-8">الصفحة المطلوبة غير موجودة</p>
      <Link to="/">
        <Button>العودة للرئيسية</Button>
      </Link>
    </div>
  );
};

export default NotFound;
```

---

### 3.17 `src/App.jsx`

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './guards/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: { fontFamily: 'Cairo', direction: 'rtl' }
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected layout */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Placeholder — Dashboard will be added in Phase 3D */}
            <Route index element={<div className="p-8"><h1 className="text-2xl font-bold">لوحة التحكم</h1><p className="text-text-light mt-2">قيد التطوير — المرحلة 3D</p></div>} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

---

### 3.18 `src/main.jsx`

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

---

## 4. Build Order

Execute in this sequence — each step depends on the previous:

| Step | Files | Why |
|------|-------|-----|
| 1 | Project init + Vite + Tailwind + `index.css` | Foundation |
| 2 | `constants/index.js` | Shared values used everywhere |
| 3 | `api/axiosInstance.js` → `api/authApi.js` | Network layer |
| 4 | `context/AuthContext.jsx` → `hooks/useAuth.js` | Auth state |
| 5 | `components/common/*` (Button, Input, Spinner, Modal) | UI atoms |
| 6 | `guards/ProtectedRoute.jsx` → `guards/RoleGuard.jsx` | Route protection |
| 7 | `components/layout/*` (Sidebar, Header, AppLayout) | Shell |
| 8 | `pages/Login.jsx` → `pages/NotFound.jsx` | Pages |
| 9 | `App.jsx` → `main.jsx` | Wire everything |

---

## 5. Agent Constraints

> [!CAUTION]
> These rules are non-negotiable.

1. **RTL everywhere.** `html { direction: rtl }` is set globally. The sidebar is on the **right** side. Use `mr-64` (not `ml-64`) for main content offset.
2. **Arabic text only.** All UI labels, messages, placeholders must be in Arabic.
3. **Access token in memory.** Never store the access token in `localStorage` or `sessionStorage`. It is stored in a JavaScript variable inside `axiosInstance.js`.
4. **Refresh token in HttpOnly cookie.** The backend sets this automatically. Use `withCredentials: true` on Axios.
5. **No hardcoded API URLs.** Always use `API_BASE` from `constants/index.js`.
6. **Use Tailwind CSS v4.** Do NOT use `tailwind.config.js`. Tailwind v4 uses `@theme` in CSS and the `@tailwindcss/vite` plugin.
7. **Google Font Cairo.** Import via `@import url(...)` in `index.css`.
8. **Government theme.** Use muted blues, grays, white backgrounds. No bright or playful colors.
9. **Functional components only.** No class components.
10. **Toast for feedback.** Use `react-hot-toast` for success/error notifications. No `alert()`.

---

## 6. Verification Plan

### 6.1 Automated

```bash
cd client
npm run dev
```

The dev server should start on `http://localhost:5173` without errors.

### 6.2 Manual Checks

| # | Check | Expected Result |
|---|-------|-----------------|
| V1 | Visit `http://localhost:5173/login` | Login form renders in Arabic, RTL layout |
| V2 | Submit empty form | Client validation shows Arabic error messages |
| V3 | Login with valid credentials (`admin` / seed password) | Redirects to `/`, sidebar shows, toast says "تم تسجيل الدخول بنجاح" |
| V4 | Sidebar reflects user role | Admin sees all 6 nav items; employee sees 4 |
| V5 | Visit `/some-random-path` | 404 page renders with "العودة للرئيسية" button |
| V6 | Click "تسجيل الخروج" | Redirects to `/login`, access token cleared |
| V7 | Visit `/` while logged out | Redirected to `/login` |
| V8 | Refresh page while logged in | Session restored via refresh token (no re-login) |
| V9 | Inspect network tab on login | Access token is NOT in any cookie or localStorage |

---

## 7. Notes for Phase 3D

Phase 3D will build on this foundation by adding:
- Dashboard page (admin stats + employee's own requests)
- Properties list + detail + search pages
- Request submission + listing pages
- User management page (admin)
- Logs viewer (admin)
- Report export buttons

All these pages will use the `AppLayout`, `ProtectedRoute`, `RoleGuard`, and `api/` infrastructure created in this phase.
