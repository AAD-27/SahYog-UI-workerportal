import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppRegLayout from './app-reg/AppRegLayout';
import DataCollectionLayout from './data-collection/DataCollectionLayout';
import LoginPage from './pages/LoginPage';
import CitizenDashboard from './pages/CitizenDashboard';
import BenefitsGuide from './pages/BenefitsGuide';
import EligibilityHelper from './pages/EligibilityHelper';
import EligibilityDeterminationLayout from './eligibility-determination/EligibilityDeterminationLayout';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
        <Route path="/citizen/benefits-guide" element={<BenefitsGuide />} />
        <Route path="/citizen/eligibility-helper" element={<EligibilityHelper />} />
        <Route path="/application-registration/*" element={<AppRegLayout />} />
        <Route path="/data-collection/*" element={<DataCollectionLayout />} />
        <Route path="/eligibility-determination/*" element={<EligibilityDeterminationLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
