import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Briefcase, Lock, Save, Eye, EyeOff,
  CheckCircle, AlertCircle, X, ShieldCheck, RefreshCw, Upload,
} from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getDark = () => {
  const s = localStorage.getItem('darkMode');
  if (s !== null) return s === 'true';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
};

const T = (dark) => ({
  bg:      dark ? '#0c0b0b' : '#f1f4f9',
  surface: dark ? '#1a1d27' : '#ffffff',
  surf2:   dark ? '#22263a' : '#f4f6fb',
  border:  dark ? '#2e3347' : '#e3e8f0',
  border2: dark ? '#252840' : '#edf0f7',
  pri:     dark ? '#e2e8f0' : '#111827',
  sec:     dark ? '#94a3b8' : '#6b7280',
  muted:   dark ? '#64748b' : '#9ca3af',
  shadow:  dark
    ? '0 2px 8px rgba(0,0,0,0.45),0 8px 32px rgba(0,0,0,0.35)'
    : '0 2px 8px rgba(60,80,140,0.07),0 8px 24px rgba(60,80,140,0.05)',
});

/* ─── bullet-proof button base — all:unset escapes global CSS completely ─── */
const BASE_BTN = {
  all: 'unset',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  cursor: 'pointer',
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 600,
  fontSize: 13,
  borderRadius: 10,
  padding: '10px 22px',
  transition: 'filter 0.18s, transform 0.18s, opacity 0.18s',
  boxSizing: 'border-box',
  lineHeight: '1',
  whiteSpace: 'nowrap',
};

const BTN = {
  primary:    { ...BASE_BTN, background: 'linear-gradient(135deg,#6d0000,#bb0000)', color: '#fff', boxShadow: '0 3px 14px rgba(187,0,0,0.38)' },
  ghost:      { ...BASE_BTN, background: 'transparent', color: '#6b7280', border: '1.5px solid #e3e8f0' },
  outlineRed: { ...BASE_BTN, background: 'rgba(187,0,0,0.07)', color: '#bb0000', border: '1.5px solid rgba(187,0,0,0.35)' },
  blue:       { ...BASE_BTN, background: 'linear-gradient(135deg,#0050A0,#0078D4)', color: '#fff', boxShadow: '0 3px 14px rgba(0,120,212,0.38)' },
  green:      { ...BASE_BTN, background: 'linear-gradient(135deg,#14532d,#16a34a)', color: '#fff', boxShadow: '0 3px 14px rgba(22,163,74,0.38)' },
  redSolid:   { ...BASE_BTN, background: 'linear-gradient(135deg,#991b1b,#dc2626)', color: '#fff', boxShadow: '0 3px 14px rgba(220,38,38,0.38)' },
  disconnect: { ...BASE_BTN, background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.32)' },
  connect:    { ...BASE_BTN, background: 'linear-gradient(135deg,#0050A0,#0078D4)', color: '#fff', boxShadow: '0 3px 14px rgba(0,120,212,0.38)', width: '100%', justifyContent: 'center' },
  disabled:   { ...BASE_BTN, background: '#d1d5db', color: '#9ca3af', cursor: 'not-allowed', boxShadow: 'none' },
};

const iBase = (th, disabled) => ({
  all: 'unset',
  display: 'block',
  width: '100%',
  background: disabled ? (th.surf2) : th.surf2,
  border: `1.5px solid ${th.border}`,
  borderRadius: 10,
  padding: '10px 14px',
  fontSize: 13,
  color: disabled ? th.muted : th.pri,
  fontFamily: "'Poppins', sans-serif",
  boxSizing: 'border-box',
  transition: 'border-color 0.18s, box-shadow 0.18s',
  opacity: disabled ? 0.65 : 1,
  cursor: disabled ? 'not-allowed' : 'text',
});

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [dark, setDark] = useState(getDark);
  const th = T(dark);

  const [profilePicture, setProfilePicture] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('');

  const [profileOtpModal, setProfileOtpModal] = useState(false);
  const [profileOtpLoading, setProfileOtpLoading] = useState(false);
  const [profileOtp, setProfileOtp] = useState(['','','','','','']);
  const [profileOtpCountdown, setProfileOtpCountdown] = useState(0);
  const [pendingProfileData, setPendingProfileData] = useState(null);
  const profileOtpRefs = useRef([]);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [otpModal, setOtpModal] = useState(false);
  const [otpStep, setOtpStep] = useState('otp');
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState(['','','','','','']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const otpRefs = useRef([]);

  const [outlookConnected, setOutlookConnected] = useState(false);
  const [outlookEmail, setOutlookEmail] = useState('');
  const [outlookConnectedSince, setOutlookConnectedSince] = useState('');
  const [disconnecting, setDisconnecting] = useState(false);
  const [connectingOutlook, setConnectingOutlook] = useState(false);
  const [disconnectModal, setDisconnectModal] = useState(false);
  const [disconnectPassword, setDisconnectPassword] = useState('');
  const [showDisconnectPassword, setShowDisconnectPassword] = useState(false);
  const [disconnectPasswordError, setDisconnectPasswordError] = useState('');
  const [verifyingDisconnect, setVerifyingDisconnect] = useState(false);

  const [connectOtpModal, setConnectOtpModal] = useState(false);
  const [connectOtp, setConnectOtp] = useState(['','','','','','']);
  const [connectOtpLoading, setConnectOtpLoading] = useState(false);
  const [connectOtpCountdown, setConnectOtpCountdown] = useState(0);
  const connectOtpRefs = useRef([]);

  // dark mode sync (same as UserCreation)
  useEffect(() => {
    const h = (e) => setDark(e.detail.darkMode);
    window.addEventListener('darkModeChange', h);
    return () => window.removeEventListener('darkModeChange', h);
  }, []);
  useEffect(() => {
    const id = setInterval(() => {
      const s = localStorage.getItem('darkMode');
      if (s !== null) setDark(p => (s === 'true') !== p ? s === 'true' : p);
    }, 300);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const t = setTimeout(() => setOtpCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCountdown]);
  useEffect(() => {
    if (profileOtpCountdown <= 0) return;
    const t = setTimeout(() => setProfileOtpCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [profileOtpCountdown]);
  useEffect(() => {
    if (connectOtpCountdown <= 0) return;
    const t = setTimeout(() => setConnectOtpCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [connectOtpCountdown]);

  useEffect(() => { fetchAdminData(); }, []);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('outlook_connected') === '1') {
      fetchAdminData();
      showMessage('Outlook connected successfully!', 'success');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('outlook_error')) {
      showMessage('Outlook connection failed: ' + decodeURIComponent(params.get('outlook_error')), 'error');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      if (!token) { navigate('/admin/login'); return; }
      const response = await fetch(`${API}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        if (response.status === 401) { localStorage.removeItem('adminToken'); localStorage.removeItem('adminData'); navigate('/admin/login'); return; }
        throw new Error('Failed to fetch admin data');
      }
      const data = await response.json();
      const admin = data.admin;
      setAdminData(admin);
      const nameParts = (admin.name || '').trim().split(' ').filter(Boolean);
      setFirstName(nameParts[0] || '');
      setMiddleName(nameParts.length >= 3 ? nameParts.slice(1, -1).join(' ') : '');
      setLastName(nameParts.length >= 2 ? nameParts[nameParts.length - 1] : '');
      setEmail(admin.email || '');
      setPosition(admin.role || '');
      setProfilePicture(admin.profilePicture || '');
      try {
        const outlookRes = await fetch(`${API}/outlook/status`, { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
        if (outlookRes.ok) {
          const od = await outlookRes.json();
          if (od.connected) {
            setOutlookConnected(true); setOutlookEmail(od.email || '');
            setOutlookConnectedSince(od.connectedAt ? new Date(od.connectedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
          } else { setOutlookConnected(false); setOutlookEmail(''); setOutlookConnectedSince(''); }
        }
      } catch { /* non-fatal */ }
      localStorage.setItem('adminData', JSON.stringify(admin));
    } catch { showMessage('Failed to load profile data. Please try again.', 'error'); }
    finally { setLoading(false); }
  };

  const showMessage = (text, type = 'success') => { setMessage({ text, type }); setTimeout(() => setMessage(null), 5000); };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { showMessage('Invalid image format. Only JPEG, JPG, PNG, and WEBP are allowed.', 'error'); e.target.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { showMessage('Image size should be less than 5MB', 'error'); e.target.value = ''; return; }
    const reader = new FileReader();
    reader.onloadend = () => { setProfilePicture(reader.result); showMessage('Profile picture selected successfully!', 'success'); };
    reader.onerror = () => showMessage('Failed to read image file. Please try again.', 'error');
    reader.readAsDataURL(file);
  };

  const validateName = (name, fieldName) => {
    if (!name.trim()) { showMessage(`${fieldName} is required`, 'error'); return false; }
    if (!/^[a-zA-Z\s]+$/.test(name)) { showMessage(`${fieldName} should contain only letters`, 'error'); return false; }
    if (name.trim().length > 20) { showMessage(`${fieldName} should not exceed 20 characters`, 'error'); return false; }
    return true;
  };
  const handleFirstNameChange = (e) => { const v = e.target.value; if (v.length <= 20 && (/^[a-zA-Z\s]*$/.test(v) || v === '')) setFirstName(v); else showMessage('First name should contain only letters (max 20 characters)', 'error'); };
  const handleMiddleNameChange = (e) => { const v = e.target.value; if (v.length <= 20 && (/^[a-zA-Z ]*$/.test(v) || v === '')) setMiddleName(v); else showMessage('Middle name should contain only letters (max 20 characters)', 'error'); };
  const handleLastNameChange = (e) => { const v = e.target.value; if (v.length <= 20 && (/^[a-zA-Z\s]*$/.test(v) || v === '')) setLastName(v); else showMessage('Last name should contain only letters (max 20 characters)', 'error'); };

  const handleAccountUpdate = async (e) => {
    e.preventDefault();
    if (!validateName(firstName, 'First name')) return;
    if (middleName.trim() && middleName.trim().length > 20) { showMessage('Middle name should not exceed 20 characters', 'error'); return; }
    if (!validateName(lastName, 'Last name')) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/admin/change-password/send-profile-otp`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (!res.ok) { showMessage(data.message || 'Failed to send OTP.', 'error'); return; }
      setPendingProfileData({ name: [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(' '), profilePicture });
      setProfileOtp(['','','','','','']); setProfileOtpCountdown(60); setProfileOtpModal(true);
    } catch { showMessage('Network error. Please try again.', 'error'); }
    finally { setSaving(false); }
  };

  const handleProfileOtpVerify = async (e) => {
    e.preventDefault();
    const otpValue = profileOtp.join('');
    if (otpValue.length < 6) { showMessage('Please enter the complete 6-digit OTP.', 'error'); return; }
    setProfileOtpLoading(true);
    try {
      const token = localStorage.getItem('adminToken'); const adminId = adminData.id || adminData._id;
      const vr = await fetch(`${API}/admin/change-password/verify-profile-otp`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ otp: otpValue }) });
      const vd = await vr.json();
      if (!vr.ok) { showMessage(vd.message || 'Invalid OTP.', 'error'); return; }
      const sr = await fetch(`${API}/admin/${adminId}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(pendingProfileData) });
      if (!sr.ok) { const se = await sr.json(); throw new Error(se.message || 'Failed to update profile'); }
      const sd = await sr.json();
      setAdminData(sd.admin); localStorage.setItem('adminData', JSON.stringify(sd.admin));
      closeProfileOtpModal(); showMessage('✓ Profile updated successfully!', 'success'); await fetchAdminData();
    } catch (error) { showMessage(error.message || 'Failed to update profile. Please try again.', 'error'); }
    finally { setProfileOtpLoading(false); }
  };

  const handleProfileOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const n = [...profileOtp]; n[index] = value.slice(-1); setProfileOtp(n);
    if (value && index < 5) profileOtpRefs.current[index + 1]?.focus();
  };
  const handleProfileOtpKeyDown = (index, e) => { if (e.key === 'Backspace' && !profileOtp[index] && index > 0) profileOtpRefs.current[index - 1]?.focus(); };
  const handleProfileOtpPaste = (e) => { e.preventDefault(); const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); const n = [...profileOtp]; p.split('').forEach((c, i) => { n[i] = c; }); setProfileOtp(n); profileOtpRefs.current[Math.min(p.length, 5)]?.focus(); };
  const handleProfileResendOtp = async () => {
    if (profileOtpCountdown > 0) return; setProfileOtpLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/admin/change-password/send-profile-otp`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (!res.ok) { showMessage(data.message || 'Failed to resend OTP.', 'error'); return; }
      setProfileOtp(['','','','','','']); setProfileOtpCountdown(60); showMessage('New OTP sent to your email.', 'success');
      setTimeout(() => profileOtpRefs.current[0]?.focus(), 100);
    } catch { showMessage('Network error. Please try again.', 'error'); }
    finally { setProfileOtpLoading(false); }
  };
  const closeProfileOtpModal = () => { setProfileOtpModal(false); setProfileOtp(['','','','','','']); setPendingProfileData(null); };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!currentPassword) { showMessage('Please enter your current password.', 'error'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/admin/change-password/verify-current`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword }) });
      const data = await res.json();
      if (!res.ok) { showMessage(data.message || 'Incorrect current password.', 'error'); return; }
      setOtpEmail(data.email || email); setOtp(['','','','','','']); setOtpStep('otp'); setOtpCountdown(60); setOtpModal(true);
    } catch { showMessage('Network error. Please try again.', 'error'); }
    finally { setSaving(false); }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const n = [...otp]; n[index] = value.slice(-1); setOtp(n);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };
  const handleOtpKeyDown = (index, e) => { if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus(); };
  const handleOtpPaste = (e) => { e.preventDefault(); const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); const n = [...otp]; p.split('').forEach((c, i) => { n[i] = c; }); setOtp(n); otpRefs.current[Math.min(p.length, 5)]?.focus(); };
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) { showMessage('Please enter the complete 6-digit OTP.', 'error'); return; }
    setOtpLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/admin/change-password/verify-otp`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ otp: otpValue }) });
      const data = await res.json();
      if (!res.ok) { showMessage(data.message || 'Invalid OTP.', 'error'); return; }
      setOtpStep('newpwd'); setNewPassword(''); setConfirmPassword('');
    } catch { showMessage('Network error. Please try again.', 'error'); }
    finally { setOtpLoading(false); }
  };
  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) { showMessage('Please fill in all fields.', 'error'); return; }
    if (newPassword.length < 6) { showMessage('Password must be at least 6 characters.', 'error'); return; }
    if (newPassword !== confirmPassword) { showMessage('Passwords do not match.', 'error'); return; }
    setOtpLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/admin/change-password/update`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword, confirmPassword }) });
      const data = await res.json();
      if (!res.ok) { showMessage(data.message || 'Failed to update password.', 'error'); return; }
      closeOtpModal(); handleCancelPasswordUpdate(); showMessage('✓ Password updated successfully!', 'success');
    } catch { showMessage('Network error. Please try again.', 'error'); }
    finally { setOtpLoading(false); }
  };
  const handleResendOtp = async () => {
    if (otpCountdown > 0) return; setOtpLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/admin/change-password/resend-otp`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (!res.ok) { showMessage(data.message || 'Failed to resend OTP.', 'error'); return; }
      setOtp(['','','','','','']); setOtpCountdown(60); showMessage('New OTP sent to your email.', 'success');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch { showMessage('Network error. Please try again.', 'error'); }
    finally { setOtpLoading(false); }
  };
  const closeOtpModal = () => { setOtpModal(false); setOtp(['','','','','','']); setNewPassword(''); setConfirmPassword(''); setOtpStep('otp'); };
  const handleCancelPasswordUpdate = () => { setCurrentPassword(''); setShowPasswordForm(false); };

  const handleConnectOutlook = async () => {
    setConnectingOutlook(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/admin/change-password/send-connect-outlook-otp`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (!res.ok) { showMessage(data.message || 'Failed to send OTP.', 'error'); return; }
      setConnectOtp(['','','','','','']); setConnectOtpCountdown(60); setConnectOtpModal(true);
    } catch { showMessage('Failed to send OTP. Please try again.', 'error'); }
    finally { setConnectingOutlook(false); }
  };
  const handleConnectOtpVerify = async (e) => {
    e.preventDefault();
    const otpValue = connectOtp.join('');
    if (otpValue.length < 6) { showMessage('Please enter the complete 6-digit OTP.', 'error'); return; }
    setConnectOtpLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const vr = await fetch(`${API}/admin/change-password/verify-connect-outlook-otp`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ otp: otpValue }) });
      const vd = await vr.json();
      if (!vr.ok) { showMessage(vd.message || 'Invalid OTP. Please try again.', 'error'); return; }
      const authRes = await fetch(`${API}/outlook/auth/start`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!authRes.ok) throw new Error('Failed to get auth URL');
      const { redirectUrl } = await authRes.json();
      window.location.href = redirectUrl;
    } catch { showMessage('Failed to start Outlook connection. Please try again.', 'error'); }
    finally { setConnectOtpLoading(false); }
  };
  const handleConnectOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const n = [...connectOtp]; n[index] = value.slice(-1); setConnectOtp(n);
    if (value && index < 5) connectOtpRefs.current[index + 1]?.focus();
  };
  const handleConnectOtpKeyDown = (index, e) => { if (e.key === 'Backspace' && !connectOtp[index] && index > 0) connectOtpRefs.current[index - 1]?.focus(); };
  const handleConnectOtpPaste = (e) => { e.preventDefault(); const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); const n = [...connectOtp]; p.split('').forEach((c, i) => { n[i] = c; }); setConnectOtp(n); connectOtpRefs.current[Math.min(p.length, 5)]?.focus(); };
  const handleConnectResendOtp = async () => {
    if (connectOtpCountdown > 0) return; setConnectOtpLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/admin/change-password/send-connect-outlook-otp`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      const data = await res.json();
      if (!res.ok) { showMessage(data.message || 'Failed to resend OTP.', 'error'); return; }
      setConnectOtp(['','','','','','']); setConnectOtpCountdown(60); showMessage('New OTP sent to your email.', 'success');
      setTimeout(() => connectOtpRefs.current[0]?.focus(), 100);
    } catch { showMessage('Network error. Please try again.', 'error'); }
    finally { setConnectOtpLoading(false); }
  };
  const closeConnectOtpModal = () => { setConnectOtpModal(false); setConnectOtp(['','','','','','']); };

  const handleDisconnectOutlook = () => { setDisconnectPassword(''); setDisconnectPasswordError(''); setShowDisconnectPassword(false); setDisconnectModal(true); };
  const handleConfirmDisconnect = async (e) => {
    e.preventDefault();
    if (!disconnectPassword.trim()) { setDisconnectPasswordError('Please enter your current password.'); return; }
    setVerifyingDisconnect(true); setDisconnectPasswordError('');
    try {
      const token = localStorage.getItem('adminToken');
      const vr = await fetch(`${API}/admin/change-password/verify-current`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: disconnectPassword }) });
      const vd = await vr.json();
      if (!vr.ok) { setDisconnectPasswordError(vd.message || 'Incorrect password. Please try again.'); return; }
      setDisconnecting(true);
      const res = await fetch(`${API}/outlook/disconnect`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Failed to disconnect');
      setOutlookConnected(false); setOutlookEmail(''); setOutlookConnectedSince('');
      setDisconnectModal(false); setDisconnectPassword(''); showMessage('Outlook disconnected successfully.', 'success');
    } catch { setDisconnectPasswordError('Failed to disconnect. Please try again.'); }
    finally { setVerifyingDisconnect(false); setDisconnecting(false); }
  };

  const getUserInitials = () => { if (!firstName && !lastName) return 'A'; return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase(); };
  const maskEmail = (e) => { if (!e) return ''; const [local, domain] = e.split('@'); if (!domain) return e; return `${local[0]}${'*'.repeat(Math.max(local.length - 2, 2))}${local[local.length - 1]}@${domain}`; };

  /* ─── SUB-COMPONENTS ─── */
  const OtpBox = ({ value, onChange, onKeyDown, onPaste, refFn, disabled, autoFocus }) => (
    <input ref={refFn} type="text" inputMode="numeric" maxLength={1} value={value}
      onChange={onChange} onKeyDown={onKeyDown} onPaste={onPaste} disabled={disabled} autoFocus={autoFocus}
      style={{
        all: 'unset', width: 48, height: 54, display: 'block', textAlign: 'center',
        fontSize: 22, fontWeight: 700, fontFamily: "'Poppins',sans-serif",
        background: value ? (dark ? 'rgba(187,0,0,0.15)' : 'rgba(187,0,0,0.08)') : th.surf2,
        border: `2.5px solid ${value ? '#bb0000' : th.border}`,
        borderRadius: 12, color: th.pri, boxSizing: 'border-box', cursor: 'text',
        boxShadow: value ? '0 0 0 3px rgba(187,0,0,0.13)' : 'none',
        transition: 'border-color 0.18s, box-shadow 0.18s, background 0.18s',
      }} />
  );

  const OtpRow = ({ arr, onChange, onKeyDown, onPaste, refs, disabled }) => (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '18px 0' }}>
      {arr.map((digit, i) => (
        <OtpBox key={i} value={digit} refFn={el => refs.current[i] = el}
          onChange={e => onChange(i, e.target.value)} onKeyDown={e => onKeyDown(i, e)}
          onPaste={i === 0 ? onPaste : undefined} disabled={disabled} autoFocus={i === 0} />
      ))}
    </div>
  );

  const ResendRow = ({ countdown, onResend, ld }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: th.sec, marginTop: 14, fontFamily: "'Poppins',sans-serif" }}>
      <span>Didn't receive the code?</span>
      <button onClick={onResend} disabled={countdown > 0 || ld}
        style={{ all: 'unset', display: 'inline-flex', alignItems: 'center', gap: 4, cursor: countdown > 0 || ld ? 'not-allowed' : 'pointer', color: countdown > 0 ? th.muted : '#bb0000', fontWeight: 600, fontSize: 12, fontFamily: "'Poppins',sans-serif" }}>
        <RefreshCw size={11} />
        {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
      </button>
    </div>
  );

  const ModalShell = ({ onClose, grad, icon, title, sub, children }) => (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(7px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: th.surface, borderRadius: 22, width: '100%', maxWidth: 440, border: `1px solid ${th.border}`, boxShadow: '0 32px 80px rgba(0,0,0,0.45)', overflow: 'hidden', animation: 'sModalIn 0.25s cubic-bezier(0.16,1,0.3,1)' }}>
        <div style={{ background: grad, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>{icon}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: "'Poppins',sans-serif" }}>{title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 2, fontFamily: "'Poppins',sans-serif" }}>{sub}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ all: 'unset', width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><X size={15} /></button>
        </div>
        <div style={{ padding: '24px 28px 28px' }}>{children}</div>
      </div>
    </div>
  );

  const IconInput = ({ icon: Icon, type = 'text', value, onChange, placeholder, disabled, showToggle, onToggle, showPass, errorMsg }) => (
    <div>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: th.muted, pointerEvents: 'none' }} />}
        <input type={showToggle ? (showPass ? 'text' : 'password') : type}
          value={value} onChange={onChange || (() => {})} placeholder={placeholder} disabled={disabled}
          style={{ ...iBase(th, disabled), paddingLeft: Icon ? 36 : 14, paddingRight: showToggle ? 38 : 14 }} />
        {showToggle && (
          <button type="button" onClick={onToggle}
            style={{ all: 'unset', position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: th.sec, display: 'flex' }}>
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, padding: '8px 12px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 8, fontSize: 12, color: '#dc2626', fontFamily: "'Poppins',sans-serif" }}>
          <AlertCircle size={13} style={{ flexShrink: 0 }} />{errorMsg}
        </div>
      )}
    </div>
  );

  if (loading) return (
    <div style={{ minHeight: '100vh', background: th.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: "'Poppins',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap'); @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 44, height: 44, border: `3px solid ${th.border}`, borderTopColor: '#bb0000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: th.sec, fontSize: 14, fontWeight: 500, margin: 0 }}>Loading settings…</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: th.bg, fontFamily: "'Poppins',sans-serif", padding: '28px', boxSizing: 'border-box', transition: 'background 0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        * { font-family:'Poppins',sans-serif !important; box-sizing:border-box !important; }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes sModalIn { from{opacity:0;transform:translateY(18px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes sToastIn { from{opacity:0;transform:translateX(60px) scale(0.95)}to{opacity:1;transform:translateX(0) scale(1)} }
        input[type=text]:focus,input[type=email]:focus,input[type=password]:focus,input[type=tel]:focus {
          border-color:#bb0000 !important; box-shadow:0 0 0 3px rgba(187,0,0,0.12) !important; outline:none !important;
        }
        .s-tab-on  { background:linear-gradient(135deg,#6d0000,#bb0000)!important;color:#fff!important;box-shadow:0 3px 14px rgba(187,0,0,0.38)!important; }
        .s-tab-off { background:transparent!important;color:#6b7280!important;box-shadow:none!important; }
        .s-tab-off:hover { background:${dark?'#22263a':'#f4f6fb'}!important;color:${dark?'#e2e8f0':'#111827'}!important; }
        .s-upload:hover { border-color:#bb0000!important;background:${dark?'rgba(187,0,0,0.07)':'rgba(187,0,0,0.03)'}!important; }
        .s-btn-p:hover:not([disabled]) { filter:brightness(1.12);transform:translateY(-1px); }
        .s-btn-g:hover:not([disabled]) { background:${dark?'#2e3347':'#e9edf5'}!important; }
        .s-btn-or:hover:not([disabled]){ background:rgba(187,0,0,0.13)!important; }
        .s-btn-b:hover:not([disabled]) { filter:brightness(1.1);transform:translateY(-1px); }
        .s-btn-rs:hover:not([disabled]){ filter:brightness(1.1);transform:translateY(-1px); }
        .s-btn-d:hover:not([disabled]) { background:rgba(220,38,38,0.14)!important; }
        .s-btn-cn:hover:not([disabled]){ filter:brightness(1.1);transform:translateY(-1px); }
        ::-webkit-scrollbar{width:5px}
        ::-webkit-scrollbar-track{background:${dark?'#0f1117':'#f8fafc'}}
        ::-webkit-scrollbar-thumb{background:${dark?'#2e3347':'#e2e8f0'};border-radius:3px}
      `}</style>

      {/* ── TOAST ── */}
      {message && (
        <div style={{ position:'fixed',top:20,right:24,zIndex:9999,display:'flex',alignItems:'flex-start',gap:11,padding:'13px 14px 13px 18px',borderRadius:14,minWidth:300,maxWidth:380,overflow:'hidden',background:dark?'#1e2330':'#fff',border:`1px solid ${dark?'rgba(255,255,255,0.08)':'#e5e7eb'}`,boxShadow:dark?'0 8px 32px rgba(0,0,0,0.5)':'0 8px 32px rgba(0,0,0,0.12)',animation:'sToastIn 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div style={{ position:'absolute',left:0,top:0,bottom:0,width:4,borderRadius:'14px 0 0 14px',background:message.type==='success'?'#16a34a':'#dc2626' }} />
          <div style={{ width:32,height:32,borderRadius:9,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',background:message.type==='success'?(dark?'rgba(22,163,74,0.15)':'#dcfce7'):(dark?'rgba(220,38,38,0.15)':'#fee2e2'),color:message.type==='success'?'#16a34a':'#dc2626' }}>
            {message.type==='success'?<CheckCircle size={16}/>:<AlertCircle size={16}/>}
          </div>
          <div style={{ flex:1,minWidth:0,paddingTop:1 }}>
            <div style={{ fontSize:13,fontWeight:700,color:dark?'#f9fafb':'#111827' }}>{message.type==='success'?'Success':'Error'}</div>
            <div style={{ fontSize:12,marginTop:2,color:th.sec,lineHeight:1.4 }}>{message.text}</div>
          </div>
          <button onClick={()=>setMessage(null)} style={{ all:'unset',cursor:'pointer',color:th.muted,display:'flex' }}><X size={13}/></button>
        </div>
      )}

      {/* ══ CONNECT OUTLOOK OTP MODAL ══ */}
      {connectOtpModal && (
        <ModalShell onClose={closeConnectOtpModal} grad="linear-gradient(135deg,#0050A0,#0078D4)"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="5" width="13" height="14" rx="2" fill="white" fillOpacity="0.9"/><rect x="10" y="2" width="13" height="14" rx="2" fill="white" fillOpacity="0.6"/><ellipse cx="7.5" cy="12" rx="2.8" ry="3.5" fill="#0078D4"/></svg>}
          title="Verify Your Identity" sub="Connect Microsoft Outlook">
          <p style={{ fontSize:13,color:th.sec,margin:'0 0 4px',lineHeight:1.6,textAlign:'center' }}>
            We sent a 6-digit OTP to <strong style={{ color:th.pri }}>{maskEmail(email)}</strong>.<br/>Enter it below to proceed.
          </p>
          <form onSubmit={handleConnectOtpVerify}>
            <OtpRow arr={connectOtp} onChange={handleConnectOtpChange} onKeyDown={handleConnectOtpKeyDown} onPaste={handleConnectOtpPaste} refs={connectOtpRefs} disabled={connectOtpLoading}/>
            <button type="submit" className="s-btn-b" disabled={connectOtpLoading||connectOtp.join('').length<6}
              style={{ ...(connectOtpLoading||connectOtp.join('').length<6 ? BTN.disabled : BTN.blue), width:'100%', padding:'12px 0', borderRadius:11, justifyContent:'center' }}>
              <ShieldCheck size={15}/>{connectOtpLoading?'Verifying…':'Verify & Connect Outlook'}
            </button>
          </form>
          <ResendRow countdown={connectOtpCountdown} onResend={handleConnectResendOtp} ld={connectOtpLoading}/>
        </ModalShell>
      )}

      {/* ══ DISCONNECT MODAL ══ */}
      {disconnectModal && (
        <ModalShell onClose={()=>{setDisconnectModal(false);setDisconnectPassword('');setDisconnectPasswordError('');}}
          grad="linear-gradient(135deg,#991B1B,#DC2626)" icon={<Lock size={22}/>}
          title="Confirm Disconnect" sub="Microsoft Outlook">
          <p style={{ fontSize:13,color:th.sec,margin:'0 0 18px',lineHeight:1.6 }}>Enter your current password to disconnect. This removes stored tokens from the system.</p>
          <form onSubmit={handleConfirmDisconnect} style={{ display:'flex',flexDirection:'column',gap:14 }}>
            <div>
              <label style={{ fontSize:12,fontWeight:600,color:th.sec,display:'block',marginBottom:6 }}>Current Password <span style={{ color:'#ef4444' }}>*</span></label>
              <IconInput icon={Lock} type="password" value={disconnectPassword}
                onChange={e=>{setDisconnectPassword(e.target.value);setDisconnectPasswordError('');}}
                placeholder="Enter your current password" disabled={verifyingDisconnect||disconnecting}
                showToggle showPass={showDisconnectPassword} onToggle={()=>setShowDisconnectPassword(v=>!v)}
                errorMsg={disconnectPasswordError}/>
            </div>
            <div style={{ display:'flex',gap:10 }}>
              <button type="button" className="s-btn-g" onClick={()=>{setDisconnectModal(false);setDisconnectPassword('');setDisconnectPasswordError('');}} disabled={verifyingDisconnect||disconnecting}
                style={{ ...BTN.ghost, flex:1, justifyContent:'center', padding:'11px 0', borderRadius:10, color:th.sec, border:`1.5px solid ${th.border}` }}>
                Cancel
              </button>
              <button type="submit" className="s-btn-rs" disabled={verifyingDisconnect||disconnecting||!disconnectPassword.trim()}
                style={{ ...(verifyingDisconnect||disconnecting||!disconnectPassword.trim()?BTN.disabled:BTN.redSolid), flex:1, justifyContent:'center', padding:'11px 0', borderRadius:10 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="4" y1="4" x2="20" y2="20"/></svg>
                {verifyingDisconnect?'Verifying…':disconnecting?'Disconnecting…':'Disconnect Outlook'}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {/* ══ PROFILE OTP MODAL ══ */}
      {profileOtpModal && (
        <ModalShell onClose={closeProfileOtpModal} grad="linear-gradient(135deg,#6d0000,#bb0000)"
          icon={<ShieldCheck size={22}/>} title="Verify Profile Update" sub="One-time password required">
          <p style={{ fontSize:13,color:th.sec,margin:'0 0 4px',lineHeight:1.6,textAlign:'center' }}>
            We sent a 6-digit OTP to <strong style={{ color:th.pri }}>{maskEmail(email)}</strong>.<br/>Enter it below to save your changes.
          </p>
          <form onSubmit={handleProfileOtpVerify}>
            <OtpRow arr={profileOtp} onChange={handleProfileOtpChange} onKeyDown={handleProfileOtpKeyDown} onPaste={handleProfileOtpPaste} refs={profileOtpRefs} disabled={profileOtpLoading}/>
            <button type="submit" className="s-btn-p" disabled={profileOtpLoading||profileOtp.join('').length<6}
              style={{ ...(profileOtpLoading||profileOtp.join('').length<6?BTN.disabled:BTN.primary), width:'100%', padding:'12px 0', borderRadius:11, justifyContent:'center' }}>
              <ShieldCheck size={15}/>{profileOtpLoading?'Verifying…':'Verify & Save'}
            </button>
          </form>
          <ResendRow countdown={profileOtpCountdown} onResend={handleProfileResendOtp} ld={profileOtpLoading}/>
        </ModalShell>
      )}

      {/* ══ PASSWORD OTP MODAL ══ */}
      {otpModal && (
        <ModalShell onClose={closeOtpModal}
          grad={otpStep==='otp'?'linear-gradient(135deg,#1e3a5f,#2563eb)':'linear-gradient(135deg,#14532d,#16a34a)'}
          icon={otpStep==='otp'?<ShieldCheck size={22}/>:<CheckCircle size={22}/>}
          title={otpStep==='otp'?'Email Verification':'Set New Password'}
          sub={otpStep==='otp'?'Password change OTP':'OTP verified ✓'}>
          {otpStep==='otp'&&(
            <>
              <p style={{ fontSize:13,color:th.sec,margin:'0 0 4px',lineHeight:1.6,textAlign:'center' }}>
                We sent a 6-digit OTP to <strong style={{ color:th.pri }}>{maskEmail(otpEmail)}</strong>.<br/>It expires in 10 minutes.
              </p>
              <form onSubmit={handleVerifyOtp}>
                <OtpRow arr={otp} onChange={handleOtpChange} onKeyDown={handleOtpKeyDown} onPaste={handleOtpPaste} refs={otpRefs} disabled={otpLoading}/>
                <button type="submit" className="s-btn-b" disabled={otpLoading||otp.join('').length<6}
                  style={{ ...(otpLoading||otp.join('').length<6?BTN.disabled:BTN.blue), width:'100%', padding:'12px 0', borderRadius:11, justifyContent:'center' }}>
                  <ShieldCheck size={15}/>{otpLoading?'Verifying…':'Verify OTP'}
                </button>
              </form>
              <ResendRow countdown={otpCountdown} onResend={handleResendOtp} ld={otpLoading}/>
            </>
          )}
          {otpStep==='newpwd'&&(
            <form onSubmit={handleSetNewPassword} style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <p style={{ fontSize:13,color:th.sec,margin:'0 0 4px',lineHeight:1.6 }}>OTP verified! Create a strong new password for your account.</p>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:th.sec,display:'block',marginBottom:6 }}>New Password <span style={{ color:'#ef4444' }}>*</span></label>
                <IconInput icon={Lock} value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Min. 6 characters" disabled={otpLoading} showToggle showPass={showNewPassword} onToggle={()=>setShowNewPassword(s=>!s)}/>
              </div>
              <div>
                <label style={{ fontSize:12,fontWeight:600,color:th.sec,display:'block',marginBottom:6 }}>Confirm Password <span style={{ color:'#ef4444' }}>*</span></label>
                <IconInput icon={Lock} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Re-enter new password" disabled={otpLoading} showToggle showPass={showConfirmPassword} onToggle={()=>setShowConfirmPassword(s=>!s)}/>
              </div>
              <button type="submit" className="s-btn-p" disabled={otpLoading}
                style={{ ...(otpLoading?BTN.disabled:BTN.green), width:'100%', padding:'12px 0', borderRadius:11, justifyContent:'center' }}>
                <Lock size={15}/>{otpLoading?'Updating…':'Update Password'}
              </button>
            </form>
          )}
        </ModalShell>
      )}

      {/* ══════════════════════
          PAGE HEADER
      ══════════════════════ */}
      <div style={{ display:'flex',alignItems:'center',gap:6,fontSize:12,color:th.sec,marginBottom:6 }}>
        <span>Dashboard</span><span style={{ opacity:0.4 }}>/</span><span>Account Settings</span>
      </div>
      <div style={{ marginBottom:26 }}>
        <h1 style={{ fontSize:24,fontWeight:700,color:th.pri,margin:'0 0 4px' }}>Account Settings</h1>
        <p style={{ fontSize:13,color:th.sec,margin:0 }}>Manage your profile information and account security.</p>
      </div>

      {/* ══════════════════════
          LAYOUT
      ══════════════════════ */}
      <div style={{ display:'grid',gridTemplateColumns:'300px 1fr',gap:22,alignItems:'start' }}>

        {/* ── SIDEBAR ── */}
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>

          {/* Profile card */}
          <div style={{ background:th.surface,borderRadius:20,border:`1px solid ${th.border}`,boxShadow:th.shadow,overflow:'hidden' }}>
            <div style={{ display:'flex',flexDirection:'column',alignItems:'center',padding:'24px 20px 22px' }}>
              <div style={{ width:72,height:72,borderRadius:'50%',border:`3px solid ${th.border}`,boxShadow:'0 4px 18px rgba(0,0,0,0.12)',overflow:'hidden',background:'linear-gradient(135deg,#6d0000,#bb0000)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                {profilePicture?<img src={profilePicture} alt="Profile" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:<span style={{ fontSize:24,fontWeight:700,color:'#fff' }}>{getUserInitials()}</span>}
              </div>
              <h3 style={{ fontSize:15,fontWeight:700,color:th.pri,margin:'10px 0 5px',textAlign:'center' }}>
                {firstName||lastName?[firstName,middleName,lastName].filter(Boolean).join(' ').trim():'Your Name'}
              </h3>
              <span style={{ fontSize:11,fontWeight:600,color:'#bb0000',background:'rgba(187,0,0,0.10)',border:'1px solid rgba(187,0,0,0.22)',padding:'3px 13px',borderRadius:20 }}>
                {position||'Your Role'}
              </span>
              <div style={{ width:'100%',height:1,background:th.border,margin:'14px 0' }}/>
              {[{Icon:Mail,val:email||'your.email@example.com'},{Icon:Briefcase,val:position||'No role assigned'}].map(({Icon,val},i)=>(
                <div key={i} style={{ width:'100%',display:'flex',alignItems:'center',gap:9,padding:'9px 12px',background:th.surf2,borderRadius:10,border:`1px solid ${th.border2}`,marginBottom:i===0?8:0 }}>
                  <Icon size={13} style={{ color:'#bb0000',flexShrink:0 }}/>
                  <span style={{ fontSize:11,color:th.sec,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Connected Accounts card */}
          <div style={{ background:th.surface,borderRadius:20,border:`1px solid ${th.border}`,boxShadow:th.shadow,overflow:'hidden' }}>
            <div style={{ padding:'16px 18px 13px',borderBottom:`1px solid ${th.border}` }}>
              <div style={{ fontSize:13,fontWeight:700,color:th.pri,marginBottom:2 }}>Connected Accounts</div>
              <div style={{ fontSize:11,color:th.sec }}>Manage external accounts linked to your profile.</div>
            </div>
            <div style={{ padding:'14px 18px 18px',display:'flex',flexDirection:'column',gap:12 }}>
              <div style={{ display:'flex',alignItems:'center',gap:11 }}>
                <div style={{ width:38,height:38,borderRadius:10,background:'rgba(0,120,212,0.10)',border:'1px solid rgba(0,120,212,0.2)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="5" width="13" height="14" rx="2" fill="#0078D4"/><rect x="10" y="2" width="13" height="14" rx="2" fill="#28A8E8"/><ellipse cx="7.5" cy="12" rx="2.8" ry="3.5" fill="white"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:12,fontWeight:700,color:th.pri }}>Microsoft Outlook</div>
                  <div style={{ fontSize:10,color:th.sec }}>Sync emails and manage inbox</div>
                </div>
              </div>
              {outlookConnected?(
                <div style={{ padding:'10px 13px',background:'rgba(22,163,74,0.07)',border:'1px solid rgba(22,163,74,0.22)',borderRadius:10 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:3 }}>
                    <span style={{ width:7,height:7,borderRadius:'50%',background:'#16a34a',display:'inline-block' }}/>
                    <span style={{ fontSize:11,fontWeight:700,color:'#16a34a' }}>Connected</span>
                  </div>
                  <div style={{ fontSize:11,color:th.sec,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{outlookEmail}</div>
                  {outlookConnectedSince&&<div style={{ fontSize:10,color:th.muted,marginTop:2 }}>Since {outlookConnectedSince}</div>}
                </div>
              ):(
                <div style={{ padding:'10px 13px',background:th.surf2,border:`1px solid ${th.border}`,borderRadius:10 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                    <span style={{ width:7,height:7,borderRadius:'50%',background:th.muted,display:'inline-block' }}/>
                    <span style={{ fontSize:11,fontWeight:600,color:th.muted }}>Not Connected</span>
                  </div>
                </div>
              )}
              {outlookConnected?(
                <button className="s-btn-d" type="button" onClick={handleDisconnectOutlook} disabled={disconnecting}
                  style={{ ...BTN.disconnect, width:'100%', padding:'10px 0', borderRadius:10, fontSize:12, justifyContent:'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/><line x1="4" y1="4" x2="20" y2="20"/></svg>
                  {disconnecting?'Disconnecting…':'Disconnect Outlook'}
                </button>
              ):(
                <button className="s-btn-cn" onClick={handleConnectOutlook} disabled={connectingOutlook}
                  style={{ ...(connectingOutlook?BTN.disabled:BTN.connect), padding:'10px 0', borderRadius:10, fontSize:12 }}>
                  {connectingOutlook?'Redirecting…':'Connect Outlook'}
                </button>
              )}
              <div style={{ display:'flex',alignItems:'flex-start',gap:7,padding:'9px 11px',background:th.surf2,border:`1px solid ${th.border2}`,borderRadius:9 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color:th.muted,flexShrink:0,marginTop:1 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span style={{ fontSize:10,color:th.muted,lineHeight:1.5 }}>Disconnecting removes your Outlook tokens from this system only. Your Microsoft account will not be affected.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={{ display:'flex',flexDirection:'column',gap:0 }}>
          {/* Tabs */}
          <div style={{ display:'flex',gap:4,background:th.surface,borderRadius:14,padding:5,marginBottom:18,border:`1px solid ${th.border}`,boxShadow:th.shadow,width:'fit-content' }}>
            {['profile','security'].map(tab=>(
              <button key={tab} className={activeTab===tab?'s-tab-on':'s-tab-off'} onClick={()=>setActiveTab(tab)}
                style={{ all:'unset',padding:'9px 26px',borderRadius:10,cursor:'pointer',fontSize:13,fontWeight:activeTab===tab?700:500,fontFamily:"'Poppins',sans-serif",transition:'all 0.18s',lineHeight:'1' }}>
                {tab==='profile'?'My Profile':'Security'}
              </button>
            ))}
          </div>

          {/* MY PROFILE */}
          {activeTab==='profile'&&(
            <div style={{ background:th.surface,borderRadius:20,border:`1px solid ${th.border}`,boxShadow:th.shadow,overflow:'hidden' }}>
              <div style={{ padding:'20px 28px 16px',borderBottom:`1px solid ${th.border}` }}>
                <div style={{ fontSize:16,fontWeight:700,color:th.pri,marginBottom:3 }}>Personal Info</div>
                <div style={{ fontSize:12,color:th.sec }}>Update your photo and personal details here.</div>
              </div>
              <form onSubmit={handleAccountUpdate}>
                {/* Photo row */}
                <div style={{ display:'flex',alignItems:'flex-start',gap:24,padding:'30px 28px 26px',borderBottom:`1px solid ${th.border}` }}>
                  <div style={{ minWidth:150,paddingTop:14 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:th.pri,marginBottom:3 }}>Your Photo</div>
                    <div style={{ fontSize:11,color:th.sec }}>Displayed on your profile.</div>
                  </div>
                  <div style={{ display:'flex',alignItems:'center',gap:18,flex:1 }}>
                    <div style={{ width:62,height:62,borderRadius:'50%',border:`3px solid ${th.border}`,overflow:'hidden',background:'linear-gradient(135deg,#6d0000,#bb0000)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                      {profilePicture?<img src={profilePicture} alt="Profile" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>:<span style={{ fontSize:22,fontWeight:700,color:'#fff' }}>{getUserInitials()}</span>}
                    </div>
                    <label htmlFor="photo-upload" className="s-upload"
                      style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:7,padding:'20px 24px',border:`2px dashed ${th.border}`,borderRadius:12,cursor:'pointer',transition:'all 0.18s' }}>
                      <Upload size={18} style={{ color:th.sec }}/>
                      <span style={{ fontSize:12,color:th.sec,textAlign:'center' }}>
                        <strong style={{ color:th.pri }}>Click to upload</strong> or drag and drop
                      </span>
                      <small style={{ fontSize:10,color:th.muted }}>SVG, PNG, JPG or WEBP (max. 5MB)</small>
                    </label>
                    <input id="photo-upload" type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml" onChange={handleProfilePictureChange} style={{ display:'none' }}/>
                  </div>
                </div>
                {/* OTP notice */}
                <div style={{ padding:'14px 28px',borderBottom:`1px solid ${th.border}` }}>
                  <div style={{ display:'flex',alignItems:'center',gap:9,padding:'11px 16px',background:'rgba(187,0,0,0.06)',border:'1px solid rgba(187,0,0,0.18)',borderRadius:10 }}>
                    <ShieldCheck size={14} style={{ color:'#bb0000',flexShrink:0 }}/>
                    <span style={{ fontSize:12,color:dark?'rgba(255,180,180,0.9)':'#7a0000' }}>An OTP will be sent to your email to verify any profile changes.</span>
                  </div>
                </div>
                {/* Name row */}
                <div style={{ display:'flex',alignItems:'flex-start',gap:24,padding:'20px 28px',borderBottom:`1px solid ${th.border}` }}>
                  <div style={{ minWidth:150 }}>
                    <label style={{ fontSize:13,fontWeight:600,color:th.pri }}>Name</label>
                  </div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,flex:1 }}>
                    {[
                      {v:firstName,fn:handleFirstNameChange,ph:'First name',req:true},
                      {v:middleName,fn:handleMiddleNameChange,ph:'Middle name (optional)'},
                      {v:lastName,fn:handleLastNameChange,ph:'Last name',req:true},
                    ].map((f,i)=>(
                      <div key={i}>
                        <input type="text" value={f.v} onChange={f.fn} placeholder={f.ph} maxLength={20} required={f.req} style={iBase(th,false)}/>
                        <div style={{ fontSize:10,color:th.muted,textAlign:'right',marginTop:3 }}>{f.v.length}/20</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Email row */}
                <div style={{ display:'flex',alignItems:'flex-start',gap:24,padding:'20px 28px',borderBottom:`1px solid ${th.border}` }}>
                  <div style={{ minWidth:150 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:th.pri,marginBottom:4 }}>Email Address</div>
                    <span style={{ fontSize:10,color:th.muted,background:th.surf2,border:`1px solid ${th.border}`,padding:'2px 9px',borderRadius:20,display:'inline-block' }}>Cannot be changed</span>
                  </div>
                  <div style={{ flex:1,maxWidth:360 }}>
                    <IconInput icon={Mail} type="email" value={email} disabled/>
                  </div>
                </div>
                {/* Role row */}
                <div style={{ display:'flex',alignItems:'flex-start',gap:24,padding:'20px 28px',borderBottom:`1px solid ${th.border}` }}>
                  <div style={{ minWidth:150 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:th.pri,marginBottom:4 }}>Role / Position</div>
                    <span style={{ fontSize:10,color:th.muted,background:th.surf2,border:`1px solid ${th.border}`,padding:'2px 9px',borderRadius:20,display:'inline-block' }}>Assigned by Super Admin</span>
                  </div>
                  <div style={{ flex:1,maxWidth:360 }}>
                    <IconInput icon={Briefcase} type="text" value={position} disabled/>
                  </div>
                </div>
                {/* Actions */}
                <div style={{ display:'flex',justifyContent:'flex-end',gap:10,padding:'18px 28px' }}>
                  <button type="button" className="s-btn-g" onClick={()=>navigate(-1)}
                    style={{ ...BTN.ghost, border:`1.5px solid ${th.border}`, color:th.sec, padding:'10px 22px', borderRadius:10 }}>
                    Cancel
                  </button>
                  <button type="submit" className="s-btn-p" disabled={saving}
                    style={{ ...(saving?BTN.disabled:BTN.primary), padding:'10px 26px', borderRadius:10 }}>
                    <Save size={14}/>{saving?'Sending OTP…':'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECURITY */}
          {activeTab==='security'&&(
            <div style={{ background:th.surface,borderRadius:20,border:`1px solid ${th.border}`,boxShadow:th.shadow,overflow:'hidden' }}>
              <div style={{ padding:'20px 28px 16px',borderBottom:`1px solid ${th.border}` }}>
                <div style={{ fontSize:16,fontWeight:700,color:th.pri,marginBottom:3 }}>Password</div>
                <div style={{ fontSize:12,color:th.sec }}>Please enter your current password to change your password.</div>
              </div>
              {!showPasswordForm?(
                <div style={{ padding:'24px 28px',display:'flex',flexDirection:'column',gap:18 }}>
                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',background:th.surf2,borderRadius:14,border:`1px solid ${th.border}` }}>
                    <div>
                      <div style={{ fontSize:13,fontWeight:600,color:th.pri,marginBottom:2 }}>Current Password</div>
                      <div style={{ fontSize:12,color:th.sec }}>Keep your account secure with a strong password</div>
                    </div>
                    <button className="s-btn-or" type="button" onClick={()=>setShowPasswordForm(true)}
                      style={{ ...BTN.outlineRed, padding:'10px 18px', borderRadius:10, fontSize:13 }}>
                      <Lock size={14}/>Change Password
                    </button>
                  </div>
                  <div style={{ display:'flex',alignItems:'flex-start',gap:11,padding:'14px 18px',background:'rgba(99,102,241,0.06)',border:'1px solid rgba(99,102,241,0.2)',borderRadius:12 }}>
                    <ShieldCheck size={16} style={{ color:'#6366f1',flexShrink:0,marginTop:1 }}/>
                    <p style={{ fontSize:12,color:th.sec,margin:0,lineHeight:1.6 }}>Keep your account secure by regularly updating your password. We recommend using a strong, unique password with at least 8 characters.</p>
                  </div>
                </div>
              ):(
                <form onSubmit={handlePasswordUpdate}>
                  <div style={{ padding:'22px 28px',borderBottom:`1px solid ${th.border}` }}>
                    <div style={{ display:'flex',alignItems:'flex-start',gap:24 }}>
                      <div style={{ minWidth:150 }}>
                        <label style={{ fontSize:13,fontWeight:600,color:th.pri,display:'block',marginBottom:3 }}>Current Password</label>
                        <div style={{ fontSize:11,color:th.sec }}>Enter to verify your identity</div>
                      </div>
                      <div style={{ flex:1,maxWidth:360 }}>
                        <IconInput icon={Lock} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password" showToggle showPass={showCurrentPassword} onToggle={()=>setShowCurrentPassword(v=>!v)}/>
                        <small style={{ fontSize:11,color:th.muted,marginTop:5,display:'block' }}>Enter your current password to verify your identity</small>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex',justifyContent:'flex-end',gap:10,padding:'18px 28px' }}>
                    <button type="button" className="s-btn-g" onClick={handleCancelPasswordUpdate} disabled={saving}
                      style={{ ...BTN.ghost, border:`1.5px solid ${th.border}`, color:th.sec, padding:'10px 22px', borderRadius:10 }}>
                      Cancel
                    </button>
                    <button type="submit" className="s-btn-p" disabled={saving}
                      style={{ ...(saving?BTN.disabled:BTN.primary), padding:'10px 26px', borderRadius:10 }}>
                      <ShieldCheck size={14}/>{saving?'Verifying…':'Continue & Send OTP'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;