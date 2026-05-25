import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../shared/api/api';
import './LoginRegisterScreen.css';
import Sidebar from '../../shared/components/Sidebar';
import { useGoogleLogin } from '@react-oauth/google';
import TopNav from '../../shared/components/TopNav';

const LoginRegisterScreen = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const resetToken = new URLSearchParams(window.location.search).get('resetToken');
    if (resetToken) {
      setActiveTab('reset');
      setResetForm(prev => ({ ...prev, token: resetToken }));
      return;
    }

    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');
    if (token && user) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const googleLogin = useGoogleLogin({
  onSuccess: async (tokenResponse) => {
      setLoading(true);
      setError('');
      try {
        const res = await authService.googleLogin(tokenResponse.access_token);
        const { accessToken, refreshToken, user } = res.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/dashboard');
      } catch (err) {
        console.error('Google OAuth API error details:', err.response?.data || err.message);
        const apiErrorMsg = err.response?.data?.error?.message;
        setError(apiErrorMsg ? `Google login failed: ${apiErrorMsg}` : 'Google login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: (err) => {
      console.error('Google OAuth error:', err);
      setError('Google login was cancelled or failed.');
    },
    flow: 'implicit',
    ux_mode: 'popup',   // explicitly force popup (not redirect)
  });

  const handleGoogleClick = () => {
    console.log('Google button clicked — launching OAuth...');
    googleLogin();
  };

  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({ email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailError, setForgotEmailError] = useState('');
  const [resetForm, setResetForm] = useState({ token: '', password: '', confirmPassword: '' });
  const [resetErrors, setResetErrors] = useState({ password: '', confirmPassword: '' });

  const [registerForm, setRegisterForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [registerErrors, setRegisterErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // ── Login Validation ──────────────────────────────────────
  const validateLogin = () => {
    const errors = { email: '', password: '' };
    let valid = true;

    if (!loginForm.email) {
      errors.email = 'Email is required.';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(loginForm.email)) {
      errors.email = 'Enter a valid email address.';
      valid = false;
    }

    if (!loginForm.password) {
      errors.password = 'Password is required.';
      valid = false;
    }

    setLoginErrors(errors);
    return valid;
  };

  // ── Register Validation ───────────────────────────────────
  const validateRegister = () => {
    const errors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    let valid = true;

    if (!registerForm.firstName.trim()) {
      errors.firstName = 'First name is required.';
      valid = false;
    }

    if (!registerForm.lastName.trim()) {
      errors.lastName = 'Last name is required.';
      valid = false;
    }

    if (!registerForm.email) {
      errors.email = 'Email is required.';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(registerForm.email)) {
      errors.email = 'Enter a valid email address.';
      valid = false;
    }

    if (!registerForm.password) {
      errors.password = 'Password is required.';
      valid = false;
    } else if (registerForm.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
      valid = false;
    }

    if (!registerForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
      valid = false;
    } else if (registerForm.password !== registerForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
      valid = false;
    }

    setRegisterErrors(errors);
    return valid;
  };

  // ── Handlers ─────────────────────────────────────────────
  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    setLoginErrors({ ...loginErrors, [e.target.name]: '' });
    setError('');
  };

  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
    setRegisterErrors({ ...registerErrors, [e.target.name]: '' });
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setLoading(true);
    setError('');
    try {
      const res = await authService.login({
        email: loginForm.email,
        password: loginForm.password,
      });
      const { accessToken, refreshToken, user } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await authService.register({
        email: registerForm.email,
        password: registerForm.password,
        firstname: registerForm.firstName,
        lastname: registerForm.lastName,
      });
      const { accessToken, refreshToken, user } = res.data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      setSuccess('Account created! Please sign in.');
      setTimeout(() => {
        switchTab('login');
        setSuccess('');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };


  const handleForgotPassword = () => {
    setActiveTab('forgot');
    setForgotEmail(loginForm.email);
    setError('');
    setSuccess('');
    setForgotEmailError('');
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!forgotEmail) {
      setForgotEmailError('Email is required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(forgotEmail)) {
      setForgotEmailError('Enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword(forgotEmail);
      setSuccess('If that email exists, a reset link has been sent.');
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Failed to send reset link. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChange = (e) => {
    setResetForm({ ...resetForm, [e.target.name]: e.target.value });
    setResetErrors({ ...resetErrors, [e.target.name]: '' });
    setError('');
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    const errors = { password: '', confirmPassword: '' };

    if (!resetForm.password) {
      errors.password = 'Password is required.';
    } else if (resetForm.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (!resetForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password.';
    } else if (resetForm.password !== resetForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setResetErrors(errors);
    if (errors.password || errors.confirmPassword) return;

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await authService.resetPassword({ token: resetForm.token, password: resetForm.password });
      setSuccess('Password reset successfully. Please sign in.');
      window.history.replaceState({}, document.title, window.location.pathname);
      setResetForm({ token: '', password: '', confirmPassword: '' });
      setTimeout(() => switchTab('login'), 1200);
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Reset link is invalid or expired.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
  setActiveTab(tab);
  setError('');
  setSuccess('');

  // Clear form errors
  setLoginErrors({ email: '', password: '' });
  setRegisterErrors({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });
  setForgotEmailError('');
  setResetErrors({ password: '', confirmPassword: '' });

  // Clear form inputs
  if (tab === 'login') {
    setLoginForm({ email: '', password: '' });
  } else if (tab === 'register') {
    setRegisterForm({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  } else if (tab === 'forgot') {
    setForgotEmail('');
  } else if (tab === 'reset') {
    setResetForm({ token: resetForm.token, password: '', confirmPassword: '' });
  }
};

  return (
    <div className="login-screen-container">
      <nav className="top-nav">
          <TopNav />
        </nav>

      <div className="content">
        <div className="auth-screen">

          {/* Left Panel */}
          <div className="auth-left">
            <div className="auth-brand">FIX_POINT</div>
            <div className="auth-tagline">
              Secure, centralized issue tracking for your organization.
            </div>
            <div className="auth-features">
              <div className="auth-feature">
                <div className="auth-feature-icon">🔐</div>
                <div className="auth-feature-text">JWT Authentication & BCrypt encryption</div>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon">🔔</div>
                <div className="auth-feature-text">Email notifications on status changes</div>
              </div>
              <div className="auth-feature">
                <div className="auth-feature-icon">🛡️</div>
                <div className="auth-feature-text">Role-based access control (Admin / User)</div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="auth-right">

            <div className="auth-tab-switcher">
              <button
                className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => switchTab('login')}
              >
                LOGIN
              </button>
              <button
                className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => switchTab('register')}
              >
                REGISTER
              </button>
            </div>

            {error && <div className="alert alert-error">⚠ {error}</div>}
            {success && <div className="alert alert-success">✓ {success}</div>}

            {/* Login Form */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="auth-form" autoComplete="off">
                <div className="auth-form-title">Welcome back</div>
                <div className="auth-form-sub">Sign in to your FixPoint account.</div>

                <div className="form-group">
                  <label className="form-label">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="off"
                    className={`form-input ${loginErrors.email ? 'input-error' : ''}`}
                    placeholder="you@example.com"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                  />
                  {loginErrors.email && <span className="field-error">{loginErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">PASSWORD</label>
                  <input
                    type="password"
                    name="password"
                    autoComplete="off"
                    className={`form-input ${loginErrors.password ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    value={loginForm.password}
                    onChange={handleLoginChange}
                  />
                  {loginErrors.password && <span className="field-error">{loginErrors.password}</span>}
                </div>

                <div className="forgot-password">
                  <button type="button" onClick={handleForgotPassword} className="forgot-link">
                    Forgot password?
                  </button>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'SIGNING IN...' : 'SIGN IN →'}
                </button>

                <div className="auth-divider">or continue with</div>

                <button
                  type="button"
                  className="btn-oauth-google"
                  onClick={handleGoogleClick}
                  disabled={loading}
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Continue with Google
                </button>
              </form>
            )}

            {activeTab === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="auth-form" autoComplete="off">
                <div className="auth-form-title">Reset password</div>
                <div className="auth-form-sub">Enter your account email and we'll send a reset link.</div>

                <div className="form-group">
                  <label className="form-label">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    className={`form-input ${forgotEmailError ? 'input-error' : ''}`}
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value);
                      setForgotEmailError('');
                      setError('');
                    }}
                  />
                  {forgotEmailError && <span className="field-error">{forgotEmailError}</span>}
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'SENDING...' : 'SEND RESET LINK'}
                </button>

                <button type="button" className="btn-secondary" onClick={() => switchTab('login')} disabled={loading}>
                  BACK TO SIGN IN
                </button>
              </form>
            )}

            {activeTab === 'reset' && (
              <form onSubmit={handleResetSubmit} className="auth-form" autoComplete="off">
                <div className="auth-form-title">Choose new password</div>
                <div className="auth-form-sub">Enter a new password for your FixPoint account.</div>

                <div className="form-group">
                  <label className="form-label">NEW PASSWORD</label>
                  <input
                    type="password"
                    name="password"
                    className={`form-input ${resetErrors.password ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    value={resetForm.password}
                    onChange={handleResetChange}
                  />
                  {resetErrors.password && <span className="field-error">{resetErrors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">CONFIRM NEW PASSWORD</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    className={`form-input ${resetErrors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    value={resetForm.confirmPassword}
                    onChange={handleResetChange}
                  />
                  {resetErrors.confirmPassword && <span className="field-error">{resetErrors.confirmPassword}</span>}
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'RESETTING...' : 'RESET PASSWORD'}
                </button>

                <button type="button" className="btn-secondary" onClick={() => switchTab('login')} disabled={loading}>
                  BACK TO SIGN IN
                </button>
              </form>
            )}

            {/* Register Form */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="auth-form" autoComplete="off">
                <div className="auth-form-title">Create account</div>
                <div className="auth-form-sub">Join FixPoint — it's free and secure.</div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">FIRST NAME</label>
                    <input
                      type="text"
                      name="firstName"
                      className={`form-input ${registerErrors.firstName ? 'input-error' : ''}`}
                      placeholder="FirstName"
                      value={registerForm.firstName}
                      onChange={handleRegisterChange}
                    />
                    {registerErrors.firstName && <span className="field-error">{registerErrors.firstName}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">LAST NAME</label>
                    <input
                      type="text"
                      name="lastName"
                      className={`form-input ${registerErrors.lastName ? 'input-error' : ''}`}
                      placeholder="LastName"
                      value={registerForm.lastName}
                      onChange={handleRegisterChange}
                    />
                    {registerErrors.lastName && <span className="field-error">{registerErrors.lastName}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="off"
                    className={`form-input ${registerErrors.email ? 'input-error' : ''}`}
                    placeholder="you@example.com"
                    value={registerForm.email}
                    onChange={handleRegisterChange}
                  />
                  {registerErrors.email && <span className="field-error">{registerErrors.email}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    name="password"
                    autoComplete="off"
                    className={`form-input ${registerErrors.password ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                  />
                  <div className="password-tooltip">
                    <div className="tooltip-title">PASSWORD REQUIREMENTS</div>
                    <ul className="tooltip-list">
                      <li>At least 8 characters</li>
                    </ul>
                  </div>
                  {registerErrors.password && <span className="field-error">{registerErrors.password}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">CONFIRM PASSWORD</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    autoComplete="off"
                    className={`form-input ${registerErrors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="••••••••"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                  />
                  {registerErrors.confirmPassword && <span className="field-error">{registerErrors.confirmPassword}</span>}
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT →'}
                </button>

                <div className="email-notice">
                  A welcome email will be sent upon registration.
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRegisterScreen;
