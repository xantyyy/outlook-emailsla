import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiMail,
  HiLockClosed,
  HiExclamationCircle,
  HiSun,
  HiMoon,
} from 'react-icons/hi';
import './Login.css';
import BugCircleLogo from '../../assets/TexionixLogo-2.png';
import { authAPI } from '../../services/api';

/* ─────────────────────────────────────────────
   RATE-LIMIT CONSTANTS
───────────────────────────────────────────── */
const MAX_ATTEMPTS   = 3;
const LOCKOUT_MS     = 2 * 60 * 1000;
const LS_ATTEMPTS    = 'login_attempts';
const LS_LOCKOUT_END = 'login_lockout_end';

const getStoredRateLimit = () => {
  try {
    return {
      attempts:   parseInt(localStorage.getItem(LS_ATTEMPTS)   || '0', 10),
      lockoutEnd: parseInt(localStorage.getItem(LS_LOCKOUT_END) || '0', 10),
    };
  } catch { return { attempts: 0, lockoutEnd: 0 }; }
};

/* ── Left-panel slides ── */
const SLIDES = [
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
      </svg>
    ),
    title: 'Track & Resolve Bugs Faster',
    sub:   'Get real-time visibility into every open issue across your projects from one smart dashboard.',
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
    title: 'Secure & Reliable Access',
    sub:   'Enterprise-grade security keeps your bug tracker and team data protected at all times.',
  },
  {
    icon: (
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
    title: 'One Dashboard, Full Clarity',
    sub:   'Monitor open, closed, and critical bugs at a glance. Resolve faster with smart insights.',
  },
];

/* ═══════════════════════════════════════ */
const Login = () => {
/* ═══════════════════════════════════════ */

  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [error,          setError]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [rememberMe,     setRememberMe]     = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const [attempts,   setAttempts]   = useState(() => getStoredRateLimit().attempts);
  const [lockoutEnd, setLockoutEnd] = useState(() => getStoredRateLimit().lockoutEnd);
  const [timeLeft,   setTimeLeft]   = useState(0);

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('fp-theme') === 'dark'
  );

  const [slideIdx, setSlideIdx] = useState(0);
  const [slideKey, setSlideKey] = useState(0);
  const slideIdxRef = useRef(0);

  const timerRef     = useRef(null);
  const turnstileRef = useRef(null);
  const widgetIdRef  = useRef(null);
  const navigate     = useNavigate();

  const isLockedOut  = lockoutEnd > Date.now();
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attempts);
  const showWarning  = !isLockedOut && attempts > 0 && attempts < MAX_ATTEMPTS;
  const showError    = !!error && !isLockedOut;

  const toggleTheme = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('fp-theme', next ? 'dark' : 'light');
      return next;
    });
  };

  /* Auto-slider */
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

  /* Lockout countdown */
  useEffect(() => {
    const tick = () => {
      const remaining = lockoutEnd - Date.now();
      if (remaining <= 0) { setTimeLeft(0); clearInterval(timerRef.current); }
      else { setTimeLeft(Math.ceil(remaining / 1000)); }
    };
    if (lockoutEnd > Date.now()) { tick(); timerRef.current = setInterval(tick, 1000); }
    else { setTimeLeft(0); }
    return () => clearInterval(timerRef.current);
  }, [lockoutEnd]);

  const formatTimeLeft = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const recordFailedAttempt = () => {
    const n = attempts + 1;
    setAttempts(n);
    localStorage.setItem(LS_ATTEMPTS, String(n));
    if (n >= MAX_ATTEMPTS) {
      const end = Date.now() + LOCKOUT_MS;
      setLockoutEnd(end);
      localStorage.setItem(LS_LOCKOUT_END, String(end));
    }
  };

  /* Turnstile */
  useEffect(() => {
    window.onTurnstileLoad = () => {
      if (!turnstileRef.current || widgetIdRef.current !== null) return;
      try {
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey:            process.env.REACT_APP_TURNSTILE_SITE_KEY,
          appearance:         'always',
          theme:              'light',
          callback:           (token) => setTurnstileToken(token),
          'expired-callback': ()      => setTurnstileToken(''),
          'error-callback':   ()      => setTurnstileToken(''),
        });
      } catch (e) { console.error('Turnstile render error:', e); }
    };
    if (!document.getElementById('cf-turnstile-script')) {
      const s = document.createElement('script');
      s.id    = 'cf-turnstile-script';
      s.src   = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
      s.async = true; s.defer = true;
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
  }, []);

  const resetCaptcha = () => {
    setTurnstileToken('');
    try {
      if (widgetIdRef.current !== null && window.turnstile)
        window.turnstile.reset(widgetIdRef.current);
    } catch (_) {}
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (isLockedOut) return;
    setLoading(true);
    if (!email || !password) {
      setError('Please enter email and password');
      setLoading(false); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false); return;
    }
    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification.');
      setLoading(false); return;
    }
    try {
      const response = await authAPI.login(email, password, turnstileToken);
      localStorage.removeItem(LS_ATTEMPTS);
      localStorage.removeItem(LS_LOCKOUT_END);
      setAttempts(0); setLockoutEnd(0);
      localStorage.setItem('adminToken', response.token);
      localStorage.setItem('adminData', JSON.stringify(response.admin));
      rememberMe
        ? localStorage.setItem('rememberMe', 'true')
        : localStorage.removeItem('rememberMe');
      const role = response.admin?.role || '';
      navigate(['Super Admin', 'Innovation'].includes(role)
        ? '/admin/dashboard'
        : '/admin/messaging');
    } catch (err) {
      console.error('Login error:', err);
      resetCaptcha();
      recordFailedAttempt();
      setError(err.message || err.response?.data?.message || 'Login failed. Please try again.');
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

      {/* legacy shapes — hidden */}
      <div className="bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      {/* ══════════════════════════
          LEFT — FORM (was right)
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
            <img src={BugCircleLogo} alt="Texionix" />
            <div className="fp-card-logo-text">
              <strong>Texionix</strong>
              <span>Bug Tracker</span>
            </div>
          </div>

          {isLockedOut && (
            <div className="fp-alert fp-alert--error">
              🔒 Account locked — try again in <strong style={{ marginLeft: 4 }}>{formatTimeLeft(timeLeft)}</strong>
            </div>
          )}
          {showWarning && (
            <div className="fp-alert fp-alert--warning">
              <HiExclamationCircle size={15} /> {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining before lockout
            </div>
          )}
          {showError && (
            <div className="fp-alert fp-alert--error">
              <HiExclamationCircle size={15} /> {error}
            </div>
          )}

          <form className="fp-form" onSubmit={handleLogin}>
            <div className="fp-header">
              <h2>Admin Login</h2>
              <p>Enter your credentials to access the dashboard.</p>
            </div>

            <div className={`fp-field${isLockedOut ? ' field-disabled' : ''}`}>
              <label htmlFor="lg-email">Email Address</label>
              <div className="fp-input-wrap">
                <HiMail size={17} className="fp-input-icon" />
                <input
                  id="lg-email"
                  type="email"
                  placeholder="admin@texionix.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading || isLockedOut}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className={`fp-field${isLockedOut ? ' field-disabled' : ''}`}>
              <label htmlFor="lg-password">Password</label>
              <div className="fp-input-wrap">
                <HiLockClosed size={17} className="fp-input-icon" />
                <input
                  id="lg-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading || isLockedOut}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="fp-form-options">
              <span />
              <button
                type="button"
                className="fp-forgot-btn"
                disabled={isLockedOut}
                onClick={() => navigate('/admin/forgot-password')}
              >
                Forgot password?
              </button>
            </div>

            <div className={`fp-captcha-wrap${isLockedOut ? ' captcha-disabled' : ''}`}>
              <div ref={turnstileRef} />
            </div>

            <button
              type="submit"
              className="fp-btn"
              disabled={loading || !turnstileToken || isLockedOut}
            >
              {isLockedOut
                ? <>Locked — {formatTimeLeft(timeLeft)}</>
                : loading
                  ? <React.Fragment><span className="fp-spinner" /> Signing in...</React.Fragment>
                  : 'Sign In'}
            </button>
          </form>

          <div className="fp-login-footer">
            <p>Need help? <a href="#support">Contact Support</a></p>
          </div>

        </div>
      </div>

      {/* ══════════════════════════
          RIGHT — ILLUSTRATION (was left)
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

          {/* Video card */}
          <div className="lg-video-card">
            <video
              className="lg-video-card-player"
              src="/uploads/bg.mp4"
              autoPlay loop muted playsInline
            />
            <div className="lg-video-card-overlay" />
            <div className="lg-video-card-label">
              <span className="lg-video-badge">LIVE PREVIEW</span>
              <p>Texionix Bug Tracker Dashboard</p>
            </div>
          </div>

          {/* Slider dots */}
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

    </div>
  );
};

export default Login;