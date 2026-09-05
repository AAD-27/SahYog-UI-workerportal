import axios from 'axios';

const authApi = axios.create({
  baseURL: process.env.REACT_APP_DC_API_URL || 'http://localhost:8091/ms-data-collection',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

authApi.interceptors.request.use((config) => {
  const accessToken = sessionStorage.getItem('sahyogAccessToken');
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

const post = async (path, payload) => {
  const response = await authApi.post(path, payload);
  return response.data;
};

export const loginGovernmentOfficial = (payload) => post('/api/v1/auth/government-official/login', payload);
export const loginCitizen = (payload) => post('/api/v1/auth/citizen/login', payload);
export const registerGovernmentOfficial = (payload) => post('/api/v1/auth/government-official/register', payload);
export const registerCitizen = (payload) => post('/api/v1/auth/citizen/register', payload);
export const fetchCitizenApplicationContext = (payload) => post('/api/v1/auth/citizen/application-context', payload);

export const getAuthErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.response?.data?.error || error?.message || fallback;

export default authApi;
