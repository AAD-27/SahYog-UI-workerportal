import React from 'react';

const programNames = {
  FSP: 'FSP – Food Support Program',
  CAP: 'CAP – Cash Assistance Program',
  MCARE: 'MCARE – Medical Care and Assistance for Residents',
  CAPS: 'CAPS – Child Assistance and Protection Scheme',
  EAP: 'EAP – Energy Assistance Program'
};

const money = (value) => value === '' || value === null || value === undefined ? '—' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value) || 0);
const addressText = (address = {}) => [address.line1, address.line2, address.city, address.state, address.country, address.pincode].filter(Boolean).join(', ') || '—';

function DetailTable({ title, columns, rows, emptyText }) {
  return <section className="section-card dc-summary-section"><h2 className="section-title">{title}</h2><div className="dc-summary-table-wrap"><table className="dc-summary-table"><thead><tr>{columns.map((column) => <th key={column.label}>{column.label}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={row.id || row.incomeId || row.expenseId || row.resourceId || row.disabilityId || row.personId || index}>{columns.map((column) => <td key={column.label}>{column.value(row)}</td>)}</tr>) : <tr><td colSpan={columns.length} className="dc-summary-empty">{emptyText}</td></tr>}</tbody></table></div></section>;
}

function DC015DataCollectionSummary({ caseContext, onPrevious, onProceed }) {
  const cachedApplicant = caseContext.applicant || {};
  const savedApplicant = caseContext.applicantDetails || {};
  const applicant = {
    firstName: savedApplicant.firstName || cachedApplicant.firstName || '',
    middleName: savedApplicant.middleName || cachedApplicant.middleName || '',
    lastName: savedApplicant.lastName || cachedApplicant.lastName || '',
    mobileNumber: savedApplicant.mobileNumber || cachedApplicant.mobileNumber || '',
    emailAddress: savedApplicant.emailAddress || savedApplicant.email || cachedApplicant.emailAddress || cachedApplicant.email || '',
    isIndianResident: typeof savedApplicant.isIndianResident === 'boolean' ? savedApplicant.isIndianResident : typeof cachedApplicant.isIndianResident === 'boolean' ? cachedApplicant.isIndianResident : '',
    applicationDate: savedApplicant.applicationDate || cachedApplicant.applicationDate || ''
  };
  const address = caseContext.addressDetails || {};
  const people = caseContext.people || [];
  const programs = caseContext.programs || [];
  const incomes = caseContext.incomes || [];
  const expenses = caseContext.expenses || [];
  const resources = caseContext.resources || [];
  const disabilities = caseContext.disabilities || [];

  return <div className="card dc-card dc-final-summary"><div className="page-header"><div><span className="dc-summary-code">DC015 · FINAL REVIEW</span><h1 className="page-title">Data Collection Summary</h1><p className="page-description">Review all information collected for this case before proceeding to Eligibility Determination.</p></div></div><div className="dc-summary-case"><div><span>Case Number</span><strong>{caseContext.applicationNumber || '—'}</strong></div><div><span>Application Number</span><strong>{caseContext.arApplicationNumber || '—'}</strong></div><div><span>Records Captured</span><strong>{people.length + incomes.length + expenses.length + resources.length + disabilities.length}</strong></div></div><section className="section-card dc-summary-section"><h2 className="section-title">Applicant Details</h2><div className="dc-summary-grid"><div><span>Full Name</span><strong>{[applicant.firstName, applicant.middleName, applicant.lastName].filter(Boolean).join(' ') || '—'}</strong></div><div><span>Mobile Number</span><strong>{applicant.mobileNumber || '—'}</strong></div><div><span>Email Address</span><strong>{applicant.emailAddress || applicant.email || '—'}</strong></div><div><span>Indian Resident</span><strong>{applicant.isIndianResident === true ? 'Yes' : applicant.isIndianResident === false ? 'No' : '—'}</strong></div><div><span>Application Date</span><strong>{applicant.applicationDate || '—'}</strong></div></div></section><section className="section-card dc-summary-section"><h2 className="section-title">Address Details</h2><div className="dc-summary-grid"><div className="dc-summary-wide"><span>Permanent Address</span><strong>{addressText(address.permanent)}</strong></div><div className="dc-summary-wide"><span>Temporary Address</span><strong>{address.sameAsPermanent ? 'Same as permanent address' : addressText(address.temporary)}</strong></div></div></section><DetailTable title="Household Members" rows={people} emptyText="No household member records captured." columns={[{ label: 'Name', value: (row) => row.personName || [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ') || '—' }, { label: 'Relationship / Type', value: (row) => row.personType || row.relationship || '—' }, { label: 'Age', value: (row) => row.age ?? '—' }, { label: 'Gender', value: (row) => row.gender || '—' }]} /><section className="section-card dc-summary-section"><h2 className="section-title">Programs Selected</h2>{programs.length ? <div className="dc-summary-programs">{programs.map((program) => <span key={program} className="dc-summary-program">{programNames[program] || program}</span>)}</div> : <p className="dc-summary-empty-copy">No program selections captured.</p>}</section><DetailTable title="Income Summary" rows={incomes} emptyText="No income records captured." columns={[{ label: 'Employer / Source', value: (row) => row.employerName || row.incomeSource || '—' }, { label: 'Income Type', value: (row) => row.incomeType || '—' }, { label: 'Amount', value: (row) => money(row.incomeAmount) }, { label: 'Frequency', value: (row) => row.payFrequency || row.frequency || '—' }, { label: 'Verification', value: (row) => row.incomeVerification || '—' }]} /><DetailTable title="Expense Summary" rows={expenses} emptyText="No expense records captured." columns={[{ label: 'Expense Type', value: (row) => row.expenseType || '—' }, { label: 'Details', value: (row) => row.expenseDetails || row.expenseDetail || '—' }, { label: 'Amount', value: (row) => money(row.expenseAmount) }, { label: 'Frequency', value: (row) => row.expenseFrequency || row.frequency || '—' }, { label: 'Verification', value: (row) => row.expenseVerification || '—' }]} /><DetailTable title="Resource Summary" rows={resources} emptyText="No resource records captured." columns={[{ label: 'Resource Type', value: (row) => row.resourceType || '—' }, { label: 'Details', value: (row) => row.resourceDetail || '—' }, { label: 'Amount', value: (row) => money(row.resourceValue) }, { label: 'Ownership', value: (row) => row.ownershipType || '—' }, { label: 'Verification', value: (row) => row.resourceVerification || '—' }]} /><DetailTable title="Disability Summary" rows={disabilities} emptyText="No disability records captured." columns={[{ label: 'Applicant', value: (row) => row.personName || [row.firstName, row.lastName].filter(Boolean).join(' ') || '—' }, { label: 'Disability Type', value: (row) => row.disabilityType || (row.disabilityTypes || []).join(', ') || '—' }, { label: 'Verification', value: (row) => row.disabilityVerification || row.proofOfDisability || '—' }, { label: 'Percentage', value: (row) => row.disabilityPercentage === '' || row.disabilityPercentage == null ? '—' : `${row.disabilityPercentage}%` }]} /><div className="dc-summary-actions"><button type="button" className="secondary-button" onClick={onPrevious}>← Previous</button><button type="button" className="primary-button" onClick={onProceed}>Proceed to Eligibility Determination →</button></div></div>;
}

export default DC015DataCollectionSummary;
