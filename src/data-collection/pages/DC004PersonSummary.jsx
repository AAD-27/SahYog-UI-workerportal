import React, { useEffect, useState } from 'react';
import { addNewPerson, deletePerson, editPerson, initializePersonSummary, nextPersonSummary, previousPersonSummary } from '../../services/dataCollectionApi';

const isValidationResponse = (response) => response && parseInt(response.status, 10) === 512;
const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.response?.data?.msg || fallback;
const getPeople = (response) => {
  const raw = response?.data || response;
  const people = raw?.persons || raw?.people || raw?.personRecords || response?.persons;
  return Array.isArray(people) ? people : null;
};
const getPersonId = (person) => person.personId ?? person.id ?? person.personDetailId ?? person.recordId;

function EditIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Zm10-12 3 3M13 20h7" /></svg>; }
function DeleteIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>; }

function DC004PersonSummary({ caseContext, updateCaseContext, onContinue, onPrevious, onOpenPerson }) {
  const [people, setPeople] = useState(caseContext.people || []);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const navigationPayload = { appOrCaseNum: caseContext.applicationNumber, pageId: 'DC004' };

  const applyResponse = (response) => {
    const records = getPeople(response);
    if (!records) return;
    setPeople(records);
    updateCaseContext({ people: records });
  };

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      if (!caseContext.applicationNumber) return;
      setIsLoading(true);
      try {
        const response = await initializePersonSummary({ appOrCaseNum: caseContext.applicationNumber });
        if (!mounted) return;
        if (isValidationResponse(response)) { setMessage(response.message || 'Unable to load person summary.'); setMessageType('warning'); return; }
        applyResponse(response);
      } catch (error) {
        if (!mounted) return;
        setMessage(getErrorMessage(error, 'Unable to load person summary.')); setMessageType('warning');
      } finally { if (mounted) setIsLoading(false); }
    };
    initialize();
    return () => { mounted = false; };
  }, [caseContext.applicationNumber]);

  const handleAdd = async () => {
    setMessage(''); setMessageType(''); setIsLoading(true);
    try {
      const response = await addNewPerson(navigationPayload);
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to add person.'); setMessageType('warning'); return; }
      updateCaseContext({ selectedPerson: null, personDetails: null, personMode: 'add' });
      if (typeof onOpenPerson === 'function') onOpenPerson();
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to start a new person record.')); setMessageType('warning'); }
    finally { setIsLoading(false); }
  };

  const handleEdit = async (person) => {
    const personId = getPersonId(person);
    if (personId == null) { setMessage('This person record cannot be edited because its identifier is missing.'); setMessageType('warning'); return; }
    setMessage(''); setMessageType(''); setIsLoading(true);
    try {
      const response = await editPerson({ appOrCaseNum: caseContext.applicationNumber, personId });
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to edit person.'); setMessageType('warning'); return; }
      updateCaseContext({ selectedPerson: response?.data?.person || response?.person || person, personDetails: response?.data?.person || response?.person || person, personMode: 'edit' });
      if (typeof onOpenPerson === 'function') onOpenPerson();
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to open the person record.')); setMessageType('warning'); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async (person) => {
    const personId = getPersonId(person);
    if (personId == null) { setMessage('This person record cannot be deleted because its identifier is missing.'); setMessageType('warning'); return; }
    if (!window.confirm('Delete this person record? This action cannot be undone.')) return;
    setMessage(''); setMessageType(''); setDeletingId(personId);
    try {
      const response = await deletePerson({ appOrCaseNum: caseContext.applicationNumber, personId });
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to delete person.'); setMessageType('warning'); return; }
      const records = getPeople(response);
      const nextRecords = records || people.filter((item) => getPersonId(item) !== personId);
      setPeople(nextRecords); updateCaseContext({ people: nextRecords });
      setMessage(response?.message || 'Person record deleted successfully.');
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to delete the person record.')); setMessageType('warning'); }
    finally { setDeletingId(null); }
  };

  const handlePrevious = async () => {
    setMessage(''); setMessageType(''); setIsLoading(true);
    try {
      const response = await previousPersonSummary(navigationPayload);
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to go back.'); setMessageType('warning'); return; }
      if (typeof onPrevious === 'function') onPrevious();
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to go back. Please try again.')); setMessageType('warning'); }
    finally { setIsLoading(false); }
  };

  const handleNext = async () => {
    setMessage(''); setMessageType(''); setIsLoading(true);
    try {
      const response = await nextPersonSummary(navigationPayload);
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to proceed.'); setMessageType('warning'); return; }
      if (typeof onContinue === 'function') onContinue();
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to proceed. Please try again.')); setMessageType('warning'); }
    finally { setIsLoading(false); }
  };

  return <div className="card dc-card dc-income-summary"><div className="page-header"><div><h1 className="page-title">Person Summary</h1><p className="page-description">View, edit or delete person records. You can also add a new person.</p></div></div>{message && <div className={messageType === 'warning' ? 'notification-banner warning dc-top-message' : 'info-box dc-message dc-top-message'}>{message}</div>}<div className="dc-income-table-wrap"><table className="dc-income-table dc-person-summary-table"><thead><tr><th>Person Type</th><th>First Name</th><th>Last Name</th><th>Age</th><th>Gender</th><th>Actions</th></tr></thead><tbody>{people.map((person, index) => { const personId = getPersonId(person); return <tr key={personId ?? index}><td>{person.personType || '—'}</td><td>{person.firstName || '—'}</td><td>{person.lastName || '—'}</td><td>{person.age ?? '—'}</td><td>{person.gender || '—'}</td><td><div className="dc-income-actions"><button type="button" className="dc-icon-button edit" aria-label="Edit person" title="Edit person" onClick={() => handleEdit(person)}><EditIcon /></button><button type="button" className="dc-icon-button delete" aria-label="Delete person" title="Delete person" disabled={deletingId === personId} onClick={() => handleDelete(person)}><DeleteIcon /></button></div></td></tr>; })}{!isLoading && !people.length && <tr><td className="dc-empty-row" colSpan="6">No person records found.</td></tr>}{isLoading && !people.length && <tr><td className="dc-empty-row" colSpan="6">Loading person records…</td></tr>}</tbody></table></div><div className="dc-income-navigation"><button type="button" className="secondary-button" disabled={isLoading} onClick={handlePrevious}>← Previous</button><button type="button" className="secondary-button dc-add-income" disabled={isLoading} onClick={handleAdd}>＋&nbsp; Add New Person</button><button type="button" className="primary-button" disabled={isLoading} onClick={handleNext}>Next&nbsp;&nbsp; →</button></div></div>;
}

export default DC004PersonSummary;
