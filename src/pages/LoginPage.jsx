import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCitizenApplicationContext, getAuthErrorMessage, loginCitizen, loginGovernmentOfficial, registerCitizen, registerGovernmentOfficial } from '../services/authApi';
import './LoginPage.css';

const roles = {
  official: {
    title: 'Government Official',
    description: 'Access case management and eligibility services.',
    identityLabel: 'Official Email or Employee ID',
    identityPlaceholder: 'Enter official email or employee ID',
    buttonLabel: 'Login as Government Official',
  },
  citizen: {
    title: 'Citizen Profile',
    description: 'Access your applications and benefit information.',
    identityLabel: 'Mobile Number or Aadhaar Number',
    identityPlaceholder: 'Enter mobile or Aadhaar number',
    buttonLabel: 'Login with Citizen Profile',
  },
};

function RoleIcon({ type }) {
  if (type === 'official') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 21h18M5 21V9h14v12M2 9h20L12 3 2 9Zm7 4v4m6-4v4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('official');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationType, setRegistrationType] = useState('citizen');
  const [registrationError, setRegistrationError] = useState('');
  const [registration, setRegistration] = useState({
    firstName: '', middleName: '', lastName: '', mobileNumber: '', email: '',
    aadharNumber: '', employeeId: '', department: '', designation: '', password: '', confirmPassword: '',
  });
  const selectedRole = roles[role];

  const selectRole = (nextRole) => {
    setRole(nextRole);
    setIdentity('');
    setPassword('');
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!identity.trim() || !password.trim()) {
      setMessage('Please enter your login ID and password.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      const response = role === 'citizen'
        ? await loginCitizen({ loginId: identity.trim(), password })
        : await loginGovernmentOfficial({ loginId: identity.trim(), password });
      if (response?.accessToken) sessionStorage.setItem('sahyogAccessToken', response.accessToken);
      if (response?.refreshToken) sessionStorage.setItem('sahyogRefreshToken', response.refreshToken);
      if (response?.user) sessionStorage.setItem('sahyogUser', JSON.stringify(response.user));
      if (role === 'citizen') {
        const isAadhaarLogin = /^\d{12}$/.test(identity.trim());
        const applicationContext = await fetchCitizenApplicationContext({
          aadharNumber: response?.user?.aadharNumber || (isAadhaarLogin ? identity.trim() : null),
          mobileNumber: response?.user?.mobileNumber || (!isAadhaarLogin ? identity.trim() : null),
        });
        sessionStorage.setItem('citizenApplicationContext', JSON.stringify(applicationContext));
        sessionStorage.setItem('citizenReadOnlyMode', 'true');
      } else {
        sessionStorage.removeItem('citizenReadOnlyMode');
        sessionStorage.removeItem('citizenApplicationContext');
      }
      navigate(role === 'citizen' ? '/citizen/dashboard' : '/application-registration/register-application');
    } catch (error) {
      setMessage(getAuthErrorMessage(error, 'Unable to log in. Please verify your credentials and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAccount = () => {
    setMessage('');
    setRegistrationError('');
    setShowRegistration(true);
  };

  const selectRegistrationType = (type) => {
    setRegistrationType(type);
    setRegistrationError('');
  };

  const updateRegistration = (event) => {
    const { name, value } = event.target;
    const digitsOnly = ['mobileNumber', 'aadharNumber'].includes(name)
      ? value.replace(/\D/g, '').slice(0, name === 'mobileNumber' ? 10 : 12)
      : value;
    setRegistration((current) => ({ ...current, [name]: digitsOnly }));
  };

  const handleRegistration = async (event) => {
    event.preventDefault();
    const required = registrationType === 'citizen'
      ? ['firstName', 'lastName', 'mobileNumber', 'aadharNumber', 'password', 'confirmPassword']
      : ['firstName', 'lastName', 'employeeId', 'email', 'department', 'designation', 'password', 'confirmPassword'];
    if (required.some((field) => !registration[field].trim())) {
      setRegistrationError('Please complete all required fields.');
      return;
    }
    if (registrationType === 'citizen' && !/^\d{10}$/.test(registration.mobileNumber)) {
      setRegistrationError('Mobile number must contain exactly 10 digits.');
      return;
    }
    if (registrationType === 'citizen' && !/^\d{12}$/.test(registration.aadharNumber)) {
      setRegistrationError('Aadhaar number must contain exactly 12 digits.');
      return;
    }
    if (registration.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registration.email)) {
      setRegistrationError('Please enter a valid email address.');
      return;
    }
    if (registration.password.length < 8) {
      setRegistrationError('Password must contain at least 8 characters.');
      return;
    }
    if (registration.password !== registration.confirmPassword) {
      setRegistrationError('Password and confirm password must match.');
      return;
    }

    setIsSubmitting(true);
    setRegistrationError('');
    try {
      const common = {
        firstName: registration.firstName.trim(),
        middleName: registration.middleName.trim() || null,
        lastName: registration.lastName.trim(),
        password: registration.password,
        confirmPassword: registration.confirmPassword,
      };
      const response = registrationType === 'citizen'
        ? await registerCitizen({
          ...common,
          mobileNumber: registration.mobileNumber,
          email: registration.email.trim() || null,
          aadharNumber: registration.aadharNumber,
        })
        : await registerGovernmentOfficial({
          ...common,
          employeeId: registration.employeeId.trim(),
          officialEmail: registration.email.trim(),
          department: registration.department.trim(),
          designation: registration.designation.trim(),
        });
      setShowRegistration(false);
      setRole(registrationType);
      setRegistrationError('');
      setRegistration({ firstName: '', middleName: '', lastName: '', mobileNumber: '', email: '', aadharNumber: '', employeeId: '', department: '', designation: '', password: '', confirmPassword: '' });
      setMessage(response?.message || (registrationType === 'citizen'
        ? 'Account created successfully. You can now log in.'
        : 'Government Official registration submitted for approval.'));
    } catch (error) {
      setRegistrationError(getAuthErrorMessage(error, 'Unable to create the account. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <header className="login-header">
        <div className="login-brand" aria-label="Sahyog">
          <span className="login-brand-mark">S</span>
          <span>
            <strong>Sahyog</strong>
            <small>Citizen Welfare Eligibility System</small>
          </span>
        </div>
        <span className="login-secure-label">Secure Government Portal</span>
      </header>

      <section className="login-shell">
        <aside className="login-welcome">
          <span className="login-welcome-badge">One portal. Better access.</span>
          <h1>Welfare services made simpler.</h1>
          <p>
            Securely access applications, benefit programs, and case information
            through Sahyog.
          </p>
          <div className="login-welcome-feature">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>Secure and accessible</strong>
              <small>Your information is protected at every step.</small>
            </div>
          </div>
        </aside>

        <div className="login-panel">
          <div className="login-panel-heading">
            <span>Welcome back</span>
            <h2>Login to Sahyog</h2>
            <p>Select your profile type to continue.</p>
          </div>

          {message && <div className="login-alert" role="alert">{message}</div>}

          <div className="login-role-options" aria-label="Choose login type">
            {Object.entries(roles).map(([key, item]) => (
              <button
                className={`login-role-card${role === key ? ' active' : ''}`}
                key={key}
                type="button"
                aria-pressed={role === key}
                onClick={() => selectRole(key)}
              >
                <span className="login-role-icon"><RoleIcon type={key} /></span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </span>
                <span className="login-role-check" aria-hidden="true">✓</span>
              </button>
            ))}
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="login-identity">{selectedRole.identityLabel}</label>
            <input
              id="login-identity"
              value={identity}
              onChange={(event) => setIdentity(event.target.value)}
              placeholder={selectedRole.identityPlaceholder}
              autoComplete="username"
            />

            <div className="login-password-label">
              <label htmlFor="login-password">Password</label>
              <button type="button" onClick={() => setMessage('Password recovery will be available here.')}>
                Forgot password?
              </button>
            </div>
            <div className="login-password-input">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : selectedRole.buttonLabel}</button>
            <div className="login-divider"><span>New to Sahyog?</span></div>
            <button className="login-create" type="button" onClick={handleCreateAccount}>
              Create New Account
            </button>
          </form>
        </div>
      </section>

      <footer className="login-footer">Government of India · Citizen Welfare Services</footer>

      {showRegistration && (
        <div className="registration-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setShowRegistration(false);
        }}>
          <section className="registration-modal" role="dialog" aria-modal="true" aria-labelledby="registration-title">
            <div className="registration-header">
              <div><span>Create Sahyog profile</span><h2 id="registration-title">Register New Account</h2><p>Select an account type and enter the required details.</p></div>
              <button type="button" aria-label="Close registration" onClick={() => setShowRegistration(false)}>×</button>
            </div>
            {registrationError && <div className="registration-error" role="alert">{registrationError}</div>}
            <form onSubmit={handleRegistration} noValidate>
              <div className="registration-type-options" aria-label="Account type">
                <button type="button" className={registrationType === 'official' ? 'active' : ''} aria-pressed={registrationType === 'official'} onClick={() => selectRegistrationType('official')}><span className="registration-type-icon"><RoleIcon type="official" /></span><span><strong>Government Official</strong><small>Create an authorized staff profile</small></span><b>✓</b></button>
                <button type="button" className={registrationType === 'citizen' ? 'active' : ''} aria-pressed={registrationType === 'citizen'} onClick={() => selectRegistrationType('citizen')}><span className="registration-type-icon"><RoleIcon type="citizen" /></span><span><strong>Citizen Profile</strong><small>Create an individual citizen account</small></span><b>✓</b></button>
              </div>
              <div className="registration-grid three-columns">
                <label>First Name *<input name="firstName" value={registration.firstName} onChange={updateRegistration} placeholder="Enter first name" autoFocus /></label>
                <label>Middle Name<input name="middleName" value={registration.middleName} onChange={updateRegistration} placeholder="Enter middle name" /></label>
                <label>Last Name *<input name="lastName" value={registration.lastName} onChange={updateRegistration} placeholder="Enter last name" /></label>
              </div>
              {registrationType === 'citizen' ? <>
                <div className="registration-grid">
                  <label>Mobile Number *<input name="mobileNumber" value={registration.mobileNumber} onChange={updateRegistration} inputMode="numeric" placeholder="10-digit mobile number" /></label>
                  <label>Email Address<input name="email" type="email" value={registration.email} onChange={updateRegistration} placeholder="Enter email address (optional)" /></label>
                </div>
                <div className="registration-grid single-field">
                  <label>Aadhaar Number *<input name="aadharNumber" value={registration.aadharNumber} onChange={updateRegistration} inputMode="numeric" placeholder="12-digit Aadhaar number" /></label>
                </div>
              </> : <>
                <div className="registration-grid">
                  <label>Employee ID *<input name="employeeId" value={registration.employeeId} onChange={updateRegistration} placeholder="Enter government employee ID" /></label>
                  <label>Official Email Address *<input name="email" type="email" value={registration.email} onChange={updateRegistration} placeholder="Enter official email address" /></label>
                </div>
                <div className="registration-grid">
                  <label>Department *<input name="department" value={registration.department} onChange={updateRegistration} placeholder="Enter department name" /></label>
                  <label>Designation *<input name="designation" value={registration.designation} onChange={updateRegistration} placeholder="Enter designation" /></label>
                </div>
              </>}
              <div className="registration-grid">
                <label>Password *<input name="password" type="password" value={registration.password} onChange={updateRegistration} placeholder="Minimum 8 characters" autoComplete="new-password" /></label>
                <label>Confirm Password *<input name="confirmPassword" type="password" value={registration.confirmPassword} onChange={updateRegistration} placeholder="Re-enter password" autoComplete="new-password" /></label>
              </div>
              <label className="registration-consent"><input type="checkbox" required /> <span>I confirm that the information provided is correct and agree to the Sahyog terms of use.</span></label>
              <div className="registration-actions">
                <button className="registration-cancel" type="button" disabled={isSubmitting} onClick={() => setShowRegistration(false)}>Cancel</button>
                <button className="registration-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating Account…' : `Create ${registrationType === 'citizen' ? 'Citizen' : 'Official'} Account`}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
