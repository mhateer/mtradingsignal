import { create } from 'zustand';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
}

interface AuthState {
  token: string | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('admin_token'),
  user: localStorage.getItem('admin_user')
    ? JSON.parse(localStorage.getItem('admin_user')!)
    : null,
  isAuthenticated: !!localStorage.getItem('admin_token'),

  login: (token, user) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
