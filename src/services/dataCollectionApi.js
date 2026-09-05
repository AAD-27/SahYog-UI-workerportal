import axios from 'axios';

// Data Collection backend base URL (overridable via env)
const dcApi = axios.create({
  baseURL: process.env.REACT_APP_DC_API_URL || 'http://localhost:8091/ms-data-collection',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

const post = async (path, payload = {}) => {
  const response = await dcApi.post(path, payload);
  return response.data;
};

// DC001 — Initiate Data Collection (new contract)
// Lookup (POST)
export const postLookupInitiateDC = async (applicationNum) => {
  const path = '/api/v1/initiate-dc/lookup';
  return post(path, { appOrCaseNum: applicationNum });
};

// Continue (POST)
export const postContinueInitiateDC = async (applicationNum, payload = {}) => {
  const path = '/api/v1/initiate-dc/continue';
  return post(path, { appOrCaseNum: applicationNum, ...payload });
};

// Backwards-compatible aliases (in case other code still uses old names)
export const getInitiateDC = postLookupInitiateDC;
export const postInitiateDC = postContinueInitiateDC;

// DC002 — Applicant Details
export const initializeApplicantDetails = async (payload = {}) => post('/api/v1/applicant-details/initialize', payload);
export const nextApplicantDetails = async (payload = {}) => post('/api/v1/applicant-details/next', payload);
export const previousApplicantDetails = async (payload = {}) => post('/api/v1/applicant-details/previous', payload);

// DC003 — Address Details
export const initializeAddressDetails = async (payload = {}) => post('/api/v1/address-details/initialize', payload);
export const nextAddressDetails = async (payload = {}) => post('/api/v1/address-details/next', payload);
export const previousAddressDetails = async (payload = {}) => post('/api/v1/address-details/previous', payload);

// DC004 — Person Summary
export const initializePersonSummary = async (payload = {}) => post('/api/v1/person-summary/initialize', payload);
export const nextPersonSummary = async (payload = {}) => post('/api/v1/person-summary/next', payload);
export const previousPersonSummary = async (payload = {}) => post('/api/v1/person-summary/previous', payload);
export const addNewPerson = async (payload = {}) => post('/api/v1/person-summary/add-new', payload);
export const editPerson = async (payload = {}) => post('/api/v1/person-summary/edit', payload);
export const deletePerson = async (payload = {}) => post('/api/v1/person-summary/delete', payload);

// DC005 — Person Information
export const initializePersonInformation = async (payload = {}) => post('/api/v1/person-information/initialize', payload);
export const nextPersonInformation = async (payload = {}) => post('/api/v1/person-information/next', payload);
export const previousPersonInformation = async (payload = {}) => post('/api/v1/person-information/previous', payload);

// DC006 — Program Details
export const initializeProgramDetails = async (payload = {}) => post('/api/v1/program-details/initialize', payload);
export const nextProgramDetails = async (payload = {}) => post('/api/v1/program-details/next', payload);
export const previousProgramDetails = async (payload = {}) => post('/api/v1/program-details/previous', payload);

// DC007 — Income Summary
export const initializeIncomeSummary = async (payload = {}) => post('/api/v1/income-summary/initialize', payload);
export const nextIncomeSummary = async (payload = {}) => post('/api/v1/income-summary/next', payload);
export const previousIncomeSummary = async (payload = {}) => post('/api/v1/income-summary/previous', payload);
export const addNewIncome = async (payload = {}) => post('/api/v1/income-summary/add-new', payload);
export const editIncome = async (payload = {}) => post('/api/v1/income-summary/edit', payload);
export const deleteIncome = async (payload = {}) => post('/api/v1/income-summary/delete', payload);

// DC008 — Income Details
export const initializeIncomeDetails = async (payload = {}) => post('/api/v1/income-details/initialize', payload);
export const nextIncomeDetails = async (payload = {}) => post('/api/v1/income-details/next', payload);
export const previousIncomeDetails = async (payload = {}) => post('/api/v1/income-details/previous', payload);

// DC009 — Expense Summary
export const initializeExpenseSummary = async (payload = {}) => post('/api/v1/expenses/summary/initialize', payload);
export const nextExpenseSummary = async (payload = {}) => post('/api/v1/expenses/summary/next', payload);
export const previousExpenseSummary = async (payload = {}) => post('/api/v1/expenses/summary/previous', payload);
export const addNewExpense = async (payload = {}) => post('/api/v1/expenses/summary/add-new', payload);
export const editExpense = async (payload = {}) => post('/api/v1/expenses/summary/edit', payload);
export const deleteExpense = async (payload = {}) => post('/api/v1/expenses/summary/delete', payload);

// DC010 — Expense Details
export const initializeExpenseDetails = async (payload = {}) => post('/api/v1/expenses/details/initialize', payload);
export const nextExpenseDetails = async (payload = {}) => post('/api/v1/expenses/details/next', payload);
export const previousExpenseDetails = async (payload = {}) => post('/api/v1/expenses/details/previous', payload);

// DC011 — Resource Summary
export const initializeResourceSummary = async (payload = {}) => post('/api/v1/resources/summary/initialize', payload);
export const nextResourceSummary = async (payload = {}) => post('/api/v1/resources/summary/next', payload);
export const previousResourceSummary = async (payload = {}) => post('/api/v1/resources/summary/previous', payload);
export const addNewResource = async (payload = {}) => post('/api/v1/resources/summary/add-new', payload);
export const editResource = async (payload = {}) => post('/api/v1/resources/summary/edit', payload);
export const deleteResource = async (payload = {}) => post('/api/v1/resources/summary/delete', payload);

// DC012 — Resource Details
export const initializeResourceDetails = async (payload = {}) => post('/api/v1/resources/details/initialize', payload);
export const nextResourceDetails = async (payload = {}) => post('/api/v1/resources/details/next', payload);
export const previousResourceDetails = async (payload = {}) => post('/api/v1/resources/details/previous', payload);

// DC013 — Disability Summary
export const initializeDisabilitySummary = async (payload = {}) => post('/api/v1/disabilities/summary/initialize', payload);
export const nextDisabilitySummary = async (payload = {}) => post('/api/v1/disabilities/summary/next', payload);
export const previousDisabilitySummary = async (payload = {}) => post('/api/v1/disabilities/summary/previous', payload);
export const addNewDisability = async (payload = {}) => post('/api/v1/disabilities/summary/add-new', payload);
export const editDisability = async (payload = {}) => post('/api/v1/disabilities/summary/edit', payload);
export const deleteDisability = async (payload = {}) => post('/api/v1/disabilities/summary/delete', payload);

// DC014 — Disability Details
export const initializeDisabilityDetails = async (payload = {}) => post('/api/v1/disabilities/details/initialize', payload);
export const nextDisabilityDetails = async (payload = {}) => post('/api/v1/disabilities/details/next', payload);
export const previousDisabilityDetails = async (payload = {}) => post('/api/v1/disabilities/details/previous', payload);

export default dcApi;
