import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppRegLayout from './app-reg/AppRegLayout';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/application-registration/register-application" replace />} />
        <Route path="/application-registration/*" element={<AppRegLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
