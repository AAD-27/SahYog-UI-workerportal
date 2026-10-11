import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchGovernmentOfficialProfile } from '../../../services/authApi';
import './TopNav.css';

function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const activeModule = location.pathname.startsWith('/eligibility-determination') ? 'ED' : location.pathname.startsWith('/data-collection') ? 'DC' : 'AR';
  const authenticatedUser = (() => {
    try { return JSON.parse(sessionStorage.getItem('sahyogUser')) || {}; }
    catch { return {}; }
  })();
  const officialName = authenticatedUser.fullName
    || [authenticatedUser.firstName, authenticatedUser.middleName, authenticatedUser.lastName].filter(Boolean).join(' ')
    || authenticatedUser.name
    || 'Government Official';
  const officialInitials = officialName.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'GO';

  useEffect(() => {
    const closeMenu = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') { setMenuOpen(false); setProfileOpen(false); }
    };
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const viewProfile = async () => {
    setMenuOpen(false);
    setProfileOpen(true);
    setProfile(authenticatedUser);
    setProfileLoading(true);
    try {
      const response = await fetchGovernmentOfficialProfile();
      const fetchedProfile = response?.user || response?.profile || response?.data || response;
      if (fetchedProfile && typeof fetchedProfile === 'object') {
        const mergedProfile = { ...authenticatedUser, ...fetchedProfile };
        setProfile(mergedProfile);
        sessionStorage.setItem('sahyogUser', JSON.stringify(mergedProfile));
      }
    } catch {
      // Login response data remains available when a dedicated profile API is unavailable.
    } finally {
      setProfileLoading(false);
    }
  };

  const logout = () => {
    sessionStorage.clear();
    navigate('/login', { replace: true });
  };

  const profileName = profile?.fullName
    || [profile?.firstName, profile?.middleName, profile?.lastName].filter(Boolean).join(' ')
    || officialName;
  const profileRows = [
    ['Full Name', profileName],
    ['Employee ID', profile?.employeeId],
    ['Official Email', profile?.officialEmail || profile?.email],
    ['Department', profile?.department],
    ['Designation', profile?.designation],
    ['Role', profile?.role]
  ].filter(([, value]) => value);

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
        <div className="official-account" ref={menuRef}>
          <button type="button" className="user-chip" title={officialName} aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            <span>{officialInitials}</span>
            <span>{officialName}</span>
            <b aria-hidden="true">⌄</b>
          </button>
          {menuOpen && <div className="official-menu" role="menu">
            <button type="button" role="menuitem" onClick={viewProfile}>View Profile</button>
            <button type="button" role="menuitem" className="logout" onClick={logout}>Log out</button>
          </div>}
        </div>
      </div>
      {profileOpen && <div className="official-profile-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setProfileOpen(false); }}>
        <section className="official-profile-modal" role="dialog" aria-modal="true" aria-labelledby="official-profile-title">
          <div className="official-profile-heading">
            <div><span>Government Official</span><h2 id="official-profile-title">Your Profile</h2><p>Registration information associated with your Sahyog account.</p></div>
            <button type="button" aria-label="Close profile" onClick={() => setProfileOpen(false)}>×</button>
          </div>
          <div className="official-profile-identity"><span>{officialInitials}</span><div><strong>{profileName}</strong><small>{profile?.designation || 'Government Official'}</small></div></div>
          {profileLoading && <p className="official-profile-loading">Refreshing profile information…</p>}
          <dl className="official-profile-details">
            {profileRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
          <div className="official-profile-actions"><button type="button" onClick={() => setProfileOpen(false)}>Close</button><button type="button" className="logout" onClick={logout}>Log out</button></div>
        </section>
      </div>}
    </header>
  );
}

export default TopNav;
