import React from 'react';
import { Navigate } from 'react-router-dom';
import { clearAuthState, isStoredAuthValid } from '../api/api';

const ProtectedRoute = ({ children }) => {
  if (!isStoredAuthValid()) {
    clearAuthState();
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
