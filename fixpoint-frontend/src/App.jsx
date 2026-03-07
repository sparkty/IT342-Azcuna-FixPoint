import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginRegisterScreen from './pages/LoginRegisterScreen.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginRegisterScreen />} />
        <Route path="/dashboard" element={<div style={{color:'white',padding:'40px',background:'#0d0f12',minHeight:'100vh'}}>Dashboard coming soon</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;