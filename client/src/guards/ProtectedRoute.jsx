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
