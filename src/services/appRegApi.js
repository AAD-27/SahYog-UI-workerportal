import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '/',
  headers: {
    'Content-Type': 'application/json'
  }
});

const basePath = '/ms-application-registration/api/v1/register-application';

export const initializeRegistration = async () => {
  const response = await api.post(`${basePath}/initialize`);
  return response.data;
};

export const saveRegistrationStep = async (payload) => {
  const response = await api.post(`${basePath}/next`, payload);
  return response.data;
};

export const submitApplication = async (payload) => {
  const response = await api.post(`${basePath}/submit`, payload);
  return response.data;
};
