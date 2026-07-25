import React from 'react';
import { Link } from 'react-router-dom';
import './SideNav.css';

function SideNav({ steps, activeStep, onStepSelect, applicationContext }) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);

  return (
    <aside className="side-panel">
      <div className="side-title">Application Registration (AR)</div>
      <div className="step-list">
        {steps.map((step, index) => {
          const completed = index < activeIndex;
          return (
            <Link
              key={step.id}
              to={step.path}
              className={`step-card ${step.id === activeStep ? 'active' : ''} ${completed ? 'completed' : ''}`}
              onClick={() => onStepSelect(step.id)}
            >
              <div className="step-number">{completed ? '✓' : index + 1}</div>
              <div>
                <div className="step-label">{step.title}</div>
                <div className="step-code">{step.id}</div>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="status-card">
        <div className="status-title">Application Number</div>
        <div className="status-value">{applicationContext.applicationNumber || '-'}</div>
        <div className="status-tag">Status: {applicationContext.status || 'Draft'}</div>
      </div>
    </aside>
  );
}

export default SideNav;
