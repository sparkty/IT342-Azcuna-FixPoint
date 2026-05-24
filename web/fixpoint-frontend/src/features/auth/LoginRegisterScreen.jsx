import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../shared/api/api';
import './LoginRegisterScreen.css';
import Sidebar from '../../shared/components/Sidebar';
import { GoogleLogin } from '@react-oauth/google';
import TopNav from '../../shared/components/TopNav';

const LoginRegisterScreen = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({ email: '', password: '' });

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


  const handleForgotPassword = () => console.log('Forgot password clicked');

  const switchTab = (tab) => {
  setActiveTab(tab);
  setError('');
  setSuccess('');

  // Clear form errors
  setLoginErrors({ email: '', password: '' });
  setRegisterErrors({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' });

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

                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    setLoading(true);
                    setError('');
                    try {
                      const res = await authService.googleLogin(credentialResponse.credential);
                      const { accessToken, refreshToken, user } = res.data.data;
                      localStorage.setItem('accessToken', accessToken);
                      localStorage.setItem('refreshToken', refreshToken);
                      localStorage.setItem('user', JSON.stringify(user));
                      navigate('/dashboard');
                    } catch (err) {
                      setError('Google login failed. Please try again.');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  onError={() => setError('Google login was cancelled or failed.')}
                  width="100%"
                  theme="filled_black"
                  text="continue_with"
                  locale="en"
                />
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