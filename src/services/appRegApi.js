import axios from 'axios';

// The application-registration backend is the single source of truth.  Do not
// use the retired port-5000 mock server or the UI's local Express server.
const api = axios.create({
  baseURL: process.env.REACT_APP_APP_REG_API_URL || 'http://localhost:8090/ms-application-registration',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

const routes = {
  application: '/api/v1/register-application',
  address: '/api/v1/register-address',
  person: '/api/v1/register-person',
  program: '/api/v1/register-program',
  review: '/api/v1/register-review'
};

const post = async (path, payload = {}) => {
  const response = await api.post(path, payload);
  if (!response.data) {
    throw new Error(`Empty response from ${path}`);
  }
  return response.data;
};

export const initializeApplication = (payload) => post(`${routes.application}/initialize`, payload);
export const saveApplication = (payload) => post(`${routes.application}/next`, payload);

export const initializeAddress = (payload) => post(`${routes.address}/initialize`, payload);
export const saveAddress = (payload) => post(`${routes.address}/next`, payload);

export const initializePerson = (payload) => post(`${routes.person}/initialize`, payload);
export const savePerson = (payload) => post(`${routes.person}/next`, payload);

export const initializeProgram = (payload) => post(`${routes.program}/initialize`, payload);
export const saveProgram = (payload) => post(`${routes.program}/next`, payload);

export const initializeReview = (payload) => post(`${routes.review}/initialize`, payload);
export const submitReview = (payload) => post(`${routes.review}/submit`, payload);
