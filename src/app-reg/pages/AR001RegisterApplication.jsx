import React, { useEffect, useState } from 'react';
import { initializeRegistration, saveRegistrationStep } from '../../services/appRegApi';
import { validateField, filterNumericInput } from '../../utils/validation';
import ResetButton from '../../common/components/ResetButton';

const getToday = () => new Date().toISOString().slice(0, 10);

const initialState = {
  firstName: '',
  middleName: '',
  lastName: '',
  mobileNumber: '',
  emailAddress: '',
  applicationDate: getToday()
};

function AR001RegisterApplication({ applicationContext, updateApplicationContext, setActiveStep }) {
  const [form, setForm] = useState(initialState);
  const [initialData, setInitialData] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (applicationContext.applicationId && applicationContext.data && Object.keys(applicationContext.data).length > 0) {
      const dataFromContext = {
        firstName: applicationContext.data.firstName || '',
        middleName: applicationContext.data.middleName || '',
        lastName: applicationContext.data.lastName || '',
        mobileNumber: applicationContext.data.mobileNumber || '',
        emailAddress: applicationContext.data.emailAddress || '',
        applicationDate: applicationContext.applicationDate || applicationContext.data?.applicationDate || getToday()
      };
      setForm(dataFromContext);
      setInitialData(dataFromContext);
      return;
    }

    const loadInitial = async () => {
      try {
        const result = await initializeRegistration();
        const initialFormData = {
          firstName: result.data?.firstName || '',
          middleName: result.data?.middleName || '',
          lastName: result.data?.lastName || '',
          mobileNumber: result.data?.mobileNumber || '',
          emailAddress: result.data?.emailAddress || '',
          applicationDate: result.applicationDate || result.data?.applicationDate || getToday()
        };
        
        updateApplicationContext({
          applicationId: result.id,
          applicationNumber: result.applicationNumber,
          applicationDate: result.applicationDate || getToday(),
          status: result.status || 'Draft',
          data: result.data || {}
        });
        setForm(initialFormData);
        setInitialData(initialFormData);
      } catch (error) {
        setMessage('Unable to start registration. Please refresh the page.');
      }
    };

    loadInitial();
  }, [applicationContext.applicationId, applicationContext.applicationDate, applicationContext.data, updateApplicationContext]);

  const handleValidateField = (field, value) => {
    return validateField(field, value);
  };

  const updateField = (field) => (event) => {
    let value = event.target.value;
    
    // Apply numeric filter for mobile number
    if (field === 'mobileNumber') {
      value = filterNumericInput(value).slice(0, 10);
    }

    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: handleValidateField(field, value) }));
  };

  const handleReset = (resetData) => {
    setForm(resetData);
    setErrors({});
    setMessage('');
  };

  const validateForm = () => {
    const nextErrors = {
      firstName: handleValidateField('firstName', form.firstName),
      lastName: handleValidateField('lastName', form.lastName),
      mobileNumber: handleValidateField('mobileNumber', form.mobileNumber),
      emailAddress: handleValidateField('emailAddress', form.emailAddress),
      applicationDate: handleValidateField('applicationDate', form.applicationDate)
    };

    const filtered = Object.fromEntries(Object.entries(nextErrors).filter(([, value]) => value));
    setErrors(filtered);
    return Object.keys(filtered).length === 0;
  };

  const today = getToday();
  const applicationDate = applicationContext.applicationDate || form.applicationDate || today;
  const displayApplicationDate = applicationDate > today ? today : applicationDate;

  const isValid =
    handleValidateField('firstName', form.firstName) === undefined &&
    handleValidateField('lastName', form.lastName) === undefined &&
    handleValidateField('mobileNumber', form.mobileNumber) === undefined &&
    handleValidateField('emailAddress', form.emailAddress) === undefined &&
    handleValidateField('applicationDate', form.applicationDate) === undefined;

  const handleNext = async () => {
    if (!validateForm()) {
      setStatus('error');
      setMessage('Please correct the highlighted fields.');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const payload = { pageId: 'AR001', ...form };
      const result = await saveRegistrationStep(payload);

      updateApplicationContext({
        applicationNumber: result.applicationNumber || applicationContext.applicationNumber,
        applicationDate: result.applicationDate || applicationContext.applicationDate,
        status: result.status || 'Draft',
        data: result.data || { ...applicationContext.data, ...form }
      });
      setStatus('success');
      setMessage('Application data saved. Proceeding to address registration.');
      setActiveStep('AR002');
    } catch (error) {
      setStatus('error');
      setMessage('Unable to save application. Please try again.');
    }
  };

  return (
    <div className="card">
      <div className="page-header">
        <div>
          <h1 className="page-title">Register Application</h1>
          <p className="page-description">Enter the basic details of the applicant to create a new application.</p>
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Applicant Details</div>
      </div>

      <div className="form-grid">
        <div className="field-group">
          <label className="field-label" htmlFor="firstName">First Name *</label>
          <input
            id="firstName"
            className="field-input"
            value={form.firstName}
            onChange={updateField('firstName')}
            placeholder="Enter first name"
          />
          {errors.firstName && <span className="field-error">{errors.firstName}</span>}
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="middleName">Middle Name</label>
          <input
            id="middleName"
            className="field-input"
            value={form.middleName}
            onChange={updateField('middleName')}
            placeholder="Enter middle name (optional)"
          />
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="lastName">Last Name *</label>
          <input
            id="lastName"
            className="field-input"
            value={form.lastName}
            onChange={updateField('lastName')}
            placeholder="Enter last name"
          />
          {errors.lastName && <span className="field-error">{errors.lastName}</span>}
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="mobileNumber">Mobile Number * (10 digits)</label>
          <input
            id="mobileNumber"
            className="field-input"
            type="text"
            inputMode="numeric"
            value={form.mobileNumber}
            onChange={updateField('mobileNumber')}
            maxLength="10"
            placeholder="Enter 10-digit mobile number"
          />
          {errors.mobileNumber && <span className="field-error">{errors.mobileNumber}</span>}
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="emailAddress">Email Address</label>
          <input
            id="emailAddress"
            className="field-input"
            value={form.emailAddress}
            onChange={updateField('emailAddress')}
            placeholder="Enter email address (optional)"
          />
          {errors.emailAddress && <span className="field-error">{errors.emailAddress}</span>}
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="applicationDate">Application Date</label>
          <input
            id="applicationDate"
            className="field-input"
            type="date"
            value={form.applicationDate || displayApplicationDate}
            max={today}
            onChange={updateField('applicationDate')}
            placeholder="Select application date"
          />
          {errors.applicationDate && <span className="field-error">{errors.applicationDate}</span>}
        </div>
      </div>

      <div className="info-box">
        Please ensure the mobile number is correct. All important updates will be sent to this number.
      </div>

      {message && (
        <div className="info-box" style={{ marginTop: 16, background: status === 'error' ? '#fee2e2' : '#eef4ff', color: status === 'error' ? '#991b1b' : '#1e3a8a' }}>
          {message}
        </div>
      )}

      <div className="action-row">
        <ResetButton
          form={form}
          initialData={initialData}
          initialState={initialState}
          onReset={handleReset}
          disabled={status === 'loading'}
        />
        <button className="primary-button" disabled={!isValid || status === 'loading'} onClick={handleNext}>
          Next →
        </button>
      </div>
    </div>
  );
}

export default AR001RegisterApplication;
