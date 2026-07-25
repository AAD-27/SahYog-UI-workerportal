import React, { useState } from 'react';
import { createApplication } from '../services/api';

const initialState = {
  firstName: '',
  middleName: '',
  lastName: '',
  mobileNumber: '',
  emailAddress: ''
};

function RegisterApplication() {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleNext = async () => {
    setStatus('loading');
    try {
      const result = await createApplication({ ...form, status: 'Draft' });
      setMessage(`Application saved successfully. ID: ${result.id}`);
      setStatus('success');
    } catch (error) {
      setMessage('Unable to save application. Please try again.');
      setStatus('error');
    }
  };

  const isValid = form.firstName.trim() && form.lastName.trim() && form.mobileNumber.trim();

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
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="mobileNumber">Mobile Number *</label>
          <input
            id="mobileNumber"
            className="field-input"
            value={form.mobileNumber}
            onChange={updateField('mobileNumber')}
            placeholder="Enter 10-digit mobile number"
          />
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
        </div>
      </div>

      <div className="info-box">
        Please ensure the mobile number is correct. All important updates will be sent to this number.
      </div>

      {message && (
        <div className={`info-box ${status === 'error' ? '' : ''}`} style={{ marginTop: 16 }}>
          {message}
        </div>
      )}

      <div className="action-row">
        <button className="primary-button" disabled={!isValid || status === 'loading'} onClick={handleNext}>
          Next →
        </button>
      </div>
    </div>
  );
}

export default RegisterApplication;
