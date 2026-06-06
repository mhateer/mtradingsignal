import api from './client';

export const getPendingSubscriptions = async () => {
  const res = await api.get('/admin/subscriptions/pending');
  return res.data;
};

export const confirmPayment = async (subscriptionId: string) => {
  const res = await api.post(`/admin/subscriptions/${subscriptionId}/confirm`);
  return res.data;
};

export const getAllUsers = async () => {
  const res = await api.get('/admin/users');
  return res.data;
};

export const activateUser = async (id: string) => {
  const res = await api.post(`/admin/users/${id}/activate`);
  return res.data;
};

export const deactivateUser = async (id: string) => {
  const res = await api.post(`/admin/users/${id}/deactivate`);
  return res.data;
};

export const resetApiKey = async (id: string) => {
  const res = await api.post(`/admin/users/${id}/reset-api-key`);
  return res.data;
};

export const deleteUser = async (id: string) => {
  const res = await api.delete(`/admin/users/${id}`);
  return res.data;
};

export const getAllSubscriptions = async () => {
  const res = await api.get('/admin/subscriptions');
  return res.data;
};

export const getUserSubscriptions = async (userId: string) => {
  const res = await api.get(`/admin/subscriptions/user/${userId}`);
  return res.data;
};

export const changePlan = async (id: string, plan: string) => {
  const res = await api.post(`/admin/subscriptions/${id}/change-plan`, { plan });
  return res.data;
};

export const addCalls = async (id: string, calls: number) => {
  const res = await api.post(`/admin/subscriptions/${id}/add-calls`, { calls });
  return res.data;
};

export const extendExpiry = async (id: string, days: number) => {
  const res = await api.post(`/admin/subscriptions/${id}/extend-expiry`, { days });
  return res.data;
};

export const cancelSubscription = async (id: string) => {
  const res = await api.post(`/admin/subscriptions/${id}/cancel`);
  return res.data;
};

export const refreshCharts = async () => {
  const res = await api.post('/admin/charts/refresh');
  return res.data;
};

export const getChartSnapshots = async () => {
  const res = await api.get('/admin/charts/snapshots');
  return res.data;
};

