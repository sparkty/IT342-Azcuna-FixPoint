import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import { ToastProvider } from './shared/components/Toast.jsx';
import './index.css';
import './features/auth/LoginRegisterScreen.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="137768996007-u3m30t8rqg8dpaf7459es07v6vf673j8.apps.googleusercontent.com">
      <ToastProvider>
        <App />
      </ToastProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
