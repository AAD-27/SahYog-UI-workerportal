import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopNav from '../common/components/TopNav';
import SideNav from '../common/components/SideNav';
import ED001RunEligibility from './pages/ED001RunEligibility';
import ED002EligibilityResults from './pages/ED002EligibilityResults';
import { eligibilitySteps } from './eligibilitySteps';
import './eligibilityDetermination.css';

const routeMap = {
  ED001: '/eligibility-determination/run-eligibility',
  ED002: '/eligibility-determination/view-results'
};

const readSession = (key) => {
  try { return JSON.parse(sessionStorage.getItem(key)) || {}; } catch { return {}; }
};

export default function EligibilityDeterminationLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedCase = readSession('sahyogActiveCase');
  const citizenCase = readSession('citizenApplicationContext');
  const [eligibilityContext, setEligibilityContext] = useState({
    caseNumber: storedCase.applicationNumber || citizenCase.caseNumber || '',
    applicationNumber: storedCase.arApplicationNumber || citizenCase.applicationNumber || '',
    status: 'Ready for Determination',
    results: readSession('sahyogEligibilityResults').results || []
  });
  const activeStep = location.pathname === routeMap.ED002 ? 'ED002' : 'ED001';
  const steps = useMemo(() => eligibilitySteps.map((step) => ({ ...step, path: routeMap[step.id] })), []);
  const updateEligibilityContext = (updates) => setEligibilityContext((current) => ({ ...current, ...updates }));

  return (
    <div className="app-shell">
      <TopNav />
      <div className="app-body">
        <SideNav
          steps={steps}
          activeStep={activeStep}
          onStepSelect={(stepId) => navigate(routeMap[stepId])}
          applicationContext={{ applicationNumber: eligibilityContext.caseNumber, status: eligibilityContext.status }}
          moduleTitle="Eligibility Determination (ED)"
        />
        <main className="app-main ed-main">
          {activeStep === 'ED002'
            ? <ED002EligibilityResults context={eligibilityContext} onPrevious={() => navigate(routeMap.ED001)} />
            : <ED001RunEligibility context={eligibilityContext} updateContext={updateEligibilityContext} onContinue={() => navigate(routeMap.ED002)} />}
          <footer className="government-watermark">© 2026 Sahyog · Government of India</footer>
        </main>
      </div>
    </div>
  );
}
