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
  const [applicationContext, setApplicationContext] = useState({
    applicationId: null,
    applicationNumber: '',
    status: 'Draft'
  });

  useEffect(() => {
    const nextStep = reverseRouteMap[location.pathname] || 'AR001';
    setActiveStepState(nextStep);
  }, [location.pathname]);

  const activePage = pageComponents[activeStep];

  const updateApplicationContext = useCallback((updates) => {
    setApplicationContext((prev) => ({ ...prev, ...updates }));
  }, []);

  const setActiveStep = useCallback((stepId) => {
    const nextPath = routeMap[stepId] || routeMap.AR001;
    navigate(nextPath, { replace: false });
  }, [navigate]);

  const stepsWithPaths = useMemo(() =>
    appRegSteps.map((step) => ({ ...step, path: routeMap[step.id] }))
  , []);

  return (
    <div className="app-shell">
      <TopNav />
      <div className="app-body">
        <SideNav
          steps={stepsWithPaths}
          activeStep={activeStep}
          onStepSelect={setActiveStep}
          applicationContext={applicationContext}
        />
        <main className="app-main">
          {React.createElement(activePage, {
            applicationContext,
            updateApplicationContext,
            setActiveStep
          })}
        </main>
      </div>
    </div>
  );
}

export default AppRegLayout;
