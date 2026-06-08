import api from './client';

export const login = async (email: string, password: string) => {
  const res = await api.post('/auth/admin-login', { email, password });
  return res.data;
};
