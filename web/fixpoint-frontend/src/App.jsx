import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginRegisterScreen from './features/auth/LoginRegisterScreen.jsx';
import DashboardScreen from './features/issues/DashboardScreen.jsx';
import CreateIssueScreen from './features/issues/CreateIssueScreen.jsx';
import IssueDetailScreen from './features/issues/IssueDetailScreen.jsx';
import NotificationsScreen from './features/notifications/NotificationsScreen.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginRegisterScreen />} />
        <Route path="/dashboard" element={<DashboardScreen/>} />
        <Route path="/create-issue" element={<CreateIssueScreen />} />
        <Route path="/issue/:id" element={<IssueDetailScreen />} />
        <Route path="/notifications" element={<NotificationsScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;