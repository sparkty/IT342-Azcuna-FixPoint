import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    // User is not authenticated, redirect to login
    return <Navigate to="/" replace />;
  }

  // User is authenticated, render the protected component
  return children;
};

export default ProtectedRoute;
