import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopNav from '../common/components/TopNav';
import SideNav from '../common/components/SideNav';
import { appRegSteps } from './appRegSteps';
import AR001RegisterApplication from './pages/AR001RegisterApplication';
import AR002RegisterAddress from './pages/AR002RegisterAddress';
import AR003RegisterPerson from './pages/AR003RegisterPerson';
import AR004RegisterProgram from './pages/AR004RegisterProgram';
import AR005ReviewSubmit from './pages/AR005ReviewSubmit';
import { initializeApplication } from '../services/appRegApi';
import '../App.css';

const pageComponents = { AR001: AR001RegisterApplication, AR002: AR002RegisterAddress, AR003: AR003RegisterPerson, AR004: AR004RegisterProgram, AR005: AR005ReviewSubmit };
const routeMap = {
  AR001: '/application-registration/register-application',
  AR002: '/application-registration/register-address',
  AR003: '/application-registration/register-person',
  AR004: '/application-registration/register-program',
  AR005: '/application-registration/review-submit'
};
const reverseRouteMap = Object.fromEntries(Object.entries(routeMap).map(([step, path]) => [path, step]));

function AppRegLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const citizenReadOnly = sessionStorage.getItem('citizenReadOnlyMode') === 'true';
  const citizenContext = (() => { try { return JSON.parse(sessionStorage.getItem('citizenApplicationContext')) || {}; } catch { return {}; } })();
  const [activeStep, setActiveStepState] = useState(reverseRouteMap[location.pathname] || 'AR001');
  const [flowMode, setFlowMode] = useState(citizenReadOnly ? 'citizen' : 'new');
  const [maintainApplicationNumber, setMaintainApplicationNumber] = useState('');
  const [maintainStatus, setMaintainStatus] = useState('idle');
  const [maintainMessage, setMaintainMessage] = useState('');
  const [applicationContext, setApplicationContext] = useState({
    applicationId: null,
    applicationNumber: citizenReadOnly ? (citizenContext.applicationNumber || '') : '',
    status: citizenReadOnly ? (citizenContext.applicationStatus || 'REGISTERED') : 'DRAFT',
    initAttempted: false,
    flowMode: citizenReadOnly ? 'citizen' : 'new',
    data: {}
  });

  const registeredReadOnly = !citizenReadOnly && String(applicationContext.status || '').toUpperCase() === 'REGISTERED';
  const pageReadOnly = citizenReadOnly || registeredReadOnly;
  const ActivePage = pageComponents[activeStep];

  useEffect(() => {
    setActiveStepState(reverseRouteMap[location.pathname] || 'AR001');
    setApplicationContext((previous) => ({ ...previous, initAttempted: false }));
  }, [location.pathname]);

  const updateApplicationContext = useCallback((updates) => setApplicationContext((previous) => ({ ...previous, ...updates })), []);
  const setActiveStep = useCallback((stepId) => {
    setApplicationContext((previous) => ({ ...previous, initAttempted: false }));
    navigate(routeMap[stepId] || routeMap.AR001);
  }, [navigate]);
  const stepsWithPaths = useMemo(() => appRegSteps.map((step) => ({ ...step, path: routeMap[step.id] })), []);

  const startNewApplication = () => {
    setFlowMode('new');
    setMaintainApplicationNumber('');
    setMaintainMessage('');
    setApplicationContext({ applicationId: null, applicationNumber: '', status: 'DRAFT', initAttempted: false, flowMode: 'new', data: {} });
    navigate(routeMap.AR001);
  };

  const openMaintainApplication = () => {
    setFlowMode('maintain-search');
    setMaintainStatus('idle');
    setMaintainMessage('');
  };

  const handleMaintainApplication = async () => {
    const applicationNumber = maintainApplicationNumber.trim().toUpperCase();
    if (!/^A\d{7}$/.test(applicationNumber)) {
      setMaintainStatus('error');
      setMaintainMessage('Enter a valid application number in the format A1234567.');
      return;
    }
    setMaintainStatus('loading');
    setMaintainMessage('');
    try {
      const result = await initializeApplication({ appOrCaseNum: applicationNumber });
      if (result?.found === false) {
        setMaintainStatus('error');
        setMaintainMessage('No application was found for this application number.');
        return;
      }
      const applicationStatus = result?.applicationStatus || result?.status || 'IN_PROGRESS';
      const backendPage = result?.currentPageId || result?.pageId || result?.destinationPageId || 'AR001';
      const resumePage = routeMap[backendPage] ? backendPage : 'AR001';
      setApplicationContext({
        applicationId: result?.applicationId ?? result?.id ?? null,
        applicationNumber: result?.applicationNum || result?.applicationNumber || applicationNumber,
        applicationDate: result?.applicationDate,
        status: applicationStatus,
        initAttempted: false,
        flowMode: 'maintain',
        data: result?.data || {}
      });
      setFlowMode('maintain');
      setMaintainStatus('success');
      setMaintainMessage(String(applicationStatus).toUpperCase() === 'REGISTERED' ? 'This application is registered and has been opened in read-only mode.' : 'Application loaded. You can continue from the saved step.');
      navigate(routeMap[resumePage]);
    } catch (error) {
      setMaintainStatus('error');
      setMaintainMessage(error?.response?.data?.message || 'Unable to load the application. Please verify the number and try again.');
    }
  };

  const blockReadOnlyChanges = (event) => {
    if (!pageReadOnly || event.target.closest('[data-readonly-action="allowed"]')) return;
    const target = event.target;
    const button = target.closest('button');
    if (target.matches('input, select, textarea') || target.closest('[role="button"]') || (button && /reset|submit|add|delete|edit|cancel/i.test(button.textContent))) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div className={`app-shell${pageReadOnly ? ' citizen-read-only' : ''}`}>
      <TopNav />
      <div className="app-body">
        {flowMode !== 'maintain-search' && <SideNav steps={stepsWithPaths} activeStep={activeStep} onStepSelect={setActiveStep} applicationContext={applicationContext} />}
        <main className="app-main" onClickCapture={blockReadOnlyChanges} onChangeCapture={blockReadOnlyChanges}>
          {!citizenReadOnly && <div className="ar-flow-tabs" role="tablist" aria-label="Application registration options"><button type="button" role="tab" aria-selected={flowMode === 'new'} className={flowMode === 'new' ? 'active' : ''} onClick={startNewApplication}><span>1</span>New Application</button><button type="button" role="tab" aria-selected={flowMode !== 'new'} className={flowMode !== 'new' ? 'active' : ''} onClick={openMaintainApplication}><span>2</span>Maintain Application</button></div>}
          {flowMode === 'maintain-search' && !citizenReadOnly ? <div className="card maintain-application-card">
            <div className="page-header"><div><h1 className="page-title">Maintain Application</h1><p className="page-description">Enter an existing application number to continue an in-progress application or view a registered application.</p></div></div>
            <div className="maintain-search-row"><div className="field-group"><label className="field-label" htmlFor="maintainApplicationNumber">Application Number *</label><input id="maintainApplicationNumber" className="field-input" value={maintainApplicationNumber} onChange={(event) => { setMaintainApplicationNumber(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)); setMaintainMessage(''); }} placeholder="Example: A9000016" onKeyDown={(event) => { if (event.key === 'Enter') handleMaintainApplication(); }} /></div><button type="button" className="primary-button" disabled={maintainStatus === 'loading'} onClick={handleMaintainApplication}>{maintainStatus === 'loading' ? 'Loading...' : 'Find Application'}</button></div>
            <div className="maintain-status-guide"><div><strong>IN PROGRESS</strong><span>Continue entering or updating the saved application.</span></div><div><strong>REGISTERED</strong><span>Review the completed application in read-only mode.</span></div></div>
            {maintainMessage && <div className={`notification-banner ${maintainStatus === 'error' ? 'warning' : 'success'}`}>{maintainMessage}</div>}
          </div> : <div className={pageReadOnly ? 'read-only-page-frame' : ''}>
            {citizenReadOnly && <button type="button" className="read-only-dashboard-button" data-readonly-action="allowed" onClick={() => navigate('/citizen/dashboard')}>← Back to Citizen Dashboard</button>}
            {registeredReadOnly && <div className="registered-read-only-banner" data-readonly-action="allowed"><strong>Registered Application - Read Only</strong><span>This application has already been registered. You may review each AR screen, but no information can be changed.</span></div>}
            {pageReadOnly && <aside className="read-only-rail left" aria-label="Read-only application"><span>READ ONLY</span></aside>}
            <div className="read-only-page-content"><ActivePage key={`${activeStep}-${applicationContext.applicationNumber}-${flowMode}`} applicationContext={applicationContext} updateApplicationContext={updateApplicationContext} setActiveStep={setActiveStep} readOnly={pageReadOnly} /></div>
            {pageReadOnly && <aside className="read-only-rail right" aria-label="Read-only application"><span>READ ONLY</span></aside>}
          </div>}
          {!citizenReadOnly && <footer className="government-watermark">© 2026 Sahyog · Government of India</footer>}
        </main>
      </div>
    </div>
  );
}

export default AppRegLayout;
