import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  RefreshCw, Inbox, CheckCircle, XCircle, AlertCircle,
  Mail, Lock, ChevronRight, User, Calendar,
  Zap, Tag, Search,
} from 'lucide-react';
import './OutlookReports.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/* ══════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════ */
const SLA_INTERVAL = { Critical: 4, High: 8, Medium: 8, Low: 24 };

const SEV_META = {
  Critical: { color: '#DC2626', bg: 'rgba(220,38,38,0.10)', border: 'rgba(220,38,38,0.22)' },
  High:     { color: '#EA580C', bg: 'rgba(234,88,12,0.10)',  border: 'rgba(234,88,12,0.22)'  },
  Medium:   { color: '#CA8A04', bg: 'rgba(202,138,4,0.10)',  border: 'rgba(202,138,4,0.22)'  },
  Low:      { color: '#16A34A', bg: 'rgba(22,163,74,0.10)',  border: 'rgba(22,163,74,0.22)'  },
};

const STATUS_META = {
  Open:          { color: '#EA580C', bg: 'rgba(234,88,12,0.10)'   },
  'In Progress': { color: '#2563EB', bg: 'rgba(37,99,235,0.10)'   },
  Resolved:      { color: '#16A34A', bg: 'rgba(22,163,74,0.10)'   },
  Closed:        { color: '#6b7280', bg: 'rgba(107,114,128,0.10)' },
  Pending:       { color: '#7C3AED', bg: 'rgba(124,58,237,0.10)'  },
};

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
const sanitizeHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/font-family\s*:[^;}"'\r\n]+;?/gi, '')
    .replace(/color\s*:\s*#242424/gi, 'color:inherit')
    .replace(/color\s*:\s*black/gi, 'color:inherit')
    .replace(/background(?:-color)?\s*:\s*white[^;}"'\r\n]*;?/gi, '');
};
const isHtml = (t) => !!t && /<[a-z][\s\S]*>/i.test(t);

const formatBugId = (id, createdAt) => {
  if (!id) return '—';
  const d = createdAt ? new Date(createdAt) : new Date();
  return `BUG-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${id.slice(-3).toUpperCase()}`;
};

const timeAgo = (dateStr) => {
  const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
};

/* ══════════════════════════════════════════════════════════
   ACK EMAIL BUILDER
══════════════════════════════════════════════════════════ */
const buildAckEmail = (report, finalSeverity, finalPriority) => {
  const reporterName = report.reportedBy?.name || 'there';
  const bugId        = formatBugId(report._id, report.createdAt);
  const slaInterval  = SLA_INTERVAL[finalSeverity] || 8;
  const dateLogged   = report.createdAt
    ? new Date(report.createdAt).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})
    : '—';
  const sevC = SEV_META[finalSeverity]?.color || '#6b7280';
  return `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#1f2937;"><div style="background:#a10304;padding:24px 32px;border-radius:8px 8px 0 0;"><p style="margin:0;color:#fff;font-size:18px;font-weight:700;">TelexPH Bug Reporting System</p><p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;">Bug Report Acknowledgement</p></div><div style="padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;background:#fff;"><p style="margin:0 0 6px;font-size:15px;">Good day <strong>${reporterName}</strong>,</p><p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#374151;">Your bug report has been logged as <strong>${bugId}</strong> and our team is now actively working on it.</p><div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:0 0 16px;"><p style="margin:0 0 8px;font-size:13px;"><strong>Title:</strong> ${report.title||'—'}</p><p style="margin:0 0 8px;font-size:13px;"><strong>Severity:</strong> <span style="background:${sevC}1a;color:${sevC};font-size:12px;font-weight:700;padding:2px 10px;border-radius:999px;">${finalSeverity}</span></p><p style="margin:0;font-size:13px;"><strong>Date Logged:</strong> ${dateLogged}</p></div><div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px 16px;margin:0 0 20px;"><p style="margin:0;font-size:13px;color:#1d4ed8;">⏱ <strong>SLA Timer Started</strong> — Update in <strong>${slaInterval} hours</strong>.</p></div><p style="margin:0;font-size:14px;color:#374151;">Thank you for your cooperation.</p></div></div>`;
};

/* ══════════════════════════════════════════════════════════
   ATOMS
══════════════════════════════════════════════════════════ */
function SevBadge({ label }) {
  const m = SEV_META[label] || { color:'#6b7280', bg:'rgba(107,114,128,0.10)', border:'rgba(107,114,128,0.22)' };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      background:m.bg, color:m.color, border:`1px solid ${m.border}`,
      fontSize:11, fontWeight:700, padding:'3px 9px',
      borderRadius:20, whiteSpace:'nowrap', letterSpacing:'0.02em',
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:m.color, flexShrink:0 }}/>
      {label}
    </span>
  );
}

function StatusPill({ label }) {
  const m = STATUS_META[label] || { color:'#6b7280', bg:'rgba(107,114,128,0.10)' };
  return (
    <span style={{
      background:m.bg, color:m.color,
      fontSize:11, fontWeight:600, padding:'3px 10px',
      borderRadius:20, whiteSpace:'nowrap',
    }}>
      {label}
    </span>
  );
}

function Spinner({ size=28, color='#a10304' }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      border:`2.5px solid rgba(161,3,4,0.12)`,
      borderTopColor:color,
      animation:'pr-spin 0.65s linear infinite', flexShrink:0,
    }}/>
  );
}

function MetaChip({ icon: Icon, label, value, accent }) {
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:10,
      padding:'10px 13px',
      background:'var(--or-surface2, #f8f8fa)',
      border:'1px solid var(--or-border, rgba(0,0,0,0.07))',
      borderRadius:12,
    }}>
      <Icon size={13} color={accent||'var(--or-text3,#9898b0)'} strokeWidth={2} style={{ marginTop:2, flexShrink:0 }}/>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'var(--or-text3,#9898b0)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:2 }}>{label}</div>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--or-text1,#0d0d14)', wordBreak:'break-all', lineHeight:1.4 }}>{value||'—'}</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STATS ROW — inline pill chips (like Archive)
══════════════════════════════════════════════════════════ */
function StatsRow({ reports }) {
  const total    = reports.length;
  const bySev    = (s) => reports.filter(r => r.severity === s).length;
  const actioned = reports.filter(r => r.status === 'In Progress' || r.status === 'Closed').length;
  const pending  = total - actioned;
  const items = [
    { label:'Total',    value:total,              color:'#6b7280', bg:'rgba(107,114,128,0.08)', border:'rgba(107,114,128,0.18)' },
    { label:'Pending',  value:pending,            color:'#7C3AED', bg:'rgba(124,58,237,0.08)',  border:'rgba(124,58,237,0.18)'  },
    { label:'Critical', value:bySev('Critical'),  color:'#DC2626', bg:'rgba(220,38,38,0.08)',   border:'rgba(220,38,38,0.18)'   },
    { label:'High',     value:bySev('High'),      color:'#EA580C', bg:'rgba(234,88,12,0.08)',   border:'rgba(234,88,12,0.18)'   },
    { label:'Medium',   value:bySev('Medium'),    color:'#CA8A04', bg:'rgba(202,138,4,0.08)',   border:'rgba(202,138,4,0.18)'   },
    { label:'Low',      value:bySev('Low'),       color:'#16A34A', bg:'rgba(22,163,74,0.08)',   border:'rgba(22,163,74,0.18)'   },
  ];
  return (
    <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:16 }}>
      {items.map(i => (
        <div key={i.label} style={{
          display:'flex', alignItems:'center', gap:7,
          padding:'6px 14px',
          background:i.bg, border:`1px solid ${i.border}`,
          borderRadius:10,
        }}>
          <span style={{ fontSize:18, fontWeight:800, color:i.color, lineHeight:1 }}>{i.value}</span>
          <span style={{ fontSize:11, fontWeight:600, color:i.color, opacity:0.75 }}>{i.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   REPORT LIST ITEM
══════════════════════════════════════════════════════════ */
function ReportListItem({ report, isSelected, onClick }) {
  const isActioned = report.status === 'In Progress' || report.status === 'Closed';
  const sev = SEV_META[report.severity] || SEV_META.Medium;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick()}
      style={{
        padding:'13px 16px',
        background: isSelected ? 'rgba(161,3,4,0.04)' : 'transparent',
        borderBottom:'1px solid var(--or-border, rgba(0,0,0,0.07))',
        borderLeft:`3px solid ${isSelected ? '#a10304' : 'transparent'}`,
        cursor:'pointer',
        transition:'background 0.12s, border-left-color 0.12s',
      }}
    >
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6, gap:6 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
          <SevBadge label={report.severity}/>
          {isActioned && <StatusPill label={report.status}/>}
        </div>
        <span style={{ fontSize:10.5, color:'var(--or-text3,#9898b0)', whiteSpace:'nowrap' }}>{timeAgo(report.createdAt)}</span>
      </div>
      <div style={{
        fontSize:13, fontWeight:600,
        color: isSelected ? '#a10304' : 'var(--or-text1,#0d0d14)',
        lineHeight:1.45, marginBottom:6,
        display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
      }}>
        {report.title}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        <div style={{
          width:18, height:18, borderRadius:'50%',
          background:sev.bg, border:`1px solid ${sev.border}`,
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          <User size={9} color={sev.color}/>
        </div>
        <span style={{ fontSize:11, color:'var(--or-text2,#5a5a70)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {report.reportedBy?.name || report.reportedBy?.email || 'Unknown'}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DETAIL PANEL
══════════════════════════════════════════════════════════ */
function DetailPanel({ report, outlookConnected, outlookEmail, onConfirm, onReject, sendingEmail, onClose }) {
  const [priority, setPriority] = useState(report.priority || 'Normal');
  const [severity, setSeverity] = useState(report.severity || 'Medium');
  const [notes,    setNotes]    = useState('');

  useEffect(() => {
    setPriority(report.priority || 'Normal');
    setSeverity(report.severity || 'Medium');
    setNotes('');
  }, [report._id]);

  const isActioned = report.status === 'In Progress' || report.status === 'Closed';
  const sev = SEV_META[severity] || SEV_META.Medium;
  const bugId = formatBugId(report._id, report.createdAt);
  const dateStr = report.createdAt
    ? new Date(report.createdAt).toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})
    : '—';

  const inputStyle = {
    width:'100%', padding:'8px 12px',
    border:'1px solid var(--or-border-mid, rgba(0,0,0,0.11))',
    borderRadius:9, fontSize:13, outline:'none',
    fontFamily:'inherit', background:'var(--or-surface,#fff)',
    color:'var(--or-text1,#0d0d14)',
    transition:'border-color 0.15s, box-shadow 0.15s',
    boxSizing:'border-box',
  };

  return (
    <div style={{
      display:'flex', flexDirection:'column',
      background:'var(--or-surface,#fff)',
      borderRadius:16, border:'1px solid var(--or-border, rgba(0,0,0,0.07))',
      overflow:'hidden',
      boxShadow:'0 2px 12px rgba(0,0,0,0.05)',
    }}>
      {/* Header */}
      <div style={{
        padding:'16px 20px', flexShrink:0,
        borderBottom:'1px solid var(--or-border, rgba(0,0,0,0.07))',
        background:'var(--or-surface2,#f8f8fa)',
      }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:'#a10304', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6, fontFamily:'monospace' }}>{bugId}</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
              <SevBadge label={report.severity}/>
              <StatusPill label={report.status}/>
            </div>
            <h2 style={{ margin:0, fontSize:15, fontWeight:700, color:'var(--or-text1,#0d0d14)', lineHeight:1.4, letterSpacing:'-0.2px' }}>{report.title}</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              flexShrink:0, width:30, height:30, borderRadius:9,
              border:'1px solid var(--or-border-mid, rgba(0,0,0,0.11))',
              background:'var(--or-surface, #fff)', cursor:'pointer',
              display:'flex', alignItems:'center', justifyContent:'center',
              color:'var(--or-text3,#9898b0)', marginTop:2,
              transition:'all 0.15s ease',
            }}
          >
            <XCircle size={15}/>
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex:1, overflowY:'auto', padding:'18px 20px', display:'flex', flexDirection:'column', gap:18 }}>

        {/* Meta chips */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
          <MetaChip icon={User}     label="Reporter" value={report.reportedBy?.name || report.reportedBy?.email}/>
          <MetaChip icon={Mail}     label="Email"    value={report.reportedBy?.email}/>
          <MetaChip icon={Calendar} label="Received" value={dateStr}/>
          <MetaChip icon={Tag}      label="Category" value={report.category}/>
        </div>

        {/* Steps to reproduce */}
        {report.stepsToReproduce && (
          <div>
            <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--or-text3,#9898b0)', marginBottom:8 }}>
              Steps to Reproduce
            </div>
            {isHtml(report.stepsToReproduce)
              ? <div
                  className="pr-html-body"
                  style={{
                    fontSize:13, color:'var(--or-text2,#5a5a70)', lineHeight:1.75,
                    background:'var(--or-surface2,#f8f8fa)',
                    border:'1px solid var(--or-border, rgba(0,0,0,0.07))',
                    borderRadius:12, padding:'12px 14px',
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(report.stepsToReproduce) }}
                />
              : <p style={{
                  margin:0, fontSize:13, color:'var(--or-text2,#5a5a70)', lineHeight:1.75,
                  background:'var(--or-surface2,#f8f8fa)',
                  border:'1px solid var(--or-border, rgba(0,0,0,0.07))',
                  borderRadius:12, padding:'12px 14px',
                }}>
                  {report.stepsToReproduce}
                </p>
            }
          </div>
        )}

        {/* In Progress */}
        {report.status === 'In Progress' && report.startedAt && (
          <div style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'14px 16px',
            background:'rgba(22,163,74,0.06)',
            border:'1px solid rgba(22,163,74,0.20)',
            borderRadius:12,
          }}>
            <div style={{
              width:40, height:40, borderRadius:'50%',
              background:'rgba(22,163,74,0.10)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            }}>
              <CheckCircle size={20} color="#16a34a"/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'#15803d', marginBottom:2 }}>In Progress</div>
              <div style={{ fontSize:12, color:'#6b7280' }}>Started {timeAgo(report.startedAt)} &nbsp;·&nbsp; ⏱ SLA timer running</div>
            </div>
          </div>
        )}

        {/* Closed */}
        {report.status === 'Closed' && report.invalidReason && (
          <div style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'14px 16px',
            background:'rgba(107,114,128,0.05)',
            border:'1px solid rgba(107,114,128,0.18)',
            borderRadius:12,
          }}>
            <div style={{
              width:40, height:40, borderRadius:'50%',
              background:'rgba(107,114,128,0.10)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            }}>
              <XCircle size={20} color="#6b7280"/>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--or-text1,#0d0d14)', marginBottom:2 }}>Closed as Invalid</div>
              <div style={{ fontSize:12, color:'var(--or-text2,#5a5a70)' }}>{report.invalidReason}</div>
            </div>
          </div>
        )}

        {/* Triage form */}
        {!isActioned && (
          <div style={{
            background:'var(--or-surface2,#f8f8fa)',
            border:'1px solid var(--or-border, rgba(0,0,0,0.07))',
            borderRadius:14, padding:'16px 18px',
          }}>
            <div style={{ fontSize:11, fontWeight:700, color:'var(--or-text2,#5a5a70)', marginBottom:14, display:'flex', alignItems:'center', gap:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>
              <Zap size={12} color="#a10304"/> Confirm &amp; Triage
            </div>

            {/* Severity + Priority side by side */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--or-text3,#9898b0)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.04em' }}>Severity</label>
                <select
                  value={severity}
                  onChange={e => setSeverity(e.target.value)}
                  style={{ ...inputStyle, border:`1.5px solid ${sev.color}`, color:sev.color, background:sev.bg, fontWeight:700 }}
                >
                  {['Low','Medium','High','Critical'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, fontWeight:600, color:'var(--or-text3,#9898b0)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.04em' }}>Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  style={inputStyle}
                >
                  {['Low','Normal','High','Urgent'].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--or-text3,#9898b0)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                Notes <span style={{ fontWeight:400, opacity:0.55 }}>(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add internal notes…"
                rows={3}
                style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }}
              />
            </div>

            {/* Ack email notice */}
            {outlookConnected && report.reportedBy?.email && (
              <div style={{
                display:'flex', gap:8, padding:'9px 13px',
                background:'rgba(37,99,235,0.05)',
                border:'1px solid rgba(37,99,235,0.15)',
                borderRadius:10, marginBottom:12, fontSize:12, color:'#1d4ed8', lineHeight:1.6,
              }}>
                <Mail size={13} style={{ flexShrink:0, marginTop:1 }}/>
                <span>Ack email will be sent to <strong>{report.reportedBy.email}</strong> via <strong>{outlookEmail}</strong>.</span>
              </div>
            )}
            {!outlookConnected && report.reportedBy?.email && (
              <div style={{
                display:'flex', gap:8, padding:'9px 13px',
                background:'rgba(107,114,128,0.05)',
                border:'1px solid rgba(107,114,128,0.15)',
                borderRadius:10, marginBottom:12, fontSize:12, color:'var(--or-text3,#9898b0)', lineHeight:1.6,
              }}>
                <AlertCircle size={13} style={{ flexShrink:0, marginTop:1 }}/>
                <span>No ack email — Outlook not connected. <span style={{ color:'#2563eb' }}>Connect in Settings.</span></span>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display:'flex', gap:9 }}>
              <button
                onClick={() => onConfirm(severity, priority, notes)}
                disabled={sendingEmail}
                style={{
                  flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                  padding:'10px 0',
                  background: sendingEmail ? 'rgba(161,3,4,0.75)' : '#a10304',
                  color:'#fff', border:'none', borderRadius:10,
                  fontSize:13, fontWeight:700,
                  cursor:sendingEmail ? 'not-allowed' : 'pointer',
                  letterSpacing:'0.01em',
                  boxShadow: sendingEmail ? 'none' : '0 2px 8px rgba(161,3,4,0.28)',
                  transition:'background 0.15s, box-shadow 0.15s',
                }}
              >
                {sendingEmail
                  ? <><Spinner size={14} color="#fff"/> Confirming…</>
                  : <><CheckCircle size={14}/>{outlookConnected ? '✉ ' : ''}Confirm &amp; Start</>
                }
              </button>
              <button
                onClick={() => onReject(notes)}
                disabled={sendingEmail}
                style={{
                  padding:'10px 14px',
                  background:'var(--or-surface,#fff)',
                  color:'var(--or-text2,#5a5a70)',
                  border:'1px solid var(--or-border-mid, rgba(0,0,0,0.11))',
                  borderRadius:10, fontSize:13, fontWeight:600,
                  cursor:'pointer',
                  display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
                  transition:'all 0.15s ease',
                }}
              >
                <XCircle size={14}/> Close Invalid
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════════════════════ */
function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      gap:16, padding:'72px 32px', textAlign:'center',
    }}>
      <div style={{
        width:80, height:80, borderRadius:'50%',
        background:'rgba(161,3,4,0.06)',
        border:'1px solid rgba(161,3,4,0.12)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <Icon size={32} color="#a10304" strokeWidth={1.5}/>
      </div>
      <div>
        <h3 style={{ margin:'0 0 7px', fontSize:15, fontWeight:700, color:'var(--or-text1,#0d0d14)' }}>{title}</h3>
        <p style={{ margin:0, fontSize:13, color:'var(--or-text3,#9898b0)', lineHeight:1.65, maxWidth:320 }}>{subtitle}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN EXPORT
══════════════════════════════════════════════════════════ */
export default function OutlookReports() {
  const [pendingReports,       setPendingReports]       = useState([]);
  const [selectedReport,       setSelectedReport]       = useState(null);
  const [loading,              setLoading]              = useState(false);
  const [syncing,              setSyncing]              = useState(false);
  const [error,                setError]                = useState(null);
  const [syncResult,           setSyncResult]           = useState(null);
  const [outlookConnected,     setOutlookConnected]     = useState(false);
  const [outlookStatusChecked, setOutlookStatusChecked] = useState(false);
  const [outlookEmail,         setOutlookEmail]         = useState('');
  const [systemEmail,          setSystemEmail]          = useState('');
  const [sendingEmail,         setSendingEmail]         = useState(false);
  const [emailSent,            setEmailSent]            = useState(false);
  const [emailError,           setEmailError]           = useState(null);
  const [searchQ,              setSearchQ]              = useState('');
  const [sevFilter,            setSevFilter]            = useState('All');

  const token = () => localStorage.getItem('adminToken');

  useEffect(() => {
    checkOutlookStatus();
    fetchSystemEmail();
  }, []);

  useEffect(() => {
    if (outlookStatusChecked && outlookConnected) fetchPendingReports();
  }, [outlookStatusChecked, outlookConnected]);

  const checkOutlookStatus = async () => {
    try {
      const res = await axios.get(`${API}/outlook/status`, { headers: { Authorization:`Bearer ${token()}` } });
      setOutlookConnected(res.data?.connected === true);
      setOutlookEmail(res.data?.email || '');
    } catch { setOutlookConnected(false); }
    finally { setOutlookStatusChecked(true); }
  };

  const fetchSystemEmail = async () => {
    try {
      const res = await axios.get(`${API}/outlook/system-status`, { headers: { Authorization:`Bearer ${token()}` } });
      if (res.data?.configured) setSystemEmail(res.data.email || '');
    } catch {}
  };

  const fetchPendingReports = async () => {
    try {
      setLoading(true); setError(null);
      const res = await axios.get(`${API}/bugs/pending`, { headers: { Authorization:`Bearer ${token()}` } });
      setPendingReports(res.data || []);
    } catch (err) {
      setError('Failed to fetch: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  const handleSync = async () => {
    setSyncing(true); setError(null); setSyncResult(null);
    try {
      const res = await axios.post(`${API}/bugs/sync`, {}, { headers: { Authorization:`Bearer ${token()}` }, timeout:60000 });
      setSyncResult(res.data);
      await fetchPendingReports();
    } catch (err) {
      setError('Sync failed: ' + (err.response?.data?.error || err.message));
    } finally { setSyncing(false); }
  };

  const sendAckEmail = async (report, finalSeverity, finalPriority) => {
    const reporterEmail = report.reportedBy?.email;
    if (!reporterEmail) return;
    setSendingEmail(true); setEmailError(null);
    try {
      await axios.post(`${API}/outlook/send`, {
        subject:`[Bug Acknowledged] ${report.title || 'Your Bug Report'}`,
        body:   buildAckEmail(report, finalSeverity, finalPriority),
        toRecipients:[reporterEmail],
      }, { headers: { Authorization:`Bearer ${token()}` } });
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 6000);
    } catch (err) {
      setEmailError('Email failed: ' + (err.response?.data?.message || err.message));
    } finally { setSendingEmail(false); }
  };

  const handleConfirm = async (severity, priority, notes) => {
    if (!selectedReport) return;
    try {
      await axios.patch(`${API}/bugs/${selectedReport._id}/confirm`,
        { status:'In Progress', priority, severity, notes:notes.trim() },
        { headers: { Authorization:`Bearer ${token()}` } }
      );
      if (outlookConnected) await sendAckEmail(selectedReport, severity, priority);
      applyUpdate(selectedReport._id, { status:'In Progress', startedAt:new Date().toISOString() });
    } catch (err) {
      setError('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (notes) => {
    if (!selectedReport) return;
    try {
      await axios.patch(`${API}/bugs/${selectedReport._id}/confirm`,
        { status:'Closed', notes:notes.trim() || 'Closed as invalid' },
        { headers: { Authorization:`Bearer ${token()}` } }
      );
      applyUpdate(selectedReport._id, { status:'Closed', invalidReason:notes.trim() || 'Closed as invalid' });
    } catch (err) {
      setError('Failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const applyUpdate = (id, patch) => {
    setPendingReports(prev => prev.map(r => r._id === id ? {...r,...patch} : r));
    setSelectedReport(prev => prev?._id === id ? {...prev,...patch} : prev);
    setTimeout(() => {
      setPendingReports(prev => prev.filter(r => r._id !== id));
      setSelectedReport(prev => prev?._id === id ? null : prev);
    }, 500);
  };

  const visibleReports = pendingReports.filter(r => {
    const matchSev = sevFilter === 'All' || r.severity === sevFilter;
    const matchQ   = !searchQ || r.title?.toLowerCase().includes(searchQ.toLowerCase()) || r.reportedBy?.name?.toLowerCase().includes(searchQ.toLowerCase());
    return matchSev && matchQ;
  });

  /* ── Checking connection ── */
  if (!outlookStatusChecked) return (
    <div className="outlook-reports" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:380 }}>
      <div style={{ textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
        <Spinner size={36}/>
        <p style={{ margin:0, fontSize:13, color:'var(--or-text3,#9898b0)' }}>Checking Outlook connection…</p>
      </div>
      <style>{`@keyframes pr-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ─────────────────────────────────────────── RENDER ─── */
  return (
    <div className="outlook-reports">
      <style>{`
        @keyframes pr-spin { to { transform: rotate(360deg); } }
        .pr-html-body ul, .pr-html-body ol { padding-left: 20px; margin: 6px 0; }
        .pr-html-body li { margin-bottom: 4px; }
        .pr-html-body p  { margin: 6px 0; }
        :root.dark .pr-html-body { color: rgba(238,238,245,0.75) !important; }
        .or-report-list-item:hover { background: var(--or-surface2,#f8f8fa) !important; }
      `}</style>

      {/* ══ PAGE HEADER ══ */}
      <div className="or-header">
        <div className="or-header-left">
          <div className="or-header-icon"><Inbox size={22}/></div>
          <div>
            <h1 className="or-title">Pending Bug Reports</h1>
            <p className="or-subtitle">Review and triage incoming reports from the system Outlook inbox</p>
          </div>
        </div>
      </div>

      {/* ══ ALERTS ══ */}
      {error && (
        <div style={{
          display:'flex', alignItems:'center', gap:9,
          padding:'10px 15px',
          background:'#fff5f5', border:'1px solid #fecaca', borderLeft:'3px solid #ef4444',
          borderRadius:10, marginBottom:12, fontSize:13, color:'#991b1b', fontWeight:500,
        }}>
          <AlertCircle size={14} style={{ flexShrink:0 }}/> {error}
          <button onClick={() => setError(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#ef4444', fontSize:16 }}>×</button>
        </div>
      )}

      {emailSent && (
        <div style={{
          display:'flex', alignItems:'center', gap:9,
          padding:'10px 15px',
          background:'#f0fdf4', border:'1px solid #bbf7d0',
          borderRadius:10, marginBottom:12, fontSize:13, color:'#15803d', fontWeight:500,
        }}>
          <CheckCircle size={14}/> Acknowledgement email sent successfully.
          <button onClick={() => setEmailSent(false)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#15803d', fontSize:16 }}>×</button>
        </div>
      )}

      {emailError && (
        <div style={{
          display:'flex', alignItems:'center', gap:9,
          padding:'10px 15px',
          background:'#fff7ed', border:'1px solid #fed7aa',
          borderRadius:10, marginBottom:12, fontSize:13, color:'#c2410c',
        }}>
          <AlertCircle size={14} style={{ flexShrink:0 }}/> {emailError}
          <button onClick={() => setEmailError(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#c2410c', fontSize:16 }}>×</button>
        </div>
      )}

      {/* ══ TOOLBAR ══ */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, flexWrap:'wrap' }}>

        {/* Sync button */}
        <button
          onClick={handleSync}
          disabled={syncing || loading}
          style={{
            display:'flex', alignItems:'center', gap:7,
            padding:'9px 20px',
            background: (syncing || loading) ? 'rgba(161,3,4,0.65)' : '#a10304',
            color:'#fff', border:'none', borderRadius:10,
            fontSize:13, fontWeight:700,
            cursor:(syncing || loading) ? 'not-allowed' : 'pointer',
            flexShrink:0, fontFamily:'inherit',
            boxShadow: (syncing || loading) ? 'none' : '0 2px 8px rgba(161,3,4,0.28)',
            transition:'all 0.15s ease',
          }}
        >
          <RefreshCw size={14} style={{ animation:syncing ? 'pr-spin 0.65s linear infinite' : 'none' }}/>
          {syncing ? 'Syncing…' : 'Sync from Outlook'}
        </button>

        {/* Search input */}
        <div style={{ flex:1, minWidth:180, position:'relative' }}>
          <Search size={13} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--or-text3,#9898b0)', pointerEvents:'none' }}/>
          <input
            type="text"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search by title or reporter…"
            style={{
              width:'100%', padding:'9px 12px 9px 34px',
              border:'1px solid var(--or-border-mid, rgba(0,0,0,0.11))',
              borderRadius:10, fontSize:13,
              color:'var(--or-text1,#0d0d14)',
              background:'var(--or-surface,#fff)',
              outline:'none', boxSizing:'border-box', fontFamily:'inherit',
            }}
          />
        </div>

        {/* Severity filter pills */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {['All','Critical','High','Medium','Low'].map(s => {
            const active = sevFilter === s;
            const m = SEV_META[s];
            return (
              <button
                key={s}
                onClick={() => setSevFilter(s)}
                style={{
                  padding:'6px 13px',
                  border:`1px solid ${active && m ? m.border : 'var(--or-border-mid, rgba(0,0,0,0.11))'}`,
                  borderRadius:9, fontSize:11, fontWeight:600,
                  background: active && m ? m.bg : 'transparent',
                  color: active && m ? m.color : active ? '#a10304' : 'var(--or-text3,#9898b0)',
                  cursor:'pointer', fontFamily:'inherit',
                  transition:'all 0.13s ease',
                }}
              >
                {s}
              </button>
            );
          })}
        </div>

        {/* Sync result chip */}
        {syncResult && (
          <div style={{
            display:'flex', alignItems:'center', gap:7,
            padding:'6px 13px',
            background:'#f0fdf4', border:'1px solid #bbf7d0',
            borderRadius:9, fontSize:12, color:'#15803d', flexShrink:0,
          }}>
            <CheckCircle size={13}/>
            <strong>{syncResult.summary?.newBugs ?? 0}</strong> new,&nbsp;<strong>{syncResult.summary?.existingBugs ?? 0}</strong> existing
            <button onClick={() => setSyncResult(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#15803d', fontSize:14, padding:0, lineHeight:1 }}>×</button>
          </div>
        )}
      </div>

      {/* ══ STATS CHIPS ══ */}
      {pendingReports.length > 0 && <StatsRow reports={pendingReports}/>}

      {/* ══ MAIN BODY ══ */}
      {!outlookConnected ? (
        <div style={{
          background:'var(--or-surface,#fff)',
          border:'1px solid var(--or-border, rgba(0,0,0,0.07))',
          borderRadius:16,
          boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <EmptyState icon={Lock} title="Outlook Not Connected" subtitle="Connect your Outlook account in Settings → Connected Accounts to view and manage pending bug reports."/>
        </div>
      ) : loading ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, padding:'72px 0' }}>
          <Spinner size={34}/>
          <p style={{ fontSize:13, color:'var(--or-text3,#9898b0)', margin:0 }}>Loading pending reports…</p>
        </div>
      ) : pendingReports.length === 0 ? (
        <div style={{
          background:'var(--or-surface,#fff)',
          border:'1px solid var(--or-border, rgba(0,0,0,0.07))',
          borderRadius:16, boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
        }}>
          <EmptyState icon={Inbox} title="No Pending Reports" subtitle="No pending bug reports found. Click Sync from Outlook to fetch the latest reports from the inbox."/>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'minmax(250px,310px) 1fr', gap:14, alignItems:'start' }}>

          {/* ── Left: report list ── */}
          <div style={{
            background:'var(--or-surface,#fff)',
            border:'1px solid var(--or-border, rgba(0,0,0,0.07))',
            borderRadius:16, overflow:'hidden',
            boxShadow:'0 1px 4px rgba(0,0,0,0.05)',
          }}>
            <div style={{
              padding:'11px 16px',
              borderBottom:'1px solid var(--or-border, rgba(0,0,0,0.07))',
              background:'var(--or-surface2,#f8f8fa)',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--or-text3,#9898b0)' }}>Reports</span>
              <span style={{
                fontSize:11, fontWeight:700, color:'#a10304',
                background:'rgba(161,3,4,0.08)',
                padding:'2px 10px', borderRadius:20,
              }}>{visibleReports.length}</span>
            </div>
            <div style={{ maxHeight:'calc(100vh - 380px)', overflowY:'auto' }}>
              {visibleReports.length === 0
                ? <div style={{ padding:'36px 20px', textAlign:'center', fontSize:13, color:'var(--or-text3,#9898b0)' }}>No reports match filters.</div>
                : visibleReports.map(r => (
                  <ReportListItem
                    key={r._id}
                    report={r}
                    isSelected={selectedReport?._id === r._id}
                    onClick={() => setSelectedReport(r)}
                  />
                ))
              }
            </div>
          </div>

          {/* ── Right: detail panel ── */}
          {selectedReport
            ? <DetailPanel
                report={selectedReport}
                outlookConnected={outlookConnected}
                outlookEmail={outlookEmail}
                onConfirm={handleConfirm}
                onReject={handleReject}
                sendingEmail={sendingEmail}
                onClose={() => setSelectedReport(null)}
              />
            : <div style={{
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:12, padding:'72px 24px',
                background:'var(--or-surface,#fff)',
                border:'1.5px dashed var(--or-border-mid, rgba(0,0,0,0.11))',
                borderRadius:16, textAlign:'center',
              }}>
                <div style={{
                  width:60, height:60, borderRadius:'50%',
                  background:'rgba(161,3,4,0.05)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <ChevronRight size={26} color="#a10304" strokeWidth={1.5}/>
                </div>
                <p style={{ fontSize:13, color:'var(--or-text3,#9898b0)', margin:0 }}>
                  Select a report from the list to view details &amp; take action
                </p>
              </div>
          }
        </div>
      )}
    </div>
  );
}