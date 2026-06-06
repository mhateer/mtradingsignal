import api from './client';

export const getPlans = async () => {
  const res = await api.get('/subscriptions/plans');
  return res.data;
};

export const getPublicSignals = async () => {
  const res = await api.get('/signals/gold/public');
  return res.data;
};
