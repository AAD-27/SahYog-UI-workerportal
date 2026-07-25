import React, { useEffect, useMemo, useState } from 'react';
import { initializeRegistration, submitApplication } from '../../services/appRegApi';

const programLabels = {
  FSP: 'FSP – Food Support Program',
  CAP: 'CAP – Cash Assistance Program',
  MCARE: 'MCARE – Medical Care and Assistance for Residents',
  CAPS: 'CAPS – Child Assistance and Protection Scheme',
  EAP: 'EAP – Energy Assistance Program'
};

function AR005ReviewSubmit({ applicationContext, updateApplicationContext, setActiveStep }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (applicationContext.applicationId && applicationContext.data && Object.keys(applicationContext.data).length > 0) {
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
      } catch (error) {
        setMessage('Unable to load review data. Please refresh.');
      }
    };

    loadInitial();
  }, [applicationContext.applicationId, applicationContext.data, applicationContext.applicationNumber, applicationContext.applicationDate, applicationContext.status, updateApplicationContext]);

  const person = applicationContext.data?.person || {};
  const address = applicationContext.data?.address || {};
  const programs = applicationContext.data?.programs || [];

  const age = useMemo(() => {
    if (!person.dob) return '-';
    const birth = new Date(person.dob);
    const diff = Date.now() - birth.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }, [person.dob]);

  const handlePrevious = () => setActiveStep('AR004');

  const handleSubmit = async () => {
    setShowConfirm(false);
    setStatus('loading');
    setMessage('');
    try {
      const payload = { pageId: 'AR005', ...applicationContext.data };
      const result = await submitApplication(payload);
      updateApplicationContext({
        applicationNumber: result.applicationNumber || applicationContext.applicationNumber,
        applicationDate: result.applicationDate || applicationContext.applicationDate,
        status: result.status || 'Submitted',
        data: result.data || applicationContext.data
      });
      setStatus('success');
      setMessage('Application submitted successfully. The AR flow is now read-only.');
    } catch (error) {
      setStatus('error');
      setMessage('Unable to submit the application. Please try again.');
    }
  };

  const selectedPrograms = programs.length ? programs : ['No programs selected'];

  return (
    <div className="card" style={{ position: 'relative' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Review & Submit Application</h1>
          <p className="page-description">Please review the details below before submitting your application.</p>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Applicant Details</h2>
          </div>
        </div>

        <div className="field-row">
          <div className="field-group">
            <div className="field-label">Name</div>
            <div>{`${person.firstName || '-'} ${person.middleName || ''} ${person.lastName || ''}`.trim()}</div>
          </div>
          <div className="field-group">
            <div className="field-label">Age</div>
            <div>{person.dob ? `${age} Years` : '-'}</div>
          </div>
          <div className="field-group">
            <div className="field-label">Gender</div>
            <div>{person.gender || '-'}</div>
          </div>
        </div>
      </div>

      <div className="section-card" style={{ marginTop: 20 }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">Address Details</h2>
          </div>
        </div>

        <div className="field-row">
          <div className="field-group">
            <div className="field-label">Permanent Address</div>
            <div>{address.permanent?.line1 || '-'}{address.permanent?.line2 ? `, ${address.permanent.line2}` : ''}</div>
            <div>{address.permanent?.city || '-'}, {address.permanent?.state || '-'} {address.permanent?.country || '-'}</div>
          </div>
          <div className="field-group">
            <div className="field-label">Temporary Address</div>
            <div>{address.temporary?.line1 || '-'}{address.temporary?.line2 ? `, ${address.temporary.line2}` : ''}</div>
            <div>{address.temporary?.city || '-'}, {address.temporary?.state || '-'} {address.temporary?.country || '-'}</div>
          </div>
        </div>
      </div>

      <div className="section-card" style={{ marginTop: 20 }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">Program(s) Selected</h2>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          {selectedPrograms.map((program) => (
            <div key={program} className="section-card" style={{ padding: 16, background: '#f8fafb', borderColor: '#e2e8f0' }}>
              <div style={{ fontWeight: 700 }}>{programLabels[program] || program}</div>
            </div>
          ))}
        </div>
      </div>

      {message && (
        <div className="info-box" style={{ marginTop: 16, background: status === 'error' ? '#fee2e2' : '#eef4ff', color: status === 'error' ? '#991b1b' : '#1e3a8a' }}>
          {message}
        </div>
      )}

      <div className="action-row">
        <button type="button" className="secondary-button" onClick={handlePrevious} disabled={status === 'loading'}>
          ← Previous
        </button>
        <button type="button" className="primary-button" onClick={() => setShowConfirm(true)} disabled={status === 'loading' || applicationContext.status === 'Submitted'}>
          Submit Application
        </button>
      </div>

      {showConfirm && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'grid', placeItems: 'center', zIndex: 10 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: 420, padding: 28, boxShadow: '0 24px 60px rgba(15,23,42,0.2)' }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                <span style={{ fontSize: 28, color: '#22c55e' }}>✓</span>
              </div>
              <h2 style={{ margin: 0, fontSize: 22 }}>Are you ready to submit this application?</h2>
              <p style={{ marginTop: 12, color: '#475569' }}>Once submitted, the Application Registration (AR) module will become read-only and no further changes can be made in this section.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="secondary-button" onClick={() => setShowConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleSubmit} disabled={status === 'loading'}>
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AR005ReviewSubmit;
