import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EligibilityHelper.css';

const initialForm = {
  annualIncome: '', monthlyIncome: '', foodExpense: '', utilityExpense: '', totalExpense: '', medicalExpense: '', age: '',
  indianResident: '', significantAssets: '', utilityPayer: '', youngChild: '', parentGuardian: '', childLivesWithYou: '',
  fspExisting: '', capExisting: '', mcareExisting: '', capsExisting: '', eapExisting: '',
  disability: false, majorMedicalCondition: false, unemployed: false, soleEarner: false
};

const programs = [
  { code: 'FSP', name: 'Food Support Program', color: '#22a447' },
  { code: 'CAP', name: 'Cash Assistance Program', color: '#00897b' },
  { code: 'MCARE', name: 'Medical Care Assistance', color: '#2563eb' },
  { code: 'CAPS', name: 'Child Assistance & Protection Scheme', color: '#7c3aed' },
  { code: 'EAP', name: 'Energy Assistance Program', color: '#f97316' }
];

const numberOrNull = (value) => value === '' ? null : Number(value);
const formatIndianAmount = (value) => {
  if (value === '') return '';
  const digits = String(value).replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  const lastThree = digits.slice(-3);
  const leadingDigits = digits.slice(0, -3);
  return `${leadingDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}`;
};
const booleanRule = (value, expected) => value === '' ? null : value === String(expected);
const maxRule = (value, maximum) => value === null ? null : value <= maximum;
const ratioRule = (expense, income, ratio) => expense === null || income === null || income <= 0 ? null : expense >= income * ratio;

const evaluate = (form) => {
  const annual = numberOrNull(form.annualIncome);
  const enteredMonthly = numberOrNull(form.monthlyIncome);
  const monthly = enteredMonthly ?? (annual === null ? null : annual / 12);
  const food = numberOrNull(form.foodExpense);
  const utility = numberOrNull(form.utilityExpense);
  const total = numberOrNull(form.totalExpense);
  const medical = numberOrNull(form.medicalExpense);
  const age = numberOrNull(form.age);
  const resident = booleanRule(form.indianResident, true);
  const noExisting = (value) => booleanRule(value, false);
  const conditionSelected = form.disability || form.majorMedicalCondition;
  const hardshipSelected = conditionSelected || form.unemployed || form.soleEarner;
  const results = {
    FSP: [
      ['Yearly household income is ₹3,00,000 or less', maxRule(annual, 300000)],
      ['Food and grocery expenses are at least 20% of monthly income', ratioRule(food, monthly, .2)],
      ['Food and utility expenses together are at least 40% of monthly income', food === null || utility === null ? null : ratioRule(food + utility, monthly, .4)],
      ['Applicant is an Indian resident', resident],
      ['No active or approved FSP benefit', noExisting(form.fspExisting)]
    ],
    CAP: [
      ['Yearly household income is ₹2,00,000 or less', maxRule(annual, 200000)],
      ['Total monthly expenses are at least 80% of monthly income', ratioRule(total, monthly, .8)],
      ['Applicant is between 18 and 60 years old', age === null ? null : age >= 18 && age <= 60],
      ['Household does not own significant financial assets', booleanRule(form.significantAssets, false)],
      ['No active or approved CAP benefit', noExisting(form.capExisting)],
      ['At least one hardship applies: disability, major illness, unemployment, or sole earner', hardshipSelected ? true : null]
    ],
    MCARE: [
      ['Yearly household income is ₹5,00,000 or less', maxRule(annual, 500000)],
      ['Applicant has a certified disability or major medical condition', conditionSelected ? true : null],
      ['Medical expenses are at least 10% of monthly income', ratioRule(medical, monthly, .1)],
      ['Applicant is an Indian resident', resident],
      ['No active or approved MCARE benefit', noExisting(form.mcareExisting)]
    ],
    CAPS: [
      ['Household includes a child aged 5 years or younger', booleanRule(form.youngChild, true)],
      ['Yearly household income is ₹3,50,000 or less', maxRule(annual, 350000)],
      ['Applicant is the child’s parent or legal guardian', booleanRule(form.parentGuardian, true)],
      ['Child lives in the applicant’s household', booleanRule(form.childLivesWithYou, true)],
      ['No active or approved CAPS benefit for the same child', noExisting(form.capsExisting)]
    ],
    EAP: [
      ['Yearly household income is ₹3,00,000 or less', maxRule(annual, 300000)],
      ['Electricity and water expenses are at least 15% of monthly income', ratioRule(utility, monthly, .15)],
      ['Applicant is responsible for paying the utility bills', booleanRule(form.utilityPayer, true)],
      ['Applicant is an Indian resident', resident],
      ['No active or approved EAP benefit', noExisting(form.eapExisting)]
    ]
  };
  return programs.map((program) => {
    const criteria = results[program.code].map(([label, status]) => ({ label, status }));
    const checks = criteria.map((criterion) => criterion.status);
    const failed = checks.filter((value) => value === false).length;
    const unknown = checks.filter((value) => value === null).length;
    return { ...program, criteria, passed: checks.length - failed - unknown, failed, unknown, total: checks.length, outcome: failed ? 'UNLIKELY' : unknown ? 'MORE_INFO' : 'LIKELY' };
  });
};

function SelectQuestion({ label, name, value, onChange, yes = 'Yes', no = 'No' }) {
  return <label className="helper-field"><span>{label}</span><select name={name} value={value} onChange={onChange}><option value="">Prefer not to answer</option><option value="true">{yes}</option><option value="false">{no}</option></select></label>;
}

function MoneyQuestion({ label, name, value, onChange }) {
  return <label className="helper-field"><span>{label}</span><div className="helper-money"><b>₹</b><input name={name} inputMode="numeric" value={formatIndianAmount(value)} onChange={onChange} placeholder="Optional" /></div></label>;
}

export default function EligibilityHelper() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [showResults, setShowResults] = useState(false);
  const results = useMemo(() => evaluate(form), [form]);
  const update = (event) => {
    const { name, type, checked } = event.target;
    let value = type === 'checkbox' ? checked : event.target.value;
    if (type !== 'checkbox' && ['annualIncome','monthlyIncome','foodExpense','utilityExpense','totalExpense','medicalExpense','age'].includes(name)) value = value.replace(/\D/g, '');
    setForm((current) => ({ ...current, [name]: value }));
    setShowResults(false);
  };
  const reset = () => { setForm(initialForm); setShowResults(false); };

  return (
    <div className="helper-page">
      <header className="helper-header"><button type="button" onClick={() => navigate('/citizen/dashboard')}><span>S</span><div><strong>Sahyog</strong><small>Citizen Welfare Eligibility System</small></div></button><span>Benefit Eligibility Helper</span></header>
      <main className="helper-content">
        <button className="helper-back" type="button" onClick={() => navigate('/citizen/benefits-guide')}>← Back to Benefits Guide</button>
        <section className="helper-intro"><span className="helper-bot">••</span><div><span>Quick benefit check</span><h1>Let’s find benefits that may suit you</h1><p>Answer as many questions as you are comfortable with. Every question is optional, and your answers stay only on this page.</p></div></section>
        <div className="helper-warning"><span>!</span><p><strong>Important:</strong> Meeting these points does not guarantee approval. Your application and supporting information will be checked during Eligibility Determination.</p></div>

        <section className="helper-question-card"><div className="helper-section-heading"><span>1</span><div><h2>Household income and monthly expenses</h2><p>These amounts help compare your household income with essential expenses.</p></div></div><div className="helper-grid"><MoneyQuestion label="Total yearly household income" name="annualIncome" value={form.annualIncome} onChange={update} /><MoneyQuestion label="Monthly household income (if known)" name="monthlyIncome" value={form.monthlyIncome} onChange={update} /><MoneyQuestion label="Monthly food and grocery expenses" name="foodExpense" value={form.foodExpense} onChange={update} /><MoneyQuestion label="Monthly electricity and water expenses" name="utilityExpense" value={form.utilityExpense} onChange={update} /><MoneyQuestion label="Total monthly household expenses" name="totalExpense" value={form.totalExpense} onChange={update} /><MoneyQuestion label="Monthly medical expenses" name="medicalExpense" value={form.medicalExpense} onChange={update} /></div></section>

        <section className="helper-question-card"><div className="helper-section-heading"><span>2</span><div><h2>About the applicant</h2><p>Tell us a little about residency, age, assets, and utility responsibility.</p></div></div><div className="helper-grid"><label className="helper-field"><span>Applicant’s age</span><input name="age" inputMode="numeric" value={form.age} onChange={update} placeholder="Optional" /></label><SelectQuestion label="Is the applicant an Indian resident?" name="indianResident" value={form.indianResident} onChange={update} /><SelectQuestion label="Does the household own significant financial assets?" name="significantAssets" value={form.significantAssets} onChange={update} /><SelectQuestion label="Is the applicant responsible for electricity and water bills as owner or tenant?" name="utilityPayer" value={form.utilityPayer} onChange={update} /></div></section>

        <section className="helper-question-card"><div className="helper-section-heading"><span>3</span><div><h2>Health and financial hardship</h2><p>Select any condition that applies. You can leave all options blank.</p></div></div><div className="helper-check-grid">{[['disability','Certified disability'],['majorMedicalCondition','Chronic or major medical condition'],['unemployed','Currently unemployed'],['soleEarner','Only earning member of the household']].map(([name,label]) => <label key={name}><input type="checkbox" name={name} checked={form[name]} onChange={update} /><span>{label}</span></label>)}</div></section>

        <section className="helper-question-card"><div className="helper-section-heading"><span>4</span><div><h2>Children in the household</h2><p>These details help check the Child Assistance & Protection Scheme.</p></div></div><div className="helper-grid"><SelectQuestion label="Is there a child aged 5 years or younger in the household?" name="youngChild" value={form.youngChild} onChange={update} /><SelectQuestion label="Is the applicant the child’s parent or legal guardian?" name="parentGuardian" value={form.parentGuardian} onChange={update} /><SelectQuestion label="Does the child live in the applicant’s household?" name="childLivesWithYou" value={form.childLivesWithYou} onChange={update} /></div></section>

        <section className="helper-question-card"><div className="helper-section-heading"><span>5</span><div><h2>Existing applications and benefits</h2><p>Choose Yes only if an application is under review or a benefit is already approved.</p></div></div><div className="helper-grid">{programs.map((program) => <SelectQuestion key={program.code} label={`Active or approved ${program.code} benefit?`} name={`${program.code.toLowerCase()}Existing`} value={form[`${program.code.toLowerCase()}Existing`]} onChange={update} />)}</div></section>

        <div className="helper-actions"><button className="secondary-button" type="button" onClick={reset}>Reset Answers</button><button className="primary-button" type="button" onClick={() => { setShowResults(true); window.setTimeout(() => document.getElementById('helper-results')?.scrollIntoView({ behavior:'smooth' }), 0); }}>Check Eligibility</button></div>

        {showResults && <section className="helper-results" id="helper-results"><div className="helper-results-heading"><span>Suggestion</span><h2>Benefits you may want to explore</h2><p>Each program is checked separately using the answers you entered. Review every parameter below.</p></div><div className="helper-result-grid">{results.map((result) => <article key={result.code} className={`helper-result ${result.outcome.toLowerCase()}`} style={{ '--result-color': result.color }}><div><span>{result.code}</span><strong>{result.name}</strong></div><h3>{result.outcome === 'LIKELY' ? 'You may qualify' : result.outcome === 'MORE_INFO' ? 'More information needed' : 'May not qualify based on these answers'}</h3><p className="helper-result-summary">{result.passed} matched · {result.unknown} unanswered · {result.failed} did not match</p><h4>Eligibility parameters</h4><ul className="helper-criteria">{result.criteria.map((criterion) => <li key={criterion.label} className={criterion.status === true ? 'matched' : criterion.status === false ? 'failed' : 'unknown'}><span>{criterion.status === true ? '✓' : criterion.status === false ? '×' : '?'}</span><p>{criterion.label}<small>{criterion.status === true ? 'Matched' : criterion.status === false ? 'Does not match' : 'Not answered'}</small></p></li>)}</ul></article>)}</div><div className="helper-warning result-warning"><span>!</span><p>Meeting these points does not guarantee approval. Your application and supporting information will be checked during Eligibility Determination.</p></div></section>}
      </main>
    </div>
  );
}
