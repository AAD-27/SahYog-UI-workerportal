import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import fspIcon from '../assets/program-icons/fsp.png';
import capIcon from '../assets/program-icons/cap-rupee.png';
import capsIcon from '../assets/program-icons/caps-family.png';
import './CitizenDashboard.css';

const benefits = [
  { id: 'FSP', name: 'Food Support Program', description: 'Food assistance for households with limited financial capacity.', icon: fspIcon, color: '#22a447', status: 'Applications open' },
  { id: 'CAP', name: 'Cash Assistance Program', description: 'Temporary financial support for citizens experiencing hardship.', icon: capIcon, color: '#00897b', status: 'Check eligibility' },
  { id: 'MCARE', name: 'Medical Care Assistance', description: 'Healthcare and medical insurance support for eligible residents.', symbol: 'medical', color: '#2563eb', status: 'Applications open' },
  { id: 'CAPS', name: 'Child Assistance & Protection', description: 'Support for households responsible for young children.', icon: capsIcon, color: '#7c3aed', status: 'Check eligibility' },
  { id: 'EAP', name: 'Energy Assistance Program', description: 'Help with essential electricity, gas, and other utility bills.', symbol: 'energy', color: '#f97316', status: 'Applications open' },
];

function ProgramIcon({ benefit }) {
  if (benefit.symbol === 'medical') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6V4Z" /></svg>;
  if (benefit.symbol === 'energy') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.2 2 5 13.7h5.4L9.3 22 19 9.8h-5.7L13.2 2Z" /></svg>;
  return <img src={benefit.icon} alt="" />;
}

const translations = {
  English: {
    dashboard: 'Dashboard', applications: 'My Applications', help: 'Help & Support', citizenProfile: 'Citizen Profile', logout: 'Log out', citizenDashboard: 'Citizen Dashboard', hello: 'Hello', welcome: 'Welcome to Sahyog', tagline: 'Bringing you the Benefits You Deserve', intro: 'Discover welfare programs, follow your application, and manage your citizen profile from one secure place.', explore: 'Explore Benefits', fivePrograms: '5 welfare programs', onePlatform: 'One simple platform', viewCase: 'View Your Case', trackCase: 'Track status and recent updates', noApplication: 'No active application found', newApplication: 'New Application', applyBenefits: 'Apply for available benefits', changeLanguage: 'Change Language', preferredLanguage: 'Choose your preferred language', governmentPrograms: 'Government welfare programs', benefitsOffer: 'Benefits We Offer', explorePrograms: 'Explore programs designed to support you and your family.', checkEligibility: 'Check My Eligibility', viewDetails: 'View Details', needHelp: 'Need help finding the right benefit?', helpText: 'Answer a few simple questions and Sahyog will help identify programs that may suit your household.', getHelp: 'Get Help', accessibility: 'Accessibility', privacy: 'Privacy', terms: 'Terms of Use', noAssociated: 'No application is currently associated with your citizen profile.', apiPending: 'will be connected when the citizen APIs are available.', governmentIndia: 'Government of India'
  },
  हिन्दी: {
    dashboard: 'डैशबोर्ड', applications: 'मेरे आवेदन', help: 'सहायता और समर्थन', citizenProfile: 'नागरिक प्रोफ़ाइल', logout: 'लॉग आउट', citizenDashboard: 'नागरिक डैशबोर्ड', hello: 'नमस्ते', welcome: 'सहयोग में आपका स्वागत है', tagline: 'आप तक वे लाभ पहुँचाना जिनके आप हकदार हैं', intro: 'कल्याणकारी योजनाएँ खोजें, अपने आवेदन की स्थिति देखें और एक सुरक्षित स्थान से अपनी नागरिक प्रोफ़ाइल प्रबंधित करें।', explore: 'लाभ देखें', fivePrograms: '5 कल्याणकारी योजनाएँ', onePlatform: 'एक सरल मंच', viewCase: 'अपना मामला देखें', trackCase: 'स्थिति और नवीनतम अपडेट देखें', noApplication: 'कोई सक्रिय आवेदन नहीं मिला', newApplication: 'नया आवेदन', applyBenefits: 'उपलब्ध लाभों के लिए आवेदन करें', changeLanguage: 'भाषा बदलें', preferredLanguage: 'अपनी पसंदीदा भाषा चुनें', governmentPrograms: 'सरकारी कल्याणकारी योजनाएँ', benefitsOffer: 'हमारे उपलब्ध लाभ', explorePrograms: 'आप और आपके परिवार के लिए उपलब्ध योजनाएँ देखें।', checkEligibility: 'अपनी पात्रता जाँचें', viewDetails: 'विवरण देखें', needHelp: 'सही लाभ खोजने में सहायता चाहिए?', helpText: 'कुछ सरल प्रश्नों के उत्तर दें और सहयोग आपके परिवार के लिए उपयुक्त योजनाएँ खोजने में मदद करेगा।', getHelp: 'सहायता लें', accessibility: 'सुगम्यता', privacy: 'गोपनीयता', terms: 'उपयोग की शर्तें', noAssociated: 'आपकी नागरिक प्रोफ़ाइल से कोई आवेदन जुड़ा हुआ नहीं है।'
  },
  मराठी: {
    dashboard: 'डॅशबोर्ड', applications: 'माझे अर्ज', help: 'मदत आणि सहाय्य', citizenProfile: 'नागरिक प्रोफाइल', logout: 'बाहेर पडा', citizenDashboard: 'नागरिक डॅशबोर्ड', hello: 'नमस्कार', welcome: 'सहयोगमध्ये आपले स्वागत आहे', tagline: 'तुम्हाला हक्काचे लाभ मिळवून देत आहोत', intro: 'कल्याणकारी योजना शोधा, तुमच्या अर्जाचा मागोवा घ्या आणि एकाच सुरक्षित ठिकाणाहून तुमचे नागरिक प्रोफाइल व्यवस्थापित करा.', explore: 'लाभ पाहा', fivePrograms: '5 कल्याणकारी योजना', onePlatform: 'एक सोपे व्यासपीठ', viewCase: 'तुमचे प्रकरण पाहा', trackCase: 'स्थिती आणि अलीकडील अपडेट पाहा', noApplication: 'कोणताही सक्रिय अर्ज आढळला नाही', newApplication: 'नवीन अर्ज', applyBenefits: 'उपलब्ध लाभांसाठी अर्ज करा', changeLanguage: 'भाषा बदला', preferredLanguage: 'तुमची पसंतीची भाषा निवडा', governmentPrograms: 'शासकीय कल्याणकारी योजना', benefitsOffer: 'आम्ही देत असलेले लाभ', explorePrograms: 'तुमच्यासाठी आणि तुमच्या कुटुंबासाठी तयार केलेल्या योजना पाहा.', checkEligibility: 'माझी पात्रता तपासा', viewDetails: 'तपशील पाहा', needHelp: 'योग्य लाभ शोधण्यासाठी मदत हवी आहे?', helpText: 'काही सोप्या प्रश्नांची उत्तरे द्या आणि सहयोग तुमच्या कुटुंबासाठी योग्य योजना शोधण्यास मदत करेल.', getHelp: 'मदत मिळवा', accessibility: 'सुलभता', privacy: 'गोपनीयता', terms: 'वापराच्या अटी', noAssociated: 'तुमच्या नागरिक प्रोफाइलशी सध्या कोणताही अर्ज जोडलेला नाही.', apiPending: 'नागरिक API उपलब्ध झाल्यावर जोडले जाईल.', governmentIndia: 'भारत सरकार'
  },
  বাংলা: {
    dashboard: 'ড্যাশবোর্ড', applications: 'আমার আবেদন', help: 'সহায়তা ও সমর্থন', citizenProfile: 'নাগরিক প্রোফাইল', logout: 'লগ আউট', citizenDashboard: 'নাগরিক ড্যাশবোর্ড', hello: 'নমস্কার', welcome: 'সহযোগে স্বাগতম', tagline: 'আপনার প্রাপ্য সুবিধা আপনার কাছে পৌঁছে দিচ্ছি', intro: 'কল্যাণমূলক কর্মসূচি খুঁজুন, আবেদন অনুসরণ করুন এবং এক নিরাপদ স্থান থেকে নাগরিক প্রোফাইল পরিচালনা করুন।', explore: 'সুবিধা দেখুন', fivePrograms: '৫টি কল্যাণমূলক কর্মসূচি', onePlatform: 'একটি সহজ প্ল্যাটফর্ম', viewCase: 'আপনার কেস দেখুন', trackCase: 'স্থিতি ও সাম্প্রতিক আপডেট দেখুন', noApplication: 'কোনো সক্রিয় আবেদন পাওয়া যায়নি', newApplication: 'নতুন আবেদন', applyBenefits: 'উপলব্ধ সুবিধার জন্য আবেদন করুন', changeLanguage: 'ভাষা পরিবর্তন করুন', preferredLanguage: 'আপনার পছন্দের ভাষা বেছে নিন', governmentPrograms: 'সরকারি কল্যাণমূলক কর্মসূচি', benefitsOffer: 'আমাদের দেওয়া সুবিধা', explorePrograms: 'আপনার ও পরিবারের সহায়তায় তৈরি কর্মসূচি দেখুন।', checkEligibility: 'আমার যোগ্যতা যাচাই করুন', viewDetails: 'বিস্তারিত দেখুন', needHelp: 'সঠিক সুবিধা খুঁজতে সাহায্য চান?', helpText: 'কয়েকটি সহজ প্রশ্নের উত্তর দিন, সহযোগ আপনার পরিবারের উপযুক্ত কর্মসূচি খুঁজে দেবে।', getHelp: 'সহায়তা নিন', accessibility: 'প্রবেশগম্যতা', privacy: 'গোপনীয়তা', terms: 'ব্যবহারের শর্তাবলি', noAssociated: 'আপনার নাগরিক প্রোফাইলের সঙ্গে কোনো আবেদন যুক্ত নেই।'
  },
  தமிழ்: {
    dashboard: 'முகப்புப்பலகை', applications: 'எனது விண்ணப்பங்கள்', help: 'உதவி மற்றும் ஆதரவு', citizenProfile: 'குடிமகன் சுயவிவரம்', logout: 'வெளியேறு', citizenDashboard: 'குடிமகன் முகப்புப்பலகை', hello: 'வணக்கம்', welcome: 'சஹயோகிற்கு வரவேற்கிறோம்', tagline: 'நீங்கள் பெறத் தகுதியான நலன்களை உங்களிடம் கொண்டு வருகிறோம்', intro: 'நலத்திட்டங்களைக் கண்டறிந்து, விண்ணப்பத்தைப் பின்தொடர்ந்து, ஒரே பாதுகாப்பான இடத்தில் சுயவிவரத்தை நிர்வகிக்கவும்.', explore: 'நலன்களைப் பார்க்கவும்', fivePrograms: '5 நலத்திட்டங்கள்', onePlatform: 'ஒரே எளிய தளம்', viewCase: 'உங்கள் வழக்கைப் பார்க்கவும்', trackCase: 'நிலை மற்றும் சமீபத்திய தகவல்களைப் பார்க்கவும்', noApplication: 'செயலில் உள்ள விண்ணப்பம் இல்லை', newApplication: 'புதிய விண்ணப்பம்', applyBenefits: 'கிடைக்கும் நலன்களுக்கு விண்ணப்பிக்கவும்', changeLanguage: 'மொழியை மாற்றவும்', preferredLanguage: 'விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்', governmentPrograms: 'அரசு நலத்திட்டங்கள்', benefitsOffer: 'நாங்கள் வழங்கும் நலன்கள்', explorePrograms: 'உங்களுக்கும் குடும்பத்திற்கும் உதவும் திட்டங்களைப் பார்க்கவும்.', checkEligibility: 'எனது தகுதியைச் சரிபார்க்கவும்', viewDetails: 'விவரங்களைப் பார்க்கவும்', needHelp: 'சரியான நலனைத் தேர்ந்தெடுக்க உதவி வேண்டுமா?', helpText: 'சில எளிய கேள்விகளுக்குப் பதிலளியுங்கள்; உங்கள் குடும்பத்திற்கான திட்டங்களைக் கண்டறிய சஹயோக் உதவும்.', getHelp: 'உதவி பெறவும்', accessibility: 'அணுகல்தன்மை', privacy: 'தனியுரிமை', terms: 'பயன்பாட்டு விதிமுறைகள்', noAssociated: 'உங்கள் குடிமகன் சுயவிவரத்துடன் எந்த விண்ணப்பமும் இணைக்கப்படவில்லை.'
  },
  తెలుగు: {
    dashboard: 'డ్యాష్‌బోర్డ్', applications: 'నా దరఖాస్తులు', help: 'సహాయం మరియు మద్దతు', citizenProfile: 'పౌర ప్రొఫైల్', logout: 'లాగ్ అవుట్', citizenDashboard: 'పౌర డ్యాష్‌బోర్డ్', hello: 'నమస్కారం', welcome: 'సహయోగ్‌కు స్వాగతం', tagline: 'మీకు అర్హమైన ప్రయోజనాలను మీకు అందిస్తున్నాం', intro: 'సంక్షేమ పథకాలను కనుగొనండి, దరఖాస్తును అనుసరించండి మరియు ఒకే సురక్షిత ప్రదేశం నుండి మీ ప్రొఫైల్‌ను నిర్వహించండి.', explore: 'ప్రయోజనాలను చూడండి', fivePrograms: '5 సంక్షేమ పథకాలు', onePlatform: 'ఒక సులభమైన వేదిక', viewCase: 'మీ కేసును చూడండి', trackCase: 'స్థితి మరియు తాజా సమాచారం చూడండి', noApplication: 'సక్రియ దరఖాస్తు కనుగొనబడలేదు', newApplication: 'కొత్త దరఖాస్తు', applyBenefits: 'అందుబాటులో ఉన్న ప్రయోజనాలకు దరఖాస్తు చేయండి', changeLanguage: 'భాష మార్చండి', preferredLanguage: 'మీకు నచ్చిన భాషను ఎంచుకోండి', governmentPrograms: 'ప్రభుత్వ సంక్షేమ పథకాలు', benefitsOffer: 'మేము అందించే ప్రయోజనాలు', explorePrograms: 'మీకు మరియు మీ కుటుంబానికి సహాయపడే పథకాలను చూడండి.', checkEligibility: 'నా అర్హతను తనిఖీ చేయండి', viewDetails: 'వివరాలు చూడండి', needHelp: 'సరైన ప్రయోజనం కనుగొనడంలో సహాయం కావాలా?', helpText: 'కొన్ని సులభమైన ప్రశ్నలకు సమాధానం ఇవ్వండి; మీ కుటుంబానికి సరిపోయే పథకాలను కనుగొనడంలో సహయోగ్ సహాయం చేస్తుంది.', getHelp: 'సహాయం పొందండి', accessibility: 'ప్రాప్యత', privacy: 'గోప్యత', terms: 'వినియోగ నిబంధనలు', noAssociated: 'మీ పౌర ప్రొఫైల్‌కు ప్రస్తుతం దరఖాస్తు అనుసంధానించబడలేదు.'
  }
};

const languageExtras = {
  English: { apiPending: 'will be connected when the citizen APIs are available.', governmentIndia: 'Government of India' },
  हिन्दी: { apiPending: 'नागरिक API उपलब्ध होने पर जोड़ा जाएगा।', governmentIndia: 'भारत सरकार' },
  मराठी: { apiPending: 'नागरिक API उपलब्ध झाल्यावर जोडले जाईल.', governmentIndia: 'भारत सरकार' },
  বাংলা: { apiPending: 'নাগরিক API উপলব্ধ হলে সংযুক্ত করা হবে।', governmentIndia: 'ভারত সরকার' },
  தமிழ்: { apiPending: 'குடிமகன் API கிடைக்கும்போது இணைக்கப்படும்.', governmentIndia: 'இந்திய அரசு' },
  తెలుగు: { apiPending: 'పౌర API అందుబాటులోకి వచ్చినప్పుడు అనుసంధానించబడుతుంది.', governmentIndia: 'భారత ప్రభుత్వం' }
};

const caseLabels = {
  English: { caseNumber: 'View Your Case', currentModule: 'Current Module', unavailable: 'Not available' },
  हिन्दी: { caseNumber: 'अपना मामला देखें', currentModule: 'वर्तमान मॉड्यूल', unavailable: 'उपलब्ध नहीं' },
  मराठी: { caseNumber: 'तुमचे प्रकरण पाहा', currentModule: 'सध्याचे मॉड्यूल', unavailable: 'उपलब्ध नाही' },
  বাংলা: { caseNumber: 'আপনার কেস দেখুন', currentModule: 'বর্তমান মডিউল', unavailable: 'উপলব্ধ নয়' },
  தமிழ்: { caseNumber: 'உங்கள் வழக்கைப் பார்க்கவும்', currentModule: 'தற்போதைய தொகுதி', unavailable: 'கிடைக்கவில்லை' },
  తెలుగు: { caseNumber: 'మీ కేసును చూడండి', currentModule: 'ప్రస్తుత మాడ్యూల్', unavailable: 'అందుబాటులో లేదు' }
};

export default function CitizenDashboard() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(() => sessionStorage.getItem('sahyogLanguage') || 'English');
  const t = translations[language] || translations.English;
  const extra = languageExtras[language] || languageExtras.English;
  const caseText = caseLabels[language] || caseLabels.English;
  const [notice, setNotice] = useState('');
  const [applicationContext] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('citizenApplicationContext')) || null;
    } catch {
      return null;
    }
  });
  const [citizenUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('sahyogUser')) || {};
    } catch {
      return {};
    }
  });
  const citizenName = citizenUser.fullName || 'Citizen';
  const citizenInitials = citizenName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((_, index, parts) => index === 0 || index === parts.length - 1)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2) || 'C';

  const mockAction = (text) => {
    setNotice(`${text} ${extra.apiPending}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewCase = () => {
    if (!applicationContext?.found) {
      setNotice(t.noAssociated);
      return;
    }
    const arRoutes = {
      AR001: '/application-registration/register-application', AR002: '/application-registration/register-address',
      AR003: '/application-registration/register-person', AR004: '/application-registration/register-program',
      AR005: '/application-registration/review-submit'
    };
    const dcRoutes = {
      DC001: '/data-collection/initiate-data-collection', DC002: '/data-collection/applicant-details',
      DC003: '/data-collection/address-details', DC004: '/data-collection/person-summary',
      DC005: '/data-collection/person-information', DC006: '/data-collection/program-details',
      DC007: '/data-collection/income-summary', DC008: '/data-collection/income-details',
      DC009: '/data-collection/expense-summary', DC010: '/data-collection/expense-details',
      DC011: '/data-collection/resource-summary', DC012: '/data-collection/resource-details',
      DC013: '/data-collection/disability-summary', DC014: '/data-collection/disability-details'
    };
    const moduleCode = String(applicationContext.currentModule || '').toUpperCase();
    const pageId = String(applicationContext.currentPageId || '').toUpperCase();
    const destination = moduleCode === 'AR'
      ? (arRoutes[pageId] || arRoutes.AR001)
      : moduleCode === 'DC'
        ? (dcRoutes[pageId] || dcRoutes.DC001)
        : null;
    if (!destination) {
      setNotice(`The ${applicationContext.currentModuleName || moduleCode || 'requested'} module is not available in the citizen portal yet.`);
      return;
    }
    sessionStorage.setItem('citizenReadOnlyMode', 'true');
    navigate(destination);
  };

  return (
    <div className="citizen-page">
      <header className="citizen-header">
        <button className="citizen-brand" type="button" onClick={() => navigate('/citizen/dashboard')}>
          <span className="citizen-brand-mark">S</span>
          <span><strong>Sahyog</strong><small>Citizen Welfare Eligibility System</small></span>
        </button>
        <nav className="citizen-nav" aria-label="Citizen navigation">
          <button className="active" type="button">{t.dashboard}</button>
          <button type="button" onClick={handleViewCase}>{t.applications}</button>
          <button type="button" onClick={() => navigate('/citizen/benefits-guide')}>{t.help}</button>
        </nav>
        <div className="citizen-profile">
          <span className="citizen-avatar">{citizenInitials}</span>
          <span><strong>{citizenName}</strong><small>{t.citizenProfile}</small></span>
          <button type="button" aria-label={t.logout} onClick={() => { sessionStorage.clear(); navigate('/login'); }}>{t.logout}</button>
        </div>
      </header>

      <main className="citizen-content">
        {notice && <div className="citizen-notice" role="status">{notice}<button type="button" onClick={() => setNotice('')}>×</button></div>}

        <section className="citizen-hero">
          <div>
            <span className="citizen-eyebrow">{t.citizenDashboard}</span>
            <h1>{t.hello}, {citizenName.split(' ')[0]}!</h1>
            <h2>{t.welcome}</h2>
            <p className="citizen-tagline">{t.tagline}</p>
            <p className="citizen-intro">{t.intro}</p>
            <button type="button" onClick={() => document.getElementById('benefits').scrollIntoView({ behavior: 'smooth' })}>{t.explore} <span>→</span></button>
          </div>
          <div className="citizen-hero-art" aria-hidden="true">
            <div className="citizen-art-orbit" aria-label="Sahyog">
              <span className="citizen-hero-logo">S</span>
              <span className="citizen-hero-brand"><strong>Sahyog</strong><small>Citizen Welfare Platform</small></span>
              <span className="citizen-brand-status">● Secure access</span>
            </div>
            <div className="citizen-art-card"><span>✓</span><strong>{t.fivePrograms}</strong><small>{t.onePlatform}</small></div>
            <div className="citizen-art-secure"><span>◇</span> Simple · Secure · Inclusive</div>
          </div>
        </section>

        <section className="citizen-quick-actions" aria-label="Quick actions">
          <button type="button" onClick={handleViewCase}><span className="quick-icon blue">#</span><span><strong>{caseText.caseNumber}</strong><small>{applicationContext?.caseNumber || applicationContext?.applicationNumber || caseText.unavailable}</small></span><b>→</b></button>
          <button type="button" onClick={handleViewCase}><span className="quick-icon green">▦</span><span><strong>{caseText.currentModule}</strong><small>{applicationContext?.currentModuleName || applicationContext?.currentModule || caseText.unavailable}</small></span><b>→</b></button>
          <div className="citizen-language"><span className="quick-icon violet">文</span><span><strong>{t.changeLanguage}</strong><small>{t.preferredLanguage}</small></span><select value={language} onChange={(event) => { setLanguage(event.target.value); sessionStorage.setItem('sahyogLanguage', event.target.value); }} aria-label={t.changeLanguage}><option>English</option><option>हिन्दी</option><option>मराठी</option><option>বাংলা</option><option>தமிழ்</option><option>తెలుగు</option></select></div>
        </section>

        <section className="citizen-benefits" id="benefits">
          <div className="citizen-section-heading">
            <div><span>{t.governmentPrograms}</span><h2>{t.benefitsOffer}</h2><p>{t.explorePrograms}</p></div>
            <button type="button" onClick={() => mockAction(t.checkEligibility)}>{t.checkEligibility} →</button>
          </div>
          <div className="citizen-benefit-grid">
            {benefits.map((benefit) => (
              <article className="citizen-benefit-card" key={benefit.id} style={{ '--program-color': benefit.color }}>
                <div className="citizen-benefit-top"><span className="citizen-program-icon"><ProgramIcon benefit={benefit} /></span><span className="citizen-program-code">{benefit.id}</span></div>
                <h3>{benefit.name}</h3>
                <p>{benefit.description}</p>
                <div className="citizen-benefit-bottom"><span>● {benefit.status}</span><button type="button" onClick={() => mockAction(benefit.name)}>{t.viewDetails} →</button></div>
              </article>
            ))}
          </div>
        </section>

        <section className="citizen-help-card">
          <div><span>?</span><div><h2>{t.needHelp}</h2><p>{t.helpText}</p></div></div>
          <button type="button" onClick={() => navigate('/citizen/benefits-guide')}>{t.getHelp}</button>
        </section>
      </main>
      <footer className="citizen-footer"><span>© 2026 Sahyog · {extra.governmentIndia}</span><span>{t.accessibility} &nbsp; {t.privacy} &nbsp; {t.terms}</span></footer>
    </div>
  );
}
