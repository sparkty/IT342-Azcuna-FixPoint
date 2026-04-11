import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginRegisterScreen from './pages/LoginRegisterScreen.jsx';
import CreateIssueScreen from './pages/CreateIssueScreen';
import DashboardScreen from './pages/DashboardScreen.jsx';
import IssueDetailScreen from './pages/IssueDetailScreen.jsx';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginRegisterScreen />} />
        <Route path="/dashboard" element={<DashboardScreen/>} />
        <Route path="/create-issue" element={<CreateIssueScreen />} />
        <Route path="/issue/:id" element={<IssueDetailScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;