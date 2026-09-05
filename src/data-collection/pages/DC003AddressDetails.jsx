import React, { useEffect, useMemo, useState } from 'react';
import { initializeAddressDetails, nextAddressDetails, previousAddressDetails } from '../../services/dataCollectionApi';
import { filterNumericInput, validatePinCode } from '../../utils/validation';
import { countries, indianStatesAndUnionTerritories } from '../../utils/locationOptions';

const emptyAddress = { line1: '', line2: '', city: '', state: '', country: '', pincode: '' };
const initialState = { permanent: { ...emptyAddress }, temporary: { ...emptyAddress }, sameAsPermanent: false };

function DC003AddressDetails({ caseContext, updateCaseContext, onContinue, onPrevious }) {
  const initialForm = useMemo(() => caseContext.addressDetails || initialState, [caseContext.addressDetails]);
  const [form, setForm] = useState(initialForm);
  const [initialData, setInitialData] = useState(initialForm);
  const [errors, setErrors] = useState({ permanent: {}, temporary: {} });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const validateField = (field, value) => {
    if (field === 'line2') return undefined;
    if (field === 'pincode') return validatePinCode(value);
    return value.trim() ? undefined : 'This field is required.';
  };

  const updateField = (section, field) => (event) => {
    if (section === 'sameAsPermanent') {
      const sameAsPermanent = event.target.checked;
      setForm((previous) => ({ ...previous, sameAsPermanent, temporary: sameAsPermanent ? { ...previous.permanent } : previous.temporary }));
      return;
    }
    let value = event.target.value;
    if (field === 'pincode') value = filterNumericInput(value).slice(0, 6);
    setForm((previous) => {
      const next = { ...previous, [section]: { ...previous[section], [field]: value } };
      return previous.sameAsPermanent && section === 'permanent' ? { ...next, temporary: { ...next.permanent } } : next;
    });
    setErrors((previous) => ({ ...previous, [section]: { ...previous[section], [field]: validateField(field, value) } }));
  };

  const validateAddress = (address) => Object.fromEntries(Object.entries(address).map(([field, value]) => [field, validateField(field, value)]).filter(([, error]) => error));
  const validateForm = () => {
    const nextErrors = { permanent: validateAddress(form.permanent), temporary: form.sameAsPermanent ? {} : validateAddress(form.temporary) };
    setErrors(nextErrors);
    return !Object.keys(nextErrors.permanent).length && !Object.keys(nextErrors.temporary).length;
  };
  const handleReset = () => { setForm(initialData); setErrors({ permanent: {}, temporary: {} }); setMessage(''); };
  const handleNext = async () => {
    if (!validateForm()) { setMessage('Please correct the highlighted address fields before proceeding.'); return; }
    setMessage('');
    setMessageType('');
    try {
      const payload = { appOrCaseNum: caseContext.applicationNumber, pageId: 'DC003', address: form };
      const res = await nextAddressDetails(payload);
      if (res && parseInt(res.status, 10) === 512) {
        setMessage(res.message || 'Validation error');
        setMessageType('warning');
        return;
      }
      const raw = res?.data || res?.address || res?.addressDetails || res || null;
      let details = null;
      if (raw) details = raw.address ? raw.address : raw;
      if (details) {
        const normalize = (d) => {
          if (!d) return initialState;
          if (d.permanent || d.temporary) {
            return {
              permanent: { ...initialState.permanent, ...(d.permanent || {}) },
              temporary: { ...initialState.temporary, ...(d.temporary || {}) },
              sameAsPermanent: !!d.sameAsPermanent
            };
          }
          return {
            permanent: {
              line1: d.line1 || '',
              line2: d.line2 || '',
              city: d.city || '',
              state: d.state || '',
              country: d.country || '',
              pincode: d.pincode || ''
            },
            temporary: { ...initialState.temporary },
            sameAsPermanent: !!d.sameAsPermanent
          };
        };
        const mapped = normalize(details);
        updateCaseContext({ addressDetails: mapped });
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
      const payload = { appOrCaseNum: caseContext.applicationNumber, pageId: 'DC003' };
      const res = await previousAddressDetails(payload);
      if (res && parseInt(res.status, 10) === 512) {
        setMessage(res.message || 'Validation error');
        setMessageType('warning');
        return;
      }
      const raw = res?.data || res?.address || res?.addressDetails || res || null;
      let details = null;
      if (raw) details = raw.address ? raw.address : raw;
      if (details) {
        const normalize = (d) => {
          if (!d) return initialState;
          if (d.permanent || d.temporary) {
            return {
              permanent: { ...initialState.permanent, ...(d.permanent || {}) },
              temporary: { ...initialState.temporary, ...(d.temporary || {}) },
              sameAsPermanent: !!d.sameAsPermanent
            };
          }
          return {
            permanent: {
              line1: d.line1 || '',
              line2: d.line2 || '',
              city: d.city || '',
              state: d.state || '',
              country: d.country || '',
              pincode: d.pincode || ''
            },
            temporary: { ...initialState.temporary },
            sameAsPermanent: !!d.sameAsPermanent
          };
        };
        const mapped = normalize(details);
        updateCaseContext({ addressDetails: mapped });
        setForm(mapped);
        setInitialData(mapped);
      }
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
          const res = await initializeAddressDetails({ appOrCaseNum: caseContext.applicationNumber });
          if (!mounted) return;
          if (res && parseInt(res.status, 10) === 512) {
            setMessage(res.message || '');
            setMessageType('warning');
            return;
          }
          // The backend may return address under different keys: data, address, addressDetails, or top-level
          const raw = res?.data || res?.address || res?.addressDetails || res || null;
          let details = null;
          if (raw) {
            details = raw.address ? raw.address : raw;
          }
          if (details) {
            // Normalize address shape to { permanent, temporary, sameAsPermanent }
            const normalize = (d) => {
              if (!d) return initialState;
              if (d.permanent || d.temporary) {
                return {
                  permanent: { ...initialState.permanent, ...(d.permanent || {}) },
                  temporary: { ...initialState.temporary, ...(d.temporary || {}) },
                  sameAsPermanent: !!d.sameAsPermanent
                };
              }
              // flat address fields -> populate permanent
              return {
                permanent: {
                  line1: d.line1 || '',
                  line2: d.line2 || '',
                  city: d.city || '',
                  state: d.state || '',
                  country: d.country || '',
                  pincode: d.pincode || ''
                },
                temporary: { ...initialState.temporary },
                sameAsPermanent: !!d.sameAsPermanent
              };
            };
            const mapped = normalize(details);
            updateCaseContext({ addressDetails: mapped });
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
          // ignore errors — allow manual entry
        }
    };
    init();
    return () => { mounted = false; };
  }, [caseContext.applicationNumber]);
  const isValid = !Object.keys(validateAddress(form.permanent)).length && (form.sameAsPermanent || !Object.keys(validateAddress(form.temporary)).length);

  const addressFields = (section, title, disabled) => (
    <div className="dc-address-fields">
      <div className="field-group"><label className="field-label" htmlFor={`${section}Line1`}>Address Line 1 *</label><input id={`${section}Line1`} className="field-input" value={form[section].line1} onChange={updateField(section, 'line1')} disabled={disabled} placeholder="Enter address line 1" />{errors[section].line1 && !disabled && <span className="field-error">{errors[section].line1}</span>}</div>
      <div className="field-group"><label className="field-label" htmlFor={`${section}Line2`}>Address Line 2</label><input id={`${section}Line2`} className="field-input" value={form[section].line2} onChange={updateField(section, 'line2')} disabled={disabled} placeholder="Enter address line 2 (optional)" /></div>
      <div className="field-group"><label className="field-label" htmlFor={`${section}City`}>City *</label><input id={`${section}City`} className="field-input" value={form[section].city} onChange={updateField(section, 'city')} disabled={disabled} placeholder="Enter city" />{errors[section].city && !disabled && <span className="field-error">{errors[section].city}</span>}</div>
      <div className="field-group"><label className="field-label" htmlFor={`${section}State`}>State *</label><select id={`${section}State`} className="field-input" value={form[section].state} onChange={updateField(section, 'state')} disabled={disabled}><option value="">Select state</option>{indianStatesAndUnionTerritories.map((state) => <option key={state} value={state}>{state}</option>)}</select>{errors[section].state && !disabled && <span className="field-error">{errors[section].state}</span>}</div>
      <div className="field-group"><label className="field-label" htmlFor={`${section}Country`}>Country *</label><select id={`${section}Country`} className="field-input" value={form[section].country} onChange={updateField(section, 'country')} disabled={disabled}><option value="">Select country</option>{countries.map((country) => <option key={country} value={country}>{country}</option>)}</select>{errors[section].country && !disabled && <span className="field-error">{errors[section].country}</span>}</div>
      <div className="field-group"><label className="field-label" htmlFor={`${section}Pincode`}>PIN Code *</label><input id={`${section}Pincode`} className="field-input" inputMode="numeric" maxLength="6" value={form[section].pincode} onChange={updateField(section, 'pincode')} disabled={disabled} placeholder="Enter 6-digit PIN code" />{errors[section].pincode && !disabled && <span className="field-error">{errors[section].pincode}</span>}</div>
    </div>
  );

  return (
    <div className="card dc-card">
      <div className="page-header"><div><h1 className="page-title">Address Details</h1><p className="page-description">Please enter the permanent and temporary address details of the applicant.</p></div></div>
      {message && messageType === 'warning' && <div className="notification-banner warning">{message}</div>}
      {message && messageType !== 'warning' && <div className="info-box dc-message">{message}</div>}
      <section className="section-card dc-section"><h2 className="section-title">Permanent Address</h2><p className="section-subtitle">Address Types • Permanent Address</p>{addressFields('permanent', 'Permanent Address', false)}</section>
      <section className="section-card dc-section"><h2 className="section-title">Temporary Address</h2><p className="section-subtitle">Address Types • Temporary Address</p><div className="checkbox-row"><input id="dcSameAsPermanent" type="checkbox" checked={form.sameAsPermanent} onChange={updateField('sameAsPermanent')} /><label htmlFor="dcSameAsPermanent">Same as Permanent Address</label></div>{addressFields('temporary', 'Temporary Address', form.sameAsPermanent)}</section>
      {message && messageType === 'warning' && <div className="notification-banner warning">{message}</div>}
      {message && messageType !== 'warning' && <div className="info-box dc-message">{message}</div>}
      <div className="dc-address-actions">
        <button type="button" className="secondary-button" onClick={handlePrevious}>← Previous</button>
        <button type="button" className="secondary-button" onClick={handleReset}>↻ Reset</button>
        <button type="button" className="primary-button" disabled={!isValid} onClick={handleNext}>Next →</button>
      </div>
    </div>
  );
}

export default DC003AddressDetails;
