import React, { useState, useEffect, useCallback } from 'react';
import {
  User, Mail, Lock, Eye, EyeOff, Hash, Phone,
  CheckCircle2, XCircle, Loader2, UserPlus, AlertCircle,
  Users, Lightbulb, ClipboardCheck, HeartHandshake, Calculator,
  UserSearch, Palette, Megaphone, Settings2, UserCircle2,
  ChevronRight, X, Plus, List, LayoutGrid, Search,
  ShieldCheck, UserCheck, Activity, RefreshCw, ArrowUpDown, ChevronDown,
  ToggleLeft, ToggleRight, UserX, ShieldAlert, FileText, Archive, History,
} from 'lucide-react';

/* ─────────────────────────────────────────
   ROLES
───────────────────────────────────────── */
const ROLES = [
  { id: 'innovation',  label: 'Innovation',          icon: Lightbulb,      accent: '#7c3aed', accentBg: 'rgba(124,58,237,0.12)', description: 'Drives product innovation, R&D, and creative problem-solving across the platform.', access: 'Creative Access'    },
  { id: 'audit',       label: 'Audit and Compliance', icon: ClipboardCheck, accent: '#0891b2', accentBg: 'rgba(8,145,178,0.12)',  description: 'Monitors regulatory compliance, conducts audits, and ensures policy adherence.',    access: 'Audit Access'       },
  { id: 'hr',          label: 'Human Resource',       icon: HeartHandshake, accent: '#db2777', accentBg: 'rgba(219,39,119,0.12)', description: 'Manages employee relations, onboarding, benefits, and workforce planning.',         access: 'HR Access'          },
  { id: 'accounting',  label: 'Accounting',           icon: Calculator,     accent: '#059669', accentBg: 'rgba(5,150,105,0.12)',  description: 'Handles financial reporting, budgeting, and all accounting operations.',             access: 'Finance Access'     },
  { id: 'recruitment', label: 'Recruitment',          icon: UserSearch,     accent: '#d97706', accentBg: 'rgba(217,119,6,0.12)',  description: 'Manages talent acquisition, job postings, and candidate pipeline.',                  access: 'Recruitment Access' },
  { id: 'creatives',   label: 'Creatives',            icon: Palette,        accent: '#e11d48', accentBg: 'rgba(225,29,72,0.12)',  description: 'Produces visual content, branding materials, and design assets.',                   access: 'Creative Access'    },
  { id: 'marketing',   label: 'Marketing',            icon: Megaphone,      accent: '#ea580c', accentBg: 'rgba(234,88,12,0.12)',  description: 'Plans and executes campaigns, manages brand presence and communications.',           access: 'Marketing Access'   },
  { id: 'operations',  label: 'Operations',           icon: Settings2,      accent: '#0284c7', accentBg: 'rgba(2,132,199,0.12)',  description: 'Oversees day-to-day business processes, logistics, and service delivery.',          access: 'Operations Access'  },
  { id: 'user',        label: 'User',                 icon: UserCircle2,    accent: '#bb0000', accentBg: 'rgba(187,0,0,0.12)',    description: 'Standard access for staff handling day-to-day tasks and bug reports.',              access: 'Standard Access'    },
];

const EMP_NO_REGEX = /^TX\d{4}-\d{6}$/;

const getDarkModeFromStorage = () => {
  const s = localStorage.getItem('darkMode');
  if (s !== null) return s === 'true';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
};

/* ─────────────────────────────────────────
   THEME
───────────────────────────────────────── */
const T = (dark) => {
  const bg      = dark ? '#0c0b0b' : '#f8fafc';
  const surface = dark ? '#1a1d27' : '#ffffff';
  const surf2   = dark ? '#22263a' : '#f9fafb';
  const border  = dark ? '#2e3347' : '#e5e7eb';
  const border2 = dark ? '#252840' : '#f3f4f6';
  const pri     = dark ? '#e2e8f0' : '#111827';
  const sec     = dark ? '#94a3b8' : '#6b7280';
  const muted   = dark ? '#64748b' : '#9ca3af';
  const shadow  = dark
    ? '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)'
    : '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)';
  return { bg, surface, surf2, border, border2, pri, sec, muted, shadow };
};

/* ─────────────────────────────────────────
   TOAST
───────────────────────────────────────── */
const ToastContainer = ({ toasts, removeToast, dark }) => (
  <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
    {toasts.map(toast => (
      <div key={toast.id} style={{ pointerEvents: 'all', position: 'relative', display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 14px 13px 18px', borderRadius: 14, minWidth: 300, maxWidth: 380, overflow: 'hidden', fontFamily: "'Poppins', sans-serif", background: dark ? '#1e2330' : '#ffffff', border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`, boxShadow: dark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.10)', animation: 'toastSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: '14px 0 0 14px', background: toast.type === 'success' ? '#16a34a' : '#dc2626' }} />
        <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: toast.type === 'success' ? (dark ? 'rgba(22,163,74,0.15)' : '#dcfce7') : (dark ? 'rgba(220,38,38,0.15)' : '#fee2e2'), color: toast.type === 'success' ? (dark ? '#4ade80' : '#16a34a') : (dark ? '#f87171' : '#dc2626') }}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.3, color: dark ? '#f9fafb' : '#111827' }}>{toast.title}</div>
          <div style={{ fontSize: 12, fontWeight: 500, marginTop: 2, lineHeight: 1.4, color: dark ? '#9ca3af' : '#6b7280' }}>{toast.message}</div>
        </div>
        <button onClick={() => removeToast(toast.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dark ? '#6b7280' : '#9ca3af', flexShrink: 0, marginTop: 1 }}><X size={13} /></button>
        <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, borderRadius: '0 0 14px 14px', background: toast.type === 'success' ? (dark ? '#4ade80' : '#16a34a') : (dark ? '#f87171' : '#dc2626'), opacity: 0.4, animation: 'toastProgress 4s linear forwards' }} />
      </div>
    ))}
  </div>
);

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const makeInitial = (role = '') => ({
  employeeNumber: '', firstName: '', middleName: '',
  surname: '', email: '', phone: '', role,
  password: '', confirmPassword: '',
});

const passwordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return [
    { score: 1, label: 'Weak',   color: '#ef4444' },
    { score: 2, label: 'Fair',   color: '#f97316' },
    { score: 3, label: 'Good',   color: '#eab308' },
    { score: 4, label: 'Strong', color: '#22c55e' },
  ][s - 1] || { score: 0, label: '', color: '' };
};

/* ─────────────────────────────────────────
   FIELD
───────────────────────────────────────── */
const Field = ({ id, label, icon: Icon, error, required, th, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: th.sec }}>
      {Icon && <Icon size={12} />}{label}
      {required && <span style={{ color: '#ef4444', fontSize: 11 }}>*</span>}
    </label>
    {children}
    {error && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ef4444' }}><AlertCircle size={11} />{error}</span>}
  </div>
);

/* ─────────────────────────────────────────
   CREATION MODAL
───────────────────────────────────────── */
const CreationModal = ({ role, onClose, onSuccess, onError, th }) => {
  const [form, setForm]   = useState(makeInitial(role.id));
  const [showP, setShowP] = useState(false);
  const [showC, setShowC] = useState(false);
  const [errs, setErrs]   = useState({});
  const [status, setStatus] = useState(null);
  const [touch, setTouch] = useState({});

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  const strength = passwordStrength(form.password);

  const validate = (d = form) => {
    const e = {};
    if (!d.employeeNumber.trim()) e.employeeNumber = 'Employee number is required.';
    else if (!EMP_NO_REGEX.test(d.employeeNumber.trim())) e.employeeNumber = 'Format: TX####-###### (e.g. TX1234-678910)';
    if (!d.firstName.trim()) e.firstName = 'First name is required.';
    else if (d.firstName.trim().length < 2) e.firstName = 'At least 2 characters.';
    if (!d.surname.trim()) e.surname = 'Surname is required.';
    else if (d.surname.trim().length < 2) e.surname = 'At least 2 characters.';
    if (!d.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) e.email = 'Enter a valid email.';
    if (!d.phone.trim()) e.phone = 'Phone is required.';
    else if (!/^\d+$/.test(d.phone)) e.phone = 'Numbers only.';
    else if (!d.phone.startsWith('09')) e.phone = 'Must start with 09.';
    else if (d.phone.length !== 11) e.phone = 'Must be 11 digits.';
    if (!d.password) e.password = 'Password is required.';
    else if (d.password.length < 8) e.password = 'Min. 8 characters.';
    if (!d.confirmPassword) e.confirmPassword = 'Please confirm password.';
    else if (d.password !== d.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    return e;
  };

  const handleChange = (field) => (e) => {
    let v = e.target.value;
    if (field === 'phone') v = v.replace(/\D/g, '').slice(0, 11);
    if (field === 'employeeNumber') {
      let raw = v.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      raw = raw.length <= 2
        ? ('TX' + raw.replace(/[^0-9]/g, '')).slice(0, 2)
        : 'TX' + raw.slice(2).replace(/[^0-9]/g, '').slice(0, 10);
      v = raw.length > 6 ? raw.slice(0, 6) + '-' + raw.slice(6) : raw;
    }
    setForm(f => ({ ...f, [field]: v }));
    if (touch[field]) {
      const e2 = validate({ ...form, [field]: v });
      setErrs(p => ({ ...p, [field]: e2[field] }));
    }
  };

  const handleBlur = (field) => () => {
    setTouch(t => ({ ...t, [field]: true }));
    setErrs(p => ({ ...p, [field]: validate()[field] }));
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setTouch(Object.fromEntries(Object.keys(makeInitial()).map(k => [k, true])));
    const e2 = validate();
    setErrs(e2);
    if (Object.keys(e2).length) return;
    setStatus('loading');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: [form.firstName.trim(), form.middleName.trim(), form.surname.trim()].filter(Boolean).join(' '),
          firstName: form.firstName.trim(), middleName: form.middleName.trim(),
          surname: form.surname.trim(), email: form.email.trim(),
          phone: form.phone.trim(), employeeNumber: form.employeeNumber.trim(),
          role: role.id, password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(null);
        onError({ title: 'Failed to Create Account', message: data.message || 'Something went wrong.' });
        return;
      }
      setStatus(null);
      onClose();
      onSuccess({ title: 'User Created Successfully!', message: `${form.firstName.trim()} ${form.surname.trim()} has been added as ${role.label}.` });
    } catch {
      setStatus(null);
      onError({ title: 'Network Error', message: 'Could not connect to the server.' });
    }
  };

  const iS = (f) => ({
    width: '100%', background: th.surf2, border: `1px solid ${errs[f] ? '#ef4444' : th.border}`,
    borderRadius: 10, padding: '9px 12px', fontSize: 13, color: th.pri,
    fontFamily: "'Poppins',sans-serif", outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
  });
  const eyeBtn = { position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: th.sec, display: 'flex', padding: 2 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: th.surface, borderRadius: 22, width: '100%', maxWidth: 700, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: `1px solid ${th.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>
        <div style={{ background: `linear-gradient(135deg, ${role.accent}18, ${role.accentBg})`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${th.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, background: `${role.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.accent }}><role.icon size={20} /></div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: th.pri, margin: 0 }}>New {role.label} Account</h2>
              <p style={{ fontSize: 12, color: th.sec, margin: '2px 0 0' }}>{role.access}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: th.surf2, border: `1px solid ${th.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: th.sec }}><X size={16} /></button>
        </div>
        <form style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }} onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="uc-form-grid">
            <Field id="empNo" label="Employee Number" icon={Hash} error={errs.employeeNumber} required th={th}>
              <input id="empNo" type="text" style={iS('employeeNumber')} placeholder="ex. TX1234-678910" value={form.employeeNumber} onChange={handleChange('employeeNumber')} onBlur={handleBlur('employeeNumber')} autoComplete="off" maxLength={13} />
            </Field>
            <Field id="firstName" label="First Name" icon={User} error={errs.firstName} required th={th}>
              <input id="firstName" type="text" style={iS('firstName')} placeholder="ex. Juan" value={form.firstName} onChange={handleChange('firstName')} onBlur={handleBlur('firstName')} autoComplete="off" />
            </Field>
            <Field id="middleName" label="Middle Name (Optional)" icon={User} th={th}>
              <input id="middleName" type="text" style={iS('middleName')} placeholder="ex. Santos" value={form.middleName} onChange={handleChange('middleName')} autoComplete="off" />
            </Field>
            <Field id="surname" label="Surname" icon={User} error={errs.surname} required th={th}>
              <input id="surname" type="text" style={iS('surname')} placeholder="ex. dela Cruz" value={form.surname} onChange={handleChange('surname')} onBlur={handleBlur('surname')} autoComplete="off" />
            </Field>
            <Field id="email" label="Email Address" icon={Mail} error={errs.email} required th={th}>
              <input id="email" type="email" style={iS('email')} placeholder="ex. juan@gmail.com" value={form.email} onChange={handleChange('email')} onBlur={handleBlur('email')} autoComplete="off" />
            </Field>
            <Field id="phone" label="Phone" icon={Phone} error={errs.phone} required th={th}>
              <input id="phone" type="tel" style={iS('phone')} placeholder="ex. 09123456789" value={form.phone} onChange={handleChange('phone')} onBlur={handleBlur('phone')} pattern="[0-9]*" inputMode="numeric" maxLength={11} />
            </Field>
            <Field id="password" label="Password" icon={Lock} error={errs.password} required th={th}>
              <div style={{ position: 'relative' }}>
                <input id="password" type={showP ? 'text' : 'password'} style={{ ...iS('password'), paddingRight: 36 }} placeholder="Min. 8 characters" value={form.password} onChange={handleChange('password')} onBlur={handleBlur('password')} autoComplete="new-password" />
                <button type="button" style={eyeBtn} onClick={() => setShowP(s => !s)} tabIndex={-1}>{showP ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
              {form.password && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                  <div style={{ display: 'flex', gap: 3, flex: 1 }}>
                    {[1,2,3,4].map(n => <div key={n} style={{ height: 4, flex: 1, borderRadius: 3, background: n <= strength.score ? strength.color : th.border, transition: 'background 0.2s' }} />)}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </Field>
            <Field id="confirmPw" label="Confirm Password" icon={Lock} error={errs.confirmPassword} required th={th}>
              <div style={{ position: 'relative' }}>
                <input id="confirmPw" type={showC ? 'text' : 'password'} style={{ ...iS('confirmPassword'), paddingRight: 36 }} placeholder="Re-enter password" value={form.confirmPassword} onChange={handleChange('confirmPassword')} onBlur={handleBlur('confirmPassword')} autoComplete="new-password" />
                <button type="button" style={eyeBtn} onClick={() => setShowC(s => !s)} tabIndex={-1}>{showC ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </Field>
          </div>
        </form>
        <div style={{ padding: '14px 24px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: `1px solid ${th.border2}` }}>
          <button style={{ background: th.surf2, border: `1px solid ${th.border}`, borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 500, color: th.pri, cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }} onClick={() => { setForm(makeInitial(role.id)); setErrs({}); setTouch({}); }} disabled={status === 'loading'}>Reset</button>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: `linear-gradient(135deg,${role.accent}cc,${role.accent})`, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", boxShadow: `0 2px 8px ${role.accent}44`, opacity: status === 'loading' ? 0.7 : 1 }} onClick={handleSubmit} disabled={status === 'loading'}>
            {status === 'loading' ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Creating…</> : <><UserPlus size={14} /> Create Account</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   ROLE PICKER
───────────────────────────────────────── */
const RolePicker = ({ onSelect, onClose, getCount, countsLoading, th }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div style={{ background: th.surface, borderRadius: 22, width: '100%', maxWidth: 500, border: `1px solid ${th.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: `1px solid ${th.border2}` }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: th.pri, margin: '0 0 2px' }}>Select a Role</h2>
          <p style={{ fontSize: 12, color: th.sec, margin: 0 }}>Choose the role for the new account</p>
        </div>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, background: th.surf2, border: `1px solid ${th.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: th.sec }}><X size={16} /></button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', padding: '10px 14px 14px', gap: 3, maxHeight: 460, overflowY: 'auto' }}>
        {ROLES.map(role => (
          <button key={role.id} className="uc-picker-item" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 12, cursor: 'pointer', border: '1px solid transparent', background: 'transparent', width: '100%', textAlign: 'left', fontFamily: "'Poppins',sans-serif" }} onClick={() => onSelect(role)}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: role.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.accent, flexShrink: 0 }}><role.icon size={16} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: th.pri }}>{role.label}</div>
              <div style={{ fontSize: 11, color: th.sec }}>{countsLoading ? '…' : `${getCount(role.id)} accounts`}</div>
            </div>
            <ChevronRight size={14} style={{ color: th.muted, flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════
   VIEW USER MODAL  ← NEW
   Shows full user info + deactivation reason
═══════════════════════════════════════════ */
const ViewUserModal = ({ user: initialUser, roleObj, onClose, onChangeStatus, onArchive, th }) => {
  const [user,      setUser]      = useState(initialUser);
  const [loading,   setLoading]   = useState(true);
  const [fetchErr,  setFetchErr]  = useState(false);
  const [view,      setView]      = useState('info'); // 'info' | 'history'
  const active = user.isActive !== false;

  // Fetch fresh user data (including full history arrays) every time modal opens
  const fetchUser = useCallback(async () => {
    setLoading(true);
    setFetchErr(false);
    try {
      const token = localStorage.getItem('adminToken');
      const res   = await fetch(`/api/users/${initialUser._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch user');
      const data = await res.json();
      setUser(data.user);
    } catch {
      setFetchErr(true);
      setUser(initialUser); // fallback to whatever we already have
    } finally {
      setLoading(false);
    }
  }, [initialUser._id]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);

  const InfoBox = ({ label, value, full }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '10px 14px', background: th.surf2, border: `1px solid ${th.border}`, borderRadius: 10, gridColumn: full ? '1 / -1' : undefined }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: th.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: th.pri }}>{value || '—'}</span>
    </div>
  );

  const totalEvents = (user.activationHistory?.length || 0) + (user.deactivationHistory?.length || 0);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: th.surface, borderRadius: 22, width: '100%', maxWidth: 460, border: `1px solid ${th.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.35)', overflow: 'hidden', animation: 'statusModalIn 0.22s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header — always visible */}
        <div style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${th.border}`, background: active ? 'rgba(22,163,74,0.06)' : 'rgba(220,38,38,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: roleObj ? `${roleObj.accent}22` : th.surf2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: roleObj?.accent || th.sec, fontSize: 18, fontWeight: 700, flexShrink: 0, border: `2px solid ${roleObj?.accent || th.border}33` }}>
              {(user.firstName || user.name || '?')[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: th.pri, margin: 0 }}>
                {user.firstName ? `${user.firstName} ${user.surname || ''}`.trim() : user.name}
              </h2>
              <p style={{ fontSize: 11, color: th.sec, margin: '2px 0 0' }}>{user.role}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* View toggle tabs */}
            <div style={{ display: 'flex', background: th.surf2, border: `1px solid ${th.border}`, borderRadius: 9, padding: 3, gap: 2 }}>
              <button onClick={() => setView('info')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: view === 'info' ? 600 : 400, background: view === 'info' ? th.surface : 'transparent', color: view === 'info' ? th.pri : th.muted, fontFamily: "'Poppins',sans-serif", boxShadow: view === 'info' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                <FileText size={11} /> Info
              </button>
              <button onClick={() => setView('history')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: view === 'history' ? 600 : 400, background: view === 'history' ? th.surface : 'transparent', color: view === 'history' ? '#6366f1' : th.muted, fontFamily: "'Poppins',sans-serif", boxShadow: view === 'history' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                <History size={11} /> History
                {totalEvents > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, borderRadius: '50%', background: view === 'history' ? '#6366f1' : th.border, color: view === 'history' ? '#fff' : th.sec, fontSize: 9, fontWeight: 700 }}>{totalEvents}</span>
                )}
              </button>
            </div>
            <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: th.surf2, border: `1px solid ${th.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: th.sec }}><X size={14} /></button>
          </div>
        </div>

        {/* ── LOADING STATE ── */}
        {loading && (
          <div style={{ padding: '32px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ height: i === 1 ? 48 : 38, borderRadius: 10, background: th.surf2, border: `1px solid ${th.border}`, animation: 'pulse 1.4s ease-in-out infinite', opacity: 1 - i * 0.15 }} />
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>
          </div>
        )}

        {/* ── FETCH ERROR ── */}
        {!loading && fetchErr && (
          <div style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={28} style={{ color: '#ef4444', opacity: 0.7 }} />
            <p style={{ fontSize: 13, color: th.sec, margin: 0, textAlign: 'center' }}>Could not load latest data.<br/>Showing last known info.</p>
            <button onClick={fetchUser} style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}>Retry</button>
          </div>
        )}

        {/* ── INFO VIEW ── */}
        {!loading && view === 'info' && (
          <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Status pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, background: active ? 'rgba(22,163,74,0.08)' : 'rgba(220,38,38,0.08)', border: `1px solid ${active ? 'rgba(22,163,74,0.25)' : 'rgba(220,38,38,0.25)'}` }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: active ? '#16a34a' : '#dc2626', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#16a34a' : '#dc2626' }}>
                {active ? 'Active Account' : 'Inactive Account'}
              </span>
            </div>

            {/* Reason for Activation — shown for active accounts */}
            {active && (
              <div style={{ padding: '12px 14px', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <UserCheck size={12} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reason for Activation</span>
                </div>
                <p style={{ fontSize: 13, color: th.pri, margin: 0, lineHeight: 1.6 }}>
                  {user.activationReason || <span style={{ color: th.muted, fontStyle: 'italic' }}>No reason provided</span>}
                </p>
              </div>
            )}

            {/* Deactivation reason — only shown if inactive */}
            {!active && user.inactiveReason && (
              <div style={{ padding: '12px 14px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.22)', borderRadius: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <ShieldAlert size={12} style={{ color: '#dc2626', flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reason for Deactivation</span>
                </div>
                <p style={{ fontSize: 13, color: th.pri, margin: 0, lineHeight: 1.6 }}>{user.inactiveReason}</p>
              </div>
            )}

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <InfoBox label="Employee No." value={user.employeeNumber} />
              <InfoBox label="Role" value={user.role} />
              <InfoBox label="Email" value={user.email} full />
              <InfoBox label="Phone" value={user.phone} />
              <InfoBox label="Account Created" value={user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'} />
            </div>
          </div>
        )}

        {/* ── HISTORY VIEW ── */}
        {!loading && view === 'history' && (() => {
          const HistoryPanel = () => {
            const [openIdx, setOpenIdx] = useState(null);

            // Merge both arrays, tag each, sort oldest→newest, then reverse for newest-first display
            const acts   = (Array.isArray(user.activationHistory)   ? user.activationHistory   : [])
              .map(e => ({ type: 'activation',   reason: e.reason, by: e.activatedBy,   at: e.activatedAt }));
            const deacts = (Array.isArray(user.deactivationHistory) ? user.deactivationHistory : [])
              .map(e => ({ type: 'deactivation', reason: e.reason, by: e.deactivatedBy, at: e.deactivatedAt }));
            const timeline = [...acts, ...deacts]
              .sort((a, b) => new Date(a.at) - new Date(b.at))
              .reverse(); // newest first

            const fmtDate = (at) => at
              ? new Date(at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '—';
            const fmtTime = (at) => at
              ? new Date(at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
              : '';

            return (
              <div style={{ padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 420, overflowY: 'auto' }}>
                <style>{`
                  @keyframes expandIn {
                    from { opacity: 0; max-height: 0; }
                    to   { opacity: 1; max-height: 200px; }
                  }
                `}</style>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <History size={13} style={{ color: '#6366f1' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: th.pri }}>Status Change History</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: '#6366f1', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', padding: '2px 8px', borderRadius: 20 }}>
                    {totalEvents} event{totalEvents !== 1 ? 's' : ''}
                  </span>
                </div>

                {totalEvents === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '36px 0' }}>
                    <History size={30} style={{ color: th.muted, opacity: 0.3 }} />
                    <p style={{ fontSize: 13, color: th.muted, margin: 0 }}>No status change history yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {timeline.map((entry, i) => {
                      const isAct    = entry.type === 'activation';
                      const accent   = isAct ? '#16a34a' : '#dc2626';
                      const bgClosed = isAct ? 'rgba(22,163,74,0.05)'  : 'rgba(220,38,38,0.05)';
                      const bgOpen   = isAct ? 'rgba(22,163,74,0.10)'  : 'rgba(220,38,38,0.10)';
                      const border   = isAct ? 'rgba(22,163,74,0.25)'  : 'rgba(220,38,38,0.25)';
                      const dotBg    = isAct ? 'rgba(22,163,74,0.18)'  : 'rgba(220,38,38,0.18)';
                      const label    = isAct ? 'Reason for Activation' : 'Reason for Deactivation';
                      const Icon     = isAct ? UserCheck : UserX;
                      const isOpen   = openIdx === i;
                      const isLast   = i === timeline.length - 1;

                      return (
                        <div key={i} style={{ display: 'flex', gap: 0 }}>

                          {/* Timeline spine */}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0, paddingTop: 14 }}>
                            {/* Dot */}
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                              background: dotBg, border: `1.5px solid ${border}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: accent, zIndex: 1,
                              boxShadow: isOpen ? `0 0 0 3px ${isAct ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)'}` : 'none',
                              transition: 'box-shadow 0.2s',
                            }}>
                              <Icon size={12} />
                            </div>
                            {/* Connector line */}
                            {!isLast && (
                              <div style={{
                                width: 2, flex: 1, minHeight: 12,
                                background: `linear-gradient(to bottom, ${border}, ${
                                  // next entry color
                                  timeline[i+1]?.type === 'activation' ? 'rgba(22,163,74,0.2)' : 'rgba(220,38,38,0.2)'
                                })`,
                                marginTop: 2,
                              }} />
                            )}
                          </div>

                          {/* Card */}
                          <div style={{ flex: 1, marginBottom: isLast ? 0 : 8, marginLeft: 10 }}>
                            <div style={{
                              borderRadius: 12,
                              border: `1px solid ${isOpen ? border : th.border}`,
                              background: isOpen ? bgOpen : bgClosed,
                              overflow: 'hidden',
                              transition: 'border-color 0.18s, background 0.18s',
                              cursor: 'pointer',
                            }}
                              onClick={() => setOpenIdx(isOpen ? null : i)}
                            >
                              {/* ── Collapsed row (always visible) ── */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
                                {/* Type badge */}
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  fontSize: 10, fontWeight: 700, color: accent,
                                  background: isAct ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
                                  border: `1px solid ${border}`,
                                  padding: '2px 8px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0,
                                }}>
                                  <Icon size={9} />
                                  {isAct ? 'Activated' : 'Deactivated'}
                                </span>

                                {/* Date */}
                                <span style={{ fontSize: 11, color: th.sec, flex: 1, textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  {fmtDate(entry.at)}
                                </span>

                                {/* Chevron */}
                                <span style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                                  background: isOpen ? (isAct ? 'rgba(22,163,74,0.18)' : 'rgba(220,38,38,0.18)') : 'transparent',
                                  color: isOpen ? accent : th.muted,
                                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                  transition: 'transform 0.2s, background 0.15s, color 0.15s',
                                }}>
                                  <ChevronDown size={12} />
                                </span>
                              </div>

                              {/* ── Expanded body ── */}
                              {isOpen && (
                                <div style={{ padding: '0 12px 12px', animation: 'expandIn 0.2s ease-out' }}>
                                  {/* Divider */}
                                  <div style={{ height: 1, background: `linear-gradient(to right, ${border}, transparent)`, marginBottom: 10 }} />

                                  {/* Label */}
                                  <span style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    {label}
                                  </span>

                                  {/* Reason text */}
                                  <p style={{
                                    fontSize: 13, color: entry.reason ? th.pri : th.muted,
                                    margin: '6px 0 8px', lineHeight: 1.6,
                                    fontStyle: entry.reason ? 'normal' : 'italic',
                                    wordBreak: 'break-word',
                                  }}>
                                    {entry.reason || 'No reason provided'}
                                  </p>

                                  {/* Meta row */}
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                                    {entry.by && (
                                      <span style={{ fontSize: 11, color: th.muted }}>
                                        by <strong style={{ color: th.sec }}>{entry.by}</strong>
                                      </span>
                                    )}
                                    <span style={{ fontSize: 11, color: th.muted, marginLeft: 'auto' }}>
                                      {fmtTime(entry.at)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          };
          return <HistoryPanel />;
        })()}

        {/* Footer */}
        <div style={{ padding: '14px 22px 20px', display: 'flex', justifyContent: 'space-between', gap: 8, borderTop: `1px solid ${th.border}` }}>
          <button onClick={onClose} style={{ background: th.surf2, border: `1px solid ${th.border}`, borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 500, color: th.pri, cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}>Close</button>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Archive button — only for inactive accounts */}
            {!active && onArchive && (
              <button onClick={() => { onClose(); onArchive(user); }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#78350f,#b45309)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", boxShadow: '0 2px 8px rgba(180,83,9,0.35)' }}>
                <Archive size={14} /> Archive
              </button>
            )}
            <button onClick={() => { onClose(); onChangeStatus(user); }} style={{ display: 'flex', alignItems: 'center', gap: 6, background: active ? 'linear-gradient(135deg,#991b1b,#dc2626)' : 'linear-gradient(135deg,#15803d,#16a34a)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", boxShadow: active ? '0 2px 8px rgba(220,38,38,0.3)' : '0 2px 8px rgba(22,163,74,0.3)' }}>
              {active ? <><UserX size={14} /> Deactivate</> : <><UserCheck size={14} /> Activate</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   STATUS MODAL  (UPDATED)
   Fixes:
   1. No redundant status choice — only shows the opposite action
   2. Two-step flow: form → confirm → submit
═══════════════════════════════════════════ */
const StatusModal = ({ user, onClose, onSuccess, onError, th }) => {
  const isCurrentlyActive = user.isActive !== false;
  const willDeactivate    = isCurrentlyActive; // active → will deactivate; inactive → will activate

  const [step,              setStep]              = useState('form'); // 'form' | 'confirm'
  const [reason,            setReason]            = useState('');
  const [activationReason,  setActivationReason]  = useState('');
  const [adminPassword,     setAdminPassword]     = useState('');
  const [showPassword,      setShowPassword]      = useState(false);
  const [loading,           setLoading]           = useState(false);
  const [errs,              setErrs]              = useState({});

  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') {
        if (step === 'confirm') setStep('form');
        else onClose();
      }
    };
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose, step]);

  const validate = () => {
    const e = {};
    if (willDeactivate && !reason.trim())
      e.reason = 'Please provide a reason for deactivating this account.';
    if (!adminPassword.trim())
      e.adminPassword = 'Your password is required to confirm this action.';
    return e;
  };

  /* Step 1: validate → show confirm screen */
  const handleProceed = () => {
    const e = validate();
    setErrs(e);
    if (Object.keys(e).length) return;
    setStep('confirm');
  };

  /* Step 2: confirmed → call API */
  const handleConfirm = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/users/${user._id}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          isActive:          !isCurrentlyActive,
          reason:            willDeactivate ? reason.trim() : '',
          activationReason:  !willDeactivate ? activationReason.trim() : '',
          adminPassword:     adminPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          setErrs(p => ({ ...p, adminPassword: data.message }));
          setStep('form'); // go back to fix password
        } else {
          onError({ title: 'Update Failed', message: data.message || 'Something went wrong.' });
        }
        setLoading(false);
        return;
      }
      onClose();
      onSuccess({
        title:   `Account ${!isCurrentlyActive ? 'Activated' : 'Deactivated'}`,
        message: `${user.firstName || user.name}'s account is now ${!isCurrentlyActive ? 'Active' : 'Inactive'}.`,
        updated: data.user,
      });
    } catch {
      onError({ title: 'Network Error', message: 'Could not connect to the server.' });
      setLoading(false);
    }
  };

  const accentColor = willDeactivate ? '#dc2626' : '#16a34a';
  const accentBg    = willDeactivate ? 'rgba(220,38,38,0.08)' : 'rgba(22,163,74,0.08)';
  const iS = (field) => ({
    width: '100%', background: th.surf2, border: `1px solid ${errs[field] ? '#ef4444' : th.border}`,
    borderRadius: 10, padding: '9px 12px', fontSize: 13, color: th.pri,
    fontFamily: "'Poppins',sans-serif", outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
  });

  /* ──────────────────────────────
     STEP 2 — CONFIRMATION SCREEN
  ────────────────────────────── */
  if (step === 'confirm') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(e) => e.target === e.currentTarget && setStep('form')}>
        <div style={{ background: th.surface, borderRadius: 22, width: '100%', maxWidth: 400, border: `1px solid ${th.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', overflow: 'hidden', animation: 'statusModalIn 0.22s cubic-bezier(0.16,1,0.3,1)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 28px 28px' }}>

          {/* Icon */}
          <div style={{ width: 62, height: 62, borderRadius: '50%', background: willDeactivate ? 'rgba(220,38,38,0.12)' : 'rgba(22,163,74,0.12)', border: `1.5px solid ${willDeactivate ? 'rgba(220,38,38,0.3)' : 'rgba(22,163,74,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
            {willDeactivate ? <UserX size={28} style={{ color: '#dc2626' }} /> : <UserCheck size={28} style={{ color: '#16a34a' }} />}
          </div>

          <h3 style={{ fontSize: 17, fontWeight: 700, color: th.pri, margin: '0 0 8px', textAlign: 'center' }}>
            {willDeactivate ? 'Confirm Deactivation?' : 'Confirm Activation?'}
          </h3>
          <p style={{ fontSize: 13, color: th.sec, margin: '0 0 20px', textAlign: 'center', lineHeight: 1.55 }}>
            You are about to <strong style={{ color: accentColor }}>{willDeactivate ? 'deactivate' : 'activate'}</strong> the account of{' '}
            <strong style={{ color: th.pri }}>{user.firstName ? `${user.firstName} ${user.surname || ''}`.trim() : user.name}</strong>.
          </p>

          {/* Summary */}
          <div style={{ width: '100%', background: th.surf2, border: `1px solid ${th.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'User',   value: user.firstName ? `${user.firstName} ${user.surname || ''}`.trim() : user.name },
              { label: 'Role',   value: user.role },
              { label: 'Status Change', value: willDeactivate ? 'Active → Inactive' : 'Inactive → Active', color: accentColor },
              ...(willDeactivate && reason ? [{ label: 'Reason', value: reason }] : []),
              ...(!willDeactivate && activationReason ? [{ label: 'Activation Reason', value: activationReason }] : []),
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: th.muted, flexShrink: 0, marginTop: 7 }} />
                <span style={{ fontSize: 13, color: th.sec, lineHeight: 1.4 }}>
                  <strong style={{ color: th.pri }}>{item.label}:</strong>{' '}
                  <span style={{ color: item.color || th.sec }}>{item.value}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Warning note */}
          <div style={{ width: '100%', background: willDeactivate ? 'rgba(220,38,38,0.07)' : 'rgba(22,163,74,0.07)', border: `1px solid ${willDeactivate ? 'rgba(220,38,38,0.2)' : 'rgba(22,163,74,0.2)'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14 }}>{willDeactivate ? '⚠️' : 'ℹ️'}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: th.sec }}>
              {willDeactivate
                ? 'This user will immediately lose access to the system.'
                : 'This user will regain full access once activated.'}
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <button onClick={() => setStep('form')} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: `1.5px solid ${th.border}`, background: th.surf2, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: th.sec, fontFamily: "'Poppins',sans-serif" }}>
              ← Back
            </button>
            <button onClick={handleConfirm} disabled={loading} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: willDeactivate ? 'linear-gradient(135deg,#991b1b,#dc2626)' : 'linear-gradient(135deg,#15803d,#16a34a)', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: "'Poppins',sans-serif", boxShadow: willDeactivate ? '0 3px 10px rgba(220,38,38,0.35)' : '0 3px 10px rgba(22,163,74,0.35)', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {loading
                ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…</>
                : willDeactivate
                  ? <><UserX size={14} /> Yes, Deactivate</>
                  : <><UserCheck size={14} /> Yes, Activate</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────
     STEP 1 — FORM SCREEN
  ────────────────────────────── */
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: th.surface, borderRadius: 22, width: '100%', maxWidth: 480, border: `1px solid ${th.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'statusModalIn 0.22s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header */}
        <div style={{ background: accentBg, padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${th.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: `${accentColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
              {willDeactivate ? <UserX size={18} /> : <UserCheck size={18} />}
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: th.pri, margin: 0 }}>
                {willDeactivate ? 'Deactivate Account' : 'Activate Account'}
              </h2>
              <p style={{ fontSize: 11, color: th.sec, margin: '2px 0 0' }}>
                {user.firstName || user.name} · {user.role}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: th.surf2, border: `1px solid ${th.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: th.sec }}><X size={14} /></button>
        </div>

        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Current status + what it will change to */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', background: th.surf2, borderRadius: 11, border: `1px solid ${th.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: isCurrentlyActive ? '#16a34a' : '#dc2626' }} />
              <span style={{ fontSize: 12, color: th.sec }}>Current: <strong style={{ color: th.pri }}>{isCurrentlyActive ? 'Active' : 'Inactive'}</strong></span>
            </div>
            <span style={{ color: th.muted, fontSize: 13, margin: '0 2px' }}>→</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: accentColor, background: willDeactivate ? 'rgba(220,38,38,0.10)' : 'rgba(22,163,74,0.10)', padding: '2px 10px', borderRadius: 20, border: `1px solid ${willDeactivate ? 'rgba(220,38,38,0.25)' : 'rgba(22,163,74,0.25)'}` }}>
              {willDeactivate ? 'Inactive' : 'Active'}
            </span>
          </div>

          {/* Reason — only when deactivating */}
          {willDeactivate && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: th.sec, display: 'flex', alignItems: 'center', gap: 5 }}>
                <ShieldAlert size={12} style={{ color: '#dc2626' }} />
                Reason for Deactivation <span style={{ color: '#ef4444', fontSize: 11 }}>*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Employee resigned, Account suspended..."
                value={reason}
                onChange={e => { setReason(e.target.value); if (errs.reason) setErrs(p => ({ ...p, reason: '' })); }}
                style={{ ...iS('reason'), resize: 'vertical', minHeight: 80, lineHeight: 1.55 }}
              />
              {errs.reason && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ef4444' }}><AlertCircle size={11} />{errs.reason}</span>}
            </div>
          )}

          {/* Reason for Activation — only when activating */}
          {!willDeactivate && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: th.sec, display: 'flex', alignItems: 'center', gap: 5 }}>
                <UserCheck size={12} style={{ color: '#16a34a' }} />
                Reason for Activation <span style={{ color: th.muted, fontSize: 11 }}>(optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Account reinstated after review, New employee onboarded..."
                value={activationReason}
                onChange={e => setActivationReason(e.target.value)}
                style={{ ...iS('activationReason'), resize: 'vertical', minHeight: 80, lineHeight: 1.55 }}
              />
              <span style={{ fontSize: 11, color: th.muted }}>This reason will be saved and visible in the account's activation history.</span>
            </div>
          )}

          {/* Admin password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: th.sec, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Lock size={12} />
              Your Password to Confirm <span style={{ color: '#ef4444', fontSize: 11 }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Your account password"
                value={adminPassword}
                onChange={e => { setAdminPassword(e.target.value); if (errs.adminPassword) setErrs(p => ({ ...p, adminPassword: '' })); }}
                style={{ ...iS('adminPassword'), paddingRight: 38 }}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: th.sec, display: 'flex', padding: 2 }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errs.adminPassword && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ef4444' }}><AlertCircle size={11} />{errs.adminPassword}</span>}
            <span style={{ fontSize: 11, color: th.muted, marginTop: 2 }}>Required to verify your identity before changing account status.</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: `1px solid ${th.border}` }}>
          <button onClick={onClose} style={{ background: th.surf2, border: `1px solid ${th.border}`, borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 500, color: th.pri, cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}>Cancel</button>
          <button onClick={handleProceed} style={{ display: 'flex', alignItems: 'center', gap: 6, background: willDeactivate ? 'linear-gradient(135deg,#991b1b,#dc2626)' : 'linear-gradient(135deg,#15803d,#16a34a)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", boxShadow: willDeactivate ? '0 2px 8px rgba(220,38,38,0.3)' : '0 2px 8px rgba(22,163,74,0.3)' }}>
            {willDeactivate ? <><UserX size={14} /> Review & Deactivate</> : <><UserCheck size={14} /> Review & Activate</>}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   ARCHIVE MODAL — confirm + password
═══════════════════════════════════════════ */
const ArchiveModal = ({ user, onClose, onSuccess, onError, th }) => {
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [err,           setErr]           = useState('');
  const [step,          setStep]          = useState('form'); // 'form' | 'confirm'

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') { if (step === 'confirm') setStep('form'); else onClose(); } };
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose, step]);

  const handleProceed = () => {
    if (!adminPassword.trim()) { setErr('Your password is required to confirm this action.'); return; }
    setErr('');
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setLoading(true);
    setErr('');
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/users/${user._id}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adminPassword: adminPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) { setErr(data.message); setStep('form'); }
        else onError({ title: 'Archive Failed', message: data.message || 'Something went wrong.' });
        setLoading(false);
        return;
      }
      onSuccess({
        title:   'User Archived',
        message: `${user.firstName || user.name}'s account has been archived and removed from the user list.`,
        userId:  user._id,
      });
    } catch {
      onError({ title: 'Network Error', message: 'Could not connect to the server.' });
      setLoading(false);
    }
  };

  const iS = (field) => ({
    width: '100%', background: th.surf2, border: `1px solid ${err && field === 'adminPassword' ? '#ef4444' : th.border}`,
    borderRadius: 10, padding: '9px 12px', fontSize: 13, color: th.pri,
    fontFamily: "'Poppins',sans-serif", outline: 'none', boxSizing: 'border-box',
  });

  if (step === 'confirm') return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(e) => e.target === e.currentTarget && setStep('form')}>
      <div style={{ background: th.surface, borderRadius: 22, width: '100%', maxWidth: 400, border: `1px solid ${th.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.4)', overflow: 'hidden', animation: 'statusModalIn 0.22s cubic-bezier(0.16,1,0.3,1)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 28px 28px' }}>
        <div style={{ width: 62, height: 62, borderRadius: '50%', background: 'rgba(180,83,9,0.12)', border: '1.5px solid rgba(180,83,9,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
          <Archive size={28} style={{ color: '#b45309' }} />
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: th.pri, margin: '0 0 8px', textAlign: 'center' }}>Confirm Archive?</h3>
        <p style={{ fontSize: 13, color: th.sec, margin: '0 0 20px', textAlign: 'center', lineHeight: 1.55 }}>
          You are about to <strong style={{ color: '#b45309' }}>archive</strong> the account of{' '}
          <strong style={{ color: th.pri }}>{user.firstName ? `${user.firstName} ${user.surname || ''}`.trim() : user.name}</strong>.
        </p>
        <div style={{ width: '100%', background: th.surf2, border: `1px solid ${th.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'User',   value: user.firstName ? `${user.firstName} ${user.surname || ''}`.trim() : user.name },
            { label: 'Role',   value: user.role },
            { label: 'Action', value: 'Move to Archive → Users Tab', color: '#b45309' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: th.muted, flexShrink: 0, marginTop: 7 }} />
              <span style={{ fontSize: 13, color: th.sec, lineHeight: 1.4 }}>
                <strong style={{ color: th.pri }}>{item.label}:</strong>{' '}
                <span style={{ color: item.color || th.sec }}>{item.value}</span>
              </span>
            </div>
          ))}
        </div>
        <div style={{ width: '100%', background: 'rgba(180,83,9,0.07)', border: '1px solid rgba(180,83,9,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>📦</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: th.sec }}>This account will be removed from the user list and moved to the Archive → Users tab.</span>
        </div>
        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <button onClick={() => setStep('form')} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: `1.5px solid ${th.border}`, background: th.surf2, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: th.sec, fontFamily: "'Poppins',sans-serif" }}>← Back</button>
          <button onClick={handleConfirm} disabled={loading} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#78350f,#b45309)', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: "'Poppins',sans-serif", boxShadow: '0 3px 10px rgba(180,83,9,0.35)', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            {loading ? <><Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Archiving…</> : <><Archive size={14} /> Yes, Archive</>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: th.surface, borderRadius: 22, width: '100%', maxWidth: 440, border: `1px solid ${th.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden', animation: 'statusModalIn 0.22s cubic-bezier(0.16,1,0.3,1)' }}>
        {/* Header */}
        <div style={{ background: 'rgba(180,83,9,0.08)', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${th.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(180,83,9,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309' }}>
              <Archive size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: th.pri, margin: 0 }}>Archive Account</h2>
              <p style={{ fontSize: 11, color: th.sec, margin: '2px 0 0' }}>{user.firstName || user.name} · {user.role}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: th.surf2, border: `1px solid ${th.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: th.sec }}><X size={14} /></button>
        </div>
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Info box */}
          <div style={{ padding: '12px 14px', background: 'rgba(180,83,9,0.06)', border: '1px solid rgba(180,83,9,0.2)', borderRadius: 11, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <Archive size={13} style={{ color: '#b45309', flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: th.sec, margin: 0, lineHeight: 1.6 }}>
              Archiving will <strong style={{ color: th.pri }}>remove this account from the active user list</strong> and move it to the <strong style={{ color: th.pri }}>Archive → Users</strong> tab. The user's data and history are preserved.
            </p>
          </div>
          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: th.sec, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Lock size={12} /> Your Password to Confirm <span style={{ color: '#ef4444', fontSize: 11 }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Your account password"
                value={adminPassword}
                onChange={e => { setAdminPassword(e.target.value); if (err) setErr(''); }}
                style={{ ...iS('adminPassword'), paddingRight: 38 }}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: th.sec, display: 'flex', padding: 2 }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {err && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ef4444' }}><AlertCircle size={11} />{err}</span>}
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding: '14px 22px 20px', display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: `1px solid ${th.border}` }}>
          <button onClick={onClose} style={{ background: th.surf2, border: `1px solid ${th.border}`, borderRadius: 10, padding: '9px 18px', fontSize: 13, fontWeight: 500, color: th.pri, cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}>Cancel</button>
          <button onClick={handleProceed} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#78350f,#b45309)', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", boxShadow: '0 2px 8px rgba(180,83,9,0.3)' }}>
            <Archive size={14} /> Review & Archive
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
const UserCreation = () => {
  const [activeRole,    setActiveRole]    = useState(null);
  const [showPicker,    setShowPicker]    = useState(false);
  const [roleCounts,    setRoleCounts]    = useState({});
  const [countsLoading, setCountsLoading] = useState(true);
  const [viewMode,      setViewMode]      = useState('card');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [sortOrder,     setSortOrder]     = useState('asc');
  const [darkMode,      setDarkMode]      = useState(getDarkModeFromStorage);
  const [statusTarget,  setStatusTarget]  = useState(null);
  const [viewTarget,    setViewTarget]    = useState(null); // ← user to view details
  const [archiveTarget, setArchiveTarget] = useState(null); // ← user to archive
  const [userList,      setUserList]      = useState([]);
  const [toasts,        setToasts]        = useState([]);

  const th = T(darkMode);

  const addToast = (type, title, message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    const h = (e) => setDarkMode(e.detail.darkMode);
    window.addEventListener('darkModeChange', h);
    return () => window.removeEventListener('darkModeChange', h);
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      const s = localStorage.getItem('darkMode');
      if (s !== null) setDarkMode(p => (s === 'true') !== p ? s === 'true' : p);
    }, 300);
    return () => clearInterval(id);
  }, []);

  const ROLE_DB = {
    innovation: 'Innovation', audit: 'Audit and Compliance', hr: 'Human Resource',
    accounting: 'Accounting', recruitment: 'Recruitment', creatives: 'Creatives',
    marketing: 'Marketing', operations: 'Operations', user: 'User',
  };

  const fetchCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res   = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data  = await res.json();
      const list  = data.users || data.admins || [];
      const c = {};
      list.forEach(u => { if (u.role) c[u.role] = (c[u.role] || 0) + 1; });
      setRoleCounts(c);
      setUserList(list);
    } catch (e) { console.error(e); }
    finally { setCountsLoading(false); }
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const getCount        = (id) => roleCounts[ROLE_DB[id]] ?? 0;
  const totalUsers      = ROLES.reduce((s, r) => s + getCount(r.id), 0);
  const totalRoles      = ROLES.length;
  const mostPopularRole = [...ROLES].sort((a, b) => getCount(b.id) - getCount(a.id))[0];

  const filteredRoles = [...(searchQuery.trim()
    ? ROLES.filter(r =>
        r.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.access.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()))
    : ROLES
  )].sort((a, b) => sortOrder === 'asc' ? a.label.localeCompare(b.label) : b.label.localeCompare(a.label));

  const Skeleton = () => (
    <span style={{ display: 'inline-block', width: 40, height: 18, borderRadius: 6, background: th.border, animation: 'pulse 1.5s ease-in-out infinite' }} />
  );

  return (
    <div style={{ minHeight: '100vh', background: th.bg, fontFamily: "'Poppins',sans-serif", padding: 24, boxSizing: 'border-box', transition: 'background 0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        * { font-family:'Poppins',sans-serif !important; box-sizing:border-box !important; }
        @keyframes spin  { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes toastSlideIn { from { opacity:0; transform:translateX(50px) scale(0.95); } to { opacity:1; transform:translateX(0) scale(1); } }
        @keyframes toastProgress { from { width:100%; } to { width:0%; } }
        @keyframes statusModalIn { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }

        .uc-role-card:hover  { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,${darkMode?'0.35':'0.1'}) !important; }
        .uc-list-row:hover   { background:${darkMode?'#22263a':'#f9fafb'} !important; }
        .uc-user-row:hover   { background:${darkMode?'rgba(255,255,255,0.03)':'#fafafa'} !important; }
        .uc-picker-item:hover{ background:${darkMode?'#22263a':'#f3f4f6'} !important; border-color:${darkMode?'#3a3f58':'#e5e7eb'} !important; }
        .uc-add-btn:hover    { filter:brightness(1.1); transform:translateY(-1px); }
        .uc-filter-btn:hover { background:${darkMode?'#2e3347':'#f3f4f6'} !important; color:${darkMode?'#e2e8f0':'#374151'} !important; }
        .uc-view-btn:hover   { background:${darkMode?'#2e3347':'#f3f4f6'} !important; color:${darkMode?'#e2e8f0':'#374151'} !important; }
        .uc-create-btn:hover { background:#9a0000 !important; }
        .uc-icon-btn:hover   { background:${darkMode?'#2e3347':'#f3f4f6'} !important; }
        .uc-stat-card:hover  { transform:translateY(-2px); }
        input:focus, textarea:focus { border-color:#bb0000 !important; box-shadow:0 0 0 3px rgba(187,0,0,0.1) !important; }
        ::-webkit-scrollbar       { width:5px; }
        ::-webkit-scrollbar-track { background:${darkMode?'#0f1117':'#f8fafc'}; }
        ::-webkit-scrollbar-thumb { background:${darkMode?'#2e3347':'#e2e8f0'}; border-radius:3px; }

        @media (max-width:900px)  { .uc-stats-grid { grid-template-columns:repeat(2,1fr) !important; } }
        @media (max-width:700px)  {
          .uc-roles-grid  { grid-template-columns:1fr 1fr !important; }
          .uc-form-grid   { grid-template-columns:1fr !important; }
          .uc-list-header { display:none !important; }
          .uc-list-row    { grid-template-columns:1fr 80px !important; }
          .uc-list-desc   { display:none !important; }
          .uc-list-count  { display:none !important; }
          .uc-toolbar     { flex-direction:column !important; align-items:stretch !important; }
          .uc-toolbar-right{ justify-content:flex-end !important; }
        }
        @media (max-width:480px)  {
          .uc-roles-grid { grid-template-columns:1fr !important; }
          .uc-stats-grid { grid-template-columns:1fr !important; }
        }
      `}</style>

      <ToastContainer toasts={toasts} removeToast={removeToast} dark={darkMode} />

      {/* BREADCRUMB */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: th.sec, marginBottom: 6 }}>
        <LayoutGrid size={13} style={{ color: th.sec }} />
        <span>Dashboard</span>
        <span style={{ opacity: 0.5 }}>/</span>
        <span>User Creation</span>
      </div>

      {/* PAGE TITLE */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: th.pri, margin: '0 0 4px', lineHeight: 1.2 }}>User Creation</h1>
        <p style={{ fontSize: 13, color: th.sec, margin: 0 }}>View, filter, and manage all user accounts</p>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }} className="uc-stats-grid">
        {[
          { label: 'TOTAL USERS',  value: totalUsers,                                            icon: <Users size={20} />,     gradient: 'linear-gradient(135deg,#4a0a0a 0%,#bb0000 100%)', shadow: '0 4px 20px rgba(187,0,0,0.3)' },
          { label: 'ROLES',        value: totalRoles,                                            icon: <ShieldCheck size={20}/>, iconBg: 'rgba(8,145,178,0.1)',  iconColor: '#0891b2' },
          { label: 'MOST STAFFED', value: getCount(mostPopularRole.id), sub: mostPopularRole.label, icon: <UserCheck size={20}/>, iconBg: 'rgba(5,150,105,0.1)', iconColor: '#059669' },
          { label: 'EMPTY ROLES',  value: ROLES.filter(r => getCount(r.id) === 0).length,       icon: <Activity size={20} />,  iconBg: 'rgba(245,158,11,0.1)', iconColor: '#f59e0b' },
          { label: 'INACTIVE',     value: userList.filter(u => u.isActive === false).length,    icon: <UserX size={20} />,     iconBg: 'rgba(220,38,38,0.1)',  iconColor: '#dc2626' },
        ].map((s, i) => (
          <div key={i} className="uc-stat-card" style={{ background: s.gradient || th.surface, borderRadius: 16, padding: '22px 20px', border: !s.gradient && darkMode ? `1px solid ${th.border}` : 'none', boxShadow: s.shadow || th.shadow, transition: 'transform 0.2s', cursor: 'default' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: s.gradient ? 'rgba(255,255,255,0.15)' : s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: s.gradient ? '#fca5a5' : s.iconColor }}>{s.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 400, color: s.gradient ? 'rgba(255,210,210,0.65)' : th.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 34, fontWeight: 700, color: s.gradient ? 'rgba(255,255,255,0.9)' : th.pri, lineHeight: 1 }}>
              {countsLoading ? <span style={{ fontSize: 20, color: s.gradient ? 'rgba(255,200,200,0.6)' : th.muted }}>…</span> : s.value}
            </div>
            {s.sub && <div style={{ fontSize: 11, color: th.sec, marginTop: 4 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div className="uc-toolbar" style={{ background: th.surface, borderRadius: 14, padding: '10px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, border: `1px solid ${th.border}`, boxShadow: th.shadow, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: th.surf2, borderRadius: 9, padding: '7px 12px', minWidth: 180, border: `1px solid ${th.border}` }}>
            <Search size={13} style={{ color: th.sec, flexShrink: 0 }} />
            <input type="text" placeholder="Search roles…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', fontSize: 12, color: th.pri, fontFamily: "'Poppins',sans-serif", flex: 1, width: '100%' }} />
            {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: th.sec, display: 'flex', padding: 0 }}><X size={12} /></button>}
          </div>
          <button className="uc-filter-btn" onClick={() => setSortOrder(s => s === 'asc' ? 'desc' : 'asc')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: th.surf2, border: `1px solid ${th.border}`, borderRadius: 9, padding: '7px 13px', fontSize: 12, fontWeight: 400, color: th.sec, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            <ArrowUpDown size={13} /> {sortOrder === 'asc' ? 'A → Z' : 'Z → A'} <ChevronDown size={12} />
          </button>
        </div>
        <div className="uc-toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button className="uc-icon-btn" onClick={fetchCounts} title="Refresh" style={{ width: 34, height: 34, borderRadius: 9, background: th.surf2, border: `1px solid ${th.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: th.sec, transition: 'all 0.15s', flexShrink: 0 }}>
            <RefreshCw size={14} style={{ animation: countsLoading ? 'spin 0.8s linear infinite' : 'none' }} />
          </button>
          <div style={{ width: 1, height: 22, background: th.border }} />
          <button className="uc-view-btn" onClick={() => setViewMode('card')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: viewMode === 'card' ? 600 : 400, background: viewMode === 'card' ? th.surf2 : 'transparent', color: viewMode === 'card' ? th.pri : th.sec, transition: 'all 0.15s', fontFamily: "'Poppins',sans-serif" }}>
            <LayoutGrid size={13} /> Cards
          </button>
          <button className="uc-view-btn" onClick={() => setViewMode('list')} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: viewMode === 'list' ? 600 : 400, background: viewMode === 'list' ? th.surf2 : 'transparent', color: viewMode === 'list' ? th.pri : th.sec, transition: 'all 0.15s', fontFamily: "'Poppins',sans-serif" }}>
            <List size={13} /> List
          </button>
          <div style={{ width: 1, height: 22, background: th.border }} />
          <button className="uc-create-btn" onClick={() => setShowPicker(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#bb0000', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            <Plus size={15} /> Add New User
          </button>
        </div>
      </div>

      {/* CARD VIEW */}
      {viewMode === 'card' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 14 }} className="uc-roles-grid">
          {filteredRoles.map(role => (
            <div key={role.id} className="uc-role-card" style={{ background: th.surface, borderRadius: 18, overflow: 'hidden', border: `1px solid ${th.border}`, boxShadow: th.shadow, transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ background: role.accentBg, padding: '18px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `${role.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.accent }}><role.icon size={20} /></div>
                <span style={{ fontSize: 10, fontWeight: 600, color: role.accent, background: `${role.accent}18`, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.03em' }}>{role.access}</span>
              </div>
              <div style={{ padding: '14px 18px 10px' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: th.pri, margin: '0 0 5px' }}>{role.label}</h3>
                <p style={{ fontSize: 12, color: th.sec, margin: 0, lineHeight: 1.55 }}>{role.description}</p>
              </div>
              <div style={{ padding: '12px 18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${th.border2}` }}>
                <div>
                  {countsLoading ? <Skeleton /> : <span style={{ fontSize: 22, fontWeight: 700, color: role.accent, display: 'block', lineHeight: 1 }}>{getCount(role.id)}</span>}
                  <span style={{ fontSize: 11, color: th.sec, display: 'block', marginTop: 2 }}>accounts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {userList.filter(u => u.role === ROLE_DB[role.id]).length > 0 && (
                    <button onClick={() => setStatusTarget({ roleFilter: role.id })} style={{ display: 'flex', alignItems: 'center', gap: 4, background: th.surf2, color: th.sec, border: `1px solid ${th.border}`, borderRadius: 9, padding: '8px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", transition: 'all 0.2s' }}>
                      <Users size={13} /> Manage
                    </button>
                  )}
                  <button className="uc-add-btn" onClick={() => setActiveRole(role)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: `linear-gradient(135deg,${role.accent}cc,${role.accent})`, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", transition: 'all 0.2s', boxShadow: `0 2px 8px ${role.accent}44` }}>
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredRoles.length === 0 && <div style={{ gridColumn: '1/-1', padding: 40, textAlign: 'center', color: th.sec, fontSize: 13 }}>No roles match your search.</div>}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div style={{ background: th.surface, borderRadius: 18, border: `1px solid ${th.border}`, boxShadow: th.shadow, overflow: 'hidden' }}>
          <div className="uc-list-header" style={{ display: 'grid', gridTemplateColumns: '2fr 1.8fr 1fr 100px', gap: 12, padding: '11px 20px', background: th.surf2, borderBottom: `1px solid ${th.border}`, fontSize: 11, fontWeight: 600, color: th.sec, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Role</span><span className="uc-list-desc">Description</span><span className="uc-list-count">Accounts</span><span>Action</span>
          </div>
          {filteredRoles.map((role, idx) => (
            <div key={role.id} className="uc-list-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1.8fr 1fr 100px', gap: 12, padding: '14px 20px', borderBottom: idx === filteredRoles.length - 1 ? 'none' : `1px solid ${th.border2}`, alignItems: 'center', transition: 'background 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: role.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.accent, flexShrink: 0 }}><role.icon size={16} /></div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: th.pri }}>{role.label}</div>
                  <div style={{ fontSize: 11, color: th.sec }}>{role.access}</div>
                </div>
              </div>
              <div className="uc-list-desc" style={{ fontSize: 12, color: th.sec, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{role.description}</div>
              <div className="uc-list-count">
                {countsLoading ? <Skeleton /> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${role.accent}18`, color: role.accent, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20 }}><Users size={10} /> {getCount(role.id)}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {userList.filter(u => u.role === ROLE_DB[role.id]).length > 0 && (
                  <button onClick={() => setStatusTarget({ roleFilter: role.id })} style={{ display: 'flex', alignItems: 'center', gap: 4, background: th.surf2, color: th.sec, border: `1px solid ${th.border}`, borderRadius: 8, padding: '7px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                    <Users size={12} /> Manage
                  </button>
                )}
                <button className="uc-add-btn" onClick={() => setActiveRole(role)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: `linear-gradient(135deg,${role.accent}cc,${role.accent})`, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", transition: 'all 0.2s', whiteSpace: 'nowrap', boxShadow: `0 2px 6px ${role.accent}40` }}>
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>
          ))}
          {filteredRoles.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: th.sec, fontSize: 13 }}>No roles match your search.</div>}
        </div>
      )}

      {/* CREATION MODAL */}
      {activeRole && (
        <CreationModal role={activeRole} th={th}
          onClose={() => { setActiveRole(null); fetchCounts(); }}
          onSuccess={({ title, message }) => { fetchCounts(); addToast('success', title, message); }}
          onError={({ title, message }) => addToast('error', title, message)}
        />
      )}

      {/* USER LIST MODAL — per role */}
      {statusTarget?.roleFilter && (() => {
        const roleObj   = ROLES.find(r => r.id === statusTarget.roleFilter);
        const RoleIcon  = roleObj?.icon || Users;
        const roleUsers = userList.filter(u => u.role === ROLE_DB[statusTarget.roleFilter]);
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(e) => e.target === e.currentTarget && setStatusTarget(null)}>
            <div style={{ background: th.surface, borderRadius: 22, width: '100%', maxWidth: 580, maxHeight: '82vh', border: `1px solid ${th.border}`, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'statusModalIn 0.22s cubic-bezier(0.16,1,0.3,1)' }}>

              {/* Header */}
              <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${th.border}`, background: roleObj?.accentBg, flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${roleObj?.accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: roleObj?.accent }}><RoleIcon size={18} /></div>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: th.pri, margin: 0 }}>{roleObj?.label} Accounts</h2>
                    <p style={{ fontSize: 11, color: th.sec, margin: '2px 0 0' }}>
                      {roleUsers.length} user{roleUsers.length !== 1 ? 's' : ''} · Click <strong>View</strong> for details or <strong>change status</strong>
                    </p>
                  </div>
                </div>
                <button onClick={() => setStatusTarget(null)} style={{ width: 30, height: 30, borderRadius: 8, background: th.surf2, border: `1px solid ${th.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: th.sec }}><X size={14} /></button>
              </div>

              {/* User list */}
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {roleUsers.length === 0
                  ? <div style={{ padding: 40, textAlign: 'center', color: th.sec, fontSize: 13 }}>No users found for this role.</div>
                  : roleUsers.map((u, idx) => {
                      const active = u.isActive !== false;
                      return (
                        <div key={u._id} className="uc-user-row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 22px', borderBottom: idx === roleUsers.length - 1 ? 'none' : `1px solid ${th.border}`, transition: 'background 0.12s' }}>
                          {/* Avatar */}
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${roleObj?.accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: roleObj?.accent, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                            {(u.firstName || u.name || '?')[0].toUpperCase()}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: th.pri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.firstName ? `${u.firstName} ${u.surname || ''}`.trim() : u.name}
                            </div>
                            <div style={{ fontSize: 11, color: th.sec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                          </div>

                          {/* Right side controls */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            {/* Status badge */}
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, background: active ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)', color: active ? '#16a34a' : '#dc2626', border: `1px solid ${active ? 'rgba(22,163,74,0.3)' : 'rgba(220,38,38,0.3)'}` }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#16a34a' : '#dc2626' }} />
                              {active ? 'Active' : 'Inactive'}
                            </span>

                            {/* View button → opens ViewUserModal */}
                            <button onClick={() => setViewTarget(u)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, border: `1px solid ${th.border}`, background: th.surf2, color: th.sec, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", transition: 'all 0.15s' }}>
                              <FileText size={12} /> View
                            </button>

                            {/* Change status button */}
                            <button onClick={() => setStatusTarget({ user: u })} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', borderRadius: 8, border: `1px solid ${active ? 'rgba(220,38,38,0.3)' : 'rgba(22,163,74,0.3)'}`, background: active ? 'rgba(220,38,38,0.08)' : 'rgba(22,163,74,0.08)', color: active ? '#dc2626' : '#16a34a', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Poppins',sans-serif", transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
                              {active ? <><ToggleLeft size={13} /> Deactivate</> : <><ToggleRight size={13} /> Activate</>}
                            </button>
                          </div>
                        </div>
                      );
                    })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* VIEW USER MODAL */}
      {viewTarget && (
        <ViewUserModal
          user={viewTarget}
          roleObj={ROLES.find(r => ROLE_DB[r.id] === viewTarget.role)}
          th={th}
          onClose={() => setViewTarget(null)}
          onArchive={(u) => {
            setViewTarget(null);
            setArchiveTarget(u);
          }}
          onChangeStatus={(u) => {
            setViewTarget(null);
            setStatusTarget({ user: u, fromView: true });
          }}
        />
      )}

      {/* ARCHIVE MODAL */}
      {archiveTarget && (
        <ArchiveModal
          user={archiveTarget}
          th={th}
          onClose={() => setArchiveTarget(null)}
          onSuccess={({ title, message, userId }) => {
            setUserList(prev => prev.filter(u => u._id !== userId));
            setArchiveTarget(null);
            addToast('success', title, message);
            fetchCounts();
          }}
          onError={({ title, message }) => addToast('error', title, message)}
        />
      )}

      {/* STATUS MODAL */}
      {statusTarget?.user && (
        <StatusModal
          user={statusTarget.user}
          th={th}
          onClose={() => setStatusTarget(prev => prev?.roleFilter ? { roleFilter: prev.roleFilter } : null)}
          onSuccess={({ title, message, updated }) => {
            setUserList(prev => prev.map(u => u._id === updated._id ? updated : u));
            setStatusTarget(null);
            addToast('success', title, message);
            // If triggered from ViewUserModal, re-open it so history refreshes
            if (statusTarget.fromView) setViewTarget(updated);
          }}
          onError={({ title, message }) => addToast('error', title, message)}
        />
      )}

      {/* ROLE PICKER */}
      {showPicker && (
        <RolePicker th={th} getCount={getCount} countsLoading={countsLoading}
          onSelect={(role) => { setShowPicker(false); setActiveRole(role); }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};

export default UserCreation;