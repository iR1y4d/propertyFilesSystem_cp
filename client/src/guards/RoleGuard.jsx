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
