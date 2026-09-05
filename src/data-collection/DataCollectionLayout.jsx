import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopNav from '../common/components/TopNav';
import SideNav from '../common/components/SideNav';
import { dataCollectionSteps } from './dataCollectionSteps';
import DC001InitiateDataCollection from './pages/DC001InitiateDataCollection';
import DC002IncomeDetails from './pages/DC002IncomeDetails';
import DC003AddressDetails from './pages/DC003AddressDetails';
import DC004PersonSummary from './pages/DC004PersonSummary';
import DC004PersonInformation from './pages/DC004PersonInformation';
import DC005ProgramDetails from './pages/DC005ProgramDetails';
import DC006IncomeSummary from './pages/DC006IncomeSummary';
import DC007IncomeDetails from './pages/DC007IncomeDetails';
import DC008ExpenseSummary from './pages/DC008ExpenseSummary';
import DC009ExpenseDetails from './pages/DC009ExpenseDetails';
import DC010ResourceSummary from './pages/DC010ResourceSummary';
import DC011ResourceDetails from './pages/DC011ResourceDetails';
import DC012DisabilitySummary from './pages/DC012DisabilitySummary';
import DC014DisabilityDetails from './pages/DC014DisabilityDetails';
import './dataCollection.css';

const routeMap = {
  DC001: '/data-collection/initiate-data-collection',
  DC002: '/data-collection/applicant-details',
  DC003: '/data-collection/address-details',
  DC004: '/data-collection/person-summary',
  DC005: '/data-collection/person-information',
  DC006: '/data-collection/program-details',
  DC007: '/data-collection/income-summary',
  DC008: '/data-collection/income-details',
  DC009: '/data-collection/expense-summary',
  DC010: '/data-collection/expense-details',
  DC011: '/data-collection/resource-summary',
  DC012: '/data-collection/resource-details',
  DC013: '/data-collection/disability-summary',
  DC014: '/data-collection/disability-details'
};

const restrictedDetailSteps = {
  DC005: 'Please access Person Details via the Add or Edit action from Person Summary.',
  DC008: 'Please access Income Details via the Add or Edit action from Income Summary.',
  DC010: 'Please access Expense Details via the Add or Edit action from Expense Summary.',
  DC012: 'Please access Resource Details via the Add or Edit action from Resource Summary.',
  DC014: 'Please access Disability Details via the Add or Edit action from Disability Summary.'
};

function DataCollectionLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const readOnly = sessionStorage.getItem('citizenReadOnlyMode') === 'true';
  const citizenContext = (() => { try { return JSON.parse(sessionStorage.getItem('citizenApplicationContext')) || {}; } catch { return {}; } })();
  const [caseContext, setCaseContext] = useState({ applicationNumber: readOnly ? (citizenContext.caseNumber || citizenContext.applicationNumber || '') : '', arApplicationNumber: readOnly ? (citizenContext.applicationNumber || '') : '', status: readOnly ? (citizenContext.applicationStatus || 'Registered') : 'Registered', applicant: null, applicantDetails: null });
  const [navigationError, setNavigationError] = useState('');
  useEffect(() => {
    setNavigationError('');
  }, [location.pathname]);
  const updateCaseContext = useCallback((updates) => setCaseContext((previous) => ({ ...previous, ...updates })), []);
  useEffect(() => {
    if (caseContext.applicationNumber) sessionStorage.setItem('sahyogActiveCase', JSON.stringify(caseContext));
  }, [caseContext]);
  const activeStep = Object.keys(routeMap).find((stepId) => routeMap[stepId] === location.pathname) || 'DC001';
  const steps = useMemo(() => dataCollectionSteps.map((step) => ({ ...step, path: routeMap[step.id], disabled: !routeMap[step.id] })), []);
  const activePage = activeStep === 'DC014'
    ? <DC014DisabilityDetails caseContext={caseContext} updateCaseContext={updateCaseContext} onPrevious={() => navigate(routeMap.DC013)} />
    : activeStep === 'DC013'
    ? <DC012DisabilitySummary caseContext={caseContext} updateCaseContext={updateCaseContext} onPrevious={() => navigate(routeMap.DC011)} onOpenDisability={() => navigate(routeMap.DC014)} />
    : activeStep === 'DC012'
    ? <DC011ResourceDetails caseContext={caseContext} updateCaseContext={updateCaseContext} onContinue={() => navigate(routeMap.DC013)} onPrevious={() => navigate(routeMap.DC011)} />
    : activeStep === 'DC011'
    ? <DC010ResourceSummary caseContext={caseContext} updateCaseContext={updateCaseContext} onContinue={() => navigate(routeMap.DC013)} onPrevious={() => navigate(routeMap.DC010)} onOpenResource={() => navigate(routeMap.DC012)} />
    : activeStep === 'DC010'
    ? <DC009ExpenseDetails caseContext={caseContext} updateCaseContext={updateCaseContext} onContinue={() => navigate(routeMap.DC011)} onPrevious={() => navigate(routeMap.DC009)} />
    : activeStep === 'DC009'
    ? <DC008ExpenseSummary caseContext={caseContext} updateCaseContext={updateCaseContext} onContinue={() => navigate(routeMap.DC011)} onPrevious={() => navigate(routeMap.DC007)} onOpenExpense={() => navigate(routeMap.DC010)} />
    : activeStep === 'DC008'
    ? <DC007IncomeDetails caseContext={caseContext} updateCaseContext={updateCaseContext} onContinue={() => navigate(routeMap.DC007)} onPrevious={() => navigate(routeMap.DC007)} />
    : activeStep === 'DC007'
    ? <DC006IncomeSummary caseContext={caseContext} updateCaseContext={updateCaseContext} onContinue={() => navigate(routeMap.DC009)} onPrevious={() => navigate(routeMap.DC006)} onOpenIncome={() => navigate(routeMap.DC008)} />
    : activeStep === 'DC006'
    ? <DC005ProgramDetails caseContext={caseContext} updateCaseContext={updateCaseContext} onContinue={() => navigate(routeMap.DC007)} onPrevious={() => navigate(routeMap.DC004)} />
    : activeStep === 'DC005'
    ? <DC004PersonInformation caseContext={caseContext} updateCaseContext={updateCaseContext} onContinue={() => navigate(routeMap.DC004)} onPrevious={() => navigate(routeMap.DC004)} />
    : activeStep === 'DC004'
    ? <DC004PersonSummary caseContext={caseContext} updateCaseContext={updateCaseContext} onContinue={() => navigate(routeMap.DC006)} onPrevious={() => navigate(routeMap.DC003)} onOpenPerson={() => navigate(routeMap.DC005)} />
    : activeStep === 'DC003'
    ? <DC003AddressDetails caseContext={caseContext} updateCaseContext={updateCaseContext} onContinue={() => navigate(routeMap.DC004)} onPrevious={() => navigate(routeMap.DC002)} />
    : activeStep === 'DC002'
      ? <DC002IncomeDetails caseContext={caseContext} updateCaseContext={updateCaseContext} onContinue={() => navigate(routeMap.DC003)} onPrevious={() => navigate(routeMap.DC001)} />
      : <DC001InitiateDataCollection caseContext={caseContext} updateCaseContext={updateCaseContext} onContinue={() => navigate(routeMap.DC002)} />;

  const blockReadOnlyChanges = (event) => {
    if (!readOnly || event.target.closest('[data-readonly-action="allowed"]')) return;
    const target = event.target;
    const button = target.closest('button');
    const modifyingButton = button && (/reset|add|delete/i.test(button.textContent) || button.matches('.dc-icon-button.delete,.dc-add-income,.dc-add-person'));
    if (target.matches('input, select, textarea') || target.closest('.dc-program-card') || modifyingButton) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div className={`app-shell${readOnly ? ' citizen-read-only' : ''}`}>
      <TopNav />
      <div className="app-body">
        <SideNav
          steps={steps}
          activeStep={activeStep}
          onStepSelect={(stepId) => { setNavigationError(''); if (routeMap[stepId]) navigate(routeMap[stepId]); }}
          applicationContext={caseContext}
          moduleTitle="Data Collection (DC)"
          restrictedSteps={restrictedDetailSteps}
          onRestrictedStep={setNavigationError}
        />
        <main className="app-main dc-main" onClickCapture={blockReadOnlyChanges} onChangeCapture={blockReadOnlyChanges}>
          {navigationError && <div className="notification-banner warning dc-navigation-error" role="alert"><span>!</span><strong>{navigationError}</strong><button type="button" data-readonly-action="allowed" aria-label="Dismiss navigation warning" onClick={() => setNavigationError('')}>×</button></div>}
          <div className={readOnly ? 'read-only-page-frame' : ''}>
            {readOnly && <button type="button" className="read-only-dashboard-button" data-readonly-action="allowed" onClick={() => navigate('/citizen/dashboard')}>← Back to Citizen Dashboard</button>}
            {readOnly && <aside className="read-only-rail left" aria-label="Read-only citizen view"><span>READ ONLY</span></aside>}
            <div className="read-only-page-content">{activePage}</div>
            {readOnly && <aside className="read-only-rail right" aria-label="Read-only citizen view"><span>READ ONLY</span></aside>}
          </div>
          {!readOnly && <footer className="government-watermark">© 2026 Sahyog · Government of India</footer>}
        </main>
      </div>
    </div>
  );
}

export default DataCollectionLayout;
