import React, { useEffect, useState } from 'react';
import { addNewResource, deleteResource, editResource, initializeResourceSummary, nextResourceSummary, previousResourceSummary } from '../../services/dataCollectionApi';

const isValidationResponse = (response) => response && parseInt(response.status, 10) === 512;
const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.response?.data?.msg || fallback;
const getResourceRecords = (response) => {
  const raw = response?.data || response;
  const records = raw?.resources || raw?.resourceRecords || raw?.resourceSummary || response?.resources;
  return Array.isArray(records) ? records : null;
};
const getResourceId = (resource) => resource.resourceId ?? resource.id ?? resource.resourceDetailId ?? resource.recordId;
const formatDate = (value) => {
  if (!value) return '—';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
};

function EditIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Zm10-12 3 3M13 20h7" /></svg>; }
function DeleteIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>; }

function DC010ResourceSummary({ caseContext, updateCaseContext, onContinue, onPrevious, onOpenResource }) {
  const [resources, setResources] = useState(caseContext.resources || []);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const navigationPayload = { appOrCaseNum: caseContext.applicationNumber, pageId: 'DC011' };

  const applyResponse = (response) => {
    const records = getResourceRecords(response);
    if (!records) return;
    setResources(records);
    updateCaseContext({ resources: records });
  };

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      if (!caseContext.applicationNumber) return;
      setIsLoading(true);
      try {
        const response = await initializeResourceSummary({ appOrCaseNum: caseContext.applicationNumber });
        if (!mounted) return;
        if (isValidationResponse(response)) { setMessage(response.message || 'Unable to load resource summary.'); setMessageType('warning'); return; }
        applyResponse(response);
      } catch (error) {
        if (!mounted) return;
        setMessage(getErrorMessage(error, 'Unable to load resource summary.')); setMessageType('warning');
      } finally { if (mounted) setIsLoading(false); }
    };
    initialize();
    return () => { mounted = false; };
  }, [caseContext.applicationNumber]);

  const handleAdd = async () => {
    setMessage(''); setMessageType(''); setIsLoading(true);
    try {
      const response = await addNewResource(navigationPayload);
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to add resource.'); setMessageType('warning'); return; }
      updateCaseContext({ selectedResource: response?.data?.resource || response?.resource || null, resourceMode: 'add' });
      if (typeof onOpenResource === 'function') onOpenResource();
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to start a new resource record.')); setMessageType('warning'); }
    finally { setIsLoading(false); }
  };

  const handleEdit = async (resource) => {
    const resourceId = getResourceId(resource);
    if (resourceId == null) { setMessage('This resource record cannot be edited because its identifier is missing.'); setMessageType('warning'); return; }
    setMessage(''); setMessageType(''); setIsLoading(true);
    try {
      const response = await editResource({ appOrCaseNum: caseContext.applicationNumber, resourceId });
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to edit resource.'); setMessageType('warning'); return; }
      updateCaseContext({ selectedResource: response?.data?.resource || response?.resource || resource, resourceMode: 'edit' });
      if (typeof onOpenResource === 'function') onOpenResource();
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to open the resource record.')); setMessageType('warning'); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async (resource) => {
    const resourceId = getResourceId(resource);
    if (resourceId == null) { setMessage('This resource record cannot be deleted because its identifier is missing.'); setMessageType('warning'); return; }
    if (!window.confirm('Delete this resource record? This action cannot be undone.')) return;
    setMessage(''); setMessageType(''); setDeletingId(resourceId);
    try {
      const response = await deleteResource({ appOrCaseNum: caseContext.applicationNumber, resourceId });
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to delete resource.'); setMessageType('warning'); return; }
      const records = getResourceRecords(response);
      const nextRecords = records || resources.filter((item) => getResourceId(item) !== resourceId);
      setResources(nextRecords); updateCaseContext({ resources: nextRecords });
      setMessage(response?.message || 'Resource record deleted successfully.');
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to delete the resource record.')); setMessageType('warning'); }
    finally { setDeletingId(null); }
  };

  const handlePrevious = async () => {
    setMessage(''); setMessageType(''); setIsLoading(true);
    try {
      const response = await previousResourceSummary(navigationPayload);
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to go back.'); setMessageType('warning'); return; }
      if (typeof onPrevious === 'function') onPrevious();
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to go back. Please try again.')); setMessageType('warning'); }
    finally { setIsLoading(false); }
  };

  const handleNext = async () => {
    setMessage(''); setMessageType(''); setIsLoading(true);
    try {
      const response = await nextResourceSummary(navigationPayload);
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to proceed.'); setMessageType('warning'); return; }
      if (typeof onContinue === 'function') onContinue();
      else setMessage(response?.message || 'Resource summary completed successfully.');
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to proceed. Please try again.')); setMessageType('warning'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="card dc-card dc-income-summary">
      <div className="page-header"><div><h1 className="page-title">Resource Summary</h1><p className="page-description">View, edit or delete resource records. You can also add new resource details.</p></div></div>
      {message && <div className={messageType === 'warning' ? 'notification-banner warning dc-top-message' : 'info-box dc-message dc-top-message'}>{message}</div>}
      <div className="dc-income-table-wrap"><table className="dc-income-table dc-resource-table"><thead><tr><th>Resource Type</th><th>Resource Detail</th><th>Resource Start Date</th><th>Actions</th></tr></thead><tbody>
        {resources.map((resource, index) => { const resourceId = getResourceId(resource); return <tr key={resourceId ?? index}><td>{resource.resourceType || '—'}</td><td>{resource.resourceDetail || resource.resourceDetails || resource.description || '—'}</td><td>{formatDate(resource.resourceStartDate)}</td><td><div className="dc-income-actions"><button type="button" className="dc-icon-button edit" aria-label="Edit resource" title="Edit resource" onClick={() => handleEdit(resource)}><EditIcon /></button><button type="button" className="dc-icon-button delete" aria-label="Delete resource" title="Delete resource" disabled={deletingId === resourceId} onClick={() => handleDelete(resource)}><DeleteIcon /></button></div></td></tr>; })}
        {!isLoading && !resources.length && <tr><td className="dc-empty-row" colSpan="4">No resource records found.</td></tr>}
        {isLoading && !resources.length && <tr><td className="dc-empty-row" colSpan="4">Loading resource records…</td></tr>}
      </tbody></table></div>
      <div className="dc-income-navigation"><button type="button" className="secondary-button" disabled={isLoading} onClick={handlePrevious}>← Previous</button><button type="button" className="secondary-button dc-add-income" disabled={isLoading} onClick={handleAdd}>＋&nbsp; Add New Resource</button><button type="button" className="primary-button" disabled={isLoading} onClick={handleNext}>Next&nbsp;&nbsp; →</button></div>
    </div>
  );
}

export default DC010ResourceSummary;
