import React, { useEffect, useState } from 'react';
import { initializeRegistration, saveRegistrationStep } from '../../services/appRegApi';
import { validateField, filterNumericInput } from '../../utils/validation';
import ResetButton from '../../common/components/ResetButton';

const personTypes = ['Primary Applicant', 'Child', 'Parent', 'Guardian', 'Other Household Member'];
const genders = ['Male', 'Female', 'Other'];
const maritalStatuses = ['Single', 'Married', 'Widowed', 'Divorced', 'Separated'];
const casteOptions = ['General', 'OBC', 'SC', 'ST', 'Other'];
const religionOptions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Other'];

const initialState = {
  personType: 'Primary Applicant',
  firstName: '',
  middleName: '',
  lastName: '',
  dob: '',
  gender: '',
  casteRace: '',
  religion: '',
  maritalStatus: '',
  aadharNumber: '',
  panNumber: '',
  passportNumber: ''
};

function AR003RegisterPerson({ applicationContext, updateApplicationContext, setActiveStep }) {
  const [form, setForm] = useState(initialState);
  const [initialData, setInitialData] = useState({});
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (applicationContext.applicationId && applicationContext.data && Object.keys(applicationContext.data).length > 0) {
      const personData = applicationContext.data?.person || initialState;
      setForm(personData);
      setInitialData(personData);
      return;
    }

    const loadInitial = async () => {
      try {
        const result = await initializeRegistration();
        updateApplicationContext({
          applicationNumber: result.applicationNumber || applicationContext.applicationNumber,
          applicationDate: result.applicationDate || applicationContext.applicationDate,
          status: result.status || applicationContext.status,
          data: result.data || applicationContext.data
        });
        const personData = result.data?.person || initialState;
        setForm(personData);
        setInitialData(personData);
      } catch (error) {
        setMessage('Unable to load person registration data. Please refresh.');
      }
    };

    loadInitial();
  }, [applicationContext.applicationId, applicationContext.data, applicationContext.applicationNumber, applicationContext.applicationDate, applicationContext.status, updateApplicationContext]);

  const handleValidateField = (field, value) => {
    return validateField(field, value);
  };

  const updateField = (field) => (event) => {
    let value = event.target.value;
    
    // Apply numeric filter for Aadhaar number
    if (field === 'aadharNumber') {
      value = filterNumericInput(value).slice(0, 12);
    }
    
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: handleValidateField(field, value) }));
  };

  const validateForm = () => {
    const nextErrors = {
      personType: handleValidateField('personType', form.personType),
      firstName: handleValidateField('firstName', form.firstName),
      lastName: handleValidateField('lastName', form.lastName),
      dob: handleValidateField('dob', form.dob),
      gender: handleValidateField('gender', form.gender),
      casteRace: handleValidateField('casteRace', form.casteRace),
      religion: handleValidateField('religion', form.religion),
      maritalStatus: handleValidateField('maritalStatus', form.maritalStatus),
      aadharNumber: handleValidateField('aadharNumber', form.aadharNumber),
      panNumber: handleValidateField('panNumber', form.panNumber),
      passportNumber: handleValidateField('passportNumber', form.passportNumber)
    };

    const filtered = Object.fromEntries(Object.entries(nextErrors).filter(([, value]) => value));
    setErrors(filtered);
    return Object.keys(filtered).length === 0;
  };

  const isValid =
    handleValidateField('firstName', form.firstName) === undefined &&
    handleValidateField('lastName', form.lastName) === undefined &&
    handleValidateField('dob', form.dob) === undefined &&
    handleValidateField('gender', form.gender) === undefined &&
    handleValidateField('casteRace', form.casteRace) === undefined &&
    handleValidateField('religion', form.religion) === undefined &&
    handleValidateField('maritalStatus', form.maritalStatus) === undefined &&
    handleValidateField('aadharNumber', form.aadharNumber) === undefined &&
    handleValidateField('panNumber', form.panNumber) === undefined &&
    handleValidateField('passportNumber', form.passportNumber) === undefined;

  const handlePrevious = () => setActiveStep('AR002');

  const handleReset = (resetData) => {
    setForm(resetData);
    setErrors({});
    setMessage('');
  };

  const handleNext = async () => {
    if (!validateForm()) {
      setStatus('error');
      setMessage('Please correct the highlighted fields before proceeding.');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const result = await saveRegistrationStep({ pageId: 'AR003', person: form });
      updateApplicationContext({
        applicationNumber: result.applicationNumber || applicationContext.applicationNumber,
        applicationDate: result.applicationDate || applicationContext.applicationDate,
        status: result.status || 'Draft',
        data: result.data || { ...applicationContext.data, person: form }
      });
      setStatus('success');
      setMessage('Person details saved. Proceeding to program registration.');
      setActiveStep('AR004');
    } catch (error) {
      setStatus('error');
      setMessage('Unable to save person details. Please try again.');
    }
  };

  return (
    <div className="card">
      <div className="page-header">
        <div>
          <h1 className="page-title">Register Person</h1>
          <p className="page-description">Capture personal information for one or more individuals associated with this application.</p>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Person Information</h2>
            <p className="section-subtitle">Please provide the person details for the application.</p>
          </div>
        </div>

        <div className="field-row">
          <div className="field-group">
            <label className="field-label" htmlFor="personType">Application / Person Type *</label>
            <select id="personType" className="field-input" value={form.personType} onChange={updateField('personType')}>
              {personTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="firstName">First Name *</label>
            <input id="firstName" className="field-input" value={form.firstName} onChange={updateField('firstName')} placeholder="Enter first name" />
            {errors.firstName && <span className="field-error">{errors.firstName}</span>}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="middleName">Middle Name</label>
            <input id="middleName" className="field-input" value={form.middleName} onChange={updateField('middleName')} placeholder="Enter middle name" />
          </div>
        </div>

        <div className="field-row">
          <div className="field-group">
            <label className="field-label" htmlFor="lastName">Last Name *</label>
            <input id="lastName" className="field-input" value={form.lastName} onChange={updateField('lastName')} placeholder="Enter last name" />
            {errors.lastName && <span className="field-error">{errors.lastName}</span>}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="dob">Date of Birth *</label>
            <input id="dob" className="field-input" type="date" value={form.dob} onChange={updateField('dob')} />
            {errors.dob && <span className="field-error">{errors.dob}</span>}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="gender">Gender *</label>
            <select id="gender" className="field-input" value={form.gender} onChange={updateField('gender')}>
              <option value="">Select gender</option>
              {genders.map((gender) => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
            {errors.gender && <span className="field-error">{errors.gender}</span>}
          </div>
        </div>

        <div className="field-row">
          <div className="field-group">
            <label className="field-label" htmlFor="casteRace">Caste / Race *</label>
            <select id="casteRace" className="field-input" value={form.casteRace} onChange={updateField('casteRace')}>
              <option value="">Select caste / race</option>
              {casteOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            {errors.casteRace && <span className="field-error">{errors.casteRace}</span>}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="religion">Religion *</label>
            <select id="religion" className="field-input" value={form.religion} onChange={updateField('religion')}>
              <option value="">Select religion</option>
              {religionOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            {errors.religion && <span className="field-error">{errors.religion}</span>}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="maritalStatus">Marital Status *</label>
            <select id="maritalStatus" className="field-input" value={form.maritalStatus} onChange={updateField('maritalStatus')}>
              <option value="">Select marital status</option>
              {maritalStatuses.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            {errors.maritalStatus && <span className="field-error">{errors.maritalStatus}</span>}
          </div>
        </div>

        <div className="field-row">
          <div className="field-group">
            <label className="field-label" htmlFor="aadharNumber">Aadhaar Number * (12 digits only)</label>
            <input
              id="aadharNumber"
              className="field-input"
              type="text"
              inputMode="numeric"
              value={form.aadharNumber}
              onChange={updateField('aadharNumber')}
              maxLength="12"
              placeholder="Enter 12-digit Aadhaar"
            />
            {errors.aadharNumber && <span className="field-error">{errors.aadharNumber}</span>}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="panNumber">PAN Number (if available)</label>
            <input
              id="panNumber"
              className="field-input"
              value={form.panNumber}
              onChange={updateField('panNumber')}
              maxLength="10"
              placeholder="Enter PAN number (10 characters)"
            />
            {errors.panNumber && <span className="field-error">{errors.panNumber}</span>}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="passportNumber">Passport Number (if available)</label>
            <input
              id="passportNumber"
              className="field-input"
              value={form.passportNumber}
              onChange={updateField('passportNumber')}
              maxLength="9"
              placeholder="Enter passport number (6-9 characters)"
            />
            {errors.passportNumber && <span className="field-error">{errors.passportNumber}</span>}
          </div>
        </div>
      </div>

      {message && (
        <div className="info-box" style={{ marginTop: 16, background: status === 'error' ? '#fee2e2' : '#eef4ff', color: status === 'error' ? '#991b1b' : '#1e3a8a' }}>
          {message}
        </div>
      )}

      <div className="action-row">
        <div>
          <ResetButton
            form={form}
            initialData={initialData}
            initialState={initialState}
            onReset={handleReset}
            disabled={status === 'loading'}
          />
          <button type="button" className="secondary-button" onClick={handlePrevious} disabled={status === 'loading'}>
            ← Previous
          </button>
        </div>
        <button type="button" className="primary-button" onClick={handleNext} disabled={!isValid || status === 'loading'}>
          Next →
        </button>
      </div>
    </div>
  );
}

export default AR003RegisterPerson;
