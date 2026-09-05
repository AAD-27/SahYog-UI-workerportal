import React, { useEffect, useMemo, useState } from 'react';
import { initializeApplicantDetails, nextApplicantDetails, previousApplicantDetails } from '../../services/dataCollectionApi';
import { filterNumericInput, validateField } from '../../utils/validation';

const getToday = () => new Date().toISOString().slice(0, 10);

const initialState = {
  firstName: '',
  middleName: '',
  lastName: '',
  mobileNumber: '',
  emailAddress: '',
  isIndianResident: '',
  applicationDate: getToday()
};

function DC002IncomeDetails({ caseContext, updateCaseContext, onContinue, onPrevious }) {
  const initialForm = useMemo(() => ({ ...initialState, ...caseContext.applicantDetails }), [caseContext.applicantDetails]);
  const [form, setForm] = useState(initialForm);
  const [initialData, setInitialData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const validateApplicantField = (field, value) => {
    if (field === 'isIndianResident') return value === true || value === false ? undefined : 'Indian residency status is required.';
    const required = ['firstName', 'lastName', 'mobileNumber', 'applicationDate'].includes(field);
    return validateField(field, value, {
      required,
      maxLength: ['firstName', 'middleName', 'lastName'].includes(field) ? 50 : undefined,
      label: field === 'firstName' ? 'First name' : field === 'lastName' ? 'Last name' : field === 'mobileNumber' ? 'Mobile number' : 'Application date'
    });
  };

  const updateField = (field) => (event) => {
    let value = event.target.value;
    if (field === 'mobileNumber') value = filterNumericInput(value).slice(0, 10);
    if (field === 'isIndianResident') value = value === '' ? '' : value === 'true';
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: validateApplicantField(field, value) }));
  };

  const validateForm = () => {
    const nextErrors = Object.fromEntries(Object.keys(initialState).map((field) => [field, validateApplicantField(field, form[field])]));
    const filtered = Object.fromEntries(Object.entries(nextErrors).filter(([, error]) => error));
    setErrors(filtered);
    return Object.keys(filtered).length === 0;
  };

  const handleReset = () => {
    setForm(initialData);
    setErrors({});
    setMessage('');
  };

  const handleNext = async () => {
    if (!validateForm()) {
      setMessage('Please correct the highlighted fields.');
      return;
    }
    setMessage('');
    setMessageType('');
    try {
      const payload = { appOrCaseNum: caseContext.applicationNumber, pageId: 'DC002', applicantDetails: form };
      const res = await nextApplicantDetails(payload);
      if (res && parseInt(res.status, 10) === 512) {
        setMessage(res.message || 'Validation error');
        setMessageType('warning');
        return;
      }
      const details = res?.data || res?.applicantDetails || res || null;
      if (details) {
        const mapped = {
          firstName: details.firstName || '',
          middleName: details.middleName || '',
          lastName: details.lastName || '',
          mobileNumber: details.mobileNumber || '',
          emailAddress: details.emailAddress || '',
          applicationDate: details.applicationDate || getToday(),
          isIndianResident: typeof (details.isIndianResident ?? details.indianResident) === 'boolean' ? (details.isIndianResident ?? details.indianResident) : ''
        };
        updateCaseContext({ applicantDetails: mapped, applicant: { firstName: mapped.firstName, lastName: mapped.lastName } });
        setForm(mapped);
        setInitialData(mapped);
      }
      onContinue();
    } catch (err) {
      const resp = err?.response;
      if (resp && parseInt(resp.status, 10) === 512) {
        const bodyMessage = resp.data?.message || resp.data?.msg || resp.statusText || '';
        setMessage(bodyMessage || 'Validation error');
        setMessageType('warning');
        return;
      }
      setMessage('Unable to proceed. Please try again.');
    }
  };

  const handlePrevious = async () => {
    setMessage('');
    setMessageType('');
    try {
      const payload = { appOrCaseNum: caseContext.applicationNumber, pageId: 'DC002' };
      const res = await previousApplicantDetails(payload);
      if (res && parseInt(res.status, 10) === 512) {
        setMessage(res.message || 'Validation error');
        setMessageType('warning');
        return;
      }
      const details = res?.data || res?.applicantDetails || res || null;
      if (details) {
        const mapped = {
          firstName: details.firstName || '',
          middleName: details.middleName || '',
          lastName: details.lastName || '',
          mobileNumber: details.mobileNumber || '',
          emailAddress: details.emailAddress || '',
          applicationDate: details.applicationDate || getToday(),
          isIndianResident: typeof (details.isIndianResident ?? details.indianResident) === 'boolean' ? (details.isIndianResident ?? details.indianResident) : ''
        };
        updateCaseContext({ applicantDetails: mapped, applicant: { firstName: mapped.firstName, lastName: mapped.lastName } });
        setForm(mapped);
        setInitialData(mapped);
      }
      // navigate back
      if (typeof onPrevious === 'function') onPrevious();
    } catch (err) {
      const resp = err?.response;
      if (resp && parseInt(resp.status, 10) === 512) {
        const bodyMessage = resp.data?.message || resp.data?.msg || resp.statusText || '';
        setMessage(bodyMessage || 'Validation error');
        setMessageType('warning');
        return;
      }
      setMessage('Unable to go back. Please try again.');
    }
  };

  // Call initialize API when this page is opened
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (!caseContext.applicationNumber) return;
          try {
            const res = await initializeApplicantDetails({ appOrCaseNum: caseContext.applicationNumber });
            if (!mounted) return;
            // If server returns validation (status 512), show message
            if (res && parseInt(res.status, 10) === 512) {
              setMessage(res.message || '');
              setMessageType('warning');
              return;
            }
              // merge returned applicant details into caseContext and local form
              const details = res?.data || res?.applicantDetails || res || null;
              if (details) {
                const mapped = {
                  firstName: details.firstName || '',
                  middleName: details.middleName || '',
                  lastName: details.lastName || '',
                  mobileNumber: details.mobileNumber || '',
                  emailAddress: details.emailAddress || '',
                  applicationDate: details.applicationDate || getToday(),
                  isIndianResident: typeof (details.isIndianResident ?? details.indianResident) === 'boolean' ? (details.isIndianResident ?? details.indianResident) : ''
                };
                updateCaseContext({ applicantDetails: mapped, applicant: { firstName: mapped.firstName, lastName: mapped.lastName } });
                setForm(mapped);
                setInitialData(mapped);
              }
          } catch (err) {
            const resp = err?.response;
            if (resp && parseInt(resp.status, 10) === 512) {
              const bodyMessage = resp.data?.message || resp.data?.msg || resp.statusText || '';
              setMessage(bodyMessage || '');
              setMessageType('warning');
              return;
            }
            // ignore other errors; UI remains usable
          }
    };
    init();
    return () => { mounted = false; };
  }, [caseContext.applicationNumber]);

  const today = getToday();
  const isValid = Object.keys(initialState).every((field) => !validateApplicantField(field, form[field]));

  return (
    <div className="card dc-card">
      <div className="page-header"><div><h1 className="page-title">Applicant Details</h1><p className="page-description">Capture the applicant details required for data collection.</p></div></div>
      {message && messageType === 'warning' && <div className="notification-banner warning">{message}</div>}
      {message && messageType !== 'warning' && <div className="info-box dc-message">{message}</div>}
      <div className="field-group"><div className="field-label">Applicant Details</div></div>
      <div className="form-grid dc-applicant-grid">
        <div className="field-group"><label className="field-label" htmlFor="dcFirstName">First Name *</label><input id="dcFirstName" className="field-input" value={form.firstName} onChange={updateField('firstName')} placeholder="Enter first name" />{errors.firstName && <span className="field-error">{errors.firstName}</span>}</div>
        <div className="field-group"><label className="field-label" htmlFor="dcMiddleName">Middle Name</label><input id="dcMiddleName" className="field-input" value={form.middleName} onChange={updateField('middleName')} placeholder="Enter middle name (optional)" /></div>
        <div className="field-group"><label className="field-label" htmlFor="dcLastName">Last Name *</label><input id="dcLastName" className="field-input" value={form.lastName} onChange={updateField('lastName')} placeholder="Enter last name" />{errors.lastName && <span className="field-error">{errors.lastName}</span>}</div>
        <div className="field-group"><label className="field-label" htmlFor="dcMobileNumber">Mobile Number * (10 digits)</label><input id="dcMobileNumber" className="field-input" inputMode="numeric" maxLength="10" value={form.mobileNumber} onChange={updateField('mobileNumber')} placeholder="Enter 10-digit mobile number" />{errors.mobileNumber && <span className="field-error">{errors.mobileNumber}</span>}</div>
        <div className="field-group"><label className="field-label" htmlFor="dcEmailAddress">Email Address</label><input id="dcEmailAddress" className="field-input" value={form.emailAddress} onChange={updateField('emailAddress')} placeholder="Enter email address (optional)" />{errors.emailAddress && <span className="field-error">{errors.emailAddress}</span>}</div>
        <div className="field-group"><label className="field-label" htmlFor="dcIndianResident">Indian Resident *</label><select id="dcIndianResident" className="field-input" value={form.isIndianResident === '' ? '' : String(form.isIndianResident)} onChange={updateField('isIndianResident')}><option value="">Select residency status</option><option value="true">Yes — Indian Resident</option><option value="false">No — Not an Indian Resident</option></select>{errors.isIndianResident && <span className="field-error">{errors.isIndianResident}</span>}</div>
        <div className="field-group"><label className="field-label" htmlFor="dcApplicationDate">Application Date</label><input id="dcApplicationDate" className="field-input" type="date" max={today} value={form.applicationDate} onChange={updateField('applicationDate')} />{errors.applicationDate && <span className="field-error">{errors.applicationDate}</span>}</div>
      </div>
      <div className="info-box">Please ensure the mobile number is correct. All important updates will be sent to this number.</div>
      {message && messageType === 'warning' && <div className="notification-banner warning">{message}</div>}
      {message && messageType !== 'warning' && <div className="info-box dc-message">{message}</div>}
      <div className="action-row">
        <button type="button" className="secondary-button" onClick={handlePrevious}>← Previous</button>
        <button type="button" className="secondary-button" onClick={handleReset}>↻ Reset</button>
        <button type="button" className="primary-button" disabled={!isValid} onClick={handleNext}>Next →</button>
      </div>
    </div>
  );
}

export default DC002IncomeDetails;
