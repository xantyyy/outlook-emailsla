import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const IDLE_TIMEOUT_MS  = 10 * 60 * 1000; // 10 minutes — browser open idle
const PING_INTERVAL_MS = 5 * 1000;      // 5 seconds

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
  'wheel',
];

const useIdleLogout = () => {
  const navigate    = useNavigate();
  const idleTimerRef = useRef(null);
  const pingTimerRef = useRef(null);
  const loggedOut    = useRef(false);
  const navigateRef  = useRef(navigate);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    // ── Hard redirect — clears storage and goes to login ────────────────
    const forceLogout = () => {
      if (loggedOut.current) return;
      loggedOut.current = true;
      clearTimeout(idleTimerRef.current);
      clearInterval(pingTimerRef.current);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      navigateRef.current('/admin/login', { replace: true });
    };

    // ── Called when THIS tab idles for 2 min ────────────────────────────
    const logout = async () => {
      try {
        await api.post('/auth/logout', { reason: 'timeout' });
      } catch (_) {}
      forceLogout();
    };

    // ── Ping every 5s — also acts as a session health check ─────────────
    // If server returns 401/403 (logged out by cron or another tab),
    // this tab will detect it and redirect to login automatically.
    const sendPing = async () => {
      try {
        await api.post('/auth/ping');
      } catch (err) {
        const status = err?.response?.status;
        // 401 = token invalid / account not found
        // 403 = account deactivated or isLoggedIn = false (cron logged them out)
        if (status === 401 || status === 403) {
          forceLogout();
        }
      }
    };

    const resetIdleTimer = () => {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(logout, IDLE_TIMEOUT_MS);
    };

    // Kick everything off
    sendPing();
    resetIdleTimer();
    pingTimerRef.current = setInterval(sendPing, PING_INTERVAL_MS);

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetIdleTimer, { passive: true })
    );

    return () => {
      clearTimeout(idleTimerRef.current);
      clearInterval(pingTimerRef.current);
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, resetIdleTimer)
      );
    };
  }, []);
};

export default useIdleLogout;