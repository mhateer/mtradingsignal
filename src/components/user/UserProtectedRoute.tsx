import { Navigate } from 'react-router-dom';
import { useUserAuthStore } from '../../store/userAuthStore';

export default function UserProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useUserAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}