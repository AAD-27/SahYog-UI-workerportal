import React, { useEffect, useState } from 'react';
import { addNewExpense, deleteExpense, editExpense, initializeExpenseSummary, nextExpenseSummary, previousExpenseSummary } from '../../services/dataCollectionApi';

const isValidationResponse = (response) => response && parseInt(response.status, 10) === 512;
const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.response?.data?.msg || fallback;
const getExpenseRecords = (response) => {
  const raw = response?.data || response;
  const records = raw?.expenses || raw?.expenseRecords || raw?.expenseSummary || response?.expenses;
  return Array.isArray(records) ? records : null;
};
const getExpenseId = (expense) => expense.expenseId ?? expense.id ?? expense.expenseDetailId ?? expense.recordId;
const formatDate = (value) => {
  if (!value) return '—';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
};

function EditIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Zm10-12 3 3M13 20h7" /></svg>; }
function DeleteIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>; }

function DC008ExpenseSummary({ caseContext, updateCaseContext, onContinue, onPrevious, onOpenExpense }) {
  const [expenses, setExpenses] = useState(caseContext.expenses || []);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const navigationPayload = { appOrCaseNum: caseContext.applicationNumber, pageId: 'DC009' };

  const applyResponse = (response) => {
    const records = getExpenseRecords(response);
    if (!records) return;
    setExpenses(records);
    updateCaseContext({ expenses: records });
  };

  useEffect(() => {
    let mounted = true;
    const initialize = async () => {
      if (!caseContext.applicationNumber) return;
      setIsLoading(true);
      try {
        const response = await initializeExpenseSummary({ appOrCaseNum: caseContext.applicationNumber });
        if (!mounted) return;
        if (isValidationResponse(response)) { setMessage(response.message || 'Unable to load expense summary.'); setMessageType('warning'); return; }
        applyResponse(response);
      } catch (error) {
        if (!mounted) return;
        setMessage(getErrorMessage(error, 'Unable to load expense summary.')); setMessageType('warning');
      } finally { if (mounted) setIsLoading(false); }
    };
    initialize();
    return () => { mounted = false; };
  }, [caseContext.applicationNumber]);

  const handleAdd = async () => {
    setMessage(''); setMessageType(''); setIsLoading(true);
    try {
      const response = await addNewExpense(navigationPayload);
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to add expense.'); setMessageType('warning'); return; }
      updateCaseContext({ selectedExpense: response?.data?.expense || response?.expense || null, expenseMode: 'add' });
      if (typeof onOpenExpense === 'function') onOpenExpense();
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to start a new expense record.')); setMessageType('warning'); }
    finally { setIsLoading(false); }
  };

  const handleEdit = async (expense) => {
    const expenseId = getExpenseId(expense);
    if (expenseId == null) { setMessage('This expense record cannot be edited because its identifier is missing.'); setMessageType('warning'); return; }
    setMessage(''); setMessageType(''); setIsLoading(true);
    try {
      const response = await editExpense({ appOrCaseNum: caseContext.applicationNumber, expenseId });
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to edit expense.'); setMessageType('warning'); return; }
      updateCaseContext({ selectedExpense: response?.data?.expense || response?.expense || expense, expenseMode: 'edit' });
      if (typeof onOpenExpense === 'function') onOpenExpense();
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to open the expense record.')); setMessageType('warning'); }
    finally { setIsLoading(false); }
  };

  const handleDelete = async (expense) => {
    const expenseId = getExpenseId(expense);
    if (expenseId == null) { setMessage('This expense record cannot be deleted because its identifier is missing.'); setMessageType('warning'); return; }
    if (!window.confirm('Delete this expense record? This action cannot be undone.')) return;
    setMessage(''); setMessageType(''); setDeletingId(expenseId);
    try {
      const response = await deleteExpense({ appOrCaseNum: caseContext.applicationNumber, expenseId });
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to delete expense.'); setMessageType('warning'); return; }
      const records = getExpenseRecords(response);
      const nextRecords = records || expenses.filter((item) => getExpenseId(item) !== expenseId);
      setExpenses(nextRecords); updateCaseContext({ expenses: nextRecords });
      setMessage(response?.message || 'Expense record deleted successfully.');
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to delete the expense record.')); setMessageType('warning'); }
    finally { setDeletingId(null); }
  };

  const handlePrevious = async () => {
    setMessage(''); setMessageType(''); setIsLoading(true);
    try {
      const response = await previousExpenseSummary(navigationPayload);
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to go back.'); setMessageType('warning'); return; }
      if (typeof onPrevious === 'function') onPrevious();
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to go back. Please try again.')); setMessageType('warning'); }
    finally { setIsLoading(false); }
  };

  const handleNext = async () => {
    setMessage(''); setMessageType(''); setIsLoading(true);
    try {
      const response = await nextExpenseSummary(navigationPayload);
      if (isValidationResponse(response)) { setMessage(response.message || 'Unable to proceed.'); setMessageType('warning'); return; }
      if (typeof onContinue === 'function') onContinue();
      else setMessage(response?.message || 'Expense summary completed successfully.');
    } catch (error) { setMessage(getErrorMessage(error, 'Unable to proceed. Please try again.')); setMessageType('warning'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="card dc-card dc-income-summary">
      <div className="page-header"><div><h1 className="page-title">Expense Summary</h1><p className="page-description">View, edit or delete expense records. You can also add new expense details.</p></div></div>
      {message && <div className={messageType === 'warning' ? 'notification-banner warning dc-top-message' : 'info-box dc-message dc-top-message'}>{message}</div>}
      <div className="dc-income-table-wrap"><table className="dc-income-table"><thead><tr><th>Expense Type</th><th>Expense Start Date</th><th>Expense Details</th><th>Expense Frequency</th><th>Actions</th></tr></thead><tbody>
        {expenses.map((expense, index) => { const expenseId = getExpenseId(expense); return <tr key={expenseId ?? index}><td>{expense.expenseType || '—'}</td><td>{formatDate(expense.expenseStartDate)}</td><td>{expense.expenseDetail || expense.expenseDetails || expense.description || '—'}</td><td>{expense.expenseFrequency || expense.frequency || '—'}</td><td><div className="dc-income-actions"><button type="button" className="dc-icon-button edit" aria-label="Edit expense" title="Edit expense" onClick={() => handleEdit(expense)}><EditIcon /></button><button type="button" className="dc-icon-button delete" aria-label="Delete expense" title="Delete expense" disabled={deletingId === expenseId} onClick={() => handleDelete(expense)}><DeleteIcon /></button></div></td></tr>; })}
        {!isLoading && !expenses.length && <tr><td className="dc-empty-row" colSpan="5">No expense records found.</td></tr>}
        {isLoading && !expenses.length && <tr><td className="dc-empty-row" colSpan="5">Loading expense records…</td></tr>}
      </tbody></table></div>
      <div className="dc-income-navigation"><button type="button" className="secondary-button" disabled={isLoading} onClick={handlePrevious}>← Previous</button><button type="button" className="secondary-button dc-add-income" disabled={isLoading} onClick={handleAdd}>＋&nbsp; Add New Expense</button><button type="button" className="primary-button" disabled={isLoading} onClick={handleNext}>Next&nbsp;&nbsp; →</button></div>
    </div>
  );
}

export default DC008ExpenseSummary;
