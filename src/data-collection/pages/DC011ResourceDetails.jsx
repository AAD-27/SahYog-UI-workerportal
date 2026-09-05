import React, { useEffect, useMemo, useState } from 'react';
import { initializeResourceDetails, nextResourceDetails, previousResourceDetails } from '../../services/dataCollectionApi';

const resourceOptions = {
  Vehicle: ['Car', 'Motorcycle/Bike', 'Scooter/Scooty', 'Auto Rickshaw', 'Truck', 'Tractor', 'Commercial Vehicle', 'Other Vehicle'],
  'Bank Account': ['Savings Account', 'Current Account', 'Salary Account', 'Fixed Deposit (FD)', 'Recurring Deposit (RD)', 'Other Bank Deposit'],
  Property: ['Residential House', 'Flat/Apartment', 'Commercial Property', 'Shop', 'Office', 'Other Property'],
  Land: ['Agricultural Land', 'Residential Plot', 'Commercial Land', 'Industrial Land', 'Other Land'],
  Investment: ['Mutual Funds', 'Shares/Stocks', 'Bonds', 'Government Securities', 'Other Investments'],
  'Insurance / Savings': ['Life Insurance with Cash Value', 'Endowment Policy', 'Other Savings Policy'],
  'Gold & Jewellery': ['Gold Jewellery', 'Gold Coins/Bars', 'Silver', 'Other Precious Jewellery'],
  'Business Asset': ['Business Ownership', 'Shop/Business Premises', 'Machinery', 'Business Equipment', 'Business Vehicle', 'Other Business Asset'],
  'Retirement / Provident Fund': ['EPF', 'PPF', 'NPS', 'Pension Fund', 'Other Retirement Savings'],
  'Cash / Liquid Asset': ['Cash in Hand', 'Digital Wallet Balance', 'Other Liquid Asset'],
  'Other Resource': ['Inherited Asset', 'Trust/Financial Interest', 'Other Valuable Asset']
};

const emptyResource = { resourceId: null, resourceType: '', resourceDetail: '', resourceValue: '', resourceStartDate: '', resourceEndDate: '' };
const normalizeResource = (response) => {
  const raw = response?.data || response;
  const resource = raw?.resource || (raw?.resourceType ? raw : null);
  return resource && typeof resource === 'object' ? { ...emptyResource, ...resource } : null;
};
const isValidationResponse = (response) => response && parseInt(response.status, 10) === 512;
const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.response?.data?.msg || fallback;

function DC011ResourceDetails({ caseContext, updateCaseContext, onContinue, onPrevious }) {
  const startingResource = useMemo(() => normalizeResource(caseContext.selectedResource) || emptyResource, [caseContext.selectedResource]);
  const [form, setForm] = useState(startingResource);
  const [initialData, setInitialData] = useState(startingResource);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (current = form) => {
    const nextErrors = {};
    if (!current.resourceType) nextErrors.resourceType = 'Resource type is required.';
    if (!current.resourceDetail) nextErrors.resourceDetail = 'Resource detail is required.';
    if (current.resourceValue === '' || Number(current.resourceValue) < 0) nextErrors.resourceValue = 'Enter a resource amount of zero or greater.';
    if (!current.resourceStartDate) nextErrors.resourceStartDate = 'Resource start date is required.';
    if (current.resourceEndDate && current.resourceStartDate && current.resourceEndDate < current.resourceStartDate) nextErrors.resourceEndDate = 'Resource end date cannot be before the start date.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateField = (field) => (event) => {
    let value = event.target.value;
    if (field === 'resourceValue') value = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setForm((previous) => field === 'resourceType' ? { ...previous, resourceType: value, resourceDetail: '' } : { ...previous, [field]: value });
    setErrors((previous) => field === 'resourceType' ? { ...previous, resourceType: undefined, resourceDetail: undefined } : { ...previous, [field]: undefined });
  };

  const buildPayload = () => ({
    appOrCaseNum: caseContext.applicationNumber,
    pageId: 'DC012',
    resource: {
      resourceId: form.resourceId,
      resourceType: form.resourceType,
      resourceDetail: form.resourceDetail,
      resourceValue: Number(form.resourceValue),
      resourceStartDate: form.resourceStartDate,
      resourceEndDate: form.resourceEndDate || ''
    }
  });

  const applyResponse = (response) => {
    const resource = normalizeResource(response);
    if (!resource) return;
    setForm(resource); setInitialData(resource); updateCaseContext({ selectedResource: resource });
  };

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      if (!caseContext.applicationNumber) return;
      try {
        const response = await initializeResourceDetails({ appOrCaseNum: caseContext.applicationNumber, pageId: 'DC012', resourceId: startingResource.resourceId });
        if (!mounted) return;
        if (isValidationResponse(response)) { setMessage(response.message || 'Unable to load resource details.'); setMessageType('warning'); return; }
        applyResponse(response);
      } catch (error) {
        if (!mounted) return;
        setMessage(getErrorMessage(error, 'Unable to load resource details. You can continue with manual entry.')); setMessageType('warning');
      }
    };
    initialize();
    return () => { mounted = false; };
  }, [caseContext.applicationNumber, startingResource.resourceId]);

  const handleNext = async () => {
    if (!validate()) { setMessage('Please correct the highlighted fields before proceeding.'); setMessageType('warning'); return; }
    setMessage(''); setMessageType(''); setIsSubmitting(true);
    try {
      const response = await nextResourceDetails(buildPayload());
      if (isValidationResponse(response)) { setMessage(response.message || 'Validation error'); setMessageType('warning'); return; }
      updateCaseContext({ selectedResource: { ...form, resourceId: response?.resourceId ?? form.resourceId }, resourceMode: 'edit' });
      if (typeof onContinue === 'function') onContinue();
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to save resource details.')); setMessageType('warning'); }
    finally { setIsSubmitting(false); }
  };

  const handlePrevious = async () => {
    setMessage(''); setMessageType(''); setIsSubmitting(true);
    try {
      const response = await previousResourceDetails(buildPayload());
      if (isValidationResponse(response)) { setMessage(response.message || 'Validation error'); setMessageType('warning'); return; }
      updateCaseContext({ selectedResource: { ...form, resourceId: response?.resourceId ?? form.resourceId }, resourceMode: 'edit' });
      if (typeof onPrevious === 'function') onPrevious();
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to go back. Please try again.')); setMessageType('warning'); }
    finally { setIsSubmitting(false); }
  };

  const handleCancel = () => {
    setForm(initialData);
    setErrors({});
    setMessage('');
    setMessageType('');
    updateCaseContext({ selectedResource: null, resourceMode: null });
    if (typeof onPrevious === 'function') onPrevious();
  };

  const detailOptions = resourceOptions[form.resourceType] || [];
  const visibleDetailOptions = form.resourceDetail && !detailOptions.includes(form.resourceDetail)
    ? [form.resourceDetail, ...detailOptions]
    : detailOptions;
  return (
    <div className="card dc-card">
      <div className="page-header"><div><h1 className="page-title">Resource Details</h1><p className="page-description">Please provide resource information for the applicant.</p></div></div>
      {message && <div className={messageType === 'warning' ? 'notification-banner warning dc-top-message' : 'info-box dc-message dc-top-message'}>{message}</div>}
      <section className="section-card dc-resource-detail-section"><div className="dc-resource-detail-grid">
        <div className="field-group dc-resource-wide"><label className="field-label" htmlFor="dcResourceType">Resource Type *</label><select id="dcResourceType" className="field-input" value={form.resourceType} onChange={updateField('resourceType')}><option value="">Select resource type</option>{Object.keys(resourceOptions).map((type) => <option key={type} value={type}>{type}</option>)}</select>{errors.resourceType && <span className="field-error">{errors.resourceType}</span>}</div>
        <div className="field-group dc-resource-wide"><label className="field-label" htmlFor="dcResourceDetail">Resource Detail *</label><select id="dcResourceDetail" className="field-input" value={form.resourceDetail} disabled={!form.resourceType} onChange={updateField('resourceDetail')}><option value="">{form.resourceType ? 'Select resource detail' : 'Select resource type first'}</option>{visibleDetailOptions.map((detail) => <option key={detail} value={detail}>{detail}</option>)}</select>{errors.resourceDetail && <span className="field-error">{errors.resourceDetail}</span>}</div>
        <div className="field-group dc-resource-third"><label className="field-label" htmlFor="dcResourceValue">Resource Amount (₹) *</label><div className="dc-money-input"><span>₹</span><input id="dcResourceValue" className="field-input" inputMode="decimal" value={form.resourceValue} onChange={updateField('resourceValue')} placeholder="Enter resource amount" /></div>{errors.resourceValue && <span className="field-error">{errors.resourceValue}</span>}</div>
        <div className="field-group dc-resource-third"><label className="field-label" htmlFor="dcResourceStartDate">Resource Start Date *</label><input id="dcResourceStartDate" className="field-input" type="date" value={form.resourceStartDate} onChange={updateField('resourceStartDate')} />{errors.resourceStartDate && <span className="field-error">{errors.resourceStartDate}</span>}</div>
        <div className="field-group dc-resource-third"><label className="field-label" htmlFor="dcResourceEndDate">Resource End Date</label><input id="dcResourceEndDate" className="field-input" type="date" min={form.resourceStartDate || undefined} value={form.resourceEndDate} onChange={updateField('resourceEndDate')} /><span className="dc-field-help">Leave blank if resource is ongoing.</span>{errors.resourceEndDate && <span className="field-error">{errors.resourceEndDate}</span>}</div>
      </div></section>
      <div className="dc-income-detail-navigation"><button type="button" className="secondary-button" disabled={isSubmitting} onClick={() => { setForm(initialData); setErrors({}); setMessage(''); }}>↻ Reset</button><div><button type="button" className="secondary-button" disabled={isSubmitting} onClick={handlePrevious}>← Previous</button><button type="button" className="secondary-button dc-cancel-button" disabled={isSubmitting} onClick={handleCancel}>Cancel</button><button type="button" className="primary-button" disabled={isSubmitting} onClick={handleNext}>Next →</button></div></div>
    </div>
  );
}

export default DC011ResourceDetails;
