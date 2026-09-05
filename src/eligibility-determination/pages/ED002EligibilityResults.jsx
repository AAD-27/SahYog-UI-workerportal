import React from 'react';

const decisionLabel = { ELIGIBLE: 'Eligible', NOT_ELIGIBLE: 'Not Eligible', PENDING_REVIEW: 'Pending Review' };

export default function ED002EligibilityResults({ context, onPrevious }) {
  const results = context.results || [];
  const eligibleCount = results.filter((item) => item.decision === 'ELIGIBLE').length;
  return (
    <div className="card ed-card">
      <div className="page-header"><div><h1 className="page-title">Eligibility Results</h1><p className="page-description">Review the program-level determination for case {context.caseNumber || '—'}.</p></div><span className="ed-page-code">ED002</span></div>
      <div className="ed-result-summary"><div><span>Case Number</span><strong>{context.caseNumber || '—'}</strong></div><div><span>Programs Evaluated</span><strong>{results.length}</strong></div><div><span>Eligible Programs</span><strong>{eligibleCount}</strong></div><div><span>Determination Status</span><strong>{results.length ? 'Complete' : 'Not Run'}</strong></div></div>
      {!results.length ? <div className="ed-empty-results"><span>i</span><h2>No eligibility results available</h2><p>Run eligibility for this case to generate program decisions.</p><button className="secondary-button" type="button" onClick={onPrevious}>← Run Eligibility</button></div> : <div className="ed-results-list">{results.map((result) => <article className={`ed-result-card ${result.decision.toLowerCase()}`} key={result.programCode}><div className="ed-result-code">{result.programCode}</div><div className="ed-result-copy"><h2>{result.programName}</h2><p>{result.reason}</p><div className="ed-rule-progress"><span style={{ width: `${(result.passedRules / result.totalRules) * 100}%` }} /></div><small>{result.passedRules} of {result.totalRules} rules satisfied</small></div><span className="ed-decision">{decisionLabel[result.decision]}</span></article>)}</div>}
      <div className="ed-actions"><button className="secondary-button" type="button" onClick={onPrevious}>← Previous</button><button className="primary-button" type="button" onClick={onPrevious}>Run Again</button></div>
    </div>
  );
}
