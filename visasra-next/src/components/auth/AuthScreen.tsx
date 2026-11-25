'use client';

import React, { useState } from 'react';
import type { User } from '@/types/customer';

export interface CountryConfig {
  iso: string;
  country: string;
  code: string;
  flag: string;
  minDigits: number;
  maxDigits: number;
  placeholder: string;
  formatHint: string;
  example: string;
}

export const COUNTRY_CONFIGS: CountryConfig[] = [
  // Primary Indian Diaspora & Global Trade Hubs
  { iso: 'IN', country: 'India', code: '+91', flag: '🇮🇳', minDigits: 10, maxDigits: 10, placeholder: '98765 43210', formatHint: '10 digits', example: '98765 43210' },
  { iso: 'US', country: 'United States', code: '+1', flag: '🇺🇸', minDigits: 10, maxDigits: 10, placeholder: '415 555 0199', formatHint: '10 digits', example: '415 555 0199' },
  { iso: 'AU', country: 'Australia', code: '+61', flag: '🇦🇺', minDigits: 9, maxDigits: 9, placeholder: '412 345 678', formatHint: '9 digits', example: '412 345 678' },
  { iso: 'GB', country: 'United Kingdom', code: '+44', flag: '🇬🇧', minDigits: 10, maxDigits: 10, placeholder: '7123 456789', formatHint: '10 digits', example: '7123 456789' },
  { iso: 'CA', country: 'Canada', code: '+1', flag: '🇨🇦', minDigits: 10, maxDigits: 10, placeholder: '416 555 0199', formatHint: '10 digits', example: '416 555 0199' },
  { iso: 'AE', country: 'UAE', code: '+971', flag: '🇦🇪', minDigits: 9, maxDigits: 9, placeholder: '50 123 4567', formatHint: '9 digits', example: '50 123 4567' },
  { iso: 'SG', country: 'Singapore', code: '+65', flag: '🇸🇬', minDigits: 8, maxDigits: 8, placeholder: '8123 4567', formatHint: '8 digits', example: '8123 4567' },
  { iso: 'SA', country: 'Saudi Arabia', code: '+966', flag: '🇸🇦', minDigits: 9, maxDigits: 9, placeholder: '50 123 4567', formatHint: '9 digits', example: '50 123 4567' },
  { iso: 'QA', country: 'Qatar', code: '+974', flag: '🇶🇦', minDigits: 8, maxDigits: 8, placeholder: '3312 3456', formatHint: '8 digits', example: '3312 3456' },
  { iso: 'NZ', country: 'New Zealand', code: '+64', flag: '🇳🇿', minDigits: 9, maxDigits: 10, placeholder: '21 123 4567', formatHint: '9-10 digits', example: '21 123 4567' },
  { iso: 'MY', country: 'Malaysia', code: '+60', flag: '🇲🇾', minDigits: 9, maxDigits: 10, placeholder: '12 345 6789', formatHint: '9-10 digits', example: '12 345 6789' },
  { iso: 'DE', country: 'Germany', code: '+49', flag: '🇩🇪', minDigits: 10, maxDigits: 11, placeholder: '151 23456789', formatHint: '10-11 digits', example: '151 23456789' },
  { iso: 'FR', country: 'France', code: '+33', flag: '🇫🇷', minDigits: 9, maxDigits: 9, placeholder: '6 12 34 56 78', formatHint: '9 digits', example: '6 12 34 56 78' },
  { iso: 'IE', country: 'Ireland', code: '+353', flag: '🇮🇪', minDigits: 9, maxDigits: 9, placeholder: '85 123 4567', formatHint: '9 digits', example: '85 123 4567' },
  { iso: 'NL', country: 'Netherlands', code: '+31', flag: '🇳🇱', minDigits: 9, maxDigits: 9, placeholder: '6 12345678', formatHint: '9 digits', example: '6 12345678' },
  { iso: 'CH', country: 'Switzerland', code: '+41', flag: '🇨🇭', minDigits: 9, maxDigits: 9, placeholder: '78 123 45 67', formatHint: '9 digits', example: '78 123 45 67' },
  { iso: 'KW', country: 'Kuwait', code: '+965', flag: '🇰🇼', minDigits: 8, maxDigits: 8, placeholder: '9123 4567', formatHint: '8 digits', example: '9123 4567' },
  { iso: 'BH', country: 'Bahrain', code: '+973', flag: '🇧🇭', minDigits: 8, maxDigits: 8, placeholder: '3912 3456', formatHint: '8 digits', example: '3912 3456' },
  { iso: 'OM', country: 'Oman', code: '+968', flag: '🇴🇲', minDigits: 8, maxDigits: 8, placeholder: '9123 4567', formatHint: '8 digits', example: '9123 4567' },
  { iso: 'HK', country: 'Hong Kong', code: '+852', flag: '🇭🇰', minDigits: 8, maxDigits: 8, placeholder: '9123 4567', formatHint: '8 digits', example: '9123 4567' },
  { iso: 'JP', country: 'Japan', code: '+81', flag: '🇯🇵', minDigits: 10, maxDigits: 10, placeholder: '90 1234 5678', formatHint: '10 digits', example: '90 1234 5678' },
  { iso: 'ZA', country: 'South Africa', code: '+27', flag: '🇿🇦', minDigits: 9, maxDigits: 9, placeholder: '71 234 5678', formatHint: '9 digits', example: '71 234 5678' },
];

export const detectCountryFromLocation = (loc: string): string | null => {
  const q = loc.toLowerCase().trim();
  if (!q) return null;
  if (q.includes('india') || q.includes('mumbai') || q.includes('delhi') || q.includes('bangalore') || q.includes('chennai') || q.includes('hyderabad') || q.includes('kolkata') || q.includes('pune') || q.includes('kerala')) return 'IN';
  if (q.includes('uk') || q.includes('united kingdom') || q.includes('london') || q.includes('manchester') || q.includes('birmingham') || q.includes('england') || q.includes('scotland')) return 'GB';
  if (q.includes('australia') || q.includes('sydney') || q.includes('melbourne') || q.includes('brisbane') || q.includes('perth')) return 'AU';
  if (q.includes('usa') || q.includes('united states') || q.includes('america') || q.includes('california') || q.includes('new york') || q.includes('texas')) return 'US';
  if (q.includes('canada') || q.includes('toronto') || q.includes('vancouver') || q.includes('montreal')) return 'CA';
  if (q.includes('uae') || q.includes('dubai') || q.includes('abu dhabi') || q.includes('sharjah') || q.includes('emirates')) return 'AE';
  if (q.includes('singapore')) return 'SG';
  if (q.includes('saudi') || q.includes('riyadh') || q.includes('jeddah')) return 'SA';
  if (q.includes('qatar') || q.includes('doha')) return 'QA';
  if (q.includes('germany') || q.includes('berlin') || q.includes('munich')) return 'DE';
  if (q.includes('france') || q.includes('paris')) return 'FR';
  if (q.includes('new zealand') || q.includes('auckland')) return 'NZ';
  if (q.includes('malaysia') || q.includes('kuala')) return 'MY';
  if (q.includes('ireland') || q.includes('dublin')) return 'IE';
  return null;
};

interface AuthScreenProps {
  onAuthSuccess: (user: User, token?: string, fullPhone?: string) => void;
  showToast: (msg: string) => void;
}

export function AuthScreen({ onAuthSuccess, showToast }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [authMethod, setAuthMethod] = useState<'password' | 'email_otp'>('password');
  const [showPassword, setShowPassword] = useState(false);

  // Sign In State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Sign Up State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupCountryIso, setSignupCountryIso] = useState('IN');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupLocation, setSignupLocation] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupStep, setSignupStep] = useState<'details' | 'verify_email'>('details');
  const [signupOtp, setSignupOtp] = useState('');

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);

  const activeSignupCountry = COUNTRY_CONFIGS.find((c) => c.iso === signupCountryIso) || COUNTRY_CONFIGS[0];

  // Sign In Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMethod === 'email_otp') {
        if (!otpSent) {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'send_email_otp', email: authEmail }),
          });
          const data = await res.json();
          if (res.ok) {
            setOtpSent(true);
            showToast(data.message || `Verification code sent to ${authEmail}. Please check your email.`);
          } else {
            showToast(data.error || 'Failed to send OTP to email');
          }
          setAuthLoading(false);
          return;
        }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, otp: authOtp }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          onAuthSuccess(data.user, data.token);
        } else {
          showToast(data.error || 'Invalid OTP code');
        }
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          onAuthSuccess(data.user, data.token);
        } else {
          showToast(data.error || 'Invalid email or password');
        }
      }
    } catch {
      showToast('Login network error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign Up Step 1: Request Email OTP
  const handleSignUpRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim()) {
      showToast('Please enter your name');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      showToast('Please enter a valid Gmail / Email address');
      return;
    }
    const rawDigits = signupPhone.replace(/\D/g, '');
    if (!rawDigits) {
      showToast('Please enter your mobile number');
      return;
    }
    if (rawDigits.length < activeSignupCountry.minDigits || rawDigits.length > activeSignupCountry.maxDigits) {
      const neededMsg =
        activeSignupCountry.minDigits === activeSignupCountry.maxDigits
          ? `exactly ${activeSignupCountry.minDigits} digits (e.g. ${activeSignupCountry.example})`
          : `between ${activeSignupCountry.minDigits} and ${activeSignupCountry.maxDigits} digits`;
      showToast(`Please enter a valid ${activeSignupCountry.country} mobile number with ${neededMsg}. You entered ${rawDigits.length} digits.`);
      return;
    }
    if (!signupLocation.trim()) {
      showToast('Please enter your delivery location or city');
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }

    setAuthLoading(true);
    try {
      const fullPhone = `${activeSignupCountry.code} ${rawDigits}`;
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_otp',
          name: signupName,
          email: signupEmail,
          phone: fullPhone,
          location: signupLocation,
          password: signupPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSignupStep('verify_email');
        showToast(data.message || `Verification code sent to ${signupEmail}. Please check your email.`);
      } else {
        showToast(data.error || 'Failed to send verification code');
      }
    } catch {
      showToast('Network error during registration');
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign Up Step 2: Verify Code and Create Account
  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupOtp.trim()) {
      showToast('Please enter the verification code sent to your email');
      return;
    }

    setAuthLoading(true);
    try {
      const fullPhone = `${activeSignupCountry.code} ${signupPhone.replace(/\D/g, '')}`;
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_and_create',
          name: signupName,
          email: signupEmail,
          phone: fullPhone,
          location: signupLocation,
          password: signupPassword,
          otp: signupOtp,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onAuthSuccess(data.user, data.token, fullPhone);
      } else {
        showToast(data.error || 'Invalid verification code');
      }
    } catch {
      showToast('Network error verifying code');
    } finally {
      setAuthLoading(false);
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) {
      showToast('Please enter your registered Gmail / Email address');
      return;
    }

    setAuthLoading(true);
    try {
      if (!forgotOtpSent) {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request_otp', email: forgotEmail }),
        });
        const data = await res.json();
        if (res.ok) {
          setForgotOtpSent(true);
          showToast(data.message || `Reset code sent to ${forgotEmail}. Please check your email.`);
        } else {
          showToast(data.error || 'Failed to send reset code');
        }
      } else {
        if (!forgotOtp.trim()) {
          showToast('Please enter the verification code sent to your email');
          setAuthLoading(false);
          return;
        }
        if (!forgotNewPassword || forgotNewPassword.length < 6) {
          showToast('New password must be at least 6 characters');
          setAuthLoading(false);
          return;
        }

        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reset_password',
            email: forgotEmail,
            otp: forgotOtp,
            newPassword: forgotNewPassword,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          showToast('Password updated successfully! You can now sign in.');
          setAuthEmail(forgotEmail);
          setAuthPassword(forgotNewPassword);
          setAuthMode('signin');
          setAuthMethod('password');
          setForgotOtpSent(false);
          setForgotNewPassword('');
          setForgotOtp('');
        } else {
          showToast(data.error || 'Password reset failed');
        }
      }
    } catch {
      showToast('Network error processing password reset');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div id="authScreen" aria-label="Sign in to Visasra">
      <div className="auth-side">
        <div className="auth-brand">
          <img src="/images/logo/visasra-logo.png" alt="" className="auth-logo" />
          <span className="brand-text">Visasra</span>
        </div>
        <div className="auth-side-copy">
          <h1>Shop India,<br />delivered anywhere.</h1>
          <p>Your trusted hands on the ground in India. Verified authentic items sourced live and shipped directly to your door.</p>
          <ul className="auth-points">
            <li>Live store inspections &amp; real-time photo approval</li>
            <li>Official GST store receipts verified</li>
            <li>Direct express courier to anywhere globally</li>
          </ul>
        </div>
        <img className="auth-side-leaves" src="/images/decor/leaves-corner.png" alt="" aria-hidden="true" />
      </div>

      <div className="auth-main">
        <img className="auth-corner-leaves" src="/images/decor/category-corner-leaf.png" alt="" aria-hidden="true" />
        <div className="auth-mobile-brand">
          <img src="/images/logo/visasra-logo.png" alt="" className="auth-logo" />
          <span className="brand-text">Visasra</span>
        </div>

        <div className="auth-card" style={{ maxWidth: 440 }}>
          {/* Top Toggle: Sign In vs Create Account */}
          <div className="auth-segmented-switch">
            <button
              type="button"
              className={`auth-segmented-btn ${authMode === 'signin' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signin');
                setOtpSent(false);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-segmented-btn ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => setAuthMode('signup')}
            >
              Create Account
            </button>
          </div>

          {/* ================= 1. SIGN IN ================= */}
          {authMode === 'signin' && (
            <>
              <h2 className="auth-title" style={{ fontSize: 22, marginBottom: 4 }}>
                {authMethod === 'password' ? 'Sign In' : 'Sign In with OTP'}
              </h2>
              <p className="auth-sub" style={{ fontSize: 13, marginBottom: 16 }}>
                {authMethod === 'password'
                  ? 'Enter your email and password to sign in.'
                  : 'Enter your email to receive a verification code.'}
              </p>

              <form onSubmit={handleAuthSubmit}>
                <div className="field">
                  <label>Email ID or Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="e.g. priya.sharma@example.com or 9876543210"
                  />
                </div>

                {authMethod === 'password' ? (
                  <>
                    <div className="field" style={{ marginTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label>Password</label>
                        <button
                          type="button"
                          className="auth-forgot-link"
                          onClick={() => {
                            setForgotEmail(authEmail);
                            setAuthMode('forgot');
                            setForgotOtpSent(false);
                          }}
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="auth-pass" style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="••••••••"
                          style={{ paddingRight: 42 }}
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748B',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {showPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary auth-submit"
                      style={{ marginTop: 16, width: '100%', padding: '12px' }}
                      disabled={authLoading}
                    >
                      {authLoading ? 'Signing In...' : 'Sign In'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <button
                        type="button"
                        className="auth-switch-link"
                        style={{ fontSize: 12, textDecoration: 'none' }}
                        onClick={() => {
                          setAuthMethod('email_otp');
                          setOtpSent(false);
                        }}
                      >
                        Sign in with Email OTP instead
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {otpSent && (
                      <div className="field" style={{ marginTop: 12 }}>
                        <label>Verification Code</label>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={authOtp}
                          onChange={(e) => setAuthOtp(e.target.value)}
                          placeholder="••••••"
                          style={{ letterSpacing: 4, fontWeight: 700, fontSize: 15, textAlign: 'center' }}
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary auth-submit"
                      style={{ marginTop: 16, width: '100%', padding: '12px' }}
                      disabled={authLoading}
                    >
                      {authLoading ? 'Processing...' : otpSent ? 'Verify & Sign In' : 'Send Code to Email'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: 12 }}>
                      <button
                        type="button"
                        className="auth-switch-link"
                        style={{ fontSize: 12, textDecoration: 'none' }}
                        onClick={() => {
                          setAuthMethod('password');
                          setOtpSent(false);
                        }}
                      >
                        Sign in with Password instead
                      </button>
                    </div>
                  </>
                )}
              </form>
            </>
          )}

          {/* ================= 2. CREATE ACCOUNT ================= */}
          {authMode === 'signup' && (
            <>
              {signupStep === 'details' ? (
                <>
                  <h2 className="auth-title" style={{ fontSize: 22, marginBottom: 4 }}>
                    Create Account
                  </h2>
                  <p className="auth-sub" style={{ fontSize: 13, marginBottom: 16 }}>
                    Enter your details to create your customer account.
                  </p>

                  <form onSubmit={handleSignUpRequestOtp}>
                    <div className="field">
                      <label>Name</label>
                      <input
                        type="text"
                        required
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="Ananya Iyer"
                      />
                    </div>

                    <div className="field" style={{ marginTop: 10 }}>
                      <label>Gmail / Email</label>
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="ananya.iyer@gmail.com"
                      />
                    </div>

                    <div className="field" style={{ marginTop: 10 }}>
                      <label>Mobile Number</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select
                          value={signupCountryIso}
                          onChange={(e) => {
                            const newIso = e.target.value;
                            setSignupCountryIso(newIso);
                            const newCountry = COUNTRY_CONFIGS.find((c) => c.iso === newIso);
                            if (newCountry) {
                              setSignupPhone((prev) => prev.slice(0, newCountry.maxDigits));
                              if (!signupLocation || signupLocation.trim().length <= 3) {
                                setSignupLocation(newCountry.country);
                              }
                            }
                          }}
                          style={{
                            width: '160px',
                            padding: '10px 10px',
                            borderRadius: '12px',
                            border: '1.5px solid var(--border)',
                            background: '#fff',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            color: '#0B192E',
                          }}
                        >
                          {COUNTRY_CONFIGS.map((c) => (
                            <option key={c.iso} value={c.iso}>
                              {c.country} ({c.code})
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          required
                          value={signupPhone}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, activeSignupCountry.maxDigits);
                            setSignupPhone(digits);
                          }}
                          placeholder={activeSignupCountry.placeholder}
                          maxLength={activeSignupCountry.maxDigits}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>

                    <div className="field" style={{ marginTop: 10 }}>
                      <label>Location</label>
                      <input
                        type="text"
                        required
                        value={signupLocation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSignupLocation(val);
                          const detectedIso = detectCountryFromLocation(val);
                          if (detectedIso && detectedIso !== signupCountryIso) {
                            setSignupCountryIso(detectedIso);
                            const c = COUNTRY_CONFIGS.find((cfg) => cfg.iso === detectedIso);
                            if (c) {
                              setSignupPhone((prev) => prev.slice(0, c.maxDigits));
                            }
                          }
                        }}
                        placeholder="City, Country"
                      />
                    </div>

                    <div className="field" style={{ marginTop: 10 }}>
                      <label>Password</label>
                      <div className="auth-pass" style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          autoComplete="new-password"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="••••••••"
                          style={{ paddingRight: 42 }}
                        />
                        <button
                          type="button"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#64748B',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {showPassword ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary auth-submit"
                      style={{ marginTop: 16, width: '100%', padding: '12px' }}
                      disabled={authLoading}
                    >
                      {authLoading ? 'Sending Verification Code...' : 'Continue & Verify Email →'}
                    </button>
                  </form>

                  <div className="auth-switch" style={{ marginTop: 14 }}>
                    <span>Already have an account? </span>
                    <button
                      type="button"
                      className="auth-switch-link"
                      onClick={() => setAuthMode('signin')}
                    >
                      Sign In
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 16, padding: 20 }}>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#EFF6FF', border: '1.5px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: 20 }}>
                      ✉️
                    </div>
                    <h2 className="auth-title" style={{ fontSize: 20, marginBottom: 4 }}>
                      Enter Verification Code
                    </h2>
                    <p className="auth-sub" style={{ fontSize: 13, color: '#475569', marginBottom: 0 }}>
                      We sent a 6-digit code to <b style={{ color: '#0F172A' }}>{signupEmail}</b>. Enter it below to sign in:
                    </p>
                  </div>

                  <form onSubmit={handleVerifySignupOtp}>
                    <div className="field">
                      <label style={{ textAlign: 'center', display: 'block', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                        6-Digit Code
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        autoFocus
                        value={signupOtp}
                        onChange={(e) => setSignupOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="••••••"
                        style={{
                          letterSpacing: 10,
                          fontWeight: 800,
                          fontSize: 22,
                          textAlign: 'center',
                          height: 50,
                          background: '#FFFFFF',
                          borderColor: signupOtp.length === 6 ? '#16A34A' : '#CBD5E1',
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary auth-submit"
                      style={{ marginTop: 16, width: '100%', padding: '13px', fontSize: 14, fontWeight: 700 }}
                      disabled={authLoading}
                    >
                      {authLoading ? 'Verifying...' : '✓ Verify Code & Sign In'}
                    </button>
                  </form>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid #E2E8F0', fontSize: 12.5 }}>
                    <button
                      type="button"
                      className="auth-switch-link"
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', fontWeight: 600 }}
                      onClick={() => setSignupStep('details')}
                    >
                      ← Edit email / phone
                    </button>
                    <button
                      type="button"
                      className="auth-switch-link"
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#0F172A', fontWeight: 700 }}
                      onClick={(e) => handleSignUpRequestOtp(e)}
                    >
                      Resend code ↻
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= 3. FORGOT PASSWORD ================= */}
          {authMode === 'forgot' && (
            <>
              <h2 className="auth-title" style={{ fontSize: 22, marginBottom: 4 }}>
                Reset Password
              </h2>
              <p className="auth-sub" style={{ fontSize: 13, marginBottom: 16 }}>
                Enter your email address to receive a reset code.
              </p>

              <form onSubmit={handleForgotPassword}>
                <div className="field">
                  <label>Email</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@gmail.com"
                  />
                </div>

                {forgotOtpSent && (
                  <>
                    <div className="field" style={{ marginTop: 12 }}>
                      <label>Verification Code</label>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value)}
                        placeholder="123456"
                        style={{ letterSpacing: 4, fontWeight: 700, fontSize: 15, textAlign: 'center' }}
                      />
                    </div>

                    <div className="field" style={{ marginTop: 12 }}>
                      <label>New Password</label>
                      <div className="auth-pass">
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  className="btn btn-primary auth-submit"
                  style={{ marginTop: 16, width: '100%', padding: '12px' }}
                  disabled={authLoading}
                >
                  {authLoading ? 'Verifying...' : forgotOtpSent ? 'Set New Password' : 'Send Reset Code'}
                </button>
              </form>

              <div className="auth-switch" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => {
                    setAuthMode('signin');
                    setForgotOtpSent(false);
                  }}
                >
                  &larr; Back to Sign In
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
