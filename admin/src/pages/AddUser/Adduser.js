import React, { useState } from 'react';
import {
  UserPlus,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
} from 'lucide-react';
import './AddUser.css';

const ROLES = ['Administrator', 'Super Admin', 'Moderator', 'Viewer'];

const AddUser = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [roleOpen, setRoleOpen]                 = useState(false);
  const [errors, setErrors]                     = useState({});
  const [toast, setToast]                       = useState(null); // { type: 'success'|'error', message }
  const [submitting, setSubmitting]             = useState(false);

  /* ── Helpers ── */
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim())                        errs.firstName = 'First name is required.';
    else if (!/^[A-Za-z\s]{1,20}$/.test(form.firstName)) errs.firstName = 'Letters only, max 20 characters.';

    if (!form.lastName.trim())                         errs.lastName = 'Last name is required.';
    else if (!/^[A-Za-z\s]{1,20}$/.test(form.lastName))  errs.lastName = 'Letters only, max 20 characters.';

    if (!form.email.trim())                            errs.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address.';

    if (!form.role)                                    errs.role = 'Please select a role.';

    if (!form.password)                                errs.password = 'Password is required.';
    else if (form.password.length < 8)                 errs.password = 'Password must be at least 8 characters.';

    if (!form.confirmPassword)                         errs.confirmPassword = 'Please confirm the password.';
    else if (form.password !== form.confirmPassword)   errs.confirmPassword = 'Passwords do not match.';

    return errs;
  };

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      // Replace with your actual API call
      await new Promise(res => setTimeout(res, 1200));
      showToast('success', `User "${form.firstName} ${form.lastName}" added successfully!`);
      setForm({ firstName: '', lastName: '', email: '', role: '', password: '', confirmPassword: '' });
      setErrors({});
    } catch {
      showToast('error', 'Failed to add user. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getUserInitials = () => {
    const f = form.firstName.trim();
    const l = form.lastName.trim();
    if (f && l) return f[0].toUpperCase() + l[0].toUpperCase();
    if (f)      return f[0].toUpperCase();
    return '?';
  };

  const passwordStrength = (pw) => {
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8)              score++;
    if (/[A-Z]/.test(pw))           score++;
    if (/[0-9]/.test(pw))           score++;
    if (/[^A-Za-z0-9]/.test(pw))    score++;
    if (score <= 1) return { label: 'Weak',   cls: 'pw-weak',   bars: 1 };
    if (score === 2) return { label: 'Fair',   cls: 'pw-fair',   bars: 2 };
    if (score === 3) return { label: 'Good',   cls: 'pw-good',   bars: 3 };
    return              { label: 'Strong', cls: 'pw-strong', bars: 4 };
  };

  const pwStrength = passwordStrength(form.password);

  return (
    <div className="adduser-page">

      {/* Toast */}
      {toast && (
        <div className={`au-toast au-toast--${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
          <span>{toast.message}</span>
          <button className="au-toast-close" onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      {/* Page Banner */}
      <div className="au-banner">
        <div className="au-banner-text">
          <h1>Add New User</h1>
          <p>Create an administrator account and assign a role</p>
        </div>
        <div className="au-banner-icon">
          <UserPlus size={36} />
        </div>
      </div>

      {/* Body */}
      <div className="au-body">

        {/* ── Form Card ── */}
        <div className="au-card">

          {/* Section: Profile */}
          <div className="au-section-header">
            <div className="au-section-icon"><User size={16} /></div>
            <div>
              <div className="au-section-title">Personal Information</div>
              <div className="au-section-sub">Fill in the user's basic details</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* First + Last Name */}
            <div className="au-row">
              <div className={`au-field ${errors.firstName ? 'au-field--error' : ''}`}>
                <label className="au-label">First Name <span className="au-required">*</span></label>
                <div className="au-input-wrap">
                  <span className="au-input-icon"><User size={15} /></span>
                  <input
                    type="text"
                    className="au-input"
                    placeholder="e.g. Juan"
                    value={form.firstName}
                    maxLength={20}
                    onChange={e => handleChange('firstName', e.target.value)}
                  />
                </div>
                {errors.firstName
                  ? <span className="au-error-msg"><AlertCircle size={12} />{errors.firstName}</span>
                  : <span className="au-hint">Letters only, max 20 characters ({form.firstName.length}/20)</span>
                }
              </div>

              <div className={`au-field ${errors.lastName ? 'au-field--error' : ''}`}>
                <label className="au-label">Last Name <span className="au-required">*</span></label>
                <div className="au-input-wrap">
                  <span className="au-input-icon"><User size={15} /></span>
                  <input
                    type="text"
                    className="au-input"
                    placeholder="e.g. Dela Cruz"
                    value={form.lastName}
                    maxLength={20}
                    onChange={e => handleChange('lastName', e.target.value)}
                  />
                </div>
                {errors.lastName
                  ? <span className="au-error-msg"><AlertCircle size={12} />{errors.lastName}</span>
                  : <span className="au-hint">Letters only, max 20 characters ({form.lastName.length}/20)</span>
                }
              </div>
            </div>

            {/* Email */}
            <div className={`au-field ${errors.email ? 'au-field--error' : ''}`}>
              <label className="au-label">Email Address <span className="au-required">*</span></label>
              <div className="au-input-wrap">
                <span className="au-input-icon"><Mail size={15} /></span>
                <input
                  type="email"
                  className="au-input"
                  placeholder="e.g. juan@telexph.com"
                  value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                />
              </div>
              {errors.email
                ? <span className="au-error-msg"><AlertCircle size={12} />{errors.email}</span>
                : <span className="au-hint">This will be used for login and notifications</span>
              }
            </div>

            {/* Role */}
            <div className={`au-field ${errors.role ? 'au-field--error' : ''}`}>
              <label className="au-label">Role <span className="au-required">*</span></label>
              <div className="au-select-wrap" onClick={() => setRoleOpen(o => !o)}>
                <span className="au-input-icon"><Shield size={15} /></span>
                <span className={`au-select-value ${!form.role ? 'placeholder' : ''}`}>
                  {form.role || 'Select a role'}
                </span>
                <span className={`au-select-chevron ${roleOpen ? 'open' : ''}`}>
                  <ChevronDown size={15} />
                </span>
              </div>
              {roleOpen && (
                <div className="au-dropdown">
                  {ROLES.map(r => (
                    <button
                      key={r}
                      type="button"
                      className={`au-dropdown-item ${form.role === r ? 'active' : ''}`}
                      onClick={() => { handleChange('role', r); setRoleOpen(false); }}
                    >
                      {form.role === r && <CheckCircle2 size={13} />}
                      {r}
                    </button>
                  ))}
                </div>
              )}
              {errors.role && <span className="au-error-msg"><AlertCircle size={12} />{errors.role}</span>}
            </div>

            {/* Divider */}
            <div className="au-divider">
              <div className="au-section-header" style={{ marginTop: 0 }}>
                <div className="au-section-icon"><Lock size={16} /></div>
                <div>
                  <div className="au-section-title">Security</div>
                  <div className="au-section-sub">Set a strong password for this account</div>
                </div>
              </div>
            </div>

            {/* Password */}
            <div className={`au-field ${errors.password ? 'au-field--error' : ''}`}>
              <label className="au-label">Password <span className="au-required">*</span></label>
              <div className="au-input-wrap">
                <span className="au-input-icon"><Lock size={15} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="au-input"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                />
                <button type="button" className="au-pw-toggle" onClick={() => setShowPassword(o => !o)}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Strength meter */}
              {form.password && pwStrength && (
                <div className="pw-strength-wrap">
                  <div className="pw-bars">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`pw-bar ${i <= pwStrength.bars ? pwStrength.cls : ''}`} />
                    ))}
                  </div>
                  <span className={`pw-label ${pwStrength.cls}`}>{pwStrength.label}</span>
                </div>
              )}
              {errors.password && <span className="au-error-msg"><AlertCircle size={12} />{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className={`au-field ${errors.confirmPassword ? 'au-field--error' : ''}`}>
              <label className="au-label">Confirm Password <span className="au-required">*</span></label>
              <div className="au-input-wrap">
                <span className="au-input-icon"><Lock size={15} /></span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="au-input"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={e => handleChange('confirmPassword', e.target.value)}
                />
                <button type="button" className="au-pw-toggle" onClick={() => setShowConfirmPassword(o => !o)}>
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.confirmPassword
                ? <span className="au-error-msg"><AlertCircle size={12} />{errors.confirmPassword}</span>
                : form.confirmPassword && form.password === form.confirmPassword
                  ? <span className="au-success-msg"><CheckCircle2 size={12} />Passwords match</span>
                  : null
              }
            </div>

            {/* Submit */}
            <div className="au-actions">
              <button
                type="button"
                className="au-btn au-btn--ghost"
                onClick={() => {
                  setForm({ firstName: '', lastName: '', email: '', role: '', password: '', confirmPassword: '' });
                  setErrors({});
                }}
              >
                Clear Form
              </button>
              <button type="submit" className="au-btn au-btn--primary" disabled={submitting}>
                {submitting
                  ? <><span className="au-spinner" /> Adding User...</>
                  : <><UserPlus size={16} /> Add User</>
                }
              </button>
            </div>

          </form>
        </div>

        {/* ── Preview Card ── */}
        <div className="au-preview-col">
          <div className="au-preview-card">
            <div className="au-preview-header">
              <div className="au-preview-title">User Preview</div>
              <div className="au-preview-sub">Live preview of new account</div>
            </div>

            <div className="au-preview-body">
              <div className="au-preview-avatar">
                {getUserInitials()}
              </div>
              <div className="au-preview-name">
                {(form.firstName || form.lastName)
                  ? `${form.firstName} ${form.lastName}`.trim()
                  : <span className="au-preview-placeholder">Full Name</span>
                }
              </div>
              <div className="au-preview-role">
                {form.role || <span className="au-preview-placeholder">Role</span>}
              </div>

              <div className="au-preview-details">
                <div className="au-preview-detail-row">
                  <Mail size={13} />
                  <span>{form.email || <span className="au-preview-placeholder">Email address</span>}</span>
                </div>
                <div className="au-preview-detail-row">
                  <Shield size={13} />
                  <span>{form.role || <span className="au-preview-placeholder">No role selected</span>}</span>
                </div>
              </div>
            </div>

            <div className="au-tip">
              <AlertCircle size={14} />
              <span>The new user will receive a welcome email with login instructions.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AddUser;