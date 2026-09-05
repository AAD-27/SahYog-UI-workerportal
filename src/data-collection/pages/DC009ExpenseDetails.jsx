import React, { useEffect, useMemo, useState } from 'react';
import { initializeExpenseDetails, nextExpenseDetails, previousExpenseDetails } from '../../services/dataCollectionApi';

const expenseOptions = {
  Housing: ['House Rent', 'Home Loan EMI'],
  Utilities: ['Electricity Bill', 'Water Bill', 'Gas Bill'],
  Food: ['Grocery', 'Food Expenses'],
  Healthcare: ['Medical Expenses', 'Medicines', 'Hospital Bills'],
  Education: ['School Fees', 'College Fees', 'Books', 'Transportation'],
  Financial: ['Loan EMI', 'Insurance Premium']
};
const expenseFrequencies = ['One Time', 'Weekly', 'Monthly', 'Quarterly', 'Annually'];
const emptyExpense = { expenseId: null, expenseType: '', expenseDetails: '', expenseFrequency: '', expenseAmount: '', expenseStartDate: '', expenseEndDate: '' };

const normalizeFrequency = (value) => expenseFrequencies.find((item) => item.toLowerCase() === String(value || '').toLowerCase()) || value || '';
const normalizeExpense = (response) => {
  const raw = response?.data || response;
  const expense = raw?.expense || (raw?.expenseType ? raw : null);
  if (!expense || typeof expense !== 'object') return null;
  return {
    ...emptyExpense,
    ...expense,
    expenseDetails: expense.expenseDetails || expense.expenseDetail || expense.description || '',
    expenseFrequency: normalizeFrequency(expense.expenseFrequency || expense.frequency)
  };
};
const isValidationResponse = (response) => response && parseInt(response.status, 10) === 512;
const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.response?.data?.msg || fallback;

function DC009ExpenseDetails({ caseContext, updateCaseContext, onContinue, onPrevious }) {
  const startingExpense = useMemo(() => normalizeExpense(caseContext.selectedExpense) || emptyExpense, [caseContext.selectedExpense]);
  const [form, setForm] = useState(startingExpense);
  const [initialData, setInitialData] = useState(startingExpense);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (current = form) => {
    const nextErrors = {};
    if (!current.expenseType) nextErrors.expenseType = 'Expense type is required.';
    if (!current.expenseDetails) nextErrors.expenseDetails = 'Expense detail is required.';
    if (!current.expenseFrequency) nextErrors.expenseFrequency = 'Expense frequency is required.';
    if (current.expenseAmount === '' || Number(current.expenseAmount) < 0) nextErrors.expenseAmount = 'Enter an expense amount of zero or greater.';
    if (!current.expenseStartDate) nextErrors.expenseStartDate = 'Expense start date is required.';
    if (current.expenseEndDate && current.expenseStartDate && current.expenseEndDate < current.expenseStartDate) nextErrors.expenseEndDate = 'Expense end date cannot be before the start date.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = (field) => (event) => {
    let value = event.target.value;
    if (field === 'expenseAmount') value = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setForm((previous) => {
      if (field === 'expenseType') return { ...previous, expenseType: value, expenseDetails: '' };
      return { ...previous, [field]: value };
    });
    setErrors((previous) => field === 'expenseType' ? { ...previous, expenseType: undefined, expenseDetails: undefined } : { ...previous, [field]: undefined });
  };

  const buildPayload = () => ({
    appOrCaseNum: caseContext.applicationNumber,
    pageId: 'DC010',
    expense: {
      expenseId: form.expenseId,
      expenseType: form.expenseType,
      expenseDetail: form.expenseDetails,
      expenseFrequency: form.expenseFrequency,
      expenseAmount: Number(form.expenseAmount),
      expenseStartDate: form.expenseStartDate,
      expenseEndDate: form.expenseEndDate || ''
    }
  });
  const applyResponse = (response) => {
    const expense = normalizeExpense(response);
    if (!expense) return;
    setForm(expense); setInitialData(expense); updateCaseContext({ selectedExpense: expense });
  };

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      if (!caseContext.applicationNumber) return;
      try {
        const response = await initializeExpenseDetails({ appOrCaseNum: caseContext.applicationNumber, pageId: 'DC010', expenseId: startingExpense.expenseId });
        if (!mounted) return;
        if (isValidationResponse(response)) { setMessage(response.message || 'Unable to load expense details.'); setMessageType('warning'); return; }
        applyResponse(response);
      } catch (error) {
        if (!mounted) return;
        setMessage(getErrorMessage(error, 'Unable to load expense details. You can continue with manual entry.')); setMessageType('warning');
      }
    };
    initialize();
    return () => { mounted = false; };
  }, [caseContext.applicationNumber, caseContext.expenseMode, startingExpense.expenseId]);

  const handleNext = async () => {
    if (!validate()) { setMessage('Please correct the highlighted fields before proceeding.'); setMessageType('warning'); return; }
    setMessage(''); setMessageType(''); setIsSubmitting(true);
    try {
      const response = await nextExpenseDetails(buildPayload());
      if (isValidationResponse(response)) { setMessage(response.message || 'Validation error'); setMessageType('warning'); return; }
      updateCaseContext({ selectedExpense: { ...form, expenseId: response?.expenseId ?? form.expenseId }, expenseMode: 'edit' });
      if (typeof onContinue === 'function') onContinue();
      else setMessage(response?.message || 'Expense details saved successfully.');
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to save expense details.')); setMessageType('warning'); }
    finally { setIsSubmitting(false); }
  };

  const handlePrevious = async () => {
    setMessage(''); setMessageType(''); setIsSubmitting(true);
    try {
      const response = await previousExpenseDetails(buildPayload());
      if (isValidationResponse(response)) { setMessage(response.message || 'Validation error'); setMessageType('warning'); return; }
      updateCaseContext({ selectedExpense: { ...form, expenseId: response?.expenseId ?? form.expenseId }, expenseMode: 'edit' });
      if (typeof onPrevious === 'function') onPrevious();
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to go back. Please try again.')); setMessageType('warning'); }
    finally { setIsSubmitting(false); }
  };

  const handleCancel = () => {
    setForm(initialData);
    setErrors({});
    setMessage('');
    setMessageType('');
    updateCaseContext({ selectedExpense: null, expenseMode: null });
    if (typeof onPrevious === 'function') onPrevious();
  };

  const detailOptions = expenseOptions[form.expenseType] || [];
  return (
    <div className="card dc-card">
      <div className="page-header"><div><h1 className="page-title">Expense Details</h1><p className="page-description">Please provide expense information for the applicant.</p></div></div>
      {message && <div className={messageType === 'warning' ? 'notification-banner warning dc-top-message' : 'info-box dc-message dc-top-message'}>{message}</div>}
      <section className="section-card dc-expense-detail-section"><div className="dc-expense-detail-grid">
        <div className="field-group"><label className="field-label" htmlFor="dcExpenseType">Expense Type *</label><select id="dcExpenseType" className="field-input" value={form.expenseType} onChange={updateField('expenseType')}><option value="">Select expense type</option>{Object.keys(expenseOptions).map((type) => <option key={type} value={type}>{type}</option>)}</select>{errors.expenseType && <span className="field-error">{errors.expenseType}</span>}</div>
        <div className="field-group"><label className="field-label" htmlFor="dcExpenseDetails">Expense Detail *</label><select id="dcExpenseDetails" className="field-input" value={form.expenseDetails} disabled={!form.expenseType} onChange={updateField('expenseDetails')}><option value="">{form.expenseType ? 'Select expense detail' : 'Select expense type first'}</option>{detailOptions.map((detail) => <option key={detail} value={detail}>{detail}</option>)}</select>{errors.expenseDetails && <span className="field-error">{errors.expenseDetails}</span>}</div>
        <div className="field-group"><label className="field-label" htmlFor="dcExpenseFrequency">Expense Frequency *</label><select id="dcExpenseFrequency" className="field-input" value={form.expenseFrequency} onChange={updateField('expenseFrequency')}><option value="">Select expense frequency</option>{expenseFrequencies.map((frequency) => <option key={frequency} value={frequency}>{frequency}</option>)}</select>{errors.expenseFrequency && <span className="field-error">{errors.expenseFrequency}</span>}</div>
        <div className="field-group"><label className="field-label" htmlFor="dcExpenseAmount">Expense Amount (₹) *</label><div className="dc-money-input"><span>₹</span><input id="dcExpenseAmount" className="field-input" inputMode="decimal" value={form.expenseAmount} onChange={updateField('expenseAmount')} placeholder="Enter expense amount" /></div>{errors.expenseAmount && <span className="field-error">{errors.expenseAmount}</span>}</div>
        <div className="field-group"><label className="field-label" htmlFor="dcExpenseStartDate">Expense Start Date *</label><input id="dcExpenseStartDate" className="field-input" type="date" value={form.expenseStartDate} onChange={updateField('expenseStartDate')} />{errors.expenseStartDate && <span className="field-error">{errors.expenseStartDate}</span>}</div>
        <div className="field-group"><label className="field-label" htmlFor="dcExpenseEndDate">Expense End Date</label><input id="dcExpenseEndDate" className="field-input" type="date" min={form.expenseStartDate || undefined} value={form.expenseEndDate} onChange={updateField('expenseEndDate')} /><span className="dc-field-help">Leave blank if expense is ongoing.</span>{errors.expenseEndDate && <span className="field-error">{errors.expenseEndDate}</span>}</div>
      </div></section>
      <div className="dc-income-detail-navigation"><button type="button" className="secondary-button" disabled={isSubmitting} onClick={() => { setForm(initialData); setErrors({}); setMessage(''); }}>↻ Reset</button><div><button type="button" className="secondary-button" disabled={isSubmitting} onClick={handlePrevious}>← Previous</button><button type="button" className="secondary-button dc-cancel-button" disabled={isSubmitting} onClick={handleCancel}>Cancel</button><button type="button" className="primary-button" disabled={isSubmitting} onClick={handleNext}>Next →</button></div></div>
    </div>
  );
}

export default DC009ExpenseDetails;
