import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiMail,
  HiExclamationCircle,
  HiCheckCircle,
  HiArrowLeft,
  HiLockClosed,
  HiRefresh,
  HiSun,
  HiMoon,
} from 'react-icons/hi';
import { HiEye, HiEyeSlash } from 'react-icons/hi2';
import './ForgotPassword.css';
import MailSLALogo from '../../assets/telexlogo.webp';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SLIDES = [
  {
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2.5" fill="currentColor" fillOpacity="0.08"/>
        <path d="M2 7.5 L12 13.5 L22 7.5" />
        <line x1="2" y1="19" x2="8" y2="13.5"/>
        <line x1="22" y1="19" x2="16" y2="13.5"/>
      </svg>
    ),
    title: 'Secure Account Recovery',
    sub:   'Your identity is protected with a time-limited one-time code — no reset happens without you.',
  },
  {
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    title: 'Your Data Stays Safe',
    sub:   'End-to-end encrypted recovery flow. Only you can access your Email SLA Tracker account.',
  },
  {
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12,6 12,12 16,14"/>
      </svg>
    ),
    title: 'Back in Under a Minute',
    sub:   'Verify your email, enter your OTP, and set a fresh password — done in three easy steps.',
  },
];

/* ── Animated Envelope Illustration ── */
const EnvelopeIllustration = () => (
  <div className="lg-envelope-scene" aria-hidden="true">
    <div className="lg-ripple lg-ripple-1" />
    <div className="lg-ripple lg-ripple-2" />
    <div className="lg-ripple lg-ripple-3" />

    <div className="lg-float-card lg-float-card-left">
      <div className="lg-fc-from">from: support@mailsla.com</div>
      <div className="lg-fc-subject">Password Reset OTP</div>
      <div className="lg-fc-sla">
        <span className="lg-fc-dot lg-fc-dot-warn" />
        <span>Expires in 10 min</span>
      </div>
    </div>

    <div className="lg-float-card lg-float-card-right">
      <div className="lg-fc-from">Security</div>
      <div className="lg-fc-status">
        <span className="lg-fc-dot lg-fc-dot-ok" />
        <span className="lg-fc-ok-text">Verified</span>
      </div>
      <div className="lg-fc-from" style={{ marginTop: 3 }}>OTP secured</div>
    </div>

    <div className="lg-envelope-wrap">
      <div className="lg-env-body">
        <svg className="lg-env-flap" viewBox="0 0 210 92" xmlns="http://www.w3.org/2000/svg">
          <polygon points="0,0 105,68 210,0" />
        </svg>
        <div className="lg-env-fold" />
      </div>

      <div className="lg-letter">
        <div className="lg-letter-line lg-letter-line-1" />
        <div className="lg-letter-line lg-letter-line-2" />
        <div className="lg-letter-line lg-letter-line-3" />
        <div className="lg-letter-dots">
          <span className="lg-ldot lg-ldot-1" />
          <span className="lg-ldot lg-ldot-2" />
          <span className="lg-ldot lg-ldot-3" />
        </div>
      </div>

      <div className="lg-notif-badge">!</div>
    </div>

    <div className="lg-scene-label">EMAIL SLA TRACKER</div>
  </div>
);

/* ═══════════════════════════════════════ */
const ForgotPassword = () => {
  const [step,        setStep]        = useState(1);
  const [email,       setEmail]       = useState('');
  const [otp,         setOtp]         = useState(['', '', '', '', '', '']);
  const [password,    setPassword]    = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [loading,     setLoading]     = useState(false);
  const [countdown,   setCountdown]   = useState(0);

  // ── Cloudflare Turnstile ──
  const [captchaToken, setCaptchaToken] = useState('');
  const turnstileRef = useRef(null);
  const widgetIdRef  = useRef(null);

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('fp-theme') !== 'light'
  );

  const [slideIdx, setSlideIdx] = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  const slideIdxRef = useRef(0);

  const otpRefs  = useRef([]);
  const navigate = useNavigate();

  const toggleTheme = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('fp-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // ── Turnstile script loader — same pattern as Login.js ──
  useEffect(() => {
    window.onTurnstileLoad = () => {
      if (!turnstileRef.current || widgetIdRef.current !== null) return;
      try {
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey:            process.env.REACT_APP_TURNSTILE_SITE_KEY,
          appearance:         'always',
          theme:              'light',
          callback:           (token) => setCaptchaToken(token),
          'expired-callback': ()      => setCaptchaToken(''),
          'error-callback':   ()      => { setCaptchaToken(''); setError('CAPTCHA error. Please try again.'); },
        });
      } catch (e) { console.error('Turnstile render error:', e); }
    };

    if (!document.getElementById('cf-turnstile-script')) {
      const s = document.createElement('script');
      s.id    = 'cf-turnstile-script';
      s.src   = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    } else if (window.turnstile) {
      window.onTurnstileLoad();
    }

    return () => {
      try {
        if (widgetIdRef.current !== null && window.turnstile)
          window.turnstile.remove(widgetIdRef.current);
      } catch (_) {}
      widgetIdRef.current = null;
      delete window.onTurnstileLoad;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetCaptcha = () => {
    setCaptchaToken('');
    try {
      if (widgetIdRef.current !== null && window.turnstile)
        window.turnstile.reset(widgetIdRef.current);
    } catch (_) {}
  };

  // ── Auto-slider ──
  useEffect(() => {
    const id = setInterval(() => {
      const next = (slideIdxRef.current + 1) % SLIDES.length;
      slideIdxRef.current = next;
      setSlideIdx(next);
      setSlideKey(k => k + 1);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const goSlide = (i) => {
    slideIdxRef.current = i;
    setSlideIdx(i);
    setSlideKey(k => k + 1);
  };

  // ── Resend countdown ──
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // ── Step 1: Send OTP ──
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.'); return;
    }
    if (!captchaToken) { setError('Please complete the CAPTCHA verification.'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to send OTP.'); resetCaptcha(); return; }
      resetCaptcha();
      setSuccess('OTP sent! Check your email.');
      setCountdown(60);
      setTimeout(() => {
        setSuccess('');
        setStep(2);
        setTimeout(() => otpRefs.current[0] && otpRefs.current[0].focus(), 100);
      }, 1500);
    } catch {
      setError('Network error. Please try again.');
      resetCaptcha();
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: OTP handlers ──
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError('');
    if (value && index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0 && otpRefs.current[index - 1]) {
      otpRefs.current[index - 1].focus();
    }
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) return;
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next   = [...otp];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    const last = Math.min(pasted.length, 5);
    if (otpRefs.current[last]) otpRefs.current[last].focus();
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    const val = otp.join('');
    if (val.length < 6) { setError('Please enter the complete 6-digit OTP.'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/verify-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), otp: val }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Invalid OTP.'); return; }
      setSuccess('OTP verified!');
      setTimeout(() => { setSuccess(''); setStep(3); }, 1200);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setError('');
    setOtp(['', '', '', '', '', '']);
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to resend.'); return; }
      setSuccess('New OTP sent!');
      setCountdown(60);
      setTimeout(() => setSuccess(''), 2000);
      setTimeout(() => { if (otpRefs.current[0]) otpRefs.current[0].focus(); }, 100);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset password ──
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!password)               { setError('Password is required.'); return; }
    if (password.length < 8)     { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPwd) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          email:           email.trim(),
          password:        password,
          confirmPassword: confirmPwd,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Failed to reset password.'); return; }
      setSuccess('Password reset successfully! Redirecting...');
      setTimeout(() => navigate('/admin/login'), 2500);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const slide = SLIDES[slideIdx];

  return (
    <div className={`fp-page ${darkMode ? 'fp-dark-page' : 'fp-light-page'}`}>

      {/* ── Animated background ── */}
      <div className="fp-page-bg-mesh" />
      <div className="fp-page-bg-grid" />
      <div className="fp-orb fp-orb-1" />
      <div className="fp-orb fp-orb-2" />

      {/* ══════════════════════════
          LEFT PANEL — illustration
      ══════════════════════════ */}
      <div className="fp-left-panel">
        <div className="fp-left-flame" />
        <div className="fp-left-glow" />

        <div className="fp-left-content">

          <div key={slideKey} className="fp-slide-block">
            <div className="fp-slide-icon">{slide.icon}</div>
            <h1>{slide.title}</h1>
            <p className="fp-left-sub">{slide.sub}</p>
          </div>

          <EnvelopeIllustration />

          <div className="fp-dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`fp-dot${slideIdx === i ? ' active' : ''}`}
                onClick={() => goSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

        </div>
      </div>

      {/* ══════════════════════════
          RIGHT PANEL — form
      ══════════════════════════ */}
      <div className={`fp-card ${darkMode ? 'fp-dark' : 'fp-light'}`}>

        <button
          className="fp-theme-btn"
          onClick={toggleTheme}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <HiSun size={17} /> : <HiMoon size={17} />}
        </button>

        <div className="fp-logo" />

        <div className="fp-card-inner">

          <div className="fp-card-logo-row">
            <img src={MailSLALogo} alt="Email SLA Tracker" />
            <div className="fp-card-logo-text">
              <strong>Email SLA Tracker</strong>
            </div>
          </div>

          <div className="fp-steps">
            {['Email', 'Verify OTP', 'New Password'].map((label, i) => (
              <React.Fragment key={i}>
                <div className={`fp-step ${step > i + 1 ? 'done' : ''} ${step === i + 1 ? 'active' : ''}`}>
                  <div className="fp-step-circle">
                    {step > i + 1 ? <HiCheckCircle size={13} /> : i + 1}
                  </div>
                  <span className="fp-step-label">{label}</span>
                </div>
                {i < 2 && <div className={`fp-step-line ${step > i + 1 ? 'done' : ''}`} />}
              </React.Fragment>
            ))}
          </div>

          {error && (
            <div className="fp-alert fp-alert--error">
              <HiExclamationCircle size={15} /> {error}
            </div>
          )}
          {success && (
            <div className="fp-alert fp-alert--success">
              <HiCheckCircle size={15} /> {success}
            </div>
          )}

          {/* ── STEP 1: Email + CAPTCHA ── */}
          {step === 1 && (
            <form className="fp-form" onSubmit={handleSendOTP}>
              <div className="fp-header">
                <h2>Forgot Password</h2>
                <p>Enter your registered email address and we'll send you a 6-digit OTP.</p>
              </div>
              <div className="fp-field">
                <label htmlFor="fp-email">Email Address</label>
                <div className="fp-input-wrap">
                  <HiMail size={17} className="fp-input-icon" />
                  <input
                    id="fp-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              {/* Cloudflare Turnstile widget */}
              <div className="fp-captcha-wrap">
                <div ref={turnstileRef} />
              </div>

              <button type="submit" className="fp-btn" disabled={loading || !captchaToken}>
                {loading
                  ? <React.Fragment><span className="fp-spinner" /> Sending OTP...</React.Fragment>
                  : 'Send OTP'
                }
              </button>
              <button type="button" className="fp-back-link" onClick={() => navigate('/admin/login')}>
                <HiArrowLeft size={13} /> Back to Login
              </button>
            </form>
          )}

          {/* ── STEP 2: Verify OTP ── */}
          {step === 2 && (
            <form className="fp-form" onSubmit={handleVerifyOTP}>
              <div className="fp-header">
                <h2>Enter OTP</h2>
                <p>We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.</p>
              </div>
              <div className="fp-otp-wrap">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className={`fp-otp-box${digit ? ' filled' : ''}`}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    disabled={loading}
                  />
                ))}
              </div>
              <button type="submit" className="fp-btn" disabled={loading || otp.join('').length < 6}>
                {loading
                  ? <React.Fragment><span className="fp-spinner" /> Verifying...</React.Fragment>
                  : 'Verify OTP'
                }
              </button>
              <div className="fp-resend">
                <span>Didn't receive the code?</span>
                <button
                  type="button"
                  className={`fp-resend-btn${countdown > 0 ? ' disabled' : ''}`}
                  onClick={handleResendOTP}
                  disabled={countdown > 0 || loading}
                >
                  {countdown > 0
                    ? <React.Fragment><HiRefresh size={12} /> Resend in {countdown}s</React.Fragment>
                    : <React.Fragment><HiRefresh size={12} /> Resend OTP</React.Fragment>
                  }
                </button>
              </div>
              <button
                type="button"
                className="fp-back-link"
                onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setError(''); }}
              >
                <HiArrowLeft size={13} /> Change Email
              </button>
            </form>
          )}

          {/* ── STEP 3: New Password ── */}
          {step === 3 && (
            <form className="fp-form" onSubmit={handleResetPassword}>
              <div className="fp-header">
                <h2>Set New Password</h2>
                <p>Create a strong password for your account.</p>
              </div>
              <div className="fp-field">
                <label htmlFor="fp-password">New Password</label>
                <div className="fp-input-wrap fp-password-wrap">
                  <HiLockClosed size={17} className="fp-input-icon" />
                  <input
                    id="fp-password"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button type="button" className="fp-eye-btn" onClick={() => setShowPwd(s => !s)} tabIndex={-1}>
                    {showPwd ? <HiEyeSlash size={17} /> : <HiEye size={17} />}
                  </button>
                </div>
              </div>
              <div className="fp-field">
                <label htmlFor="fp-confirm">Confirm Password</label>
                <div className="fp-input-wrap fp-password-wrap">
                  <HiLockClosed size={17} className="fp-input-icon" />
                  <input
                    id="fp-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button type="button" className="fp-eye-btn" onClick={() => setShowConfirm(s => !s)} tabIndex={-1}>
                    {showConfirm ? <HiEyeSlash size={17} /> : <HiEye size={17} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="fp-btn" disabled={loading}>
                {loading
                  ? <React.Fragment><span className="fp-spinner" /> Resetting...</React.Fragment>
                  : 'Reset Password'
                }
              </button>
            </form>
          )}

        </div>
      </div>

    </div>
  );
};

export default ForgotPassword;