import React, { useState } from 'react';

const programs = [
  { code: 'FSP', name: 'Food Support Program', color: '#22a447' },
  { code: 'CAP', name: 'Cash Assistance Program', color: '#00897b' },
  { code: 'MCARE', name: 'Medical Care Assistance', color: '#2563eb' },
  { code: 'CAPS', name: 'Child Assistance & Protection', color: '#7c3aed' },
  { code: 'EAP', name: 'Energy Assistance Program', color: '#f97316' }
];

const mockResults = [
  { programCode: 'FSP', programName: 'Food Support Program', decision: 'ELIGIBLE', passedRules: 5, totalRules: 5, reason: 'All eligibility conditions are satisfied.' },
  { programCode: 'CAP', programName: 'Cash Assistance Program', decision: 'NOT_ELIGIBLE', passedRules: 5, totalRules: 6, reason: 'Monthly expenses are below the required threshold.' },
  { programCode: 'MCARE', programName: 'Medical Care Assistance', decision: 'ELIGIBLE', passedRules: 5, totalRules: 5, reason: 'All eligibility conditions are satisfied.' },
  { programCode: 'CAPS', programName: 'Child Assistance & Protection', decision: 'NOT_ELIGIBLE', passedRules: 3, totalRules: 5, reason: 'No qualifying child was identified in the household.' },
  { programCode: 'EAP', programName: 'Energy Assistance Program', decision: 'PENDING_REVIEW', passedRules: 4, totalRules: 5, reason: 'Utility-payment responsibility requires verification.' }
];

export default function ED001RunEligibility({ context, updateContext, onContinue }) {
  const [message, setMessage] = useState('');
  const [running, setRunning] = useState(false);

  const runEligibility = () => {
    if (!context.caseNumber) {
      setMessage('A case number is required. Complete or open Data Collection before running eligibility.');
      return;
    }
    setMessage('');
    setRunning(true);
    window.setTimeout(() => {
      const result = { caseNumber: context.caseNumber, evaluatedAt: new Date().toISOString(), results: mockResults };
      sessionStorage.setItem('sahyogEligibilityResults', JSON.stringify(result));
      updateContext({ results: mockResults, status: 'Determination Complete', evaluatedAt: result.evaluatedAt });
      setRunning(false);
      onContinue();
    }, 500);
  };

  return (
    <div className="card ed-card">
      <div className="page-header"><div><h1 className="page-title">Run Eligibility</h1><p className="page-description">Evaluate the case against the configured benefit-program rules.</p></div><span className="ed-page-code">ED001</span></div>
      {message && <div className="notification-banner warning ed-top-message">{message}</div>}
      <section className="section-card ed-case-section">
        <div className="ed-case-heading"><span className="ed-case-icon">✓</span><div><h2>Case ready for eligibility determination</h2><p>The case number is automatically populated from Data Collection.</p></div></div>
        <div className="ed-case-grid">
          <div className="field-group"><label className="field-label" htmlFor="edCaseNumber">Case Number</label><input id="edCaseNumber" className="field-input ed-readonly-field" value={context.caseNumber} placeholder="No active case" readOnly /></div>
          <div className="field-group"><label className="field-label" htmlFor="edApplicationNumber">Application Number</label><input id="edApplicationNumber" className="field-input ed-readonly-field" value={context.applicationNumber} placeholder="Not available" readOnly /></div>
        </div>
      </section>
      <section className="section-card ed-program-section"><div className="ed-section-title"><div><h2>Programs to Evaluate</h2><p>Eligibility will be evaluated for all five configured welfare programs.</p></div><span>5 programs</span></div><div className="ed-program-grid">{programs.map((program) => <div className="ed-program-item" key={program.code} style={{ '--ed-color': program.color }}><span>{program.code}</span><div><strong>{program.name}</strong><small>Rules configured and ready</small></div><b>✓</b></div>)}</div></section>
      <div className="ed-actions"><span className="ed-disclaimer">Results shown before backend integration are demonstration values.</span><button className="primary-button" type="button" disabled={running} onClick={runEligibility}>{running ? 'Running Eligibility…' : 'Run Eligibility →'}</button></div>
    </div>
  );
}
