import React, { useEffect, useMemo, useState } from 'react';
import { initializeIncomeDetails, nextIncomeDetails, previousIncomeDetails } from '../../services/dataCollectionApi';
import { filterNumericInput, validatePinCode } from '../../utils/validation';
import { countries } from '../../utils/locationOptions';

const incomeTypes = ['Salary', 'Daily Wage', 'Business Income', 'Self Employment', 'Agricultural Income', 'Pension', 'Rental Income', 'Investment Income', 'Interest Income', 'Family Support', 'Other Income'];
const payFrequencies = ['One Time', 'Weekly', 'Monthly', 'Quarterly', 'Annually'];
const frequencyMultipliers = { 'One Time': 1, Weekly: 52, Monthly: 12, Quarterly: 4, Annually: 1 };

const emptyIncome = {
  incomeId: null,
  employerName: '',
  incomeType: '',
  payFrequency: '',
  incomeAmount: '',
  approxYearlyIncome: 0,
  employerAddress: { line1: '', line2: '', city: '', state: '', country: 'India', pincode: '' },
  incomeStartDate: '',
  incomeEndDate: ''
};

const normalizeFrequency = (value) => payFrequencies.find((item) => item.toLowerCase() === String(value || '').toLowerCase()) || value || '';
const calculateYearlyIncome = (amount, frequency) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) return 0;
  return Math.round((numericAmount * (frequencyMultipliers[frequency] || 0) + Number.EPSILON) * 100) / 100;
};
const normalizeIncome = (response) => {
  const raw = response?.data || response;
  const income = raw?.income || raw?.incomeDetails || raw;
  if (!income || typeof income !== 'object') return null;
  const payFrequency = normalizeFrequency(income.payFrequency);
  const employerAddress = income.employerAddress || income.address || {};
  const normalized = { ...emptyIncome, ...income, payFrequency, employerAddress: { ...emptyIncome.employerAddress, ...employerAddress } };
  return { ...normalized, approxYearlyIncome: calculateYearlyIncome(normalized.incomeAmount, payFrequency) };
};
const isValidationResponse = (response) => response && parseInt(response.status, 10) === 512;
const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.response?.data?.msg || fallback;

function DC007IncomeDetails({ caseContext, updateCaseContext, onContinue, onPrevious }) {
  const startingIncome = useMemo(() => normalizeIncome(caseContext.selectedIncome) || emptyIncome, [caseContext.selectedIncome]);
  const [form, setForm] = useState(startingIncome);
  const [initialData, setInitialData] = useState(startingIncome);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (current = form) => {
    const nextErrors = {};
    if (!current.employerName.trim()) nextErrors.employerName = 'Employer name is required.';
    if (!current.incomeType) nextErrors.incomeType = 'Income type is required.';
    if (!current.payFrequency) nextErrors.payFrequency = 'Pay frequency is required.';
    if (current.incomeAmount === '' || Number(current.incomeAmount) <= 0) nextErrors.incomeAmount = 'Enter an income amount greater than zero.';
    if (!current.employerAddress.line1.trim()) nextErrors.line1 = 'Address line 1 is required.';
    if (!current.employerAddress.city.trim()) nextErrors.city = 'City is required.';
    if (!current.employerAddress.state) nextErrors.state = 'State is required.';
    if (!current.employerAddress.country) nextErrors.country = 'Country is required.';
    const pinError = validatePinCode(current.employerAddress.pincode);
    if (pinError) nextErrors.pincode = pinError;
    if (!current.incomeStartDate) nextErrors.incomeStartDate = 'Income start date is required.';
    if (current.incomeEndDate && current.incomeStartDate && current.incomeEndDate < current.incomeStartDate) nextErrors.incomeEndDate = 'Income end date cannot be before the start date.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = (field) => (event) => {
    let value = event.target.value;
    if (field === 'incomeAmount') value = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setForm((previous) => {
      const next = { ...previous, [field]: value };
      return field === 'incomeAmount' || field === 'payFrequency'
        ? { ...next, approxYearlyIncome: calculateYearlyIncome(next.incomeAmount, next.payFrequency) }
        : next;
    });
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const updateAddress = (field) => (event) => {
    let value = event.target.value;
    if (field === 'pincode') value = filterNumericInput(value).slice(0, 6);
    setForm((previous) => ({ ...previous, employerAddress: { ...previous.employerAddress, [field]: value } }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const buildPayload = () => ({ appOrCaseNum: caseContext.applicationNumber, pageId: 'DC008', income: { ...form, incomeAmount: Number(form.incomeAmount), approxYearlyIncome: calculateYearlyIncome(form.incomeAmount, form.payFrequency) } });
  const applyResponse = (response) => {
    const income = normalizeIncome(response);
    if (!income) return;
    setForm(income); setInitialData(income); updateCaseContext({ selectedIncome: income });
  };

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      if (!caseContext.applicationNumber) return;
      try {
        const response = await initializeIncomeDetails({ appOrCaseNum: caseContext.applicationNumber, incomeId: startingIncome.incomeId, mode: caseContext.incomeMode || 'add' });
        if (!mounted) return;
        if (isValidationResponse(response)) { setMessage(response.message || 'Unable to load income details.'); setMessageType('warning'); return; }
        applyResponse(response);
      } catch (error) {
        if (!mounted) return;
        setMessage(getErrorMessage(error, 'Unable to load income details. You can continue with manual entry.')); setMessageType('warning');
      }
    };
    initialize();
    return () => { mounted = false; };
  }, [caseContext.applicationNumber, caseContext.incomeMode, startingIncome.incomeId]);

  const handleNext = async () => {
    if (!validate()) { setMessage('Please correct the highlighted fields before proceeding.'); setMessageType('warning'); return; }
    setMessage(''); setMessageType(''); setIsSubmitting(true);
    try {
      const response = await nextIncomeDetails(buildPayload());
      if (isValidationResponse(response)) { setMessage(response.message || 'Validation error'); setMessageType('warning'); return; }
      applyResponse(response);
      setMessage(response?.message || 'Income details saved successfully.');
      if (typeof onContinue === 'function') onContinue();
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to save income details.')); setMessageType('warning'); }
    finally { setIsSubmitting(false); }
  };

  const handlePrevious = async () => {
    setMessage(''); setMessageType(''); setIsSubmitting(true);
    try {
      const response = await previousIncomeDetails(buildPayload());
      if (isValidationResponse(response)) { setMessage(response.message || 'Validation error'); setMessageType('warning'); return; }
      applyResponse(response);
      if (typeof onPrevious === 'function') onPrevious();
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to go back. Please try again.')); setMessageType('warning'); }
    finally { setIsSubmitting(false); }
  };

  const handleCancel = () => {
    setForm(initialData);
    setErrors({});
    setMessage('');
    setMessageType('');
    updateCaseContext({ selectedIncome: null, incomeMode: null });
    if (typeof onPrevious === 'function') onPrevious();
  };

  const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(form.approxYearlyIncome || 0);
  const selectField = (id, field, label, values) => <div className="field-group"><label className="field-label" htmlFor={id}>{label} *</label><select id={id} className="field-input" value={form[field]} onChange={updateField(field)}><option value="">Select {label.toLowerCase()}</option>{values.map((value) => <option key={value} value={value}>{value}</option>)}</select>{errors[field] && <span className="field-error">{errors[field]}</span>}</div>;

  return (
    <div className="card dc-card">
      <div className="page-header"><div><h1 className="page-title">Income Details</h1><p className="page-description">Please provide income information for the applicant.</p></div></div>
      {message && <div className={messageType === 'warning' ? 'notification-banner warning dc-top-message' : 'info-box dc-message dc-top-message'}>{message}</div>}
      <section className="section-card dc-income-section"><div className="dc-income-details-grid"><div className="field-group"><label className="field-label" htmlFor="dcEmployerName">Employer Name *</label><input id="dcEmployerName" className="field-input" value={form.employerName} onChange={updateField('employerName')} placeholder="Enter employer name" />{errors.employerName && <span className="field-error">{errors.employerName}</span>}</div>{selectField('dcIncomeType', 'incomeType', 'Income Type', incomeTypes)}{selectField('dcPayFrequency', 'payFrequency', 'Pay Frequency', payFrequencies)}<div className="field-group"><label className="field-label" htmlFor="dcIncomeAmount">Income Amount *</label><input id="dcIncomeAmount" className="field-input" inputMode="decimal" value={form.incomeAmount} onChange={updateField('incomeAmount')} placeholder="Enter amount for selected frequency" />{errors.incomeAmount && <span className="field-error">{errors.incomeAmount}</span>}</div><div className="field-group"><label className="field-label" htmlFor="dcApproxIncome">Approx Yearly Income</label><input id="dcApproxIncome" className="field-input dc-calculated-field" value={currency} readOnly /></div></div></section>
      <section className="section-card dc-income-section"><h2 className="section-title">Employer Address</h2><div className="dc-employer-address-grid"><div className="field-group dc-span-2"><label className="field-label" htmlFor="dcIncomeLine1">Address Line 1 *</label><input id="dcIncomeLine1" className="field-input" value={form.employerAddress.line1} onChange={updateAddress('line1')} placeholder="Enter address line 1" />{errors.line1 && <span className="field-error">{errors.line1}</span>}</div><div className="field-group dc-span-2"><label className="field-label" htmlFor="dcIncomeLine2">Address Line 2</label><input id="dcIncomeLine2" className="field-input" value={form.employerAddress.line2} onChange={updateAddress('line2')} placeholder="Enter address line 2 (optional)" /></div><div className="field-group"><label className="field-label" htmlFor="dcIncomeCity">City *</label><input id="dcIncomeCity" className="field-input" value={form.employerAddress.city} onChange={updateAddress('city')} placeholder="Enter city" />{errors.city && <span className="field-error">{errors.city}</span>}</div><div className="field-group"><label className="field-label" htmlFor="dcIncomeState">State / Province / Region *</label><input id="dcIncomeState" className="field-input" value={form.employerAddress.state} onChange={updateAddress('state')} placeholder="Enter state, province or region" />{errors.state && <span className="field-error">{errors.state}</span>}</div><div className="field-group"><label className="field-label" htmlFor="dcIncomeCountry">Country *</label><select id="dcIncomeCountry" className="field-input" value={form.employerAddress.country} onChange={updateAddress('country')}><option value="">Select country</option>{countries.map((country) => <option key={country} value={country}>{country}</option>)}</select>{errors.country && <span className="field-error">{errors.country}</span>}</div><div className="field-group"><label className="field-label" htmlFor="dcIncomePincode">Pincode *</label><input id="dcIncomePincode" className="field-input" inputMode="numeric" maxLength="6" value={form.employerAddress.pincode} onChange={updateAddress('pincode')} placeholder="Enter pincode" />{errors.pincode && <span className="field-error">{errors.pincode}</span>}</div></div></section>
      <section className="section-card dc-income-section"><div className="dc-income-date-grid"><div className="field-group"><label className="field-label" htmlFor="dcIncomeStartDate">Income Start Date *</label><input id="dcIncomeStartDate" className="field-input" type="date" value={form.incomeStartDate} onChange={updateField('incomeStartDate')} />{errors.incomeStartDate && <span className="field-error">{errors.incomeStartDate}</span>}</div><div className="field-group"><label className="field-label" htmlFor="dcIncomeEndDate">Income End Date</label><input id="dcIncomeEndDate" className="field-input" type="date" min={form.incomeStartDate || undefined} value={form.incomeEndDate} onChange={updateField('incomeEndDate')} /><span className="dc-field-help">Leave blank if income is ongoing.</span>{errors.incomeEndDate && <span className="field-error">{errors.incomeEndDate}</span>}</div></div></section>
      <div className="dc-income-detail-navigation"><button type="button" className="secondary-button" disabled={isSubmitting} onClick={() => { setForm(initialData); setErrors({}); setMessage(''); }}>↻ Reset</button><div><button type="button" className="secondary-button" disabled={isSubmitting} onClick={handlePrevious}>← Previous</button><button type="button" className="secondary-button dc-cancel-button" disabled={isSubmitting} onClick={handleCancel}>Cancel</button><button type="button" className="primary-button" disabled={isSubmitting} onClick={handleNext}>Next →</button></div></div>
    </div>
  );
}

export default DC007IncomeDetails;
