import React, { useEffect, useRef, useState } from 'react';
import { initializeAddress, saveAddress } from '../../services/appRegApi';
import { filterNumericInput, validatePinCode } from '../../utils/validation';
import { countries, indianStatesAndUnionTerritories } from '../../utils/locationOptions';
import ResetButton from '../../common/components/ResetButton';

const initialAddress = {
  permanent: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: '',
    pincode: ''
  },
  temporary: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    country: '',
    pincode: ''
  },
  sameAsPermanent: false
};

function AR002RegisterAddress({ applicationContext, updateApplicationContext, setActiveStep }) {
  const [form, setForm] = useState(initialAddress);
  const [initialData, setInitialData] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({
    permanent: {},
    temporary: {}
  });
  const initializedRef = useRef(false);

  useEffect(() => {
    if (applicationContext.initAttempted || initializedRef.current) {
      if (applicationContext.data && Object.keys(applicationContext.data).length > 0) {
        const addressData = applicationContext.data?.address || initialAddress;
        setForm(addressData);
        setInitialData(addressData);
      }
      return;
    }

    const loadInitial = async () => {
      updateApplicationContext({ initAttempted: true });
      try {
        const result = await initializeAddress({ appOrCaseNum: applicationContext.applicationNumber || '' });
        if (!result) {
          setMessage('Unable to load address data. Please refresh.');
          return;
        }

        updateApplicationContext({
          initAttempted: true,
          applicationNumber: result.applicationNum || applicationContext.applicationNumber,
          data: { ...applicationContext.data, address: result.address || initialAddress }
        });

        const addressData = result.address || initialAddress;
        setForm(addressData);
        setInitialData(addressData);
      } catch (error) {
        setMessage('Unable to load address data. Please refresh.');
      }
    };

    initializedRef.current = true;
    loadInitial();
  }, [applicationContext.applicationNumber, applicationContext.data, applicationContext.initAttempted, applicationContext.status, updateApplicationContext]);

  const validateField = (section, field, value) => {
    if (['line2'].includes(field)) {
      return undefined;
    }
    if (field === 'pincode') {
      return validatePinCode(value);
    }
    if (!value.trim()) {
      return 'This field is required.';
    }
    return undefined;
  };

  const updateField = (section, field) => (event) => {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    if (field === 'pincode') {
      value = filterNumericInput(value).slice(0, 6);
    }
    setForm((prev) => {
      if (section === 'sameAsPermanent') {
        const temporary = value ? { ...prev.permanent } : prev.temporary;
        setErrors((prevErrors) => ({
          ...prevErrors,
          temporary: value ? {} : prevErrors.temporary
        }));
        return {
          ...prev,
          sameAsPermanent: value,
          temporary
        };
      }

      const nextState = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      };

      if (prev.sameAsPermanent && section === 'permanent') {
        return {
          ...nextState,
          temporary: {
            ...nextState.permanent
          }
        };
      }

      return nextState;
    });

    if (section !== 'sameAsPermanent') {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [section]: {
          ...prevErrors[section],
          [field]: validateField(section, field, value)
        }
      }));
    }
  };

  const validateForm = () => {
    const nextErrors = {
      permanent: {
        line1: validateField('permanent', 'line1', form.permanent.line1),
        line2: undefined,
        city: validateField('permanent', 'city', form.permanent.city),
        state: validateField('permanent', 'state', form.permanent.state),
        country: validateField('permanent', 'country', form.permanent.country),
        pincode: validateField('permanent', 'pincode', form.permanent.pincode)
      },
      temporary: {
        line1: undefined,
        line2: undefined,
        city: undefined,
        state: undefined,
        country: undefined,
        pincode: undefined
      }
    };

    if (!form.sameAsPermanent) {
      nextErrors.temporary.line1 = validateField('temporary', 'line1', form.temporary.line1);
      nextErrors.temporary.city = validateField('temporary', 'city', form.temporary.city);
      nextErrors.temporary.state = validateField('temporary', 'state', form.temporary.state);
      nextErrors.temporary.country = validateField('temporary', 'country', form.temporary.country);
      nextErrors.temporary.pincode = validateField('temporary', 'pincode', form.temporary.pincode);
    }

    const filtered = {
      permanent: Object.fromEntries(Object.entries(nextErrors.permanent).filter(([, value]) => value)),
      temporary: Object.fromEntries(Object.entries(nextErrors.temporary).filter(([, value]) => value))
    };
    setErrors(filtered);

    return (
      Object.keys(filtered.permanent).length === 0 &&
      Object.keys(filtered.temporary).length === 0
    );
  };

  const handlePrevious = () => {
    setActiveStep('AR001');
  };

  const handleReset = (resetData) => {
    setForm(resetData);
    setErrors({
      permanent: {},
      temporary: {}
    });
    setMessage('');
  };

  const handleNext = async () => {
    if (!validateForm()) {
      setStatus('error');
      setMessage('Please correct the highlighted address fields before proceeding.');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const result = await saveAddress({ appOrCaseNum: applicationContext.applicationNumber, pageId: 'AR002', address: form });

      updateApplicationContext({
        applicationNumber: result.applicationNum || applicationContext.applicationNumber,
        status: result.status || applicationContext.status,
        data: { ...applicationContext.data, address: form }
      });
      setStatus('success');
      setMessage('Address saved successfully. Proceeding to Register Person.');
      setActiveStep('AR003');
    } catch (error) {
      setStatus('error');
      setMessage('Unable to save address details. Please try again.');
    }
  };

  const isValid =
    form.permanent.line1.trim() &&
    form.permanent.city.trim() &&
    form.permanent.state.trim() &&
    form.permanent.country.trim() &&
    !validatePinCode(form.permanent.pincode) &&
    (form.sameAsPermanent || (form.temporary.line1.trim() && form.temporary.city.trim() && form.temporary.state.trim() && form.temporary.country.trim() && !validatePinCode(form.temporary.pincode)));

  return (
    <div className="card">
      <div className="page-header">
        <div>
          <h1 className="page-title">Register Address</h1>
          <p className="page-description">Enter the permanent and temporary address of the applicant.</p>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Permanent Address</h2>
            <p className="section-subtitle">Address Types • Permanent Address</p>
          </div>
        </div>

        <div className="field-row">
          <div className="field-group">
            <label className="field-label" htmlFor="permLine1">Address Line 1 *</label>
            <input
              id="permLine1"
              className="field-input"
              value={form.permanent.line1}
              onChange={updateField('permanent', 'line1')}
              placeholder="Enter address line 1"
            />
            {errors.permanent.line1 && <span className="field-error">{errors.permanent.line1}</span>}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="permLine2">Address Line 2</label>
            <input
              id="permLine2"
              className="field-input"
              value={form.permanent.line2}
              onChange={updateField('permanent', 'line2')}
              placeholder="Enter address line 2 (optional)"
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="permCity">City *</label>
            <input
              id="permCity"
              className="field-input"
              value={form.permanent.city}
              onChange={updateField('permanent', 'city')}
              placeholder="Enter city"
            />
            {errors.permanent.city && <span className="field-error">{errors.permanent.city}</span>}
          </div>
        </div>

        <div className="field-row">
          <div className="field-group">
            <label className="field-label" htmlFor="permState">State *</label>
            <select
              id="permState"
              className="field-input"
              value={form.permanent.state}
              onChange={updateField('permanent', 'state')}
            ><option value="">Select state</option>{indianStatesAndUnionTerritories.map((state) => <option key={state} value={state}>{state}</option>)}</select>
            {errors.permanent.state && <span className="field-error">{errors.permanent.state}</span>}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="permCountry">Country *</label>
            <select
              id="permCountry"
              className="field-input"
              value={form.permanent.country}
              onChange={updateField('permanent', 'country')}
            ><option value="">Select country</option>{countries.map((country) => <option key={country} value={country}>{country}</option>)}</select>
            {errors.permanent.country && <span className="field-error">{errors.permanent.country}</span>}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="permPincode">PIN Code *</label>
            <input
              id="permPincode"
              className="field-input"
              inputMode="numeric"
              maxLength="6"
              value={form.permanent.pincode}
              onChange={updateField('permanent', 'pincode')}
              placeholder="Enter 6-digit PIN code"
            />
            {errors.permanent.pincode && <span className="field-error">{errors.permanent.pincode}</span>}
          </div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Temporary Address</h2>
            <p className="section-subtitle">Address Types • Temporary Address</p>
          </div>
        </div>

        <div className="checkbox-row">
          <input
            id="sameAsPermanent"
            type="checkbox"
            checked={form.sameAsPermanent}
            onChange={updateField('sameAsPermanent', 'sameAsPermanent')}
          />
          <label htmlFor="sameAsPermanent">Same as Permanent Address</label>
        </div>

        <div className="field-row">
          <div className="field-group">
            <label className="field-label" htmlFor="tempLine1">Address Line 1 *</label>
            <input
              id="tempLine1"
              className="field-input"
              value={form.temporary.line1}
              onChange={updateField('temporary', 'line1')}
              placeholder="Enter address line 1"
              disabled={form.sameAsPermanent}
            />
            {errors.temporary.line1 && !form.sameAsPermanent && <span className="field-error">{errors.temporary.line1}</span>}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="tempLine2">Address Line 2</label>
            <input
              id="tempLine2"
              className="field-input"
              value={form.temporary.line2}
              onChange={updateField('temporary', 'line2')}
              placeholder="Enter address line 2 (optional)"
              disabled={form.sameAsPermanent}
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="tempCity">City *</label>
            <input
              id="tempCity"
              className="field-input"
              value={form.temporary.city}
              onChange={updateField('temporary', 'city')}
              placeholder="Enter city"
              disabled={form.sameAsPermanent}
            />
            {errors.temporary.city && !form.sameAsPermanent && <span className="field-error">{errors.temporary.city}</span>}
          </div>
        </div>

        <div className="field-row">
          <div className="field-group">
            <label className="field-label" htmlFor="tempState">State *</label>
            <select
              id="tempState"
              className="field-input"
              value={form.temporary.state}
              onChange={updateField('temporary', 'state')}
              disabled={form.sameAsPermanent}
            ><option value="">Select state</option>{indianStatesAndUnionTerritories.map((state) => <option key={state} value={state}>{state}</option>)}</select>
            {errors.temporary.state && !form.sameAsPermanent && <span className="field-error">{errors.temporary.state}</span>}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="tempCountry">Country *</label>
            <select
              id="tempCountry"
              className="field-input"
              value={form.temporary.country}
              onChange={updateField('temporary', 'country')}
              disabled={form.sameAsPermanent}
            ><option value="">Select country</option>{countries.map((country) => <option key={country} value={country}>{country}</option>)}</select>
            {errors.temporary.country && !form.sameAsPermanent && <span className="field-error">{errors.temporary.country}</span>}
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="tempPincode">PIN Code *</label>
            <input
              id="tempPincode"
              className="field-input"
              inputMode="numeric"
              maxLength="6"
              value={form.temporary.pincode}
              onChange={updateField('temporary', 'pincode')}
              placeholder="Enter 6-digit PIN code"
              disabled={form.sameAsPermanent}
            />
            {errors.temporary.pincode && !form.sameAsPermanent && <span className="field-error">{errors.temporary.pincode}</span>}
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
            initialState={initialAddress}
            onReset={handleReset}
            disabled={status === 'loading'}
          />
          <button type="button" className="secondary-button" disabled={!isValid || status === 'loading'} onClick={handlePrevious}>
            ← Previous
          </button>
        </div>
        <button className="primary-button" disabled={!isValid || status === 'loading'} onClick={handleNext}>
          Next →
        </button>
      </div>
    </div>
  );
}

export default AR002RegisterAddress;
