import React from 'react';
import './SideNav.css';

const steps = [
  { id: 'AR001', title: 'Register Application' },
  { id: 'AR002', title: 'Register Address' },
  { id: 'AR003', title: 'Register Person' },
  { id: 'AR004', title: 'Register Program' },
  { id: 'AR005', title: 'Review & Submit Application' }
];

function SideNav() {
  return (
    <aside className="side-panel">
      <div className="side-title">Application Registration (AR)</div>
      <div className="step-list">
        {steps.map((step, index) => (
          <div key={step.id} className={`step-card ${index === 0 ? 'active' : ''}`}>
            <div className="step-number">{index + 1}</div>
            <div>
              <div className="step-label">{step.title}</div>
              <div className="step-code">{step.id}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="status-card">
        <div className="status-title">Application Number</div>
        <div className="status-value">-</div>
        <div className="status-tag">Status: Draft</div>
      </div>
    </aside>
  );
}

export default SideNav;
