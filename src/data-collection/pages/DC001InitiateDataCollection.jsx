import React, { useEffect, useState } from 'react';
import { getInitiateDC, postInitiateDC } from '../../services/dataCollectionApi';

function DC001InitiateDataCollection({ caseContext, updateCaseContext, onContinue }) {
  const [applicationNumber, setApplicationNumber] = useState(caseContext.applicationNumber);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const reference = applicationNumber.trim();
    if (!reference) {
      setMessage('Enter an application number or case number to continue.');
      return;
    }

      setLoading(true);
      setMessage('');
      setMessageType('');
    try {
      const result = await postInitiateDC(reference, {});
      // If backend returns a custom validation (status 512) in body, show it and abort
      if (result && parseInt(result.status, 10) === 512) {
        setMessage(result.message || 'Validation error');
        setMessageType('warning');
        return;
      }

      // result should contain arApplicationNumber and dcApplicationNumber
      const arNum = result?.arApplicationNumber || result?.arApplicationNum || reference;
      const dcNum = result?.dcApplicationNumber || result?.dcApplicationNum || reference;
      // set caseContext.applicationNumber to DC number (case number) so all subsequent DC pages use D900...
      updateCaseContext({
        applicationNumber: dcNum,
        arApplicationNumber: arNum,
        status: result?.status || 'IN_PROGRESS',
        applicant: result?.applicant || result?.data || null,
        dcApplicationNumber: dcNum
      });
      onContinue();
    } catch (err) {
      // Axios throws on non-2xx. If server responded with HTTP 512, show its message as warning banner
      const resp = err?.response;
      if (resp && parseInt(resp.status, 10) === 512) {
        const bodyMessage = resp.data?.message || resp.data?.msg || resp.statusText || '';
        setMessage(bodyMessage || 'Validation error');
        setMessageType('warning');
        setLoading(false);
        return;
      }
      setMessage('Unable to initiate data collection. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applicant = caseContext.applicant;

  // Debounced GET call: fetch applicant details as user types application number
  useEffect(() => {
    const reference = applicationNumber?.trim();
    if (!reference) return;

    const handle = setTimeout(async () => {
      setLoading(true);
      setMessage('');
      setMessageType('');
      try {
        const result = await getInitiateDC(reference);
        // If backend returns status 512 in body, display message and do not update context
        if (result && parseInt(result.status, 10) === 512) {
          setMessage(result.message || 'Validation error');
          setMessageType('warning');
          return;
        }
        // Accept various shapes: result.applicant, result.data, or result
        const applicantData = result?.applicant || result?.data || result || null;
        const arNum = result?.arApplicationNumber || result?.arApplicationNum || reference;
        const dcNum = result?.dcApplicationNumber || result?.dcApplicationNum;
        const update = {
          arApplicationNumber: arNum,
          applicant: applicantData,
          status: result?.status || caseContext.status
        };
        if (dcNum) {
          update.applicationNumber = dcNum;
          update.dcApplicationNumber = dcNum;
        } else {
          update.applicationNumber = reference;
        }
        updateCaseContext(update);
      } catch (err) {
        const resp = err?.response;
        if (resp && parseInt(resp.status, 10) === 512) {
          const bodyMessage = resp.data?.message || resp.data?.msg || resp.statusText || '';
          setMessage(bodyMessage || 'Validation error');
          setMessageType('warning');
        } else {
          setMessage('Unable to fetch applicant details.');
        }
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(handle);
  }, [applicationNumber]);

  return (
    <div className="card dc-card">
      <div className="page-header">
        <div>
          <h1 className="page-title">Initiate Data Collection</h1>
          <p className="page-description">Enter the Application Number / Case Number to fetch applicant details and start data collection.</p>
        </div>
      </div>

      {message && messageType === 'warning' && <div className="notification-banner warning">{message}</div>}
      {message && messageType !== 'warning' && <div className="info-box dc-message">{message}</div>}

      <section className="section-card dc-section">
        <label className="field-label" htmlFor="dcApplicationNumber">Enter Application Number / Case Number</label>
        <div className="dc-reference-row">
          <input
            id="dcApplicationNumber"
            className="field-input"
            value={applicationNumber}
            onChange={(event) => setApplicationNumber(event.target.value.toUpperCase())}
            placeholder="Enter application or case number"
          />
          <button type="button" className="primary-button" onClick={handleContinue} disabled={loading}>Continue <span aria-hidden>→</span></button>
        </div>
      </section>

      <section className="section-card dc-section">
        <h2 className="section-title">Applicant Basic Details</h2>
        <p className="section-subtitle">The following details are auto-filled from the application.</p>
        <div className="dc-details-grid">
          <div><span>First Name</span><strong>{applicant?.firstName || '—'}</strong></div>
          <div><span>Last Name</span><strong>{applicant?.lastName || '—'}</strong></div>
          <div><span>Age</span><strong>{applicant?.age != null ? `${applicant.age} Years` : '—'}</strong></div>
        </div>
      </section>

      <div className="dc-note"><span className="dc-note-icon" aria-hidden>i</span><div><strong>Note</strong><p>Please verify the details above. If any information is incorrect, update it in the Application Registration module.</p></div></div>
      
    </div>
  );
}

export default DC001InitiateDataCollection;
