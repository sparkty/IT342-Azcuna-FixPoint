import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginRegisterScreen from './features/auth/LoginRegisterScreen.jsx';
import DashboardScreen from './features/issues/DashboardScreen.jsx';
import CreateIssueScreen from './features/issues/CreateIssueScreen.jsx';
import IssueDetailScreen from './features/issues/IssueDetailScreen.jsx';
import NotificationsScreen from './features/notifications/NotificationsScreen.jsx';
import ProtectedRoute from './shared/components/ProtectedRoute.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginRegisterScreen />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardScreen />
          </ProtectedRoute>
        } />
        <Route path="/create-issue" element={
          <ProtectedRoute>
            <CreateIssueScreen />
          </ProtectedRoute>
        } />
        <Route path="/issue/:id" element={
          <ProtectedRoute>
            <IssueDetailScreen />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <NotificationsScreen />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;