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
import MailSLALogo from '../../assets/telexlogo.webp';
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
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2.5" fill="currentColor" fillOpacity="0.08"/>
        <path d="M2 7.5 L12 13.5 L22 7.5" />
        <line x1="2" y1="19" x2="8" y2="13.5"/>
        <line x1="22" y1="19" x2="16" y2="13.5"/>
      </svg>
    ),
    title: 'Track Every Email SLA',
    sub:   'Track email deadlines instantly. Spot on-track, at-risk, or breached responses.',
  },
  {
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12,6 12,12 16,14"/>
      </svg>
    ),
    title: 'Never Miss a Deadline',
    sub:   'Automated escalation alerts notify your team before SLA timers expire. Stay ahead, every time.',
  },
  {
    icon: (
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
      </svg>
    ),
    title: 'One Dashboard, Full Clarity',
    sub:   'Team response analytics, compliance rates, and trend reports — all in one unified dashboard.',
  },
];

/* ── Animated Envelope Illustration ── */
const EnvelopeIllustration = () => (
  <div className="lg-envelope-scene" aria-hidden="true">
    <div className="lg-ripple lg-ripple-1" />
    <div className="lg-ripple lg-ripple-2" />
    <div className="lg-ripple lg-ripple-3" />

    <div className="lg-float-card lg-float-card-left">
      <div className="lg-fc-from">from: client@acme.com</div>
      <div className="lg-fc-subject">Invoice Q2 — Review</div>
      <div className="lg-fc-sla">
        <span className="lg-fc-dot lg-fc-dot-warn" />
        <span>2h left</span>
      </div>
    </div>

    <div className="lg-float-card lg-float-card-right">
      <div className="lg-fc-from">SLA Status</div>
      <div className="lg-fc-status">
        <span className="lg-fc-dot lg-fc-dot-ok" />
        <span className="lg-fc-ok-text">On Track</span>
      </div>
      <div className="lg-fc-from" style={{ marginTop: 3 }}>91% this week</div>
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

      <div className="lg-notif-badge">3</div>
    </div>

    <div className="lg-scene-label">EMAIL SLA TRACKER</div>
  </div>
);

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
      navigate('/admin/messaging');
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

      <div className="bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      {/* ══════════════════════════
          LEFT — FORM
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
            <img src={MailSLALogo} alt="MailSLA" />
            <div className="fp-card-logo-text">
              <strong>Email SLA Tracker</strong>
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
              <h2>Welcome back!</h2>
              <p>Enter your credentials to access the dashboard.</p>
            </div>

            <div className={`fp-field${isLockedOut ? ' field-disabled' : ''}`}>
              <label htmlFor="lg-email">Email Address</label>
              <div className="fp-input-wrap">
                <HiMail size={17} className="fp-input-icon" />
                <input
                  id="lg-email"
                  type="email"
                  placeholder="admin@mailsla.com"
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
          RIGHT — ILLUSTRATION
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

          {/* Animated envelope illustration replaces video card */}
          <EnvelopeIllustration />

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