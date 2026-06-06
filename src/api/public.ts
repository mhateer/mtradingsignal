import axios from 'axios';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const getPublicCharts = async () => {
  const res = await publicApi.get('/signals/public/charts');
  return res.data;
};