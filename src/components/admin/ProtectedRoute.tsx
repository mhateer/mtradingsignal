import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (!user?.isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}