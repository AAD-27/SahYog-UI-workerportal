import React, { useEffect, useState } from 'react';
import { addNewDisability, deleteDisability, editDisability, initializeDisabilitySummary, nextDisabilitySummary, previousDisabilitySummary } from '../../services/dataCollectionApi';

const getId = (item) => item.disabilityId ?? item.id ?? item.recordId;
const getRows = (response) => {
  const raw = response?.data || response;
  const rows = raw?.disabilities || raw?.disabilityRecords || response?.disabilities;
  return Array.isArray(rows) ? rows : null;
};
const errorMessage = (error, fallback) => error?.response?.data?.message || error?.response?.data?.msg || fallback;
const invalid = (response) => response && parseInt(response.status, 10) === 512;
function EditIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Zm10-12 3 3M13 20h7" /></svg>; }
function DeleteIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>; }

function DC012DisabilitySummary({ caseContext, updateCaseContext, onPrevious, onOpenDisability }) {
  const [rows, setRows] = useState(caseContext.disabilities || []);
  const [message, setMessage] = useState('');
  const [warning, setWarning] = useState(false);
  const [busy, setBusy] = useState(false);
  const payload = { appOrCaseNum: caseContext.applicationNumber, pageId: 'DC013' };
  const applyRows = (response) => { const next = getRows(response); if (next) { setRows(next); updateCaseContext({ disabilities: next }); } };

  useEffect(() => {
    if (!caseContext.applicationNumber) return;
    let mounted = true;
    setBusy(true);
    initializeDisabilitySummary({ appOrCaseNum: caseContext.applicationNumber }).then((response) => {
      if (!mounted) return;
      if (invalid(response)) { setMessage(response.message || 'Unable to load disability summary.'); setWarning(true); return; }
      applyRows(response);
    }).catch((error) => { if (mounted) { setMessage(errorMessage(error, 'Unable to load disability summary.')); setWarning(true); } }).finally(() => { if (mounted) setBusy(false); });
    return () => { mounted = false; };
  }, [caseContext.applicationNumber]);

  const add = async () => { setBusy(true); setMessage(''); try { const response = await addNewDisability(payload); if (invalid(response)) { setMessage(response.message || 'Unable to add disability.'); setWarning(true); return; } updateCaseContext({ selectedDisability: null, disabilityMode: 'add' }); onOpenDisability?.(); } catch (error) { setMessage(errorMessage(error, 'Unable to start a disability record.')); setWarning(true); } finally { setBusy(false); } };
  const edit = async (item) => { const disabilityId = getId(item); if (disabilityId == null) return; setBusy(true); try { const response = await editDisability({ appOrCaseNum: caseContext.applicationNumber, disabilityId }); if (invalid(response)) { setMessage(response.message || 'Unable to edit disability.'); setWarning(true); return; } updateCaseContext({ selectedDisability: response?.disability || item, disabilityMode: 'edit' }); onOpenDisability?.(); } catch (error) { setMessage(errorMessage(error, 'Unable to open the disability record.')); setWarning(true); } finally { setBusy(false); } };
  const remove = async (item) => { const disabilityId = getId(item); if (disabilityId == null || !window.confirm('Delete this disability record?')) return; setBusy(true); try { const response = await deleteDisability({ appOrCaseNum: caseContext.applicationNumber, disabilityId }); if (invalid(response)) { setMessage(response.message || 'Unable to delete disability.'); setWarning(true); return; } const next = getRows(response) || rows.filter((row) => getId(row) !== disabilityId); setRows(next); updateCaseContext({ disabilities: next }); } catch (error) { setMessage(errorMessage(error, 'Unable to delete the disability record.')); setWarning(true); } finally { setBusy(false); } };
  const previous = async () => { setBusy(true); try { const response = await previousDisabilitySummary(payload); if (invalid(response)) { setMessage(response.message || 'Unable to go back.'); setWarning(true); return; } onPrevious?.(); } catch (error) { setMessage(errorMessage(error, 'Unable to go back.')); setWarning(true); } finally { setBusy(false); } };
  const next = async () => { setBusy(true); try { const response = await nextDisabilitySummary(payload); if (invalid(response)) { setMessage(response.message || 'Unable to proceed.'); setWarning(true); return; } setMessage(response?.message || 'Disability summary completed successfully.'); setWarning(false); } catch (error) { setMessage(errorMessage(error, 'Unable to proceed.')); setWarning(true); } finally { setBusy(false); } };

  return <div className="card dc-card dc-income-summary"><div className="page-header"><div><h1 className="page-title">Disability Summary</h1><p className="page-description">View, edit or delete disability records. You can also add new disability details.</p></div></div>{message && <div className={warning ? 'notification-banner warning dc-top-message' : 'info-box dc-message dc-top-message'}>{message}</div>}<div className="dc-income-table-wrap"><table className="dc-income-table"><thead><tr><th>Disability Type</th><th>Person Name</th><th>Age (Years)</th><th>Actions</th></tr></thead><tbody>{rows.map((item, index) => <tr key={getId(item) ?? index}><td>{item.disabilityType || '—'}</td><td>{item.personName || [item.firstName, item.lastName].filter(Boolean).join(' ') || '—'}</td><td>{item.age ?? '—'}</td><td><div className="dc-income-actions"><button type="button" className="dc-icon-button edit" aria-label="Edit disability" onClick={() => edit(item)}><EditIcon /></button><button type="button" className="dc-icon-button delete" aria-label="Delete disability" onClick={() => remove(item)}><DeleteIcon /></button></div></td></tr>)}{!busy && !rows.length && <tr><td className="dc-empty-row" colSpan="4">No disability records found.</td></tr>}{busy && !rows.length && <tr><td className="dc-empty-row" colSpan="4">Loading disability records…</td></tr>}</tbody></table></div><div className="dc-income-navigation"><button type="button" className="secondary-button" disabled={busy} onClick={previous}>← Previous</button><button type="button" className="secondary-button dc-add-income" disabled={busy} onClick={add}>＋&nbsp; Add New Disability</button><button type="button" className="primary-button" disabled={busy} onClick={next}>Next&nbsp;&nbsp; →</button></div></div>;
}

export default DC012DisabilitySummary;
