import React, { useEffect, useState } from 'react';
import {
  addNewIncome,
  deleteIncome,
  editIncome,
  initializeIncomeSummary,
  nextIncomeSummary,
  previousIncomeSummary
} from '../../services/dataCollectionApi';

const isValidationResponse = (response) => response && parseInt(response.status, 10) === 512;
const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.response?.data?.msg || fallback;

const getIncomeRecords = (response) => {
  const raw = response?.data || response;
  const records = raw?.incomes || raw?.incomeRecords || raw?.incomeSummary || response?.incomes;
  return Array.isArray(records) ? records : null;
};

const getIncomeId = (income) => income.incomeId ?? income.id ?? income.incomeDetailId ?? income.recordId;

const formatDate = (value) => {
  if (!value) return '—';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
};

function EditIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Zm10-12 3 3M13 20h7" /></svg>;
}

function DeleteIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>;
}

function DC006IncomeSummary({ caseContext, updateCaseContext, onContinue, onPrevious, onOpenIncome }) {
  const [incomes, setIncomes] = useState(caseContext.incomes || []);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const applyResponse = (response) => {
    const records = getIncomeRecords(response);
    if (!records) return;
    setIncomes(records);
    updateCaseContext({ incomes: records });
  };

  const navigationPayload = { appOrCaseNum: caseContext.applicationNumber, pageId: 'DC007' };

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      if (!caseContext.applicationNumber) return;
      setIsLoading(true);
      try {
        const response = await initializeIncomeSummary({ appOrCaseNum: caseContext.applicationNumber });
        if (!mounted) return;
        if (isValidationResponse(response)) {
          setMessage(response.message || 'Unable to load income summary.');
          setMessageType('warning');
          return;
        }
        applyResponse(response);
      } catch (error) {
        if (!mounted) return;
        setMessage(getErrorMessage(error, 'Unable to load income summary.'));
        setMessageType('warning');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    initialize();
    return () => { mounted = false; };
  }, [caseContext.applicationNumber]);

  const handleAdd = async () => {
    setMessage(''); setMessageType(''); setIsLoading(true);
    try {
      const response = await addNewIncome(navigationPayload);
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to add income.'); setMessageType('warning'); return; }
      const income = response?.data?.income || response?.income || null;
      updateCaseContext({ selectedIncome: income, incomeMode: 'add' });
      if (typeof onOpenIncome === 'function') onOpenIncome();
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to start a new income record.'));
      setMessageType('warning');
    } finally { setIsLoading(false); }
  };

  const handleEdit = async (income) => {
    const incomeId = getIncomeId(income);
    if (incomeId == null) { setMessage('This income record cannot be edited because its identifier is missing.'); setMessageType('warning'); return; }
    setMessage(''); setMessageType(''); setIsLoading(true);
    try {
      const response = await editIncome({ appOrCaseNum: caseContext.applicationNumber, incomeId });
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to edit income.'); setMessageType('warning'); return; }
      const selectedIncome = response?.data?.income || response?.income || income;
      updateCaseContext({ selectedIncome, incomeMode: 'edit' });
      if (typeof onOpenIncome === 'function') onOpenIncome();
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to open the income record.'));
      setMessageType('warning');
    } finally { setIsLoading(false); }
  };

  const handleDelete = async (income) => {
    const incomeId = getIncomeId(income);
    if (incomeId == null) { setMessage('This income record cannot be deleted because its identifier is missing.'); setMessageType('warning'); return; }
    if (!window.confirm('Delete this income record? This action cannot be undone.')) return;
    setMessage(''); setMessageType(''); setDeletingId(incomeId);
    try {
      const response = await deleteIncome({ appOrCaseNum: caseContext.applicationNumber, incomeId });
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to delete income.'); setMessageType('warning'); return; }
      const records = getIncomeRecords(response);
      const nextRecords = records || incomes.filter((item) => getIncomeId(item) !== incomeId);
      setIncomes(nextRecords);
      updateCaseContext({ incomes: nextRecords });
      setMessage(response?.message || 'Income record deleted successfully.');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to delete the income record.'));
      setMessageType('warning');
    } finally { setDeletingId(null); }
  };

  const handlePrevious = async () => {
    setMessage(''); setMessageType(''); setIsLoading(true);
    try {
      const response = await previousIncomeSummary(navigationPayload);
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to go back.'); setMessageType('warning'); return; }
      if (typeof onPrevious === 'function') onPrevious();
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to go back. Please try again.')); setMessageType('warning');
    } finally { setIsLoading(false); }
  };

  const handleNext = async () => {
    setMessage(''); setMessageType(''); setIsLoading(true);
    try {
      const response = await nextIncomeSummary(navigationPayload);
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to proceed.'); setMessageType('warning'); return; }
      if (typeof onContinue === 'function') onContinue();
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to proceed. Please try again.')); setMessageType('warning');
    } finally { setIsLoading(false); }
  };

  return (
    <div className="card dc-card dc-income-summary">
      <div className="page-header"><div><h1 className="page-title">Income Summary</h1><p className="page-description">View, edit or delete income records. You can also add new income details.</p></div></div>
      {message && <div className={messageType === 'warning' ? 'notification-banner warning dc-top-message' : 'info-box dc-message dc-top-message'}>{message}</div>}
      <div className="dc-income-table-wrap">
        <table className="dc-income-table">
          <thead><tr><th>Income Type</th><th>Employer Name</th><th>Income Start Date</th><th>Pay Frequency</th><th>Actions</th></tr></thead>
          <tbody>
            {incomes.map((income, index) => {
              const incomeId = getIncomeId(income);
              return <tr key={incomeId ?? index}><td>{income.incomeType || '—'}</td><td>{income.employerName || income.EmployerName || '—'}</td><td>{formatDate(income.incomeStartDate)}</td><td>{income.payFrequency || '—'}</td><td><div className="dc-income-actions"><button type="button" className="dc-icon-button edit" aria-label="Edit income" title="Edit income" onClick={() => handleEdit(income)}><EditIcon /></button><button type="button" className="dc-icon-button delete" aria-label="Delete income" title="Delete income" disabled={deletingId === incomeId} onClick={() => handleDelete(income)}><DeleteIcon /></button></div></td></tr>;
            })}
            {!isLoading && !incomes.length && <tr><td className="dc-empty-row" colSpan="5">No income records found.</td></tr>}
            {isLoading && !incomes.length && <tr><td className="dc-empty-row" colSpan="5">Loading income records…</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="dc-income-navigation"><button type="button" className="secondary-button" disabled={isLoading} onClick={handlePrevious}>← Previous</button><button type="button" className="secondary-button dc-add-income" disabled={isLoading} onClick={handleAdd}>＋&nbsp; Add New Income</button><button type="button" className="primary-button" disabled={isLoading} onClick={handleNext}>Next&nbsp;&nbsp; →</button></div>
    </div>
  );
}

export default DC006IncomeSummary;
