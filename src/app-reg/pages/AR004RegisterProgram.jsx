import React, { useEffect, useState } from 'react';
import { initializeRegistration, saveRegistrationStep } from '../../services/appRegApi';
import ResetButton from '../../common/components/ResetButton';
import fspIcon from '../../assets/program-icons/fsp.png';
import capIcon from '../../assets/program-icons/cap.jpg';
import mcareIcon from '../../assets/program-icons/mcare.png';
import capsIcon from '../../assets/program-icons/caps.jpg';
import eapIcon from '../../assets/program-icons/eap.png';

const programOptions = [
  { id: 'FSP', label: 'FSP – Food Support Program', description: 'Provide food assistance to households with limited financial capacity.' },
  { id: 'CAP', label: 'CAP – Cash Assistance Program', description: 'Provide temporary financial assistance to citizens experiencing severe financial hardship.' },
  { id: 'MCARE', label: 'MCARE – Medical Care and Assistance for Residents', description: 'Provide medical insurance support to citizens requiring healthcare assistance.' },
  { id: 'CAPS', label: 'CAPS – Child Assistance and Protection Scheme', description: 'Provide assistance to households responsible for young children.' },
  { id: 'EAP', label: 'EAP – Energy Assistance Program', description: 'Assist households struggling to pay essential utility bills.' }
];

const initialPrograms = {
  FSP: false,
  CAP: false,
  MCARE: false,
  CAPS: false,
  EAP: false
};

const programIcons = {
  FSP: fspIcon,
  CAP: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="#fff" strokeWidth="2" />
      <path d="M6 10h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 14h12" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.5" stroke="#fff" strokeWidth="2" />
      <path d="M10.5 11.5v1" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M13.5 11.5v1" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  MCARE: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M11 4h2v6h6v2h-6v6h-2v-6H5v-2h6V4Z" fill="#fff" />
    </svg>
  ),
  CAPS: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="7" cy="7" r="2.5" fill="#fff" />
      <circle cx="17" cy="7" r="2.5" fill="#fff" />
      <circle cx="12" cy="15.5" r="1.8" fill="#fff" />
      <path d="M5 11.5c1.5 0 2-1 3-1s1.5 1 3 1 1.5-1 3-1 1.5 1 3 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 16h4v2H5zM15 16h4v2h-4z" fill="#fff" />
    </svg>
  ),
  EAP: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M13 2L5 14h5l-1 8 9-12h-5l1-8Z" fill="#fff" />
    </svg>
  )
};

const programColors = {
  FSP: { background: '#16a34a' },
  CAP: { background: '#047857' },
  MCARE: { background: '#1d4ed8' },
  CAPS: { background: '#6d28d9' },
  EAP: { background: '#f97316' }
};

function AR004RegisterProgram({ applicationContext, updateApplicationContext, setActiveStep }) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [initialData, setInitialData] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState('');

  useEffect(() => {
    if (applicationContext.applicationId && applicationContext.data && Object.keys(applicationContext.data).length > 0) {
      const initial = { ...initialPrograms };
      const savedPrograms = applicationContext.data?.programs || [];
      savedPrograms.forEach((program) => {
        if (initial.hasOwnProperty(program)) {
          initial[program] = true;
        }
      });
      setPrograms(initial);
      setInitialData(initial);
      return;
    }

    const loadInitial = async () => {
      try {
        const result = await initializeRegistration();
        updateApplicationContext({
          applicationNumber: result.applicationNumber || applicationContext.applicationNumber,
          applicationDate: result.applicationDate || applicationContext.applicationDate,
          status: result.status || applicationContext.status,
          data: result.data || applicationContext.data
        });

        const initial = { ...initialPrograms };
        const savedPrograms = result.data?.programs || applicationContext.data?.programs || [];
        savedPrograms.forEach((program) => {
          if (initial.hasOwnProperty(program)) {
            initial[program] = true;
          }
        });
        setPrograms(initial);
        setInitialData(initial);
      } catch (error) {
        setMessage('Unable to load program data. Please refresh.');
      }
    };

    loadInitial();
  }, [applicationContext.applicationId, applicationContext.data, applicationContext.applicationNumber, applicationContext.applicationDate, applicationContext.status, updateApplicationContext]);

  const updateProgram = (programId) => {
    setPrograms((prev) => ({ ...prev, [programId]: !prev[programId] }));
    setErrors('');
  };

  const selectedPrograms = Object.keys(programs).filter((key) => programs[key]);
  const isValid = selectedPrograms.length > 0;

  const handlePrevious = () => setActiveStep('AR003');

  const handleReset = (resetData) => {
    setPrograms(resetData);
    setErrors('');
    setMessage('');
  };

  const handleNext = async () => {
    if (!isValid) {
      setErrors('Please select at least one welfare program.');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const result = await saveRegistrationStep({ pageId: 'AR004', programs: selectedPrograms });
      updateApplicationContext({
        applicationNumber: result.applicationNumber || applicationContext.applicationNumber,
        applicationDate: result.applicationDate || applicationContext.applicationDate,
        status: result.status || applicationContext.status,
        data: result.data || { ...applicationContext.data, programs: selectedPrograms }
      });
      setStatus('success');
      setMessage('Program selection saved. Proceeding to review.');
      setActiveStep('AR005');
    } catch (error) {
      setStatus('error');
      setMessage('Unable to save program selection. Please try again.');
    }
  };

  return (
    <div className="card">
      <div className="page-header">
        <div>
          <h1 className="page-title">Register Program</h1>
          <p className="page-description">Select the welfare programs you want to apply for. You can select one or more programs.</p>
        </div>
      </div>

      <div className="info-box">
        You may qualify for one or more programs based on eligibility rules. Final decision will be made in the Eligibility Determination (ED) stage.
      </div>

      <div className="section-card" style={{ marginTop: 24 }}>
        {programOptions.map((program) => (
          <div
            key={program.id}
            className="section-card"
            onClick={() => updateProgram(program.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                updateProgram(program.id);
              }
            }}
            style={{
              marginBottom: 16,
              borderColor: programs[program.id] ? '#2563eb' : '#e2e8f0',
              background: programs[program.id] ? '#eff6ff' : '#fff',
              padding: 18,
              cursor: 'pointer'
            }}
          >
            <div style={{ position: 'relative', paddingLeft: 14, display: 'grid', gridTemplateColumns: 'auto 56px 1fr', gap: 16, alignItems: 'center' }}>
              <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 1, background: '#e2e8f0' }} />
              <input
                type="checkbox"
                checked={programs[program.id]}
                onChange={(e) => {
                  e.stopPropagation();
                  updateProgram(program.id);
                }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  accentColor: '#2563eb',
                  border: programs[program.id] ? 'none' : '1.5px solid #cbd5e1',
                  background: programs[program.id] ? '#2563eb' : '#fff',
                  cursor: 'pointer',
                  zIndex: 1
                }}
              />
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: programColors[program.id].background,
                  display: 'grid',
                  placeItems: 'center',
                  overflow: 'hidden'
                }}
              >
                {typeof programIcons[program.id] === 'string' ? (
                  <img
                    src={programIcons[program.id]}
                    alt={`${program.id} icon`}
                    style={{
                      width: 36,
                      height: 36,
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                ) : (
                  <div style={{ width: 36, height: 36, display: 'grid', placeItems: 'center' }}>
                    {programIcons[program.id]}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>{program.label}</div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{program.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {errors && <div className="field-error" style={{ marginTop: 16 }}>{errors}</div>}

      {message && (
        <div className="info-box" style={{ marginTop: 16, background: status === 'error' ? '#fee2e2' : '#eef4ff', color: status === 'error' ? '#991b1b' : '#1e3a8a' }}>
          {message}
        </div>
      )}

      <div className="action-row">
        <div>
          <ResetButton
            form={programs}
            initialData={initialData}
            initialState={initialPrograms}
            onReset={handleReset}
            disabled={status === 'loading'}
          />
          <button type="button" className="secondary-button" onClick={handlePrevious} disabled={status === 'loading'}>
            ← Previous
          </button>
        </div>
        <button type="button" className="primary-button" onClick={handleNext} disabled={!isValid || status === 'loading'}>
          Next →
        </button>
      </div>
    </div>
  );
}

export default AR004RegisterProgram;
