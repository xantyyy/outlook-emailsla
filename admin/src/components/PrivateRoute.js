import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';

/* ─────────────────────────────────────────────────────
   Route access map — which paths each role can visit
   Roles not listed here get NO access (forbidden)
───────────────────────────────────────────────────── */
const ROLE_ALLOWED_PATHS = {
  'Super Admin': '*',   // full access
  'Innovation':  '*',   // full access

  'Audit and Compliance': [
    '/admin/messaging',
    '/admin/settings',
    '/admin/user-creation',
    '/admin/activity-logs',
  ],
  'Human Resource': [
    '/admin/messaging',
    '/admin/settings',
    '/admin/user-creation',
    '/admin/activity-logs',
  ],
  'Accounting': [
    '/admin/messaging',
    '/admin/settings',
    '/admin/user-creation',
    '/admin/activity-logs',
  ],
  'Recruitment': [
    '/admin/messaging',
    '/admin/settings',
    '/admin/user-creation',
    '/admin/activity-logs',
  ],
  'Creatives': [
    '/admin/messaging',
    '/admin/settings',
    '/admin/user-creation',
    '/admin/activity-logs',
  ],
  'Marketing': [
    '/admin/messaging',
    '/admin/settings',
    '/admin/user-creation',
    '/admin/activity-logs',
  ],
  'Operations': [
    '/admin/messaging',
    '/admin/settings',
    '/admin/user-creation',
    '/admin/activity-logs',
  ],
  'User': [
    '/admin/messaging',
    '/admin/settings',
    '/admin/user-creation',
    '/admin/activity-logs',
  ],
};

const canAccess = (role, pathname) => {
  const allowed = ROLE_ALLOWED_PATHS[role];
  if (!allowed)          return false;   // unknown role → deny
  if (allowed === '*')   return true;    // full access
  return allowed.some(p => pathname === p || pathname.startsWith(p));
};

/* ─────────────────────────────────────────────────────
   Forbidden page — shown when role has no access
───────────────────────────────────────────────────── */
const ForbiddenPage = ({ role }) => (
  <div style={{
    display:         'flex',
    flexDirection:   'column',
    alignItems:      'center',
    justifyContent:  'center',
    height:          '100vh',
    background:      '#f8fafc',
    fontFamily:      'inherit',
    textAlign:       'center',
    padding:         '24px',
  }}>
    <div style={{
      width:        '80px',
      height:       '80px',
      borderRadius: '50%',
      background:   '#fef2f2',
      display:      'flex',
      alignItems:   'center',
      justifyContent: 'center',
      marginBottom: '24px',
      fontSize:     '36px',
    }}>
      🚫
    </div>
    <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>
      Access Restricted
    </h1>
    <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 6px', maxWidth: '360px', lineHeight: 1.6 }}>
      Your role <strong style={{ color: '#1e293b' }}>{role}</strong> does not have permission to view this page.
    </p>
    <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 28px' }}>
      Please contact your Super Admin if you think this is a mistake.
    </p>
    <button
      onClick={() => window.history.back()}
      style={{
        padding:      '10px 24px',
        borderRadius: '9px',
        border:       'none',
        background:   '#3b82f6',
        color:        '#fff',
        fontSize:     '14px',
        fontWeight:   600,
        cursor:       'pointer',
      }}
    >
      Go Back
    </button>
  </div>
);

/* ─────────────────────────────────────────────────────
   PrivateRoute — checks auth + role access
───────────────────────────────────────────────────── */
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [role,            setRole]            = useState('');
  const [loading,         setLoading]         = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token     = localStorage.getItem('adminToken');
        const adminData = localStorage.getItem('adminData');

        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Verify token with backend
        await authAPI.getMe();
        setIsAuthenticated(true);

        // Read role from stored admin data
        if (adminData) {
          try {
            const parsed = JSON.parse(adminData);
            setRole(parsed.role || '');
          } catch {}
        }

      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Loading spinner
  if (loading) {
    return (
      <div style={{
        display:        'flex',
        justifyContent: 'center',
        alignItems:     'center',
        height:         '100vh',
        backgroundColor:'#FAFAFA',
      }}>
        <div style={{
          width:       '60px',
          height:      '60px',
          border:      '6px solid #E5E7EB',
          borderTop:   '6px solid #A10000',
          borderRadius:'50%',
          animation:   'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Logged in but no access to this route → show forbidden
  if (!canAccess(role, location.pathname)) {
    return <ForbiddenPage role={role} />;
  }

  return children;
};

export default ProtectedRoute;