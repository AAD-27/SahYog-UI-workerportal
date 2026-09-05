import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fspIcon from '../assets/program-icons/fsp.png';
import capIcon from '../assets/program-icons/cap-rupee.png';
import capsIcon from '../assets/program-icons/caps-family.png';
import './BenefitsGuide.css';
import { guideLanguages, guideProgramText, guideText } from './benefitsGuideI18n';

const programs = [
  {
    code: 'FSP', name: 'Food Support Program', color: '#22a447', icon: fspIcon,
    summary: 'Support with food costs for households managing on a limited income.',
    rules: [
      'Your household’s total yearly income is ₹3,00,000 or less.',
      'Your monthly food and grocery spending is at least 20% of your monthly household income.',
      'Food and essential utility costs together are at least 40% of monthly household income.',
      'The applicant is an Indian resident.',
      'You do not already have an FSP application under review or an approved FSP benefit.'
    ]
  },
  {
    code: 'CAP', name: 'Cash Assistance Program', color: '#00897b', icon: capIcon,
    summary: 'Temporary financial support for adults experiencing serious financial hardship.',
    rules: [
      'Your household’s total yearly income is ₹2,00,000 or less.',
      'Your total monthly expenses are at least 80% of monthly household income.',
      'The applicant is between 18 and 60 years old.',
      'The household does not own significant financial assets under the applicable policy.',
      'The applicant is not already receiving CAP benefits.',
      'At least one hardship applies: disability, major medical costs, unemployment, or being the household’s only earning member.'
    ]
  },
  {
    code: 'MCARE', name: 'Medical Care Assistance', color: '#2563eb', symbol: 'medical',
    summary: 'Medical support for eligible residents affected by disability or major health conditions.',
    rules: [
      'Your household’s total yearly income is ₹5,00,000 or less.',
      'The applicant has a certified disability or a declared chronic or major medical condition.',
      'Monthly medical expenses are at least 10% of monthly household income.',
      'The applicant is an Indian resident.',
      'There is no active MCARE application or approved MCARE coverage for the applicant.'
    ]
  },
  {
    code: 'CAPS', name: 'Child Assistance & Protection Scheme', color: '#7c3aed', icon: capsIcon,
    summary: 'Support for parents and legal guardians caring for young children.',
    rules: [
      'Your household includes at least one child who is 5 years old or younger.',
      'Your household’s total yearly income is ₹3,50,000 or less.',
      'The applicant is the child’s parent or legal guardian.',
      'The child lives in the applicant’s household.',
      'The applicant is not already receiving CAPS benefits for the same child.'
    ]
  },
  {
    code: 'EAP', name: 'Energy Assistance Program', color: '#f97316', symbol: 'energy',
    summary: 'Help for households where electricity and water bills place a heavy burden on income.',
    rules: [
      'Your household’s total yearly income is ₹3,00,000 or less.',
      'Electricity and water bills together are at least 15% of monthly household income.',
      'The applicant is responsible for paying the utility bills as an owner or tenant.',
      'The applicant is an Indian resident.',
      'There is no active EAP application or approved EAP benefit for the applicant.'
    ]
  }
];

function GuideIcon({ program }) {
  if (program.symbol === 'medical') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4Z" /></svg>;
  if (program.symbol === 'energy') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 2 5 13.7h5.4L9.3 22 19 9.8h-5.7L13.2 2Z" /></svg>;
  return <img src={program.icon} alt="" />;
}

const readUser = () => {
  try { return JSON.parse(sessionStorage.getItem('sahyogUser')) || {}; } catch { return {}; }
};

export default function BenefitsGuide() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(() => sessionStorage.getItem('sahyogLanguage') || 'English');
  const text = guideText[language] || guideText.English;
  const translatedPrograms = guideProgramText[language] || guideProgramText.English;
  const changeLanguage = (event) => {
    setLanguage(event.target.value);
    sessionStorage.setItem('sahyogLanguage', event.target.value);
  };
  const user = readUser();
  const name = user.fullName || 'Citizen';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = `${parts[0]?.[0] || 'C'}${parts.length > 1 ? parts[parts.length - 1][0] : ''}`.toUpperCase();

  return (
    <div className="guide-page">
      <header className="guide-header">
        <button className="guide-brand" type="button" onClick={() => navigate('/citizen/dashboard')}><span>S</span><div><strong>Sahyog</strong><small>{text.system}</small></div></button>
        <div className="guide-profile"><span>{initials}</span><div><strong>{name}</strong><small>{text.profile}</small></div></div>
      </header>
      <main className="guide-content">
        <div className="guide-toolbar"><button className="guide-back" type="button" onClick={() => navigate('/citizen/dashboard')}>← {text.back}</button><label><span><strong>{text.language}</strong><small>{text.choose}</small></span><select value={language} onChange={changeLanguage} aria-label={text.language}>{guideLanguages.map((item) => <option key={item}>{item}</option>)}</select></label></div>
        <section className="guide-hero">
          <div><span className="guide-eyebrow">{text.guide}</span><h1>{text.title}</h1><p>{text.intro}</p></div>
          <div className="guide-hero-stat"><strong>5</strong><span>{text.programs}</span></div>
        </section>
        <div className="guide-note"><span>i</span><p><strong>{text.before}</strong> {text.disclaimer}</p></div>
        <div className="guide-programs">
          {programs.map((program) => (
            <article className="guide-program-card" id={program.code} key={program.code} style={{ '--guide-color': program.color }}>
              <div className="guide-program-heading"><span className="guide-program-icon"><GuideIcon program={program} /></span><div><span>{program.code}</span><h2>{program.name} ({program.code})</h2><p>{translatedPrograms[program.code].summary}</p></div></div>
              <div className="guide-rule-section"><h3>{text.qualify}</h3><ul>{translatedPrograms[program.code].rules.map((rule, index) => <li key={`${program.code}-${index}`}><span>{index + 1}</span><p>{rule}</p></li>)}</ul></div>
            </article>
          ))}
        </div>
        <section className="guide-bottom"><div><h2>{text.ready}</h2><p>{text.readyText}</p></div><button type="button" onClick={() => navigate('/citizen/dashboard')}>{text.back} →</button></section>
        <section className="guide-confused"><span className="guide-confused-icon">?</span><div><h2>Still confused about which benefit may suit you?</h2><p>Answer a few optional questions and get a quick, easy-to-understand benefit suggestion.</p></div><button type="button" onClick={() => navigate('/citizen/eligibility-helper')}>Answer a Few Questions →</button></section>
      </main>
      <button className="guide-chatbot" type="button" aria-label="Open benefit eligibility helper" onClick={() => navigate('/citizen/eligibility-helper')}><span className="guide-chat-face">••</span><span>Benefit Help</span></button>
      <footer className="citizen-footer"><span>© 2026 Sahyog · {text.government}</span><span>{text.accessibility} &nbsp; {text.privacy} &nbsp; {text.terms}</span></footer>
    </div>
  );
}
