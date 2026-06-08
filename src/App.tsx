import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Admin
import AdminPinRoute from './components/admin/AdminPinRoute';
import AdminLogin from './pages/admin/AdminLogin';
import AdminCharts from './pages/admin/AdminCharts';
import LandingPage from './pages/landing/LandingPage';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPayments from './pages/admin/AdminPayments';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import ProtectedRoute from './components/admin/ProtectedRoute';

// User
import UserRegister from './pages/user/UserRegister';
import UserLogin from './pages/user/UserLogin';
import UserDashboard from './pages/user/UserDashboard';
import UserProtectedRoute from './components/user/UserProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public user routes */}
          <Route path="/register" element={<UserRegister />} />
          <Route path="/login" element={<UserLogin />} />

          {/* Protected user dashboard */}
          <Route path="/dashboard" element={
            <UserProtectedRoute>
              <UserDashboard />
            </UserProtectedRoute>
          } />

          {/* Admin routes */}
          <Route
            path="/admin/login"
            element={
              <AdminPinRoute>
                <AdminLogin />
              </AdminPinRoute>
            }
          />
          <Route path="/admin" element={
            <AdminPinRoute>
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            </AdminPinRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="charts" element={<AdminCharts />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>

          {/* Landing page placeholder */}
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1C2B1A', color: '#D4AF6A', border: '0.5px solid #2e4029', fontFamily: 'EB Garamond, serif' },
        }}
      />
    </QueryClientProvider>
  );
}