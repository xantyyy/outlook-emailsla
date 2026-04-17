import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  AlertCircle, Hash, X, Search, Filter,
  ChevronDown, Timer, CheckCircle, Lock, User,
  ArrowLeft, ExternalLink, ArrowUp, ArrowDown,
  LayoutDashboard, Info, MessageSquare, Clock, Tag,
  Layers, Wifi, Phone,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════
   DARK MODE HELPER
═══════════════════════════════════════════════════ */
const getDarkModeFromStorage = () => {
  try {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  } catch { return false; }
};

/* ═══════════════════════════════════════════════════
   THEME
═══════════════════════════════════════════════════ */
const makeStyles = (dark) => {
  const bg        = dark ? '#0c0b0b'  : '#f8fafc';
  const surface   = dark ? '#1a1d27'  : '#ffffff';
  const surface2  = dark ? '#22263a'  : '#f9fafb';
  const border    = dark ? '#2e3347'  : '#e5e7eb';
  const border2   = dark ? '#252840'  : '#f3f4f6';
  const textPri   = dark ? '#e2e8f0'  : '#454545';
  const textSec   = dark ? '#94a3b8'  : '#9ca3af';
  const textMuted = dark ? '#64748b'  : '#b0a0a0';
  const shadow    = dark
    ? '0 4px 16px rgba(0,0,0,0.4)'
    : '0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)';
  const shadowHero = dark
    ? '0 4px 20px rgba(0,0,0,0.5)'
    : '0 4px 16px rgba(0,0,0,0.08)';
  return {
    bg, surface, surface2, border, border2,
    textPri, textSec, textMuted, shadow, shadowHero,
    dark,
    cardHero:  { background: 'linear-gradient(135deg, #4a0a0a 0%, #bb0000 100%)', borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s ease, box-shadow 0.2s ease', border: 'none', boxShadow: shadowHero },
    cardWhite: { background: surface, borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s ease, box-shadow 0.2s ease', border: dark ? `1px solid ${border}` : 'none', boxShadow: shadow },
    iconHero:   { width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#fca5a5' },
    iconRed:    { width: '44px', height: '44px', borderRadius: '12px', background: dark ? 'rgba(220,38,38,0.15)' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#b91c1c' },
    iconMaroon: { width: '44px', height: '44px', borderRadius: '12px', background: dark ? 'rgba(127,29,29,0.2)' : '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#7f1d1d' },
    labelHero:  { fontSize: '11px', fontWeight: 400, color: 'rgba(255,210,210,0.60)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' },
    labelWhite: { fontSize: '11px', fontWeight: 400, color: textMuted, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' },
    valueHero:  { fontSize: '32px', fontWeight: 600, color: 'rgba(255,255,255,0.90)', lineHeight: 1.1, marginBottom: '10px' },
    valueWhite: { fontSize: '32px', fontWeight: 600, color: textPri, lineHeight: 1.1, marginBottom: '10px' },
    badgeHero:   { display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(255,255,255,0.15)', color: '#fca5a5', fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px' },
    badgeRed:    { display: 'inline-flex', alignItems: 'center', gap: '3px', background: dark ? 'rgba(220,38,38,0.15)' : '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px' },
    badgeMaroon: { display: 'inline-flex', alignItems: 'center', gap: '3px', background: dark ? 'rgba(127,29,29,0.2)' : '#ffeaea', color: '#b91c1c', fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px' },
    searchBox:   { display: 'flex', alignItems: 'center', gap: '8px', background: surface2, borderRadius: '10px', padding: '8px 12px', border: `1px solid ${border}` },
    searchInput: { background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: textPri, fontFamily: "'Poppins', sans-serif", fontWeight: 400, flex: 1, width: '100%' },
    clearSearch: { background: 'none', border: 'none', cursor: 'pointer', color: textSec, display: 'flex', padding: 0 },
  };
};

/* ═══════════════════════════════════════════════════
   CONSTANTS & DATA
═══════════════════════════════════════════════════ */
const ALLOWED_STATUSES = ['New', 'Open', 'Pending', 'OnHold', 'Resolved'];
const ALLOWED_TRANSITIONS = {
  New:      ['Open', 'Resolved'],
  Open:     ['Pending', 'OnHold', 'Resolved'],
  Pending:  ['Open', 'OnHold', 'Resolved'],
  OnHold:   ['Open', 'Pending', 'Resolved'],
  Resolved: [],
};

const mapOldStatus = (raw = '') => {
  const map = {
    new: 'New', open: 'Open', pending: 'Pending',
    onhold: 'OnHold', on_hold: 'OnHold', 'on hold': 'OnHold', hold: 'OnHold',
    resolved: 'Resolved', solved: 'Resolved', closed: 'Resolved', done: 'Resolved',
  };
  return map[raw.trim().toLowerCase()] ?? 'New';
};

const validateStatus     = (s) => ALLOWED_STATUSES.includes(s);
const validateTransition = (from, to, isAdmin = false) => {
  if (!validateStatus(to))   return { ok: false, reason: `"${to}" is not a valid status.` };
  if (from === to)           return { ok: false, reason: 'Status is already set to this value.' };
  if (isAdmin)               return { ok: true };
  const allowed = ALLOWED_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) return { ok: false, reason: `Cannot transition from ${from} → ${to}. Allowed: ${allowed.join(', ') || 'none'}.` };
  return { ok: true };
};

const handleStatusChange = (from, newStatus, applyFn, isAdmin = false) => {
  const { ok, reason } = validateTransition(from, newStatus, isAdmin);
  if (!ok) { return { ok, reason }; }
  applyFn(newStatus);
  return { ok };
};

const validateBeforeOpen = (ticket) =>
  ticket.assignee ? { ok: true } : { ok: false, reason: 'Ticket must have an assignee before it can be set to Open.' };

const handlePendingStatus = (ticket, updateFn) => updateFn(ticket.id, {
  status: 'Pending', pendingAt: new Date().toISOString(), statusNote: 'Waiting for requester reply.',
});
const handleOnHoldStatus = (ticket, updateFn) => updateFn(ticket.id, {
  status: 'OnHold', onHoldAt: new Date().toISOString(),
  statusNote: 'External dependency. SLA paused.', slaPaused: true,
});
const resolveTicket = (ticket, updateFn) => {
  const resolvedAt = new Date().toISOString();
  const startMs    = ticket.slaStartTime ? new Date(ticket.slaStartTime).getTime() : null;
  const resMs      = new Date(resolvedAt).getTime();
  const resolutionMinutes = startMs ? Math.round((resMs - startMs) / 60_000) : null;
  updateFn(ticket.id, {
    status: 'Resolved', resolvedAt, resolutionMinutes, slaStopped: true,
    statusNote: `Resolved in ${resolutionMinutes ?? '?'} minutes.`,
  });
};

const STATUS_META = {
  New:      { bg: '#f59e0b', label: 'NEW'     },
  Open:     { bg: '#ef4444', label: 'OPEN'    },
  Pending:  { bg: '#3b82f6', label: 'PENDING' },
  OnHold:   { bg: '#6b7280', label: 'ON HOLD' },
  Resolved: { bg: '#10b981', label: 'SOLVED'  },
};
const getStatusMeta = (s) => STATUS_META[s] ?? { bg: '#9ca3af', label: String(s).toUpperCase() };

const PRIORITY_COLORS = {
  high:   { bg: 'rgba(239,68,68,0.1)',   color: '#ef4444',  border: 'rgba(239,68,68,0.2)'   },
  normal: { bg: 'rgba(99,102,241,0.08)', color: '#6366f1',  border: 'rgba(99,102,241,0.2)'  },
  low:    { bg: 'rgba(16,185,129,0.08)', color: '#10b981',  border: 'rgba(16,185,129,0.2)'  },
};

const CHANNEL_ICON = (channel) => {
  if (channel?.toLowerCase().includes('whatsapp')) return <Phone size={10}/>;
  if (channel?.toLowerCase().includes('widget'))   return <Wifi size={10}/>;
  return <Layers size={10}/>;
};

/* SLA */
const calculateSLATimer = (ticket, nowMs = Date.now()) => {
  if (ticket.slaStopped) return { diffMins: 0, breached: false, stopped: true,  paused: false };
  if (ticket.slaPaused)  return { diffMins: 0, breached: false, stopped: false, paused: true  };
  const diffMs   = new Date(ticket.slaDeadline).getTime() - nowMs;
  const diffMins = Math.round(diffMs / 60_000);
  return { diffMins, breached: diffMins < 0, stopped: false, paused: false };
};
const formatSLATime = (diffMins) => {
  const breached = diffMins < 0;
  const absMins  = Math.abs(diffMins);
  const prefix   = breached ? '-' : '';
  return absMins > 120 ? `${prefix}${Math.round(absMins / 60)}h` : `${prefix}${absMins}m`;
};
const getSLAColor = (breached, paused = false, stopped = false) => {
  if (stopped) return { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
  if (paused)  return { bg: '#fefce8', color: '#ca8a04', border: '#fde68a' };
  return breached
    ? { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
    : { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' };
};
const useSlaTimer = (ticket) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    if (ticket.slaStopped || ticket.slaPaused) return;
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [ticket.slaStopped, ticket.slaPaused]);
  const { diffMins, breached, stopped, paused } = calculateSLATimer(ticket, nowMs);
  const label = stopped ? 'Done' : paused ? 'Paused' : formatSLATime(diffMins);
  return { label, breached, stopped, paused };
};

/* Screen */
const detectScreenSize = () => {
  const w = window.innerWidth;
  if (w < 640)  return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
};
const useScreenSize = () => {
  const [size, setSize] = useState(() => typeof window !== 'undefined' ? detectScreenSize() : 'desktop');
  useEffect(() => {
    const h = () => setSize(detectScreenSize());
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return size;
};

/* Raw data */
const _now = Date.now();
const mins = (m) => new Date(_now + m * 60_000).toISOString();
const RAW_TICKETS = [
  { id: 2138, subject: 'Chat with Visitor 1570139948',                                channel: 'Web form',   form: 'Returns',         requester: 'Jane Dough',       requested: 'Oct 03', assignee: 'Imaadh S',  status: 'open',    priority: 'high',   slaDeadline: mins(1440), slaStartTime: mins(-60)  },
  { id: 2137, subject: 'return policy',                                               channel: 'Web form',   form: 'General Request', requester: 'Courtney Barnett', requested: 'Oct 03', assignee: null,        status: 'new',     priority: 'normal', slaDeadline: mins(300),  slaStartTime: mins(-180) },
  { id: 2132, subject: 'return policy duplicate',                                     channel: 'Web form',   form: 'General Request', requester: 'Courtney Barnett', requested: 'Oct 03', assignee: null,        status: 'new',     priority: 'normal', slaDeadline: mins(89),   slaStartTime: mins(-391) },
  { id: 2092, subject: 'Return (Bergman)',                                            channel: 'Web Widget', form: 'Returns',         requester: 'Sarah Johnson',    requested: 'Sep 25', assignee: null,        status: 'new',     priority: 'normal', slaDeadline: mins(30),   slaStartTime: mins(-450) },
  { id: 2080, subject: "Hi, could you help me with my new shoes? They don't fit....", channel: 'WhatsApp',   form: 'General Request', requester: 'Peter Tailby',     requested: 'Sep 24', assignee: 'Peter Tai', status: 'pending', priority: 'normal', slaDeadline: mins(5),    slaStartTime: mins(-475) },
  { id: 1923, subject: 'Hi',                                                          channel: 'Web form',   form: 'General Request', requester: 'JP',               requested: 'Sep 06', assignee: 'Daniel Ru', status: 'open',    priority: 'normal', slaDeadline: mins(-5),   slaStartTime: mins(-485) },
  { id: 1733, subject: 'Old ticket follow-up',                                        channel: 'Web form',   form: 'Status',          requester: 'Mariana Portela',  requested: 'Aug 07', assignee: 'Daniel Ru', status: 'on hold', priority: 'low',    slaDeadline: mins(-20),  slaStartTime: mins(-500), slaPaused: true },
  { id: 1711, subject: 'Order issue with recent purchase',                            channel: 'Web form',   form: 'Returns',         requester: 'Renato Rojas',     requested: 'Aug 05', assignee: 'Abhi Ba',   status: 'open',    priority: 'normal', slaDeadline: mins(-75),  slaStartTime: mins(-555) },
  { id: 1532, subject: 'Replacement request for defective item',                      channel: 'Web Widget', form: 'Returns',         requester: 'Sample customer',  requested: 'Jul 11', assignee: 'Santosh',   status: 'solved',  priority: 'normal', slaDeadline: mins(-130), slaStartTime: mins(-610), slaStopped: true },
  { id: 1441, subject: 'Faulty product received',                                     channel: 'WhatsApp',   form: 'General Request', requester: 'Phillip Jordan',   requested: 'Jun 24', assignee: null,        status: 'pending', priority: 'high',   slaDeadline: mins(2),    slaStartTime: mins(-478) },
  { id: 1306, subject: 'Return request for size mismatch',                            channel: 'Web form',   form: 'Returns',         requester: 'Franz Decker',     requested: 'May 28', assignee: null,        status: 'new',     priority: 'normal', slaDeadline: mins(-480), slaStartTime: mins(-960) },
  { id: 1150, subject: 'Shoe size wrong — need exchange',                             channel: 'Web Widget', form: 'Returns',         requester: 'John Customer',    requested: 'Apr 08', assignee: null,        status: 'new',     priority: 'normal', slaDeadline: mins(110),  slaStartTime: mins(-370) },
  { id: 1149, subject: 'Can I return my shoes?',                                      channel: 'Web Widget', form: 'Returns',         requester: 'Emily Customer',   requested: 'Apr 08', assignee: null,        status: 'new',     priority: 'normal', slaDeadline: mins(720),  slaStartTime: mins(-240) },
  { id: 1142, subject: 'Return — closed',                                             channel: 'Web form',   form: 'Returns',         requester: 'Jane Dough',       requested: 'Apr 04', assignee: null,        status: 'closed',  priority: 'normal', slaDeadline: mins(-10),  slaStartTime: mins(-490), slaStopped: true },
];
const TICKETS_INIT = RAW_TICKETS.map(t => ({ slaPaused: false, slaStopped: false, ...t, status: mapOldStatus(t.status) }));
const HIDDEN_IN_ALL = new Set(['OnHold', 'Resolved']);

const STATUS_FILTER_OPTIONS = [
  { value: 'All',      label: 'All Statuses', color: '#ef4444' },
  { value: 'New',      label: 'New',          color: '#f59e0b' },
  { value: 'Open',     label: 'Open',         color: '#ef4444' },
  { value: 'Pending',  label: 'Pending',      color: '#3b82f6' },
  { value: 'OnHold',   label: 'On Hold',      color: '#6b7280' },
  { value: 'Resolved', label: 'Solved',       color: '#10b981' },
];

/* Column widths */
const col = {
  id:        { flex: '0 0 5%',  minWidth: 44  },
  subject:   { flex: '1 1 28%', minWidth: 120, overflow: 'hidden' },
  channel:   { flex: '0 0 10%', minWidth: 72  },
  status:    { flex: '0 0 10%', minWidth: 80  },
  requester: { flex: '0 0 14%', minWidth: 90  },
  requested: { flex: '0 0 10%', minWidth: 72  },
  sla:       { flex: '0 0 9%',  minWidth: 72  },
  assignee:  { flex: '1 1 14%', minWidth: 80, paddingRight: 12, overflow: 'hidden' },
};

/* Avatar helpers */
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #7f1d1d, #ef4444)',
  'linear-gradient(135deg, #1e3a5f, #3b82f6)',
  'linear-gradient(135deg, #14532d, #22c55e)',
  'linear-gradient(135deg, #4c1d95, #8b5cf6)',
  'linear-gradient(135deg, #78350f, #f59e0b)',
];
const avatarBg = (name = '') => AVATAR_GRADIENTS[(name.charCodeAt(0) || 0) % AVATAR_GRADIENTS.length];

/* ═══════════════════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════════════════ */

const SlaPill = ({ ticket }) => {
  const { label, breached, stopped, paused } = useSlaTimer(ticket);
  const { bg, color, border } = getSLAColor(breached, paused, stopped);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 12,
      background: bg, color, border: `1px solid ${border}`,
      fontSize: 11, fontWeight: 600, letterSpacing: 0.2,
      fontFamily: "'Poppins','Segoe UI',sans-serif",
      flexShrink: 0, whiteSpace: 'nowrap',
    }}>
      <Timer size={10} strokeWidth={2.5}/>{label}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const { bg, label } = getStatusMeta(status);
  return (
    <span style={{
      background: bg, color: '#fff', fontSize: 10, fontWeight: 600,
      letterSpacing: 0.4, padding: '2px 7px', borderRadius: 4,
      whiteSpace: 'nowrap', flexShrink: 0,
      fontFamily: "'Poppins','Segoe UI',sans-serif",
    }}>{label}</span>
  );
};

const StatusFilterDropdown = ({ value, onChange, T }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const selected = STATUS_FILTER_OPTIONS.find(o => o.value === value);
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 12, fontWeight: 400, color: T.textSec, padding: '2px 4px',
        fontFamily: "'Poppins',sans-serif",
      }}>
        {selected && <span style={{ width: 7, height: 7, borderRadius: '50%', background: selected.color, flexShrink: 0 }}/>}
        {selected?.label || 'Status'}
        <ChevronDown size={11} style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}/>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 6,
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 300,
          minWidth: 170, padding: '6px 0',
        }}>
          {STATUS_FILTER_OPTIONS.map((opt) => {
            const isSel = value === opt.value;
            return (
              <div key={opt.value}
                onClick={(e) => { e.stopPropagation(); onChange(opt.value); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 14px', cursor: 'pointer',
                  background: isSel ? `${opt.color}18` : 'transparent',
                  transition: 'background 0.1s', fontSize: 12,
                  fontWeight: isSel ? 500 : 400,
                  color: isSel ? opt.color : T.textSec,
                  fontFamily: "'Poppins',sans-serif",
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = T.surface2; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color, flexShrink: 0 }}/>
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Toast = ({ message, onDismiss }) =>
  message ? (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: '#1e1e2e', color: '#fff', padding: '10px 20px', borderRadius: 10,
      fontSize: 12, fontWeight: 400, zIndex: 400,
      display: 'flex', gap: 12, alignItems: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap',
      fontFamily: "'Poppins',sans-serif",
    }}>
      {message}
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
        <X size={13}/>
      </button>
    </div>
  ) : null;

const Hoverable = ({ children, style, onClick, title }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <span onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={title}
      style={{
        ...style, cursor: 'pointer',
        color: hovered ? '#ef4444' : (style?.color ?? '#374151'),
        textDecoration: hovered ? 'underline' : 'none',
        transition: 'color 0.15s ease',
        display: 'inline-flex', alignItems: 'center', gap: 3,
        fontFamily: "'Poppins',sans-serif",
      }}>
      {children}
    </span>
  );
};

const ProfileModal = ({ modal, tickets, onClose, T }) => {
  if (!modal) return null;
  const { type, id } = modal;
  const related = tickets.filter(t => type === 'requester' ? t.requester === id : t.assignee === id);
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
      backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div style={{
        background: T.surface, borderRadius: 20, width: 440, maxWidth: '90vw',
        maxHeight: '80vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        padding: 24, border: `1px solid ${T.border}`,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: type === 'assignee'
                ? 'linear-gradient(135deg, #7f1d1d, #ef4444)'
                : 'linear-gradient(135deg, #92400e, #f97316)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600,
            }}>
              {initials(String(id))}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.textPri, fontFamily: "'Poppins',sans-serif" }}>{id}</div>
              <div style={{ fontSize: 11, fontWeight: 400, color: T.textMuted, textTransform: 'capitalize', fontFamily: "'Poppins',sans-serif" }}>{type}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted }}>
            <X size={16}/>
          </button>
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, color: T.textMuted, marginBottom: 8, fontFamily: "'Poppins',sans-serif" }}>Related Tickets ({related.length})</div>
        {related.length === 0 && <div style={{ fontSize: 12, color: T.textMuted, padding: '8px 0', fontFamily: "'Poppins',sans-serif" }}>No related tickets found.</div>}
        {related.map(t => (
          <div key={t.id} style={{
            padding: '8px 12px', borderRadius: 10, border: `1px solid ${T.border}`,
            marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: T.surface2,
          }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: T.textPri, fontFamily: "'Poppins',sans-serif" }}>#{t.id} {t.subject.slice(0, 35)}…</div>
              <div style={{ fontSize: 11, fontWeight: 400, color: T.textMuted, fontFamily: "'Poppins',sans-serif" }}>{t.requested}</div>
            </div>
            <StatusBadge status={t.status}/>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   REDESIGNED CARD
═══════════════════════════════════════════════════ */
const TicketCard = ({ ticket, selected, onClick, setProfileModal, T }) => {
  const { bg: statusBg } = getStatusMeta(ticket.status);
  const { label: slaLabel, breached, stopped, paused } = useSlaTimer(ticket);
  const slaColors = getSLAColor(breached, paused, stopped);
  const pc = PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.normal;

  return (
    <div
      onClick={() => onClick(ticket.id)}
      className="rt-ticket-card"
      style={{
        background: T.surface,
        borderRadius: 16,
        border: selected ? '1.5px solid #ef4444' : `1px solid ${T.border}`,
        boxShadow: selected
          ? '0 0 0 3px rgba(239,68,68,0.1), 0 4px 16px rgba(0,0,0,0.08)'
          : T.shadow,
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Colored top bar */}
      <div style={{ height: 3, background: statusBg }} />

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Row 1: ticket ID + status chip + SLA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, color: T.textMuted,
              background: T.surface2, border: `1px solid ${T.border}`,
              padding: '1px 6px', borderRadius: 5,
              fontFamily: "'Poppins',sans-serif", letterSpacing: 0.3,
            }}>#{ticket.id}</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              background: `${statusBg}18`, color: statusBg,
              border: `1px solid ${statusBg}35`,
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
              padding: '2px 7px', borderRadius: 5,
              fontFamily: "'Poppins',sans-serif",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusBg }}/>
              {getStatusMeta(ticket.status).label}
            </span>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: slaColors.bg, color: slaColors.color,
            border: `1px solid ${slaColors.border}`,
            fontSize: 10, fontWeight: 700,
            padding: '2px 7px', borderRadius: 8,
            fontFamily: "'Poppins',sans-serif",
          }}>
            <Timer size={9} strokeWidth={2.5}/>{slaLabel}
          </span>
        </div>

        {/* Row 2: Subject */}
        <p style={{
          fontSize: 12,
          fontWeight: ticket.status === 'New' ? 600 : 400,
          color: T.textPri, margin: 0,
          lineHeight: 1.45,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          fontFamily: "'Poppins',sans-serif",
        }}>{ticket.subject}</p>

        {/* Row 3: Priority + Channel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`,
            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
            textTransform: 'uppercase', letterSpacing: 0.4,
            fontFamily: "'Poppins',sans-serif",
          }}>
            <Tag size={8}/>{ticket.priority}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 10, color: T.textSec, fontFamily: "'Poppins',sans-serif",
          }}>
            {CHANNEL_ICON(ticket.channel)}{ticket.channel}
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: T.border2 }}/>

        {/* Row 4: Requester + Date */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Hoverable
            onClick={(e) => { e.stopPropagation(); setProfileModal({ type: 'requester', id: ticket.requester }); }}
            style={{ fontSize: 11, color: T.textSec }}
            title="View requester"
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: avatarBg(ticket.requester),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{initials(ticket.requester)}</div>
            {ticket.requester}
          </Hoverable>
          <span style={{ fontSize: 10, color: T.textMuted, fontFamily: "'Poppins',sans-serif" }}>{ticket.requested}</span>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   REDESIGNED DETAIL PANEL
═══════════════════════════════════════════════════ */
const DetailPanel = ({ ticket, isCompact, onClose, setProfileModal, T, darkMode }) => {
  const { bg: statusBg } = getStatusMeta(ticket.status);
  const { label: slaLabel, breached, stopped, paused } = useSlaTimer(ticket);
  const slaColors = getSLAColor(breached, paused, stopped);
  const pc = PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.normal;

  return (
    <div style={{
      width: isCompact ? '100%' : 400,
      background: T.surface,
      borderLeft: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
      position: isCompact ? 'absolute' : 'relative',
      inset: isCompact ? '0 0 0 0' : 'auto', zIndex: isCompact ? 50 : 'auto',
      animation: 'rtFadeIn 0.15s ease',
    }}>
      {/* Gradient header */}
      <div style={{
        background: `linear-gradient(160deg, ${statusBg}28 0%, ${statusBg}08 100%)`,
        borderBottom: `1px solid ${T.border}`,
        padding: '16px 18px',
        flexShrink: 0,
      }}>
        {/* Top row: back/close + ticket id */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isCompact && (
              <button onClick={onClose} style={{
                width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.border}`,
                background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: T.textSec,
              }}><ArrowLeft size={13}/></button>
            )}
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: statusBg, color: '#fff',
              fontSize: 10, fontWeight: 700, letterSpacing: 0.6,
              padding: '3px 10px', borderRadius: 5,
              fontFamily: "'Poppins',sans-serif",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.55)' }}/>
              {getStatusMeta(ticket.status).label}
            </span>
            <span style={{ fontSize: 11, color: T.textSec, fontFamily: "'Poppins',sans-serif" }}>#{ticket.id}</span>
          </div>
          {!isCompact && (
            <button onClick={onClose} style={{
              width: 28, height: 28, borderRadius: 6, border: `1px solid ${T.border}`,
              background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: T.textSec,
            }}><X size={13}/></button>
          )}
        </div>

        {/* Subject */}
        <p style={{
          fontSize: 14, fontWeight: 600, color: T.textPri,
          margin: '0 0 14px 0', lineHeight: 1.4,
          fontFamily: "'Poppins',sans-serif",
        }}>{ticket.subject}</p>

        {/* SLA + Priority pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: slaColors.bg, color: slaColors.color,
            border: `1px solid ${slaColors.border}`,
            fontSize: 11, fontWeight: 700,
            padding: '3px 10px', borderRadius: 20,
            fontFamily: "'Poppins',sans-serif",
          }}>
            <Clock size={10}/> SLA: {slaLabel}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`,
            fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
            textTransform: 'uppercase', letterSpacing: 0.4,
            fontFamily: "'Poppins',sans-serif",
          }}>
            <Tag size={9}/>{ticket.priority}
          </span>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Alerts */}
        {ticket.statusNote && (
          <div style={{
            padding: '10px 12px', borderRadius: 10,
            background: darkMode ? 'rgba(245,158,11,0.08)' : '#fffbeb',
            border: `1px solid ${darkMode ? 'rgba(245,158,11,0.25)' : '#fde68a'}`,
            fontSize: 11, color: darkMode ? '#fbbf24' : '#92400e',
            fontFamily: "'Poppins',sans-serif", lineHeight: 1.5,
          }}>📋 {ticket.statusNote}</div>
        )}

        {ticket.status === 'Resolved' && ticket.resolutionMinutes != null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', borderRadius: 10,
            background: darkMode ? 'rgba(16,185,129,0.08)' : '#f0fdf4',
            border: `1px solid ${darkMode ? 'rgba(16,185,129,0.25)' : '#bbf7d0'}`,
            fontSize: 11, fontWeight: 500, color: '#15803d',
            fontFamily: "'Poppins',sans-serif",
          }}>
            <CheckCircle size={13}/> Resolved in {formatSLATime(ticket.resolutionMinutes)}
          </div>
        )}

        {ticket.status === 'Resolved' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.textMuted, fontFamily: "'Poppins',sans-serif" }}>
            <Lock size={11}/> Terminal status — no further transitions.
          </div>
        )}

        {/* Latest comment */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <MessageSquare size={12} style={{ color: T.textMuted }}/>
            <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: "'Poppins',sans-serif" }}>
              Latest comment
            </span>
          </div>
          <div style={{
            background: T.surface2, borderRadius: 12,
            border: `1px solid ${T.border}`, overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderBottom: `1px solid ${T.border2}`,
            }}>
              <Hoverable
                onClick={() => setProfileModal({ type: 'requester', id: ticket.requester })}
                style={{ fontSize: 12, fontWeight: 500, color: T.textPri }}
                title="View requester profile"
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: avatarBg(ticket.requester),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>{initials(ticket.requester)}</div>
                {ticket.requester} <ExternalLink size={9}/>
              </Hoverable>
              <span style={{ fontSize: 10, color: T.textMuted, fontFamily: "'Poppins',sans-serif" }}>{ticket.requested}</span>
            </div>
            <p style={{
              fontSize: 12, color: T.textSec, lineHeight: 1.65, margin: 0,
              padding: '12px 14px', fontFamily: "'Poppins',sans-serif",
            }}>
              To learn more about our returns policy, please visit our help center here:{' '}
              <span style={{ color: '#ef4444', wordBreak: 'break-all' }}>
                https://z3n-showcase.zendesk.com/hc/en-us/categories/360000313031
              </span>
            </p>
          </div>
        </div>

        {/* Details grid */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <Layers size={12} style={{ color: T.textMuted }}/>
            <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: "'Poppins',sans-serif" }}>
              Details
            </span>
          </div>
          <div style={{
            background: T.surface2, borderRadius: 12,
            border: `1px solid ${T.border}`, overflow: 'hidden',
          }}>
            {[
              { label: 'Channel',   val: ticket.channel,         icon: CHANNEL_ICON(ticket.channel) },
              { label: 'Requester', val: ticket.requester,       icon: <User size={11}/>,  clickable: 'requester' },
              { label: 'Assignee',  val: ticket.assignee ?? '—', icon: <User size={11}/>,  clickable: ticket.assignee ? 'assignee' : null },
              { label: 'Priority',  val: ticket.priority,        icon: <Tag size={11}/>  },
              { label: 'Form',      val: ticket.form || '—',     icon: <Layers size={11}/> },
            ].map(({ label, val, icon, clickable }, i, arr) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 14px',
                borderBottom: i < arr.length - 1 ? `1px solid ${T.border2}` : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: T.textMuted, fontFamily: "'Poppins',sans-serif" }}>
                  <span style={{ color: T.textMuted, display: 'flex' }}>{icon}</span>
                  {label}
                </div>
                {clickable ? (
                  <Hoverable
                    onClick={() => setProfileModal({
                      type: clickable,
                      id: clickable === 'requester' ? ticket.requester : ticket.assignee,
                    })}
                    style={{ fontSize: 12, fontWeight: 500, color: T.textPri, textTransform: 'capitalize' }}
                  >
                    {val}
                  </Hoverable>
                ) : (
                  <span style={{ fontSize: 12, color: T.textPri, textTransform: 'capitalize', fontFamily: "'Poppins',sans-serif" }}>{val}</span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
const ResponseTimeTrends = () => {
  const [tickets,      setTickets]      = useState(TICKETS_INIT);
  const [selectedId,   setSelectedId]   = useState(null);
  const [detailsOpen,  setDetailsOpen]  = useState(false);
  const [toast,        setToast]        = useState('');
  const [profileModal, setProfileModal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [slaSort,      setSlaSort]      = useState('asc');
  const [viewMode,     setViewMode]     = useState('table');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [isAdmin]                       = useState(false);

  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage);
  const T = makeStyles(darkMode);

  useEffect(() => {
    const handler = (e) => setDarkMode(e.detail.darkMode);
    window.addEventListener('darkModeChange', handler);
    return () => window.removeEventListener('darkModeChange', handler);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      try {
        const stored = localStorage.getItem('darkMode');
        if (stored !== null) { const val = stored === 'true'; setDarkMode(p => p !== val ? val : p); }
      } catch {}
    }, 300);
    return () => clearInterval(id);
  }, []);

  const screenSize   = useScreenSize();
  const isMobile     = screenSize === 'mobile';
  const isTablet     = screenSize === 'tablet';
  const isCompact    = isMobile || isTablet;
  const showAssignee = !isMobile;

  const selected = tickets.find(t => t.id === selectedId);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const patchTicket = useCallback((id, patch) =>
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t)), []);

  const changeStatus = useCallback((ticket, newStatus) => {
    if (newStatus === 'Open') {
      const { ok, reason } = validateBeforeOpen(ticket);
      if (!ok) { setToast(`⚠️ ${reason}`); return; }
    }
    const result = handleStatusChange(ticket.status, newStatus, (validStatus) => {
      if (validStatus === 'Pending')  { handlePendingStatus(ticket, patchTicket); return; }
      if (validStatus === 'OnHold')   { handleOnHoldStatus(ticket, patchTicket);  return; }
      if (validStatus === 'Resolved') { resolveTicket(ticket, patchTicket);       return; }
      if (validStatus === 'Open') { patchTicket(ticket.id, { status: 'Open', slaPaused: false, statusNote: 'Ticket reopened.' }); return; }
      patchTicket(ticket.id, { status: validStatus });
    }, isAdmin);
    if (!result.ok) setToast(`⚠️ ${result.reason}`);
  }, [patchTicket, isAdmin]);

  const openCount     = tickets.filter(t => t.status === 'Open').length;
  const newCount      = tickets.filter(t => t.status === 'New').length;
  const breachedCount = tickets.filter(t => {
    if (t.slaStopped || t.slaPaused) return false;
    return new Date(t.slaDeadline).getTime() < Date.now();
  }).length;

  const displayTickets = useMemo(() => {
    const nowMs = Date.now();
    const h24Ms = 24 * 60 * 60_000;
    let list = statusFilter === 'All'
      ? tickets.filter(t => !HIDDEN_IN_ALL.has(t.status))
      : tickets.filter(t => t.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t =>
        t.subject?.toLowerCase().includes(q) ||
        t.requester?.toLowerCase().includes(q) ||
        t.assignee?.toLowerCase().includes(q) ||
        t.channel?.toLowerCase().includes(q) ||
        t.form?.toLowerCase().includes(q) ||
        String(t.id).includes(q) ||
        t.priority?.toLowerCase().includes(q) ||
        t.status?.toLowerCase().includes(q)
      );
    }
    return list
      .filter(t => new Date(t.slaDeadline).getTime() <= nowMs + h24Ms)
      .sort((a, b) => slaSort === 'asc'
        ? new Date(b.slaDeadline).getTime() - new Date(a.slaDeadline).getTime()
        : new Date(a.slaDeadline).getTime() - new Date(b.slaDeadline).getTime()
      );
  }, [tickets, statusFilter, slaSort, searchQuery]);

  const visibleCount = useMemo(() => {
    if (statusFilter === 'All') return tickets.filter(t => !HIDDEN_IN_ALL.has(t.status)).length;
    return tickets.filter(t => t.status === statusFilter).length;
  }, [tickets, statusFilter]);

  const cycleSlaSort = () => setSlaSort(p => p === 'asc' ? 'desc' : 'asc');
  const handleTicketClick = (id) => { setSelectedId(id); setDetailsOpen(true); };

  const viewOptions = [
    {
      mode: 'table', label: 'Table',
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/></svg>,
    },
    {
      mode: 'card', label: 'Cards',
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
    },
    {
      mode: 'list', label: 'List',
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>,
    },
  ];

  const renderTicketContent = () => {
    if (displayTickets.length === 0) return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 220, gap: 10 }}>
        <Filter size={28} strokeWidth={1.5} style={{ color: T.textMuted }}/>
        <span style={{ fontSize: 12, color: T.textMuted, fontFamily: "'Poppins',sans-serif" }}>
          {searchQuery ? `No tickets found for "${searchQuery}"` : 'No tickets match this filter'}
        </span>
      </div>
    );

    if (viewMode === 'card') return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(255px,1fr))', gap: 14, padding: '16px 20px' }}>
        {displayTickets.map(ticket => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            selected={selectedId === ticket.id}
            onClick={handleTicketClick}
            setProfileModal={setProfileModal}
            T={T}
          />
        ))}
      </div>
    );

    if (viewMode === 'list') return (
      <div>
        {displayTickets.map((ticket, idx) => {
          const { bg: statusBg } = getStatusMeta(ticket.status);
          return (
            <div key={ticket.id} onClick={() => handleTicketClick(ticket.id)}
              className="rt-list-row"
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 20px',
                borderBottom: idx === displayTickets.length - 1 ? 'none' : `1px solid ${T.border2}`,
                borderLeft: selectedId === ticket.id ? '3px solid #ef4444' : '3px solid transparent',
                background: selectedId === ticket.id ? 'rgba(239,68,68,0.04)' : 'transparent',
                cursor: 'pointer', transition: 'background 0.12s',
              }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusBg, flexShrink: 0 }}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: ticket.status === 'New' ? 500 : 400, color: T.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Poppins',sans-serif" }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: T.textMuted, marginRight: 8 }}>#{ticket.id}</span>
                  {ticket.subject}
                </div>
                <div style={{ fontSize: 11, color: T.textSec, marginTop: 2, fontFamily: "'Poppins',sans-serif" }}>{ticket.channel} · {ticket.form}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <StatusBadge status={ticket.status}/>
                <SlaPill ticket={ticket}/>
                <Hoverable onClick={(e) => { e.stopPropagation(); setProfileModal({ type: 'requester', id: ticket.requester }); }}
                  style={{ fontSize: 11, color: T.textSec }} title="View requester">
                  <User size={10}/> {ticket.requester}
                </Hoverable>
                <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "'Poppins',sans-serif" }}>{ticket.requested}</span>
              </div>
            </div>
          );
        })}
      </div>
    );

    /* Table */
    return (
      <>
        <div style={{
          display: 'flex', alignItems: 'center', padding: '8px 0 8px 20px',
          borderBottom: `1px solid ${T.border}`, background: T.surface2, flexShrink: 0,
          borderLeft: '3px solid transparent',
        }}>
          <input type="checkbox" style={{ marginRight: 10, flexShrink: 0, accentColor: '#ef4444' }} readOnly/>
          <span style={{ ...col.id,        fontSize: 11, fontWeight: 500, color: T.textMuted, fontFamily: "'Poppins',sans-serif" }}>ID</span>
          <span style={{ ...col.subject,   fontSize: 11, fontWeight: 500, color: T.textMuted, fontFamily: "'Poppins',sans-serif" }}>Subject</span>
          <span style={{ ...col.channel,   fontSize: 11, fontWeight: 500, color: T.textMuted, fontFamily: "'Poppins',sans-serif" }}>Channel</span>
          <span style={{ ...col.status, display: 'inline-flex', alignItems: 'center' }}>
            <StatusFilterDropdown value={statusFilter} onChange={setStatusFilter} T={T}/>
          </span>
          <span style={{ ...col.requester, fontSize: 11, fontWeight: 500, color: T.textMuted, fontFamily: "'Poppins',sans-serif" }}>Requester</span>
          <span style={{ ...col.requested, fontSize: 11, fontWeight: 500, color: T.textMuted, fontFamily: "'Poppins',sans-serif" }}>Requested ▼</span>
          <span onClick={cycleSlaSort} style={{
            ...col.sla, fontSize: 11, fontWeight: 600, color: '#ef4444',
            display: 'inline-flex', alignItems: 'center', gap: 4,
            cursor: 'pointer', userSelect: 'none', fontFamily: "'Poppins',sans-serif",
          }}>
            <Timer size={11}/>SLA
            {slaSort === 'asc'  && <ArrowDown size={11}/>}
            {slaSort === 'desc' && <ArrowUp   size={11}/>}
          </span>
          {showAssignee && <span style={{ ...col.assignee, fontSize: 11, fontWeight: 500, color: T.textMuted, fontFamily: "'Poppins',sans-serif" }}>Assignee</span>}
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {displayTickets.map(ticket => (
            <div key={ticket.id}
              className="rt-table-row"
              onClick={() => handleTicketClick(ticket.id)}
              style={{
                display: 'flex', alignItems: 'center', padding: '10px 0 10px 20px',
                borderBottom: `1px solid ${T.border2}`,
                borderLeft: selectedId === ticket.id ? '3px solid #ef4444' : '3px solid transparent',
                background: selectedId === ticket.id ? 'rgba(239,68,68,0.04)' : 'transparent',
                cursor: 'pointer', transition: 'background 0.12s',
              }}>
              <input type="checkbox" style={{ marginRight: 10, flexShrink: 0, accentColor: '#ef4444' }} readOnly onClick={e => e.stopPropagation()}/>
              <span style={{ ...col.id, fontSize: 12, color: T.textMuted, fontFamily: "'Poppins',sans-serif" }}>#{ticket.id}</span>
              <span style={{ ...col.subject, fontSize: 12, fontWeight: ticket.status === 'New' ? 500 : 400, color: T.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12, fontFamily: "'Poppins',sans-serif" }}>
                {ticket.subject}
              </span>
              <span style={{ ...col.channel, fontSize: 12, color: T.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Poppins',sans-serif" }}>
                {ticket.channel}
              </span>
              <span style={{ ...col.status }}><StatusBadge status={ticket.status}/></span>
              <span className="rt-person-cell"
                onClick={(e) => { e.stopPropagation(); setProfileModal({ type: 'requester', id: ticket.requester }); }}
                style={{ ...col.requester, fontSize: 12, color: T.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', fontFamily: "'Poppins',sans-serif" }}>
                {ticket.requester}
              </span>
              <span style={{ ...col.requested, fontSize: 12, color: T.textSec, fontFamily: "'Poppins',sans-serif" }}>{ticket.requested}</span>
              <span style={{ ...col.sla, display: 'flex', alignItems: 'center' }}><SlaPill ticket={ticket}/></span>
              {showAssignee && (
                <span className={ticket.assignee ? 'rt-person-cell' : ''}
                  onClick={ticket.assignee ? (e) => { e.stopPropagation(); setProfileModal({ type: 'assignee', id: ticket.assignee }); } : undefined}
                  style={{ ...col.assignee, fontSize: 12, color: ticket.assignee ? T.textPri : T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: ticket.assignee ? 'pointer' : 'default', fontFamily: "'Poppins',sans-serif" }}>
                  {ticket.assignee ?? '—'}
                </span>
              )}
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div style={{
      fontFamily: "'Poppins','Segoe UI',sans-serif",
      background: T.bg, minHeight: '100vh', color: T.textPri,
      transition: 'background 0.3s ease',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Poppins','Segoe UI',sans-serif !important; box-sizing: border-box !important; }
        @keyframes rtFadeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
        .rt-table-row:hover   { background: ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(239,68,68,0.03)'} !important; }
        .rt-person-cell:hover { color: #ef4444 !important; text-decoration: underline; }
        .rt-ticket-card:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(0,0,0,${darkMode ? '0.4' : '0.12'}) !important; }
        .rt-list-row:hover    { background: ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(239,68,68,0.03)'} !important; }
        .rt-stat-card:hover   { transform: translateY(-3px); }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }
        @media (max-width:768px) { .rt-stats-grid { grid-template-columns: 1fr 1fr !important; } .rt-toolbar { flex-wrap: wrap !important; } }
        @media (max-width:480px) { .rt-stats-grid { grid-template-columns: 1fr !important; } .rt-layout { padding: 12px !important; } }
      `}</style>

      <ProfileModal modal={profileModal} tickets={tickets} onClose={() => setProfileModal(null)} T={T}/>

      <div className="rt-layout" style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24, minHeight: '100vh' }}>

        {/* Page Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, color: T.textSec, fontFamily: "'Poppins',sans-serif" }}>
            <LayoutDashboard size={13}/> Dashboard
            <span style={{ opacity: 0.4 }}>/</span>
            <span>Email List</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: T.textPri, margin: '0 0 2px 0', letterSpacing: '-0.01em', fontFamily: "'Poppins',sans-serif" }}>Email List</h1>
              <p style={{ fontSize: 12, color: T.textSec, margin: 0, fontFamily: "'Poppins',sans-serif" }}>TelexPH – WanderWave Project</p>
            </div>
            <span style={{
              background: '#ef4444', color: '#fff', fontSize: 12, fontWeight: 600,
              padding: '2px 12px', borderRadius: 20, fontFamily: "'Poppins',sans-serif",
            }}>{visibleCount}</span>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="rt-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16 }}>
          <div style={T.cardHero} className="rt-stat-card">
            <div style={T.iconHero}><Hash size={20}/></div>
            <div style={T.labelHero}>Total Tickets</div>
            <div style={T.valueHero}>{tickets.length}</div>
            <span style={T.badgeHero}>All time</span>
          </div>
          <div style={T.cardWhite} className="rt-stat-card">
            <div style={T.iconRed}><AlertCircle size={20}/></div>
            <div style={T.labelWhite}>Open</div>
            <div style={T.valueWhite}>{openCount}</div>
            <span style={T.badgeRed}>Needs attention</span>
          </div>
          <div style={T.cardWhite} className="rt-stat-card">
            <div style={T.iconMaroon}><Info size={20}/></div>
            <div style={T.labelWhite}>New</div>
            <div style={T.valueWhite}>{newCount}</div>
            <span style={T.badgeMaroon}>Unassigned</span>
          </div>
          <div style={T.cardWhite} className="rt-stat-card">
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: darkMode ? 'rgba(220,38,38,0.15)' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#dc2626' }}>
              <Timer size={20}/>
            </div>
            <div style={T.labelWhite}>SLA Breached</div>
            <div style={T.valueWhite}>{breachedCount}</div>
            <span style={T.badgeRed}>Overdue</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="rt-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ ...T.searchBox, flex: '1 1 160px', maxWidth: 260 }}>
            <Search size={14} style={{ color: T.textSec, flexShrink: 0 }}/>
            <input type="text" placeholder="Search tickets…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} style={T.searchInput}/>
            {searchQuery && (
              <button style={T.clearSearch} onClick={() => setSearchQuery('')}><X size={13}/></button>
            )}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: statusFilter !== 'All' ? (darkMode ? 'rgba(239,68,68,0.12)' : '#fff0f0') : T.surface,
            border: `1px solid ${statusFilter !== 'All' ? 'rgba(239,68,68,0.35)' : T.border}`,
            borderRadius: 10, padding: '0 12px', height: 36, boxShadow: T.shadow,
          }}>
            <Filter size={12} style={{ color: statusFilter !== 'All' ? '#ef4444' : T.textSec }}/>
            <StatusFilterDropdown value={statusFilter} onChange={setStatusFilter} T={T}/>
          </div>

          <button onClick={cycleSlaSort} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 10, padding: '0 12px', height: 36,
            cursor: 'pointer', fontSize: 12, color: T.textSec,
            boxShadow: T.shadow, fontFamily: "'Poppins',sans-serif",
          }}>
            <Timer size={12}/> SLA {slaSort === 'asc' ? '↑' : '↓'}
          </button>

          <div style={{ marginLeft: 'auto' }}>
            <div style={{
              display: 'flex', background: T.surface2, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: 3, gap: 2, boxShadow: T.shadow,
            }}>
              {viewOptions.map(v => (
                <button key={v.mode} onClick={() => setViewMode(v.mode)} title={v.label} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: viewMode === v.mode ? T.surface : 'transparent',
                  color: viewMode === v.mode ? T.textPri : T.textSec,
                  boxShadow: viewMode === v.mode ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s', fontSize: 11,
                  fontWeight: viewMode === v.mode ? 500 : 400,
                  fontFamily: "'Poppins',sans-serif",
                }}>
                  {v.icon}{v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Panel */}
        <div style={{
          background: T.surface, borderRadius: 20,
          boxShadow: T.shadow,
          border: darkMode ? `1px solid ${T.border}` : 'none',
          overflow: 'hidden', display: 'flex',
          position: 'relative', minHeight: 400,
        }}>
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            borderRight: selected && detailsOpen && !isCompact ? `1px solid ${T.border}` : 'none',
            overflow: 'hidden', minWidth: 0,
          }}>
            {viewMode !== 'table' && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 20px', borderBottom: `1px solid ${T.border}`,
                background: T.surface2, flexShrink: 0,
              }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: T.textPri, fontFamily: "'Poppins',sans-serif" }}>
                  {displayTickets.length} ticket{displayTickets.length !== 1 ? 's' : ''}
                  {searchQuery && <span style={{ color: T.textMuted, fontWeight: 400 }}> for "{searchQuery}"</span>}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StatusFilterDropdown value={statusFilter} onChange={setStatusFilter} T={T}/>
                  <span onClick={cycleSlaSort} style={{
                    fontSize: 11, fontWeight: 600, color: '#ef4444',
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    cursor: 'pointer', userSelect: 'none', fontFamily: "'Poppins',sans-serif",
                  }}>
                    <Timer size={11}/>SLA
                    {slaSort === 'asc'  && <ArrowDown size={11}/>}
                    {slaSort === 'desc' && <ArrowUp   size={11}/>}
                  </span>
                </div>
              </div>
            )}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {renderTicketContent()}
            </div>
          </div>

          {selected && detailsOpen && (
            <DetailPanel
              ticket={selected}
              isCompact={isCompact}
              onClose={() => setDetailsOpen(false)}
              setProfileModal={setProfileModal}
              T={T}
              darkMode={darkMode}
            />
          )}
        </div>
      </div>

      <Toast message={toast} onDismiss={() => setToast('')}/>
    </div>
  );
};

export default ResponseTimeTrends;