import React, { useEffect, useMemo, useState } from 'react';
import { initializeProgramDetails, nextProgramDetails, previousProgramDetails } from '../../services/dataCollectionApi';
import fspIcon from '../../assets/program-icons/fsp.png';
import capIcon from '../../assets/program-icons/cap-rupee.png';
import capsIcon from '../../assets/program-icons/caps-family.png';

const options = [
  { id: 'FSP', label: 'FSP – Food Support Program', description: 'Provide food assistance to households with limited financial capacity.', color: '#16a34a', icon: fspIcon },
  { id: 'CAP', label: 'CAP – Cash Assistance Program', description: 'Provide temporary financial assistance to citizens experiencing severe financial hardship.', color: '#047857', icon: capIcon },
  { id: 'MCARE', label: 'MCARE – Medical Care and Assistance for Residents', description: 'Provide medical insurance support to citizens requiring healthcare assistance.', color: '#1d4ed8', glyph: '✚' },
  { id: 'CAPS', label: 'CAPS – Child Assistance and Protection Scheme', description: 'Provide assistance to households responsible for young children.', color: '#6d28d9', icon: capsIcon },
  { id: 'EAP', label: 'EAP – Energy Assistance Program', description: 'Assist households struggling to pay essential utility bills.', color: '#f97316', glyph: 'ϟ' }
];

const toSelectionState = (selected = []) => Object.fromEntries(options.map((option) => [option.id, selected.includes(option.id)]));
const isValidationResponse = (response) => response && parseInt(response.status, 10) === 512;
const getErrorMessage = (error, fallback) => error?.response?.data?.message || error?.response?.data?.msg || fallback;
const getPrograms = (response) => {
  const raw = response?.data || response;
  return Array.isArray(raw?.programs) ? raw.programs : Array.isArray(response?.programs) ? response.programs : null;
};

function DC005ProgramDetails({ caseContext, updateCaseContext, onContinue, onPrevious }) {
  const initial = useMemo(() => toSelectionState(caseContext.programs || []), [caseContext.programs]);
  const [programs, setPrograms] = useState(initial);
  const [initialData, setInitialData] = useState(initial);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedPrograms = options.filter((option) => programs[option.id]).map((option) => option.id);

  const toggle = (id) => { setPrograms((previous) => ({ ...previous, [id]: !previous[id] })); setMessage(''); setMessageType(''); };
  const applyResponse = (response) => {
    const selected = getPrograms(response);
    if (!selected) return;
    const mapped = toSelectionState(selected);
    setPrograms(mapped);
    setInitialData(mapped);
    updateCaseContext({ programs: selected });
  };
  const buildPayload = () => ({ appOrCaseNum: caseContext.applicationNumber, pageId: 'DC006', programs: selectedPrograms });

  const handleNext = async () => {
    if (!selectedPrograms.length) { setMessage('Please select at least one welfare program.'); return; }
    setMessage(''); setMessageType(''); setIsSubmitting(true);
    try {
      const response = await nextProgramDetails(buildPayload());
      if (isValidationResponse(response)) { setMessage(response.message || 'Validation error'); setMessageType('warning'); return; }
      applyResponse(response);
      updateCaseContext({ programs: selectedPrograms });
      setInitialData(programs);
      if (typeof onContinue === 'function') onContinue();
      else setMessage(response?.message || 'Program details saved successfully.');
    } catch (error) {
      setMessage(getErrorMessage(error, 'Unable to proceed. Please try again.')); setMessageType('warning');
    } finally { setIsSubmitting(false); }
  };

  const handlePrevious = async () => {
    setMessage(''); setMessageType(''); setIsSubmitting(true);
    try {
      const response = await previousProgramDetails(buildPayload());
      if (isValidationResponse(response)) { setMessage(response.message || 'Validation error'); setMessageType('warning'); return; }
      applyResponse(response);
      updateCaseContext({ programs: selectedPrograms });
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
        const response = await initializeProgramDetails({ appOrCaseNum: caseContext.applicationNumber });
        if (!mounted) return;
        if (isValidationResponse(response)) { setMessage(response.message || 'Validation error'); setMessageType('warning'); return; }
        applyResponse(response);
      } catch (error) {
        if (!mounted) return;
        setMessage(getErrorMessage(error, 'Unable to load program details. You can continue with manual selection.'));
        setMessageType('warning');
      }
    };
    initialize();
    return () => { mounted = false; };
  }, [caseContext.applicationNumber]);

  return <div className="card dc-card"><div className="page-header"><div><h1 className="page-title">Program Details</h1><p className="page-description">Select the welfare programs you want to apply for. You can select one or more programs.</p></div></div><div className="info-box dc-program-note"><span className="dc-note-icon" aria-hidden>i</span>You may qualify for one or more programs based on eligibility rules. Final decision will be made in the Eligibility Determination (ED) stage.</div><div className="dc-program-list">{options.map((option) => <div key={option.id} className={`dc-program-card ${programs[option.id] ? 'selected' : ''}`} role="button" tabIndex={0} onClick={() => toggle(option.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(option.id); } }}><div className="dc-program-line" /><input type="checkbox" checked={programs[option.id]} onClick={(event) => event.stopPropagation()} onChange={() => toggle(option.id)} aria-label={`${option.label} selected`} /><div className="dc-program-icon" style={{ background: option.color }}>{option.icon ? <img src={option.icon} alt="" /> : option.glyph}</div><div><strong>{option.label}</strong><p>{option.description}</p></div></div>)}</div>{message && <div className={messageType === 'warning' ? 'notification-banner warning' : 'info-box dc-message'}>{message}</div>}<div className="dc-address-actions"><button type="button" className="secondary-button" disabled={isSubmitting} onClick={handlePrevious}>← Previous</button><button type="button" className="secondary-button" disabled={isSubmitting} onClick={() => { setPrograms(initialData); setMessage(''); setMessageType(''); }}>↻ Reset</button><button type="button" className="primary-button" disabled={!selectedPrograms.length || isSubmitting} onClick={handleNext}>Next →</button></div></div>;
}

export default DC005ProgramDetails;
