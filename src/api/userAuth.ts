import api from './client';

export const initiateRegister = async (email: string, password: string, fullName: string) => {
  const res = await api.post('/auth/register', { email, password, fullName });
  return res.data;
};

export const verifyOtp = async (email: string, otp: string) => {
  const res = await api.post('/auth/verify-otp', { email, otp });
  return res.data;
};

export const resendOtp = async (email: string) => {
  const res = await api.post('/auth/resend-otp', { email });
  return res.data;
};

export const loginUser = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const getMySubscription = async () => {
  const res = await api.get('/subscriptions/active');
  return res.data;
};

export const getMySubscriptions = async () => {
  const res = await api.get('/subscriptions/my');
  return res.data;
};

export const requestSubscription = async (plan: string, paymentReference: string, paymentNote?: string) => {
  const res = await api.post('/subscriptions/request', { plan, paymentReference, paymentNote });
  return res.data;
};

export const getPlans = async () => {
  const res = await api.get('/subscriptions/plans');
  return res.data;
};

export const regenerateApiKey = async () => {
  const res = await api.post('/auth/regenerate-api-key');
  return res.data;
};