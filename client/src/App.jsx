import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './guards/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import Requests from './pages/Requests';
import RequestDetail from './pages/RequestDetail';
import Users from './pages/Users';
import Logs from './pages/Logs';
import Reports from './pages/Reports';
import RoleGuard from './guards/RoleGuard';
import { ROLES } from './constants';

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
            <Route index element={<Dashboard />} />
            <Route path="properties" element={<Properties />} />
            <Route path="properties/:fileNumber" element={<PropertyDetail />} />
            <Route path="requests" element={<Requests />} />
            <Route path="requests/:id" element={<RequestDetail />} />
            <Route path="users" element={
              <RoleGuard roles={[ROLES.ADMIN]}>
                <Users />
              </RoleGuard>
            } />
            <Route path="logs" element={
              <RoleGuard roles={[ROLES.ADMIN]}>
                <Logs />
              </RoleGuard>
            } />
            <Route path="reports" element={<Reports />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
