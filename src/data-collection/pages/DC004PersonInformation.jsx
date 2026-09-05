import React, { useEffect, useMemo, useState } from 'react';
import { initializePersonInformation, nextPersonInformation, previousPersonInformation } from '../../services/dataCollectionApi';
import { filterNumericInput, validateField } from '../../utils/validation';

const personTypes = ['Primary Applicant', 'Child', 'Parent', 'Guardian', 'Other Household Member'];
const genders = ['Male', 'Female', 'Other'];
const casteOptions = ['General', 'OBC', 'SC', 'ST', 'Other'];
const religionOptions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Other'];
const maritalStatuses = ['Single', 'Married', 'Widowed', 'Divorced', 'Separated'];
const initialState = { personId: null, personType: 'Primary Applicant', firstName: '', middleName: '', lastName: '', dob: '', gender: '', casteRace: '', religion: '', maritalStatus: '', aadharNumber: '', panNumber: '', passportNumber: '' };

const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday = today.getMonth() < birthDate.getMonth()
    || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (beforeBirthday) age -= 1;
  return age;
};

const normalizePerson = (response) => {
  const raw = response?.data || response;
  const person = raw?.person || (raw?.personType ? raw : null);
  if (!person || typeof person !== 'object') return null;
  return {
    ...initialState,
    ...person,
    passportNumber: person.passportNumber || '',
    panNumber: person.panNumber || ''
  };
};

const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.response?.data?.msg || fallback;
const isValidationResponse = (response) => response && parseInt(response.status, 10) === 512;

function DC004PersonInformation({ caseContext, updateCaseContext, onContinue, onPrevious }) {
  const selectedPerson = caseContext.selectedPerson || caseContext.personDetails;
  const initialForm = useMemo(() => ({ ...initialState, ...selectedPerson, firstName: selectedPerson?.firstName || caseContext.applicantDetails?.firstName || '', middleName: selectedPerson?.middleName || caseContext.applicantDetails?.middleName || '', lastName: selectedPerson?.lastName || caseContext.applicantDetails?.lastName || '' }), [caseContext.applicantDetails, selectedPerson]);
  const [form, setForm] = useState(initialForm);
  const [initialData, setInitialData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validatePersonField = (field, value) => validateField(field, value, { required: ['personType', 'firstName', 'lastName', 'dob', 'gender', 'casteRace', 'religion', 'maritalStatus', 'aadharNumber'].includes(field), label: field });
  const updateField = (field) => (event) => {
    let value = event.target.value;
    if (field === 'aadharNumber') value = filterNumericInput(value).slice(0, 12);
    if (field === 'panNumber' || field === 'passportNumber') value = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: validatePersonField(field, value) }));
  };
  const validateForm = () => { const nextErrors = Object.fromEntries(Object.keys(initialState).map((field) => [field, validatePersonField(field, form[field])]).filter(([, error]) => error)); setErrors(nextErrors); return !Object.keys(nextErrors).length; };
  const handleReset = () => { setForm(initialData); setErrors({}); setMessage(''); setMessageType(''); };
  const handleAddAnother = () => { if (!validateForm()) { setMessage('Please correct the highlighted fields before adding another person.'); return; } updateCaseContext({ people: [...(caseContext.people || []), form] }); setForm({ ...initialState, personType: 'Other Household Member' }); setErrors({}); setMessage('Person added. Enter the details for the next person.'); setMessageType(''); };

  const buildPayload = () => ({
    appOrCaseNum: caseContext.applicationNumber,
    pageId: 'DC005',
    person: {
      ...form,
      age: calculateAge(form.dob),
      panNumber: form.panNumber || null,
      passportNumber: form.passportNumber || null
    }
  });

  const applyResponse = (response) => {
    const person = normalizePerson(response);
    if (!person) return;
    updateCaseContext({ personDetails: person });
    setForm(person);
    setInitialData(person);
  };

  const handleNext = async () => {
    if (!validateForm()) { setMessage('Please correct the highlighted fields before proceeding.'); return; }
    setMessage(''); setMessageType(''); setIsSubmitting(true);
    try {
      const response = await nextPersonInformation(buildPayload());
      if (isValidationResponse(response)) { setMessage(response.message || 'Validation error'); setMessageType('warning'); return; }
      applyResponse(response);
      const savedPerson = { ...form, age: calculateAge(form.dob) };
      const existingPeople = caseContext.people || [];
      const savedId = savedPerson.personId;
      const people = savedId == null ? [...existingPeople, savedPerson] : existingPeople.some((person) => person.personId === savedId) ? existingPeople.map((person) => person.personId === savedId ? savedPerson : person) : [...existingPeople, savedPerson];
      updateCaseContext({ personDetails: savedPerson, selectedPerson: savedPerson, people });
      if (typeof onContinue === 'function') onContinue();
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to proceed. Please try again.')); setMessageType('warning');
    } finally { setIsSubmitting(false); }
  };

  const handlePrevious = async () => {
    setMessage(''); setMessageType(''); setIsSubmitting(true);
    try {
      const response = await previousPersonInformation(buildPayload());
      if (isValidationResponse(response)) { setMessage(response.message || 'Validation error'); setMessageType('warning'); return; }
      applyResponse(response);
      updateCaseContext({ personDetails: form });
      if (typeof onPrevious === 'function') onPrevious();
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to go back. Please try again.')); setMessageType('warning');
    } finally { setIsSubmitting(false); }
  };

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      if (!caseContext.applicationNumber) return;
      try {
        const response = await initializePersonInformation({ appOrCaseNum: caseContext.applicationNumber, pageId: 'DC005', personId: initialForm.personId });
        if (!mounted) return;
        if (isValidationResponse(response)) { setMessage(response.message || 'Validation error'); setMessageType('warning'); return; }
        applyResponse(response);
      } catch (error) {
        if (!mounted) return;
        setMessage(getErrorMessage(error, 'Unable to load person information. You can continue with manual entry.'));
        setMessageType('warning');
      }
    };
    initialize();
    return () => { mounted = false; };
  }, [caseContext.applicationNumber, initialForm.personId]);

  const isValid = Object.keys(initialState).every((field) => !validatePersonField(field, form[field]));
  const select = (id, field, options, label) => <div className="field-group"><label className="field-label" htmlFor={id}>{label}</label><select id={id} className="field-input" value={form[field]} onChange={updateField(field)}>{field !== 'personType' && <option value="">Select {label.replace(' *', '').toLowerCase()}</option>}{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>{errors[field] && <span className="field-error">{errors[field]}</span>}</div>;
  return <div className="card dc-card"><div className="page-header"><div><h1 className="page-title">Person Information</h1><p className="page-description">Please provide the personal information for each individual associated with this application.</p></div></div><section className="section-card dc-section"><h2 className="section-title">Personal Details</h2><div className="dc-person-grid">{select('dcPersonType', 'personType', personTypes, 'Application / Person Type *')}<div className="field-group"><label className="field-label" htmlFor="dcPersonFirstName">First Name *</label><input id="dcPersonFirstName" className="field-input" value={form.firstName} onChange={updateField('firstName')} placeholder="Enter first name" />{errors.firstName && <span className="field-error">{errors.firstName}</span>}</div><div className="field-group"><label className="field-label" htmlFor="dcPersonMiddleName">Middle Name</label><input id="dcPersonMiddleName" className="field-input" value={form.middleName} onChange={updateField('middleName')} placeholder="Enter middle name (optional)" /></div><div className="field-group"><label className="field-label" htmlFor="dcPersonLastName">Last Name *</label><input id="dcPersonLastName" className="field-input" value={form.lastName} onChange={updateField('lastName')} placeholder="Enter last name" />{errors.lastName && <span className="field-error">{errors.lastName}</span>}</div><div className="field-group"><label className="field-label" htmlFor="dcPersonDob">Date of Birth *</label><input id="dcPersonDob" className="field-input" type="date" max={new Date().toISOString().slice(0, 10)} value={form.dob} onChange={updateField('dob')} />{errors.dob && <span className="field-error">{errors.dob}</span>}</div>{select('dcPersonGender', 'gender', genders, 'Gender *')}{select('dcPersonCaste', 'casteRace', casteOptions, 'Caste / Race *')}{select('dcPersonReligion', 'religion', religionOptions, 'Religion *')}{select('dcPersonMarital', 'maritalStatus', maritalStatuses, 'Marital Status *')}<div className="field-group"><label className="field-label" htmlFor="dcPersonAadhar">Aadhaar Number * (12 digits only)</label><input id="dcPersonAadhar" className="field-input" inputMode="numeric" maxLength="12" value={form.aadharNumber} onChange={updateField('aadharNumber')} placeholder="Enter 12-digit Aadhaar" />{errors.aadharNumber && <span className="field-error">{errors.aadharNumber}</span>}</div><div className="field-group"><label className="field-label" htmlFor="dcPersonPan">PAN Number (if available)</label><input id="dcPersonPan" className="field-input" maxLength="10" value={form.panNumber} onChange={updateField('panNumber')} placeholder="XXXXX0000X (for example, ABCDE1111Q)" />{errors.panNumber && <span className="field-error">{errors.panNumber}</span>}</div><div className="field-group"><label className="field-label" htmlFor="dcPersonPassport">Passport Number (if available)</label><input id="dcPersonPassport" className="field-input" maxLength="8" value={form.passportNumber} onChange={updateField('passportNumber')} placeholder="X0000000 (one letter followed by seven digits)" />{errors.passportNumber && <span className="field-error">{errors.passportNumber}</span>}</div></div></section><div className="dc-note"><span className="dc-note-icon" aria-hidden>i</span><div><strong>Note</strong><p>Please ensure all details are accurate as they will be used for eligibility assessment.</p></div></div>{message && <div className={messageType === 'warning' ? 'notification-banner warning' : 'info-box dc-message'}>{message}</div>}<div className="dc-address-actions"><button type="button" className="secondary-button" disabled={isSubmitting} onClick={handlePrevious}>← Previous</button><button type="button" className="secondary-button" disabled={isSubmitting} onClick={handleReset}>↻ Reset</button><div className="dc-person-actions"><button type="button" className="secondary-button dc-add-person" disabled={isSubmitting} onClick={handleAddAnother}>＋ Add Another Person</button><button type="button" className="primary-button" disabled={!isValid || isSubmitting} onClick={handleNext}>Next →</button></div></div></div>;
}

export default DC004PersonInformation;
