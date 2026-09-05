import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './TopNav.css';

function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeModule = location.pathname.startsWith('/eligibility-determination') ? 'ED' : location.pathname.startsWith('/data-collection') ? 'DC' : 'AR';

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        <div className="brand-logo">S</div>
        <div className="brand-copy">
          <div className="brand-title">Sahyog</div>
          <div className="brand-subtitle">Citizen Welfare Eligibility System</div>
        </div>
      </div>
      <div className="top-nav-links">
        <button className={`nav-pill ${activeModule === 'AR' ? 'active' : ''}`} onClick={() => navigate('/application-registration/register-application')}>Application Registration (AR)</button>
        <button className={`nav-pill ${activeModule === 'DC' ? 'active' : ''}`} onClick={() => navigate('/data-collection/initiate-data-collection')}>Data Collection (DC)</button>
        <button className={`nav-pill ${activeModule === 'ED' ? 'active' : ''}`} onClick={() => navigate('/eligibility-determination/run-eligibility')}>Eligibility Determination (ED)</button>
      </div>
      <div className="top-nav-right">
        <span className="notification-badge">🔔</span>
        <div className="user-chip">
          <span>CW</span>
          <span>Case Worker</span>
        </div>
      </div>
    </header>
  );
}

export default TopNav;
