import React, { useEffect, useMemo, useRef, useState } from 'react';
import { initializeReview, submitReview } from '../../services/appRegApi';
import fspIcon from '../../assets/program-icons/fsp.png';
import capIcon from '../../assets/program-icons/cap-rupee.png';
import capsIcon from '../../assets/program-icons/caps-family.png';

const programDetails = {
  FSP: {
    label: 'FSP – Food Support Program',
    description: 'Provide food assistance to households with limited financial capacity.',
    color: '#16a34a',
    icon: <img src={fspIcon} alt="" style={{ width: 36, height: 36, objectFit: 'contain', display: 'block' }} />
  },
  CAP: {
    label: 'CAP – Cash Assistance Program',
    description: 'Provide temporary financial assistance to citizens experiencing severe financial hardship.',
    color: '#047857',
    icon: <img src={capIcon} alt="" style={{ width: 36, height: 36, objectFit: 'contain', display: 'block' }} />
  },
  MCARE: {
    label: 'MCARE – Medical Care and Assistance for Residents',
    description: 'Provide medical insurance support to citizens requiring healthcare assistance.',
    color: '#1d4ed8',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden><path d="M11 4h2v6h6v2h-6v6h-2v-6H5v-2h6V4Z" fill="#fff" /></svg>
  },
  CAPS: {
    label: 'CAPS – Child Assistance and Protection Scheme',
    description: 'Provide assistance to households responsible for young children.',
    color: '#6d28d9',
    icon: <img src={capsIcon} alt="" style={{ width: 36, height: 36, objectFit: 'contain', display: 'block' }} />
  },
  EAP: {
    label: 'EAP – Energy Assistance Program',
    description: 'Assist households struggling to pay essential utility bills.',
    color: '#f97316',
    icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden><path d="M13 2L5 14h5l-1 8 9-12h-5l1-8Z" fill="#fff" /></svg>
  }
};

function AR005ReviewSubmit({ applicationContext, updateApplicationContext, setActiveStep }) {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [reviewApplicant, setReviewApplicant] = useState(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (applicationContext.initAttempted || initializedRef.current) {
      return;
    }

    const loadInitial = async () => {
      updateApplicationContext({ initAttempted: true });
      if (applicationContext.applicationId && applicationContext.data && Object.keys(applicationContext.data).length > 0) {
        return;
      }

      try {
        const result = await initializeReview({ applicationNum: applicationContext.applicationNumber || '' });
        if (!result) {
          setMessage('Unable to load review data. Please refresh.');
          return;
        }

        updateApplicationContext({
          initAttempted: true,
          applicationNumber: result.applicationNum || applicationContext.applicationNumber,
          data: {
            ...applicationContext.data,
            address: result.addressDetails || applicationContext.data?.address,
            programs: result.programsSelected || applicationContext.data?.programs
          }
        });
        setReviewApplicant(result.applicantDetails || null);
      } catch (error) {
        setMessage('Unable to load review data. Please refresh.');
      }
    };

    initializedRef.current = true;
    loadInitial();
  }, [applicationContext.applicationNumber, applicationContext.applicationId, applicationContext.data, applicationContext.initAttempted, applicationContext.status, updateApplicationContext]);

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
      const payload = {
        applicationNum: applicationContext.applicationNumber,
        pageId: 'AR005',
        ...applicationContext.data,
        programs: applicationContext.data?.programs || []
      };
      const result = await submitReview(payload);
      updateApplicationContext({
        applicationNumber: result.applicationNum || applicationContext.applicationNumber,
        status: result.status || 'Submitted',
        data: applicationContext.data
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
            <div>{reviewApplicant?.name || `${person.firstName || '-'} ${person.middleName || ''} ${person.lastName || ''}`.trim()}</div>
          </div>
          <div className="field-group">
            <div className="field-label">Age</div>
            <div>{reviewApplicant?.age != null ? `${reviewApplicant.age} Years` : person.dob ? `${age} Years` : '-'}</div>
          </div>
          <div className="field-group">
            <div className="field-label">Gender</div>
            <div>{reviewApplicant?.gender || person.gender || '-'}</div>
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
          {selectedPrograms.map((program) => {
            const details = programDetails[program];
            if (!details) {
              return <div key={program} className="section-card" style={{ padding: 16, background: '#f8fafb', borderColor: '#e2e8f0', fontWeight: 700 }}>{program}</div>;
            }

            return (
            <div key={program} className="section-card" style={{ margin: 0, borderColor: '#2563eb', background: '#eff6ff', padding: 18 }}>
              <div style={{ position: 'relative', paddingLeft: 14, display: 'grid', gridTemplateColumns: 'auto 56px 1fr', gap: 16, alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 1, background: '#e2e8f0' }} />
                <input type="checkbox" checked readOnly aria-label={`${details.label} selected`} style={{ width: 20, height: 20, accentColor: '#2563eb', zIndex: 1 }} />
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: details.color, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
                  {details.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 15 }}>{details.label}</div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>{details.description}</div>
                </div>
              </div>
            </div>
            );
          })}
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
