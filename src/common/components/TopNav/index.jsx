import React from 'react';
import './TopNav.css';

function TopNav() {
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
        <button className="nav-pill active">Application Registration (AR)</button>
        <button className="nav-pill">Data Collection (DC)</button>
        <button className="nav-pill">Eligibility Determination (ED)</button>
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
