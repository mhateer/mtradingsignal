import { create } from 'zustand';

interface UserData {
  id: string;
  email: string;
  fullName: string;
  apiKey: string;
}

interface UserAuthState {
  token: string | null;
  user: UserData | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserData) => void;
  logout: () => void;
  updateUser: (user: UserData) => void;
}

export const useUserAuthStore = create<UserAuthState>((set) => ({
  token: localStorage.getItem('user_token'),
  user: localStorage.getItem('user_data')
    ? JSON.parse(localStorage.getItem('user_data')!)
    : null,
  isAuthenticated: !!localStorage.getItem('user_token'),

  login: (token, user) => {
    localStorage.setItem('user_token', token);
    localStorage.setItem('user_data', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_data');
    set({ token: null, user: null, isAuthenticated: false });
  },

  updateUser: (user) => {
    localStorage.setItem('user_data', JSON.stringify(user));
    set({ user });
  },
}));