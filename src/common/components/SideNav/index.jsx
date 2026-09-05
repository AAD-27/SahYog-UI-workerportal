import React from 'react';
import { Link } from 'react-router-dom';
import './SideNav.css';

function SideNav({ steps, activeStep, onStepSelect, applicationContext, moduleTitle = 'Application Registration (AR)', restrictedSteps = {}, onRestrictedStep }) {
  const activeIndex = steps.findIndex((step) => step.id === activeStep);

  return (
    <aside className="side-panel">
      <div className="side-title">{moduleTitle}</div>
      <div className="step-list">
        {steps.map((step, index) => {
          const completed = index < activeIndex;
          if (step.disabled) {
            return (
              <div key={step.id} className="step-card step-card-disabled">
                <div className="step-number">{index + 1}</div>
                <div>
                  <div className="step-label">{step.title}</div>
                  <div className="step-code">{step.id}</div>
                </div>
              </div>
            );
          }
          return (
            <Link
              key={step.id}
              to={step.path}
              className={`step-card ${step.id === activeStep ? 'active' : ''} ${completed ? 'completed' : ''}`}
              onClick={(event) => {
                if (restrictedSteps[step.id]) {
                  event.preventDefault();
                  onRestrictedStep?.(restrictedSteps[step.id]);
                  return;
                }
                onStepSelect(step.id);
              }}
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
        <div className="status-title">{moduleTitle && moduleTitle.includes('Data Collection') ? 'Case Number' : 'Application Number'}</div>
        <div className="status-value">{applicationContext.applicationNumber || ''}</div>
        <div className="status-tag">Status: {applicationContext.status || 'Draft'}</div>
        {moduleTitle && moduleTitle.includes('Data Collection') && applicationContext.arApplicationNumber && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>Application: {applicationContext.arApplicationNumber}</div>
        )}
      </div>
    </aside>
  );
}

export default SideNav;
