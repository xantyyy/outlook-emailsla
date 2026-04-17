import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BugReportModal.css';

const API = 'http://localhost:5000/api';

const BugReportModal = ({ isOpen, onClose, onConfirm }) => {
  const [pendingReports,   setPendingReports]   = useState([]);
  const [selectedReport,   setSelectedReport]   = useState(null);
  const [priority,         setPriority]         = useState('Normal');
  const [severity,         setSeverity]         = useState('Medium');
  const [notes,            setNotes]            = useState('');
  const [loading,          setLoading]          = useState(false);
  const [syncing,          setSyncing]          = useState(false);
  const [error,            setError]            = useState(null);
  const [syncResult,       setSyncResult]       = useState(null);

  // ── Outlook acknowledgement email state (per-user connection) ──
  const [outlookConnected,     setOutlookConnected]     = useState(false);
  const [outlookStatusChecked, setOutlookStatusChecked] = useState(false); // ✅ ADDED: gate flag
  const [outlookEmail,         setOutlookEmail]         = useState('');
  const [systemEmail,          setSystemEmail]          = useState('');
  const [sendingEmail,         setSendingEmail]         = useState(false);
  const [emailSent,            setEmailSent]            = useState(false);
  const [emailError,           setEmailError]           = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchPendingReports();
      checkOutlookStatus();
      fetchSystemEmail();
    } else {
      // ✅ ADDED: Reset on close so next open re-checks status fresh
      setOutlookStatusChecked(false);
      setOutlookConnected(false);
    }
  }, [isOpen]);

  // ── Check per-user Outlook connection (for ack email only) ──
  const checkOutlookStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const res = await axios.get(`${API}/outlook/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOutlookConnected(res.data?.connected === true);
      setOutlookEmail(res.data?.email || '');
    } catch (err) {
      console.warn('[BugModal] Outlook status check failed:', err.message);
      setOutlookConnected(false);
    } finally {
      setOutlookStatusChecked(true); // ✅ ADDED: mark as checked regardless of result
    }
  };

  // ── Fetch system inbox email (ADMIN_EMAIL) used for sync ──
  const fetchSystemEmail = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const res = await axios.get(`${API}/outlook/system-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data?.configured) setSystemEmail(res.data.email || '');
    } catch (err) {
      console.warn('[BugModal] System email fetch failed:', err.message);
    }
  };

  // ── Fetch pending bugs from DB (already synced) ──
  const fetchPendingReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found. Please login.');

      const response = await axios.get(`${API}/bugs/pending`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      setPendingReports(response.data || []);
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        setTimeout(() => {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
          window.location.href = '/admin/login';
        }, 2000);
      } else if (error.response?.status === 404) {
        setError('API endpoint not found. Please check server configuration.');
      } else {
        setError('Failed to fetch pending reports: ' + (error.response?.data?.message || error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Sync from Outlook — uses graphService (ADMIN_EMAIL, app-level) ──
  // This always works regardless of per-user Outlook connection in Settings.
  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found. Please login.');

      const response = await axios.post(`${API}/bugs/sync`, {}, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        timeout: 60000,
      });
      const { summary, errors } = response.data;
      setSyncResult({ type: 'success', summary, errors: errors || [] });
      await fetchPendingReports();
    } catch (error) {
      let errorMsg = 'Failed to sync: ';
      if (error.code === 'ECONNABORTED')        errorMsg += 'Request timed out.';
      else if (error.response?.status === 401)  errorMsg += 'Authentication failed. Please login again.';
      else if (error.response?.status === 500)  errorMsg += error.response.data.error || error.response.data.message || 'Server error.';
      else errorMsg += error.response?.data?.error || error.response?.data?.message || error.message;
      setError(errorMsg);
    } finally {
      setSyncing(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────
  const formatBugId = (id, createdAt) => {
    if (!id) return '—';
    const d = createdAt ? new Date(createdAt) : new Date();
    return `BUG-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${id.slice(-3).toUpperCase()}`;
  };

  const SLA_UPDATE_INTERVAL = { Critical: 24, High: 12, Medium: 8, Low: 4 };

  // ── Build acknowledgement email HTML ──
  const buildAcknowledgementEmail = (report, finalSeverity, finalPriority, adminNotes, confirmedByName) => {
    const reporterName = report.reportedBy?.name || 'there';
    const bugId        = formatBugId(report._id, report.createdAt);
    const slaInterval  = SLA_UPDATE_INTERVAL[finalSeverity] || 8;
    const category     = report.category || '—';
    const dateLogged   = report.createdAt
      ? new Date(report.createdAt).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' })
      : '—';

    const severityColors = { Critical:'#dc2626', High:'#ea580c', Medium:'#ca8a04', Low:'#16a34a' };
    const priorityColors = { Critical:'#dc2626', High:'#ea580c', Normal:'#3b82f6', Low:'#22c55e' };
    const sevColor  = severityColors[finalSeverity]  || '#6b7280';
    const priColor  = priorityColors[finalPriority]  || '#6b7280';
    const statColor = '#16a34a';

    return `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#1f2937;">

  <div style="background:#a10304;padding:24px 32px;border-radius:8px 8px 0 0;">
    <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">TelexPH Bug Reporting System</p>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;">Bug Report Acknowledgement</p>
  </div>

  <div style="padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;background:#ffffff;">

    <p style="margin:0 0 6px;font-size:15px;">Good day <strong>${reporterName}</strong>,</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#374151;">
      Thank you for reporting this issue.<br/>
      We acknowledge receipt of your bug report and have logged it in our tracking system with the following details:
    </p>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 16px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:9px 0;font-size:13px;color:#6b7280;width:38%;vertical-align:top;font-weight:600;">Title</td>
          <td style="padding:9px 0;font-size:13px;color:#111827;font-weight:600;line-height:1.5;">${report.title || '—'}</td>
        </tr>
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:9px 0;font-size:13px;color:#6b7280;vertical-align:middle;font-weight:600;">Status</td>
          <td style="padding:9px 0;">
            <span style="display:inline-block;background:${statColor}1a;color:${statColor};font-size:12px;font-weight:700;padding:3px 12px;border-radius:999px;">In Progress</span>
          </td>
        </tr>
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:9px 0;font-size:13px;color:#6b7280;vertical-align:middle;font-weight:600;">Severity</td>
          <td style="padding:9px 0;">
            <span style="display:inline-block;background:${sevColor}1a;color:${sevColor};font-size:12px;font-weight:700;padding:3px 12px;border-radius:999px;">${finalSeverity}</span>
          </td>
        </tr>
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:9px 0;font-size:13px;color:#6b7280;vertical-align:middle;font-weight:600;">Priority</td>
          <td style="padding:9px 0;">
            <span style="display:inline-block;background:${priColor}1a;color:${priColor};font-size:12px;font-weight:700;padding:3px 12px;border-radius:999px;">${finalPriority}</span>
          </td>
        </tr>
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:9px 0;font-size:13px;color:#6b7280;vertical-align:top;font-weight:600;">Category</td>
          <td style="padding:9px 0;font-size:13px;color:#111827;">${category}</td>
        </tr>
        <tr>
          <td style="padding:9px 0;font-size:13px;color:#6b7280;vertical-align:top;font-weight:600;">Date Logged</td>
          <td style="padding:9px 0;font-size:13px;color:#111827;">${dateLogged}</td>
        </tr>
      </table>
    </div>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;color:#1d4ed8;line-height:1.6;">
        ⏱ <strong>SLA Timer Started</strong> — Our team is now actively working on this issue.
        We'll provide an update in <strong>${slaInterval} hours</strong> for <strong>${finalSeverity}</strong> severity bugs.
      </p>
    </div>

    <p style="margin:0 0 4px;font-size:14px;color:#374151;">Thank you for your cooperation.</p>
  </div>

  <div style="padding:14px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">
      This is an automated acknowledgement from the TelexPH Bug Reporting System.
    </p>
  </div>
</div>`;
  };

  // ── Send ack email via the connected admin's Outlook account ──
  const sendAcknowledgementEmail = async (report, finalSeverity, finalPriority, adminNotes, confirmedByName) => {
    const reporterEmail = report.reportedBy?.email;
    if (!reporterEmail) {
      console.warn('[BugModal] No reporter email — skipping auto-email');
      return;
    }

    setSendingEmail(true);
    setEmailError(null);

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${API}/outlook/send`,
        {
          subject:       `[Bug Acknowledged] ${report.title || 'Your Bug Report'}`,
          body:          buildAcknowledgementEmail(report, finalSeverity, finalPriority, adminNotes, confirmedByName),
          toRecipients:  [reporterEmail],
          ccRecipients:  [],
          bccRecipients: [],
        },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      console.log(`[BugModal] ✉ Acknowledgement sent to ${reporterEmail} via ${outlookEmail}`);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 6000);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      console.error('[BugModal] Email send failed:', msg);
      setEmailError(`Could not send acknowledgement email: ${msg}`);
    } finally {
      setSendingEmail(false);
    }
  };

  // ── Confirm / Reject handler ──────────────────────────────
  const handleConfirm = async (action) => {
    if (!selectedReport) return;

    const isConfirmed = action === 'confirmed';
    const newStatus   = isConfirmed ? 'In Progress' : 'Closed';

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) throw new Error('No authentication token found. Please login.');

      await axios.patch(
        `${API}/bugs/${selectedReport._id}/confirm`,
        { status: newStatus, priority, severity, notes: notes.trim() },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      // Send ack email only if admin has their personal Outlook connected
      if (isConfirmed && outlookConnected) {
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        const confirmedByName = adminData.name || adminData.email || outlookEmail || 'Bug Team';
        await sendAcknowledgementEmail(selectedReport, severity, priority, notes, confirmedByName);
      }

      // Optimistic UI update
      setPendingReports(prev =>
        prev.map(r =>
          r._id === selectedReport._id
            ? {
                ...r,
                status:        newStatus,
                startedAt:     isConfirmed ? new Date().toISOString() : null,
                invalidReason: !isConfirmed ? (notes.trim() || 'Closed as invalid') : null,
              }
            : r
        )
      );

      if (onConfirm) onConfirm();

      setSelectedReport(null);
      setNotes('');
      setPriority('Normal');
      setSeverity('Medium');
      setError('');

      setTimeout(() => {
        setPendingReports(prev => prev.filter(r => r._id !== selectedReport._id));
      }, 400);

    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      setError('Failed to update report: ' + errorMsg);
    }
  };

  // ── Helpers ───────────────────────────────────────────────
  const sanitizeHtml = (html) => {
    if (!html) return '';
    let safe = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^>]*>/gi, '')
      .replace(/<form\b[^>]*>/gi, '')
      .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '');
    safe = safe
      .replace(/font-family\s*:[^;}"'\r\n]+;?/gi, '')
      .replace(/color\s*:\s*#242424/gi, 'color:inherit')
      .replace(/color\s*:\s*black/gi, 'color:inherit')
      .replace(/color\s*:\s*windowtext/gi, 'color:inherit')
      .replace(/background-color\s*:\s*white[^;}"'\r\n]*;?/gi, '')
      .replace(/background\s*:\s*white[^;}"'\r\n]*;?/gi, '')
      .replace(/direction\s*:\s*ltr[^;}"'\r\n]*;?/gi, '');
    return safe;
  };

  const isHtmlContent = (text) => !!text && /<[a-z][\s\S]*>/i.test(text);

  if (!isOpen) return null;

  return (
    <>
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bug-report-modal" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h2>Pending Bug Reports from Outlook</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close">&times;</button>
        </div>

        <div className="modal-body">

          {/* ── Error banner ── */}
          {error && (
            <div className="error-banner">
              ⚠️ {error}
              <button onClick={() => setError(null)} className="error-close">×</button>
            </div>
          )}

          {/* ── Email sent success toast ── */}
          {emailSent && (
            <div style={{
              display:'flex', alignItems:'center', gap:8,
              background:'#f0fdf4', border:'1px solid #86efac',
              borderRadius:8, padding:'10px 14px', marginBottom:12,
              fontSize:13, color:'#15803d', fontWeight:500,
            }}>
              ✅&nbsp;
              Acknowledgement email sent to <strong style={{ marginLeft:3 }}>
                {selectedReport?.reportedBy?.email || 'the reporter'}
              </strong>
            </div>
          )}

          {/* ── Email send error (non-blocking) ── */}
          {emailError && (
            <div style={{
              display:'flex', alignItems:'center', gap:8,
              background:'#fff7ed', border:'1px solid #fed7aa',
              borderRadius:8, padding:'10px 14px', marginBottom:12,
              fontSize:13, color:'#c2410c', fontWeight:500,
            }}>
              ⚠️&nbsp; {emailError}
              <button
                onClick={() => setEmailError(null)}
                style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#c2410c', fontSize:16 }}
              >×</button>
            </div>
          )}

          {/* ── Sync section ── */}
          <div className="sync-section">
            <button onClick={handleSync} disabled={syncing || loading} className="sync-btn">
              {syncing
                ? <><span className="sync-spinner" />Syncing from Outlook...</>
                : <>Sync from Outlook</>
              }
            </button>
            <p className="sync-hint">Click to fetch new bug reports from the system Outlook inbox</p>
          </div>

          {/* ── Sync result summary ── */}
          {syncResult && (
            <div style={{
              display:'flex', alignItems:'flex-start', gap:8,
              background:'#f0fdf4', border:'1px solid #86efac',
              borderRadius:8, padding:'10px 14px', marginBottom:12,
              fontSize:13, color:'#15803d',
            }}>
              ✅&nbsp;
              <span>
                Sync complete — <strong>{syncResult.summary?.newBugs ?? 0}</strong> new bug{syncResult.summary?.newBugs !== 1 ? 's' : ''} added,{' '}
                <strong>{syncResult.summary?.existingBugs ?? 0}</strong> already existed.
                {syncResult.errors?.length > 0 && (
                  <span style={{ color:'#c2410c', marginLeft:4 }}>
                    {syncResult.errors.length} error{syncResult.errors.length !== 1 ? 's' : ''}.
                  </span>
                )}
              </span>
              <button
                onClick={() => setSyncResult(null)}
                style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#15803d', fontSize:16, flexShrink:0 }}
              >×</button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              ✅ VALIDATION GATE — replaces the old simple loading/empty check.
              Flow:
                1. Still checking  → spinner "Checking Outlook connection..."
                2. Check done, NOT connected → lock screen with 🔒 + Close button
                3. Check done, connected, loading → spinner "Loading pending reports..."
                4. Check done, connected, loaded, empty → "No Pending Reports"
                5. Check done, connected, loaded, has bugs → reports list
          ════════════════════════════════════════════════════════ */}
          {!outlookStatusChecked ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Checking Outlook connection...</p>
            </div>
          ) : !outlookConnected ? (
            <div style={{
              display:'flex', flexDirection:'column', alignItems:'center',
              justifyContent:'center', gap:16, padding:'48px 24px', textAlign:'center',
            }}>
              <div style={{
                width:72, height:72, borderRadius:'50%',
                background:'rgba(107,114,128,0.10)',
                border:'1px solid rgba(107,114,128,0.20)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:36,
              }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a10304" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div>
                <h3 style={{ margin:'0 0 8px', fontSize:16, fontWeight:600 }}>
                  Outlook Not Connected
                </h3>
                <p style={{ margin:'0 0 4px', fontSize:13, color:'#6b7280', lineHeight:1.6, maxWidth:320 }}>
                  Connect your Outlook account to view and manage pending bug reports.
                </p>
                <p style={{ margin:'0 0 20px', fontSize:12, color:'#9ca3af' }}>
                  Go to <strong>Settings → Connected Accounts</strong> to connect.
                </p>
                <button
                  onClick={onClose}
                  style={{
                    padding:'9px 28px', borderRadius:8, border:'none',
                    background:'#a10304', color:'#fff',
                    fontSize:13, fontWeight:600, cursor:'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Loading pending reports...</p>
            </div>
          ) : pendingReports.length === 0 ? (
            <div className="no-reports">
              <div className="no-reports-icon">📭</div>
              <h3>No Pending Reports</h3>
              <p>No pending bug reports found. Click sync to fetch from Outlook.</p>
            </div>
          ) : (
            <div className="reports-container">

              {/* ── Reports list ── */}
              <div className="reports-list">
                <h3>📋 Pending Reports ({pendingReports.length})</h3>
                {pendingReports.map(report => (
                  <div
                    key={report._id}
                    className={`report-item ${selectedReport?._id === report._id ? 'selected' : ''}`}
                    onClick={() => {
                        setSelectedReport(report);
                        setSeverity(report.severity || 'Medium');
                        setPriority(report.priority || 'Normal');
                        setNotes('');
                      }}
                  >
                    <div className="report-header">
                      <span className={`severity-badge ${report.severity?.toLowerCase()}`}>{report.severity}</span>
                      <span className={`priority-badge ${report.priority?.toLowerCase()}`}>{report.priority}</span>
                    </div>
                    <h4>{report.title}</h4>
                    <p className="report-meta">From: {report.reportedBy?.name || report.reportedBy?.email}</p>
                    <p className="report-date">{new Date(report.createdAt).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {/* ── Report detail panel ── */}
              {selectedReport && (
                <div className="report-details">
                  <div className="detail-header">
                    <h3>{selectedReport.title}</h3>
                    <div className="badges">
                      <span className={`severity-badge ${selectedReport.severity?.toLowerCase()}`}>{selectedReport.severity}</span>
                      <span className={`priority-badge ${selectedReport.priority?.toLowerCase()}`}>{selectedReport.priority}</span>
                      <span className="status-badge">{selectedReport.status}</span>
                    </div>
                  </div>

                  <div className="report-info">
                    <p><strong>Reported By:</strong> {selectedReport.reportedBy?.name}</p>
                    <p><strong>Email:</strong> {selectedReport.reportedBy?.email}</p>
                    <p><strong>Date:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</p>
                    {selectedReport.category && <p><strong>Category:</strong> {selectedReport.category}</p>}
                  </div>

                  {selectedReport.stepsToReproduce && (
                    <div className="section">
                      <strong>Steps to Reproduce:</strong>
                      {isHtmlContent(selectedReport.stepsToReproduce)
                        ? <div className="description-html" dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedReport.stepsToReproduce) }} />
                        : <p>{selectedReport.stepsToReproduce}</p>
                      }
                    </div>
                  )}

                  {/* Already actioned — In Progress */}
                  {selectedReport.status === 'In Progress' && selectedReport.startedAt && (
                    <div className="actioned-display actioned-confirmed">
                      <div className="actioned-icon">✅</div>
                      <div>
                        <strong>In Progress</strong>
                        <p>Started: {new Date(selectedReport.startedAt).toLocaleString()}</p>
                        <p className="timer-note">⏱ SLA timer is running</p>
                      </div>
                    </div>
                  )}

                  {/* Already actioned — Closed */}
                  {selectedReport.status === 'Closed' && selectedReport.invalidReason && (
                    <div className="actioned-display actioned-invalid">
                      <div className="actioned-icon">🚫</div>
                      <div>
                        <strong>Closed as Invalid</strong>
                        <p>{selectedReport.invalidReason}</p>
                      </div>
                    </div>
                  )}

                  {/* ── Confirm form ── */}
                  {selectedReport.status !== 'In Progress' && selectedReport.status !== 'Closed' && (
                    <div className="confirmation-form">
                      <h4>Confirm &amp; Update</h4>

                      <label>
                        Severity:
                        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </label>

                      <label>
                        Priority:
                        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                          <option value="Low">Low</option>
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </label>

                      <label>
                        Notes:
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add notes or comments... (optional)"
                          rows="3"
                        />
                      </label>

                      {/* Ack email notice — shown only when per-user Outlook is connected */}
                      {outlookConnected && selectedReport.reportedBy?.email && (
                        <div style={{
                          display:'flex', alignItems:'flex-start', gap:8,
                          background:'rgba(0,120,212,0.05)',
                          border:'1px solid rgba(0,120,212,0.18)',
                          borderRadius:8, padding:'10px 14px', marginBottom:14,
                          fontSize:12.5, color:'#0369a1', lineHeight:1.6,
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}>
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                          <span>
                            An acknowledgement email will be sent to{' '}
                            <strong>{selectedReport.reportedBy.email}</strong> from <strong>{outlookEmail}</strong> when you confirm.
                          </span>
                        </div>
                      )}

                      {/* Notice when Outlook not connected — no email will be sent */}
                      {!outlookConnected && selectedReport.reportedBy?.email && (
                        <div style={{
                          display:'flex', alignItems:'flex-start', gap:8,
                          background:'rgba(107,114,128,0.05)',
                          border:'1px solid rgba(107,114,128,0.18)',
                          borderRadius:8, padding:'10px 14px', marginBottom:14,
                          fontSize:12.5, color:'#6b7280', lineHeight:1.6,
                        }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:1 }}>
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          <span>
                            No acknowledgement email will be sent — your Outlook is not connected.
                            Connect it in <strong>Settings → Connected Accounts</strong>.
                          </span>
                        </div>
                      )}

                      <div className="action-buttons">
                        <button
                          className="confirm-btn"
                          disabled={sendingEmail}
                          style={sendingEmail ? { opacity:0.75, cursor:'not-allowed' } : {}}
                          onClick={() => handleConfirm('confirmed')}
                        >
                          {sendingEmail ? (
                            <>
                              <span style={{
                                display:'inline-block', width:12, height:12,
                                border:'2px solid rgba(255,255,255,0.35)',
                                borderTopColor:'#fff', borderRadius:'50%',
                                animation:'brm-spin 0.7s linear infinite',
                                marginRight:7, verticalAlign:'middle',
                              }} />
                              Confirming &amp; Sending Email…
                            </>
                          ) : (
                            <>{outlookConnected ? '✉ ' : ''}Confirm &amp; Start Working</>
                          )}
                        </button>

                        <button
                          className="reject-btn"
                          disabled={sendingEmail}
                          onClick={() => handleConfirm('rejected')}
                        >
                          Close as Invalid
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

    <style>{`@keyframes brm-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
};

export default BugReportModal;