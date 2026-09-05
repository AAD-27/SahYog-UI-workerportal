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

const pageComponents = {
  AR001: AR001RegisterApplication,
  AR002: AR002RegisterAddress,
  AR003: AR003RegisterPerson,
  AR004: AR004RegisterProgram,
  AR005: AR005ReviewSubmit
};

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
  const [activeStep, setActiveStepState] = useState(reverseRouteMap[location.pathname] || 'AR001');
  const readOnly = sessionStorage.getItem('citizenReadOnlyMode') === 'true';
  const citizenContext = (() => { try { return JSON.parse(sessionStorage.getItem('citizenApplicationContext')) || {}; } catch { return {}; } })();
  const [applicationContext, setApplicationContext] = useState({
    applicationId: null,
    applicationNumber: readOnly ? (citizenContext.applicationNumber || '') : '',
    status: readOnly ? (citizenContext.applicationStatus || 'Registered') : 'Draft',
    initAttempted: false
  });

  useEffect(() => {
    const nextStep = reverseRouteMap[location.pathname] || 'AR001';
    setActiveStepState(nextStep);
  }, [location.pathname]);

  const activePage = pageComponents[activeStep];

  const updateApplicationContext = useCallback((updates) => {
    setApplicationContext((prev) => ({ ...prev, ...updates }));
  }, []);

  // Single, centralized initialization call for AR screens.
  // When an applicationNumber becomes available, call the backend exactly once
  // to fetch server-side data and mark `initAttempted` immediately to prevent
  // per-screen initializers from triggering their own calls.
  const initOnceRef = React.useRef(false);
  useEffect(() => {
    if (initOnceRef.current) return;
    // Only initialize when we have an application number (created after AR001)
    if (!applicationContext.applicationNumber) return;

    initOnceRef.current = true;
    // Mark initAttempted so child screens don't each call initialize.
    updateApplicationContext({ initAttempted: true });

    (async () => {
      try {
        const result = await initializeApplication({ appOrCaseNum: applicationContext.applicationNumber });
        // Even if result is null/empty, set initAttempted and any returned data.
        updateApplicationContext({
          applicationId: result?.id ?? applicationContext.applicationId,
          applicationNumber: result?.applicationNum ?? result?.applicationNumber ?? applicationContext.applicationNumber,
          applicationDate: result?.applicationDate ?? applicationContext.applicationDate,
          status: result?.status ?? applicationContext.status,
          data: result?.data ?? applicationContext.data,
          initAttempted: true
        });
      } catch (err) {
        // Network/error case: we still mark initAttempted to avoid retries
        updateApplicationContext({ initAttempted: true });
      }
    })();
  }, [applicationContext.applicationNumber, applicationContext.applicationId, applicationContext.applicationDate, applicationContext.status, applicationContext.data, updateApplicationContext]);

  const setActiveStep = useCallback((stepId) => {
    const nextPath = routeMap[stepId] || routeMap.AR001;
    navigate(nextPath, { replace: false });
  }, [navigate]);

  const stepsWithPaths = useMemo(() =>
    appRegSteps.map((step) => ({ ...step, path: routeMap[step.id] }))
  , []);

  const blockReadOnlyChanges = (event) => {
    if (!readOnly || event.target.closest('[data-readonly-action="allowed"]')) return;
    const target = event.target;
    const button = target.closest('button');
    if (target.matches('input, select, textarea') || target.closest('[role="button"]') || (button && /reset|submit|add|delete|edit|cancel/i.test(button.textContent))) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <div className={`app-shell${readOnly ? ' citizen-read-only' : ''}`}>
      <TopNav />
      <div className="app-body">
        <SideNav
          steps={stepsWithPaths}
          activeStep={activeStep}
          onStepSelect={setActiveStep}
          applicationContext={applicationContext}
        />
        <main className="app-main" onClickCapture={blockReadOnlyChanges} onChangeCapture={blockReadOnlyChanges}>
          <div className={readOnly ? 'read-only-page-frame' : ''}>
            {readOnly && <button type="button" className="read-only-dashboard-button" data-readonly-action="allowed" onClick={() => navigate('/citizen/dashboard')}>← Back to Citizen Dashboard</button>}
            {readOnly && <aside className="read-only-rail left" aria-label="Read-only citizen view"><span>READ ONLY</span></aside>}
            <div className="read-only-page-content">
              {React.createElement(activePage, {
                applicationContext,
                updateApplicationContext,
                setActiveStep
              })}
            </div>
            {readOnly && <aside className="read-only-rail right" aria-label="Read-only citizen view"><span>READ ONLY</span></aside>}
          </div>
          {!readOnly && <footer className="government-watermark">© 2026 Sahyog · Government of India</footer>}
        </main>
      </div>
    </div>
  );
}

export default AppRegLayout;
