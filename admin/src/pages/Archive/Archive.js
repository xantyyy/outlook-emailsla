import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Archive, Search, LayoutGrid, Star, StarOff, Filter, ArrowUpDown,
  Eye, RotateCcw, ChevronDown, ChevronUp, X, AlertTriangle,
  RefreshCw, Bug, Activity, Users, Mail, MailOpen,
  LayoutDashboard, Info, User, Clock, Table2, Tag,
  CalendarDays, Building2, CheckCircle2, Inbox,
} from 'lucide-react';
import api from '../../services/api';

/* ════════════════════════════════════════════════
   DARK MODE
════════════════════════════════════════════════ */
const getDark = () => {
  try {
    const s = localStorage.getItem('darkMode');
    if (s !== null) return s === 'true';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  } catch { return false; }
};

const T = (dark) => ({
  dark,
  bg:       dark ? '#0c0b0b' : '#f8fafc',
  bgGrad:   dark ? '#0c0b0b' : '#f2f3f5',
  surface:  dark ? '#1a1d27' : '#ffffff',
  surf2:    dark ? '#22263a' : '#f9fafb',
  surf3:    dark ? '#252840' : '#f3f4f6',
  border:   dark ? '#2e3347' : '#e5e7eb',
  border2:  dark ? '#252840' : '#f3f4f6',
  pri:      dark ? '#e2e8f0' : '#111827',
  sec:      dark ? '#94a3b8' : '#6b7280',
  muted:    dark ? '#64748b' : '#9ca3af',
  shadow:   dark ? '0 1px 3px rgba(0,0,0,0.4),0 4px 16px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.06),0 4px 12px rgba(0,0,0,0.04)',
  shadowLg: dark ? '0 12px 40px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.1)',
  sev: {
    Critical: { b: dark?'#3d0a0a':'#fde8e8', t: dark?'#f87171':'#b91c1c' },
    High:     { b: dark?'#3a1500':'#fde8d0', t: dark?'#fb923c':'#c2410c' },
    Medium:   { b: dark?'#3a2e00':'#fef9c3', t: dark?'#facc15':'#92400e' },
    Low:      { b: dark?'#0f3320':'#d1fae5', t: dark?'#4ade80':'#065f46' },
  },
  bstat: {
    'Open':        { b: dark?'#0d2744':'#dbeafe', t: dark?'#60a5fa':'#1d4ed8' },
    'In Progress': { b: dark?'#3a1500':'#fde8d0', t: dark?'#fb923c':'#c2410c' },
    'Resolved':    { b: dark?'#0f3320':'#d1fae5', t: dark?'#4ade80':'#065f46' },
    'Closed':      { b: dark?'#1a1f2e':'#f1f5f9', t: dark?'#64748b':'#475569' },
    'Reopened':    { b: dark?'#2d0f4f':'#ede9fe', t: dark?'#a78bfa':'#5b21b6' },
  },
  estat: {
    Resolved:   { b: dark?'#0f3320':'#d1fae5', t: dark?'#4ade80':'#065f46' },
    Superseded: { b: dark?'#3a2e00':'#fef9c3', t: dark?'#facc15':'#92400e' },
    Closed:     { b: dark?'#3d0a0a':'#fde8e8', t: dark?'#f87171':'#b91c1c' },
    Archived:   { b: dark?'#1a1f2e':'#f1f5f9', t: dark?'#64748b':'#475569' },
  },
});

const F = "'Poppins', sans-serif";
const LIMIT = 8;

/* ════════════════════════════════════════════════
   TAB GRADIENTS
════════════════════════════════════════════════ */
const TAB_GRADIENTS = {
  emails: {
    base:'#0a0000', sweep:'linear-gradient(138deg,#c00000 0%,#8b0000 28%,#3d0000 55%,#0a0000 80%,#000000 100%)',
    ray:'linear-gradient(138deg,rgba(220,30,30,0.0) 0%,rgba(220,30,30,0.38) 38%,rgba(200,20,20,0.55) 50%,rgba(180,10,10,0.35) 62%,rgba(120,0,0,0.0) 100%)',
    raySkew:'-8deg', vignette:'radial-gradient(ellipse at 85% 90%,rgba(0,0,0,0.7) 0%,transparent 60%)',
    dotColor:'rgba(255,80,80,0.65)', dotGlow:'rgba(255,60,60,0.8)', border:'rgba(180,0,0,0.35)',
    boxShadow:'0 8px 40px rgba(139,0,0,0.45),0 2px 12px rgba(0,0,0,0.5)', labelColor:'rgba(255,180,180,0.9)',
    pipActive:'rgba(255,120,120,0.9)', pipIdle:'rgba(255,255,255,0.18)', divider:'rgba(255,255,255,0.12)',
    iconBg:'rgba(255,255,255,0.10)', iconBorder:'rgba(255,255,255,0.18)', iconColor:'rgba(255,160,160,0.9)',
    countBg:'rgba(255,255,255,0.10)', countBorder:'rgba(255,255,255,0.18)',
  },
  bugs: {
    base:'#06000f', sweep:'linear-gradient(138deg,#5b21b6 0%,#3b0f8c 28%,#1a0050 55%,#06000f 80%,#000000 100%)',
    ray:'linear-gradient(138deg,rgba(139,92,246,0.0) 0%,rgba(139,92,246,0.35) 38%,rgba(109,62,216,0.52) 50%,rgba(80,40,180,0.32) 62%,rgba(40,10,100,0.0) 100%)',
    raySkew:'-8deg', vignette:'radial-gradient(ellipse at 85% 90%,rgba(0,0,0,0.7) 0%,transparent 60%)',
    dotColor:'rgba(167,139,250,0.65)', dotGlow:'rgba(139,92,246,0.8)', border:'rgba(100,60,200,0.35)',
    boxShadow:'0 8px 40px rgba(80,30,180,0.45),0 2px 12px rgba(0,0,0,0.5)', labelColor:'rgba(200,180,255,0.9)',
    pipActive:'rgba(167,139,250,0.9)', pipIdle:'rgba(255,255,255,0.18)', divider:'rgba(255,255,255,0.12)',
    iconBg:'rgba(255,255,255,0.10)', iconBorder:'rgba(255,255,255,0.18)', iconColor:'rgba(200,180,255,0.9)',
    countBg:'rgba(255,255,255,0.10)', countBorder:'rgba(255,255,255,0.18)',
  },
  users: {
    base:'#00050f', sweep:'linear-gradient(138deg,#1d4ed8 0%,#0e2f8c 28%,#061650 55%,#00050f 80%,#000000 100%)',
    ray:'linear-gradient(138deg,rgba(14,165,233,0.0) 0%,rgba(14,165,233,0.35) 38%,rgba(37,99,235,0.52) 50%,rgba(29,78,216,0.32) 62%,rgba(6,30,100,0.0) 100%)',
    raySkew:'-8deg', vignette:'radial-gradient(ellipse at 85% 90%,rgba(0,0,0,0.7) 0%,transparent 60%)',
    dotColor:'rgba(96,165,250,0.65)', dotGlow:'rgba(59,130,246,0.8)', border:'rgba(30,80,200,0.35)',
    boxShadow:'0 8px 40px rgba(20,60,180,0.45),0 2px 12px rgba(0,0,0,0.5)', labelColor:'rgba(147,197,253,0.9)',
    pipActive:'rgba(96,165,250,0.9)', pipIdle:'rgba(255,255,255,0.18)', divider:'rgba(255,255,255,0.12)',
    iconBg:'rgba(255,255,255,0.10)', iconBorder:'rgba(255,255,255,0.18)', iconColor:'rgba(147,197,253,0.9)',
    countBg:'rgba(255,255,255,0.10)', countBorder:'rgba(255,255,255,0.18)',
  },
  activity: {
    base:'#000f08', sweep:'linear-gradient(138deg,#065f46 0%,#064e3b 28%,#022c22 55%,#000f08 80%,#000000 100%)',
    ray:'linear-gradient(138deg,rgba(16,185,129,0.0) 0%,rgba(16,185,129,0.35) 38%,rgba(5,150,105,0.52) 50%,rgba(4,120,87,0.32) 62%,rgba(2,50,35,0.0) 100%)',
    raySkew:'-8deg', vignette:'radial-gradient(ellipse at 85% 90%,rgba(0,0,0,0.7) 0%,transparent 60%)',
    dotColor:'rgba(52,211,153,0.65)', dotGlow:'rgba(16,185,129,0.8)', border:'rgba(20,120,80,0.35)',
    boxShadow:'0 8px 40px rgba(10,100,60,0.45),0 2px 12px rgba(0,0,0,0.5)', labelColor:'rgba(110,231,183,0.9)',
    pipActive:'rgba(52,211,153,0.9)', pipIdle:'rgba(255,255,255,0.18)', divider:'rgba(255,255,255,0.12)',
    iconBg:'rgba(255,255,255,0.10)', iconBorder:'rgba(255,255,255,0.18)', iconColor:'rgba(110,231,183,0.9)',
    countBg:'rgba(255,255,255,0.10)', countBorder:'rgba(255,255,255,0.18)',
  },
};

const TABS = [
  { id:'emails',   label:'Messages',      sublabel:'Email threads',       icon:Mail,     accent:'#ef4444', stripe:'linear-gradient(135deg,#ef4444 0%,#f97316 100%)', desc:'Archived email threads and message conversations',         count:10, countLabel:'emails'  },
  { id:'bugs',     label:'Bug Reports',   sublabel:'Archived bugs',       icon:Bug,      accent:'#8b5cf6', stripe:'linear-gradient(135deg,#8b5cf6 0%,#6366f1 100%)', desc:'Archived bug reports — restore to return to Bug Reports',  count:0,  countLabel:'bugs'    },
  { id:'users',    label:'Users',         sublabel:'Deactivated accounts',icon:Users,    accent:'#0ea5e9', stripe:'linear-gradient(135deg,#0ea5e9 0%,#2563eb 100%)', desc:'Deactivated or removed user accounts',                     count:5,  countLabel:'users'   },
  { id:'activity', label:'Activity Logs', sublabel:'Audit history',       icon:Activity, accent:'#10b981', stripe:'linear-gradient(135deg,#10b981 0%,#0891b2 100%)', desc:'Historical audit logs and system activity records',         count:8,  countLabel:'entries' },
];

const EMAIL_DATA = [
  { id:1,  title:'RE: Q1 2024 Performance Review Discussion',      from:'hr@company.com',          dept:'HR',         date:'2024-03-31', tags:['performance','quarterly'], status:'Resolved',   pinned:true  },
  { id:2,  title:'FWD: WanderWave Campaign Final Approval',        from:'creatives@company.com',   dept:'Creatives',  date:'2024-02-15', tags:['campaign','approval'],    status:'Superseded', pinned:true  },
  { id:3,  title:'RE: SLA Breach — February Incident Report',      from:'ops@company.com',         dept:'Operations', date:'2024-02-29', tags:['sla','incident'],         status:'Resolved',   pinned:false },
  { id:4,  title:'RE: HR Recruitment Pipeline Update Q4',          from:'recruitment@company.com', dept:'HR',         date:'2023-12-28', tags:['recruitment','update'],   status:'Closed',     pinned:false },
  { id:5,  title:'URGENT: Escalation — November Client Complaint', from:'ops@company.com',         dept:'Operations', date:'2023-11-22', tags:['escalation','urgent'],    status:'Resolved',   pinned:true  },
  { id:6,  title:'FWD: Marketing Campaign Asset Sign-Off',         from:'marketing@company.com',   dept:'Marketing',  date:'2024-01-10', tags:['marketing','sign-off'],   status:'Superseded', pinned:false },
  { id:7,  title:'RE: Accounting Reconciliation January 2024',     from:'accounting@company.com',  dept:'Accounting', date:'2024-01-31', tags:['finance','recon'],        status:'Resolved',   pinned:false },
  { id:8,  title:'RE: Bug Tracker — Full Export Request',          from:'ops@company.com',         dept:'Operations', date:'2024-03-01', tags:['bugs','export'],          status:'Closed',     pinned:false },
  { id:9,  title:'FWD: Compliance Audit 2023 Final Summary',       from:'audit@company.com',       dept:'Audit',      date:'2023-12-15', tags:['audit','compliance'],     status:'Resolved',   pinned:false },
  { id:10, title:'RE: Response Time Trends — February Snapshot',   from:'ops@company.com',         dept:'Operations', date:'2024-02-05', tags:['sla','trends'],           status:'Archived',   pinned:false },
];

const USER_DATA = [
  { id:1, name:'Juan dela Cruz',    email:'juan@company.com',   role:'Operations', dept:'Operations', archivedAt:'2024-02-10', reason:'Resigned',       initials:'JD', color:'#ef4444' },
  { id:2, name:'Maria Santos',      email:'maria@company.com',  role:'HR',         dept:'HR',         archivedAt:'2024-01-22', reason:'Contract ended', initials:'MS', color:'#8b5cf6' },
  { id:3, name:'Pedro Reyes',       email:'pedro@company.com',  role:'Accounting', dept:'Accounting', archivedAt:'2023-12-05', reason:'Terminated',     initials:'PR', color:'#0ea5e9' },
  { id:4, name:'Ana Lim',           email:'ana@company.com',    role:'Creatives',  dept:'Creatives',  archivedAt:'2023-11-18', reason:'Resigned',       initials:'AL', color:'#f59e0b' },
  { id:5, name:'Carlos Villanueva', email:'carlos@company.com', role:'Marketing',  dept:'Marketing',  archivedAt:'2024-03-02', reason:'Contract ended', initials:'CV', color:'#10b981' },
];

const LOG_TYPES = {
  login:  { label:'Login',  color:'#0ea5e9', icon:User     },
  bug:    { label:'Bug',    color:'#8b5cf6', icon:Bug      },
  email:  { label:'Email',  color:'#ef4444', icon:Mail     },
  user:   { label:'User',   color:'#f59e0b', icon:Users    },
  system: { label:'System', color:'#10b981', icon:Activity },
};
const LOG_DATA = [
  { id:1, type:'login',  actor:'Super Admin',    action:'User login from 192.168.1.1',             ts:'2024-03-01 09:00', module:'Auth'        },
  { id:2, type:'bug',    actor:'Aldus Asuncion', action:'Archived bug: OTP Not Received',          ts:'2024-03-01 09:15', module:'Bug Reports' },
  { id:3, type:'email',  actor:'Santy Balmores', action:'Sent reply to x.balmores@outlook.com',    ts:'2024-03-01 09:32', module:'Messaging'   },
  { id:4, type:'user',   actor:'Super Admin',    action:'Archived user: Juan dela Cruz',            ts:'2024-02-28 14:20', module:'Users'       },
  { id:5, type:'system', actor:'System',         action:'Outlook email sync completed (12 emails)', ts:'2024-02-28 08:00', module:'Sync'        },
  { id:6, type:'email',  actor:'Admin',          action:'Exported bug report CSV',                 ts:'2024-02-27 16:45', module:'Bug Reports' },
  { id:7, type:'login',  actor:'Aldus Asuncion', action:'User login from 10.0.0.5',                ts:'2024-02-27 09:01', module:'Auth'        },
  { id:8, type:'bug',    actor:'Aldus Asuncion', action:'Marked bug as Resolved: Custom Tour',     ts:'2024-02-26 11:30', module:'Bug Reports' },
];

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
};
const fmtBugId = (id, createdAt) => {
  if (!id) return '—';
  const d = createdAt ? new Date(createdAt) : new Date();
  return `BUG-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${id.slice(-3).toUpperCase()}`;
};

/* ════════════════════════════════════════════════
   GLOBAL CSS
════════════════════════════════════════════════ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
  * { font-family:'Poppins',sans-serif !important; box-sizing:border-box !important; }

  @keyframes arcFadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes arcSpin     { to{transform:rotate(360deg)} }
  @keyframes arcSlideIn  { from{opacity:0;transform:translateY(-4px)} to{opacity:1;transform:none} }
  @keyframes iconPop     { 0%{transform:scale(0.8)} 60%{transform:scale(1.15)} 100%{transform:scale(1)} }
  @keyframes modalIn     { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes overlayIn   { from{opacity:0} to{opacity:1} }

  .arc-fade-up      { animation:arcFadeUp .25s cubic-bezier(.22,1,.36,1) both; }
  .arc-hover-row:hover { background:var(--arc-row-hover) !important; }
  .arc-card-lift    { transition:transform .2s ease,box-shadow .2s ease !important; }
  .arc-card-lift:hover { transform:translateY(-2px) !important; box-shadow:0 20px 50px rgba(0,0,0,0.12),0 4px 12px rgba(0,0,0,0.06) !important; }
  .arc-btn          { transition:all .15s ease !important; cursor:pointer; font-family:'Poppins',sans-serif !important; }
  .arc-btn:hover    { filter:brightness(1.05); }
  .arc-icon-btn     { transition:all .15s ease !important; cursor:pointer; border:none !important; }
  .arc-icon-btn:hover { transform:scale(1.08); }
  .arc-dropdown     { animation:arcSlideIn .15s ease both; }
  .arc-spinning     { animation:arcSpin .8s linear infinite; }
  .arc-overlay-bg   { animation:overlayIn .2s ease both; }
  .arc-modal-anim   { animation:modalIn .3s cubic-bezier(.22,1,.36,1) both; }
  input:focus,textarea:focus { border-color:#bb0000 !important; box-shadow:0 0 0 3px rgba(187,0,0,0.1) !important; }
  .arc-input:focus  { outline:none; }
  .arc-input::placeholder { opacity:.5; }
  ::-webkit-scrollbar       { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:rgba(128,128,128,0.2); border-radius:3px; }

  /* Section header */
  .sh-layout  { display:flex; align-items:stretch; }
  .sh-left    { flex:0 0 auto; width:300px; padding:22px 0 22px 28px; }
  .sh-divider { width:1px; flex-shrink:0; margin:18px 0; }
  .sh-right   { flex:1; min-width:0; }
  @media (max-width:767px) {
    .sh-layout  { flex-direction:column; }
    .sh-left    { width:100% !important; padding:18px 18px 12px !important; }
    .sh-divider { display:none !important; }
    .sh-right   { padding:0 0 12px; }
  }

  /* ── TAB GRID: always 1 row, 4 equal columns ── */
  .tab-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  /* On very small screens allow horizontal scroll instead of wrapping */
  @media (max-width: 639px) {
    .tab-grid {
      grid-template-columns: repeat(4, minmax(140px, 1fr));
      gap: 8px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      padding-bottom: 4px;
    }
    .tab-grid::-webkit-scrollbar { display: none; }
  }

  /* Search row — single line, never wraps */
  .search-row         { display:flex; align-items:center; gap:8px; flex-wrap:nowrap; position:relative; z-index:20; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; }
  .search-row::-webkit-scrollbar { display:none; }
  .search-input-wrap  { flex:0 0 auto; min-width:140px; max-width:220px; }
  .filter-group       { display:flex; align-items:center; gap:6px; flex-wrap:nowrap; flex-shrink:0; }
  .view-right         { margin-left:auto; display:flex; align-items:center; gap:6px; flex-shrink:0; }

  /* Users table */
  .users-table-header { display:grid; grid-template-columns:1fr 120px 130px 120px 72px; align-items:center; padding:10px 18px; gap:8px; }
  .users-table-row    { display:grid; grid-template-columns:1fr 120px 130px 120px 72px; align-items:center; padding:12px 18px; gap:8px; }
  @media (max-width:767px) {
    .users-table-header { grid-template-columns:1fr 100px 80px; padding:10px 14px; }
    .users-table-header .users-col-dept,.users-table-header .users-col-date { display:none; }
    .users-table-row    { grid-template-columns:1fr 100px 80px; padding:12px 14px; gap:6px; }
    .users-col-dept,.users-col-date { display:none; }
  }
  @media (max-width:479px) {
    .users-table-header { grid-template-columns:1fr 72px; padding:10px 12px; }
    .users-table-header .users-col-reason { display:none; }
    .users-table-row    { grid-template-columns:1fr 72px; padding:10px 12px; gap:4px; }
    .users-col-reason { display:none; }
  }

  /* Activity table */
  .act-table-header { display:grid; grid-template-columns:110px 1fr 110px 155px; align-items:center; padding:10px 18px; gap:8px; }
  .act-table-row    { display:grid; grid-template-columns:110px 1fr 110px 155px; align-items:center; padding:12px 18px; gap:8px; }
  @media (max-width:767px) {
    .act-table-header { grid-template-columns:85px 1fr 115px; padding:10px 14px; }
    .act-table-header .act-col-module { display:none; }
    .act-table-row    { grid-template-columns:85px 1fr 115px; padding:12px 14px; gap:6px; }
    .act-col-module   { display:none; }
  }
  @media (max-width:479px) {
    .act-table-header { grid-template-columns:75px 1fr; padding:10px 12px; }
    .act-table-header .act-col-ts { display:none; }
    .act-table-row    { grid-template-columns:75px 1fr; padding:10px 12px; gap:4px; }
    .act-col-ts       { display:none; }
  }

  /* Email list */
  .email-list-header { display:grid; grid-template-columns:28px 1fr 120px 90px 105px 64px; align-items:center; padding:9px 16px; gap:8px; }
  .email-list-row    { display:grid; grid-template-columns:28px 1fr 120px 90px 105px 64px; align-items:center; padding:14px 18px; gap:8px; }
  @media (max-width:767px) {
    .email-list-header { grid-template-columns:28px 1fr 90px 64px; padding:9px 12px; gap:6px; }
    .email-list-header .email-col-dept,.email-list-header .email-col-date { display:none; }
    .email-list-row    { grid-template-columns:28px 1fr 90px 64px; padding:12px 14px; gap:6px; }
    .email-col-dept,.email-col-date { display:none; }
  }
  @media (max-width:479px) {
    .email-list-header { grid-template-columns:28px 1fr 60px; padding:9px 10px; gap:4px; }
    .email-list-header .email-col-status { display:none; }
    .email-list-row    { grid-template-columns:28px 1fr 60px; padding:10px 10px; gap:4px; }
    .email-col-status  { display:none; }
  }

  /* Bug list */
  .bug-list-header { display:grid; grid-template-columns:28px 1fr 100px 105px 125px 64px; align-items:center; padding:9px 16px; gap:8px; }
  .bug-list-row    { display:grid; grid-template-columns:28px 1fr 100px 105px 125px 64px; align-items:center; padding:11px 16px; gap:8px; }
  @media (max-width:767px) {
    .bug-list-header { grid-template-columns:28px 1fr 90px 64px; padding:9px 12px; gap:6px; }
    .bug-list-header .bug-col-stat,.bug-list-header .bug-col-archived { display:none; }
    .bug-list-row    { grid-template-columns:28px 1fr 90px 64px; padding:10px 12px; gap:6px; }
    .bug-col-stat,.bug-col-archived { display:none; }
  }
  @media (max-width:479px) {
    .bug-list-header { grid-template-columns:28px 1fr 60px; padding:9px 10px; gap:4px; }
    .bug-list-header .bug-col-sev { display:none; }
    .bug-list-row    { grid-template-columns:28px 1fr 60px; padding:10px 10px; gap:4px; }
    .bug-col-sev     { display:none; }
  }

  /* Arc page padding */
  .arc-page { padding:24px; }
  @media (max-width:639px) { .arc-page { padding:14px 12px; } }
  @media (max-width:359px) { .arc-page { padding:10px 8px; } }

  /* Grid containers */
  .email-grid-container,.bug-grid-container { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px; }
  @media (max-width:479px) {
    .email-grid-container,.bug-grid-container { grid-template-columns:1fr !important; }
  }

  /* Table scroll */
  .arc-table-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }

  /* Filter dropdown right-align */
  @media (max-width:479px) { .arc-dropdown-right { left:auto !important; right:0 !important; } }

  /* Modal overlay — does NOT lock scroll */
  .arc-overlay {
    position:fixed; inset:0;
    background:rgba(0,0,0,0.45);
    backdrop-filter:blur(3px);
    -webkit-backdrop-filter:blur(3px);
    z-index:1000;
    pointer-events:none;
  }
  /* Modal container — fixed, pointer-events on the modal only */
  .arc-modal-container {
    position:fixed; inset:0;
    z-index:1001;
    display:flex;
    align-items:flex-start;
    justify-content:flex-end;
    padding:16px;
    pointer-events:none;
  }
  @media (max-width:639px) {
    .arc-modal-container {
      align-items:flex-end;
      justify-content:center;
      padding:0;
    }
  }

  /* Pill truncate */
  .arc-pill-truncate { max-width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  @media (max-width:479px) { .arc-pill-truncate { max-width:60px; } }

  /* Chip */
  .arc-chip { display:inline-flex; align-items:center; padding:2px 9px; border-radius:20px; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100px; }

  /* Folder tab label */
  @media (max-width:359px) {
    .tab-folder-label { font-size:11px !important; }
    .tab-folder-sub   { font-size:9px !important; }
  }

  /* Touch tap areas */
  @media (max-width:639px) { .arc-icon-btn { min-width:32px; min-height:32px; } }

  /* Section header slider hide on tiny */
  @media (max-width:359px) { .sh-right { display:none !important; } }
`;

/* ════════════════════════════════════════════════
   FOLDER SHAPE SVG
════════════════════════════════════════════════ */
function FolderShape({ color, width, height }) {
  const r=14,nt=10,nw=width*0.42,nh=20,bw=width,bh=height;
  const d=[`M ${r} ${bh}`,`Q 0 ${bh} 0 ${bh-r}`,`L 0 ${nh}`,`Q 0 ${nh-nt} ${nt} ${nh-nt}`,`L ${nw-nt*1.5} ${nh-nt}`,`Q ${nw} ${nh-nt} ${nw+nt} ${nh}`,`L ${bw-r} ${nh}`,`Q ${bw} ${nh} ${bw} ${nh+r}`,`L ${bw} ${bh-r}`,`Q ${bw} ${bh} ${bw-r} ${bh}`,`L ${r} ${bh}`,`Z`].join(' ');
  return (
    <svg width={width} height={bh} style={{position:'absolute',top:0,left:0,zIndex:0,display:'block',overflow:'visible',filter:'drop-shadow(0px 4px 8px rgba(0,0,0,0.15))'}} viewBox={`0 0 ${width} ${bh}`}>
      <path d={d} fill={color}/>
    </svg>
  );
}

function TabCard({ cfg, active, dark, onClick }) {
  const [hovered,setHovered]=useState(false);
  const ref=React.useRef(null);
  const [dims,setDims]=React.useState({w:220,h:136});
  React.useEffect(()=>{
    if(!ref.current)return;
    const ro=new ResizeObserver(([e])=>setDims({w:e.contentRect.width,h:e.contentRect.height}));
    ro.observe(ref.current);
    return()=>ro.disconnect();
  },[]);
  const AC={emails:{shell:'#8b1a22',paper:'linear-gradient(145deg,#f8d0d2 0%,#f0b8bc 55%,#eaaab0 100%)',paperSolid:'#f0b8bc',title:'#5a0a10',sub:'#8a2830'},bugs:{shell:'#3a1878',paper:'linear-gradient(145deg,#e0d0f8 0%,#d0b8f0 55%,#c4a8e8 100%)',paperSolid:'#d0b8f0',title:'#28106a',sub:'#50309a'},users:{shell:'#0a3d78',paper:'linear-gradient(145deg,#cce0f8 0%,#b8d0f0 55%,#a8c4e8 100%)',paperSolid:'#b8d0f0',title:'#082858',sub:'#184888'},activity:{shell:'#065038',paper:'linear-gradient(145deg,#c0f0d8 0%,#a8e8c8 55%,#90e0b8 100%)',paperSolid:'#a8e8c8',title:'#043020',sub:'#0a6040'}};
  const ACD={emails:{shell:'#6e2830',paper:'linear-gradient(145deg,#321018 0%,#2a1518 55%,#241018 100%)',paperSolid:'#2a1518',title:'#f4a0a8',sub:'#c06070'},bugs:{shell:'#3a2070',paper:'linear-gradient(145deg,#201030 0%,#1a1228 55%,#160e22 100%)',paperSolid:'#1a1228',title:'#b4a0f4',sub:'#8060c0'},users:{shell:'#102a58',paper:'linear-gradient(145deg,#0e1a30 0%,#0c1520 55%,#0a1018 100%)',paperSolid:'#0c1520',title:'#90c0e8',sub:'#5090c0'},activity:{shell:'#104030',paper:'linear-gradient(145deg,#0c2018 0%,#0c1a10 55%,#08140c 100%)',paperSolid:'#0c1a10',title:'#80d0a8',sub:'#40a070'}};
  const IDLE={light:{shell:'#f0f1ed',paper:'#f0f1ed',paperSolid:'#f0f1ed',title:'#555',sub:'#888'},dark:{shell:'#1e2020',paper:'#1e2020',paperSolid:'#1e2020',title:'#aaa',sub:'#666'}};
  const c=active?(dark?ACD:AC)[cfg.id]:(dark?IDLE.dark:IDLE.light);
  const AVATARS={emails:[{bg:'#ef4444',l:'A'}],bugs:[{bg:'#8b5cf6',l:'B'},{bg:'#6366f1',l:'C'}],users:[{bg:'#0ea5e9',l:'D'},{bg:'#2563eb',l:'E'},{bg:'#38bdf8',l:'F'},{bg:'#0284c7',l:'G'},{bg:'#7dd3fc',l:'H'}],activity:[{bg:'#10b981',l:'I'},{bg:'#0891b2',l:'J'}]};
  const avList=AVATARS[cfg.id]||[];const shown=avList.slice(0,3);const extra=avList.length-3;const NUB_H=20;
  return (
    <div ref={ref} onClick={onClick} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{position:'relative',cursor:'pointer',fontFamily:F,paddingTop:NUB_H,transform:`translateY(${active?-4:hovered?-2:0}px)`,transition:'transform .2s ease'}}>
      <FolderShape color={c.shell} width={dims.w} height={dims.h+NUB_H}/>
      <div style={{position:'relative',zIndex:1,background:c.paper,borderRadius:20,padding:'12px 14px',display:'flex',flexDirection:'column',justifyContent:'space-between',minHeight:90}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:6}}>
          <div style={{flex:1,minWidth:0}}>
            <div className="tab-folder-label" style={{fontSize:13,fontWeight:700,color:active?cfg.accent:c.title,fontFamily:F,lineHeight:1.3,transition:'color .15s',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cfg.label}</div>
            <div className="tab-folder-sub" style={{fontSize:11,color:c.sub,fontFamily:F,marginTop:2,lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cfg.sublabel}</div>
          </div>
          <button onClick={e=>e.stopPropagation()} style={{background:'none',border:'none',cursor:'pointer',padding:'0 2px',color:c.sub,display:'flex',alignItems:'center',opacity:0.6,flexShrink:0}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
          </button>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:8}}>
          <div style={{display:'flex',alignItems:'center'}}>
            {shown.map((av,i)=>(<div key={i} style={{width:22,height:22,borderRadius:'50%',background:av.bg,border:`2px solid ${c.paperSolid}`,marginLeft:i===0?0:-7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800,color:'#fff',zIndex:shown.length-i,position:'relative',flexShrink:0,boxShadow:'0 1px 3px rgba(0,0,0,0.2)'}}>{av.l}</div>))}
            {extra>0&&<div style={{width:22,height:22,borderRadius:'50%',background:dark?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.08)',border:`2px solid ${c.paperSolid}`,marginLeft:-7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800,color:c.sub,zIndex:0,position:'relative',flexShrink:0}}>+{extra}</div>}
          </div>
          <span style={{fontSize:11,fontWeight:500,color:active?cfg.accent:c.sub,fontFamily:F,whiteSpace:'nowrap',transition:'color .15s'}}>{cfg.count} {cfg.countLabel}</span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   SECTION HEADER
════════════════════════════════════════════════ */
function SectionHeader({ tab, icon, accent, title, sub, count, label, cards }) {
  const g=TAB_GRADIENTS[tab];
  const Dot=({color})=>(<div style={{width:34,height:34,borderRadius:10,background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.20)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:9}}><span style={{display:'block',width:16,height:16,borderRadius:'50%',background:color||accent,boxShadow:`0 0 10px ${color||accent}99`}}/></div>);
  return (
    <div style={{position:'relative',borderRadius:18,overflow:'hidden',boxShadow:g.boxShadow,border:`1px solid ${g.border}`}}>
      <div style={{position:'absolute',inset:0,background:g.base}}/>
      <div style={{position:'absolute',inset:0,background:g.sweep}}/>
      <div style={{position:'absolute',top:'-30%',left:'-10%',width:'75%',height:'110%',background:g.ray,transform:`skewY(${g.raySkew})`,pointerEvents:'none'}}/>
      <div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.025) 1px,transparent 1px)',backgroundSize:'22px 22px',opacity:0.5}}/>
      <div style={{position:'absolute',inset:0,background:g.vignette}}/>
      <div style={{position:'absolute',top:12,right:70,width:4,height:4,borderRadius:'50%',background:g.dotColor,boxShadow:`0 0 8px ${g.dotGlow}`}}/>
      <div style={{position:'absolute',top:28,right:140,width:3,height:3,borderRadius:'50%',background:g.dotColor.replace('0.65','0.4'),boxShadow:`0 0 5px ${g.dotGlow}`}}/>
      <div style={{position:'absolute',top:8,right:210,width:2.5,height:2.5,borderRadius:'50%',background:g.dotColor.replace('0.65','0.3')}}/>
      <div style={{position:'absolute',top:40,right:55,width:2,height:2,borderRadius:'50%',background:g.dotColor.replace('0.65','0.25')}}/>
      <div className="sh-layout" style={{position:'relative'}}>
        <div className="sh-left">
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <div style={{width:32,height:32,borderRadius:9,background:g.iconBg,border:`1px solid ${g.iconBorder}`,display:'flex',alignItems:'center',justifyContent:'center',color:g.iconColor,flexShrink:0}}>{icon}</div>
            <span style={{fontSize:11,fontWeight:600,color:g.labelColor,fontFamily:F,letterSpacing:'.08em',textTransform:'uppercase'}}>{label} archive</span>
          </div>
          <h2 style={{fontSize:20,fontWeight:700,color:'#ffffff',fontFamily:F,margin:'0 0 4px',lineHeight:1.25,letterSpacing:'-.02em'}}>{title}</h2>
          <p style={{fontSize:13,color:'rgba(255,255,255,0.72)',fontFamily:F,margin:'0 0 14px',lineHeight:1.5}}>{sub}</p>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 14px',background:g.countBg,border:`1px solid ${g.countBorder}`,borderRadius:20}}>
            <span style={{fontSize:16,fontWeight:700,color:'#ffffff',fontFamily:F}}>{count}</span>
            <span style={{fontSize:11,color:g.labelColor,fontFamily:F}}>{label}</span>
          </div>
        </div>
        <div className="sh-divider" style={{background:g.divider}}/>
        <div className="sh-right" style={{position:'relative',minWidth:0}}>
          <CardSlider cards={cards} g={g} accent={accent} Dot={Dot}/>
        </div>
      </div>
    </div>
  );
}

function CardSlider({ cards, g, accent, Dot }) {
  const CARD_W=220,GAP=10,STEP=230,SPEED=0.4;
  const offsetRef=React.useRef(0),rafRef=React.useRef(null),pausedRef=React.useRef(false),trackRef=React.useRef(null);
  const [activeIdx,setActiveIdx]=React.useState(0);
  const looped=[...cards,...cards,...cards];const loopLen=STEP*cards.length;
  React.useEffect(()=>{
    const animate=()=>{ if(!pausedRef.current){offsetRef.current+=SPEED;if(offsetRef.current>=loopLen)offsetRef.current-=loopLen;if(trackRef.current)trackRef.current.style.transform=`translateX(-${offsetRef.current}px)`;setActiveIdx(Math.round(offsetRef.current/STEP)%cards.length);} rafRef.current=requestAnimationFrame(animate); };
    rafRef.current=requestAnimationFrame(animate);
    return()=>cancelAnimationFrame(rafRef.current);
  },[cards.length,loopLen]);
  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',paddingTop:18,paddingBottom:18}} onMouseEnter={()=>{pausedRef.current=true;}} onMouseLeave={()=>{pausedRef.current=false;}}>
      <div style={{overflow:'hidden',paddingLeft:16}}>
        <div ref={trackRef} style={{display:'flex',gap:GAP,willChange:'transform'}}>
          {looped.map((card,i)=>{
            const avs=card.avatars||[];const shownAv=avs.slice(0,3);const extraAv=avs.length-3;
            return(
            <div key={i} style={{flexShrink:0,width:CARD_W,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.18)',borderRadius:18,padding:'14px 16px',backdropFilter:'blur(8px)',display:'flex',flexDirection:'column',justifyContent:'space-between',gap:10}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:6}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#ffffff',lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{card.label}</div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.6)',marginTop:2,lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{card.sub}</div>
                </div>
                <div style={{width:8,height:8,borderRadius:'50%',background:card.dot||accent,boxShadow:`0 0 8px ${card.dot||accent}`,flexShrink:0,marginTop:3}}/>
              </div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                {avs.length>0?(
                  <div style={{display:'flex',alignItems:'center'}}>
                    {shownAv.map((av,j)=>(<div key={j} style={{width:22,height:22,borderRadius:'50%',background:av.bg,border:'2px solid rgba(255,255,255,0.15)',marginLeft:j===0?0:-7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800,color:'#fff',zIndex:shownAv.length-j,position:'relative',flexShrink:0,boxShadow:'0 1px 4px rgba(0,0,0,0.3)'}}>{av.l}</div>))}
                    {extraAv>0&&<div style={{width:22,height:22,borderRadius:'50%',background:'rgba(255,255,255,0.15)',border:'2px solid rgba(255,255,255,0.15)',marginLeft:-7,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:800,color:'rgba(255,255,255,0.8)',zIndex:0,position:'relative',flexShrink:0}}>+{extraAv}</div>}
                  </div>
                ):(
                  <Dot color={card.dot||accent}/>
                )}
                {card.count!==undefined&&(
                  <span style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.85)',whiteSpace:'nowrap'}}>{card.count} {card.countLabel||''}</span>
                )}
              </div>
            </div>
          );})}
        </div>
      </div>
      <div style={{display:'flex',justifyContent:'center',gap:5,marginTop:10}}>
        {cards.map((_,i)=><div key={i} style={{width:activeIdx===i?14:5,height:5,borderRadius:3,background:activeIdx===i?g.pipActive:g.pipIdle,transition:'all .3s ease'}}/>)}
      </div>
    </div>
  );
}

function ActiveSectionHeader({ tab }) {
  const cfg={
    emails:  {icon:<Mail size={16}/>,accent:'#ef4444',title:'Messages',sub:'Email threads — restore to move back to active inbox',label:'emails',count:10,cards:[
      {dot:'#ef4444',label:'HR',          sub:'Department emails',   avatars:[{bg:'#ef4444',l:'A'}],                                                                    count:3,  countLabel:'emails'},
      {dot:'#f97316',label:'Creatives',   sub:'Department emails',   avatars:[{bg:'#f97316',l:'B'},{bg:'#fbbf24',l:'C'}],                                               count:2,  countLabel:'emails'},
      {dot:'#0ea5e9',label:'Operations',  sub:'Department emails',   avatars:[{bg:'#0ea5e9',l:'D'},{bg:'#6366f1',l:'E'},{bg:'#10b981',l:'F'},{bg:'#8b5cf6',l:'G'}],      count:4,  countLabel:'emails'},
      {dot:'#10b981',label:'Marketing',   sub:'Department emails',   avatars:[{bg:'#10b981',l:'H'}],                                                                    count:1,  countLabel:'emails'},
    ]},
    bugs:    {icon:<Bug size={16}/>,accent:'#8b5cf6',title:'Bug Reports Archive',sub:'Archived bugs — restore to move back to Bug Reports',label:'bugs',count:0,cards:[
      {dot:'#f87171',label:'Critical',    sub:'Highest priority bugs',avatars:[{bg:'#ef4444',l:'B'},{bg:'#dc2626',l:'C'}],                                              count:0,  countLabel:'bugs'},
      {dot:'#fb923c',label:'High',        sub:'Urgent attention needed',avatars:[{bg:'#f97316',l:'D'},{bg:'#ea580c',l:'E'}],                                            count:0,  countLabel:'bugs'},
      {dot:'#facc15',label:'Medium',      sub:'Moderate impact bugs', avatars:[{bg:'#eab308',l:'F'},{bg:'#ca8a04',l:'G'},{bg:'#a16207',l:'H'}],                          count:0,  countLabel:'bugs'},
      {dot:'#4ade80',label:'Low',         sub:'Minor or cosmetic issues',avatars:[{bg:'#22c55e',l:'I'}],                                                                count:0,  countLabel:'bugs'},
    ]},
    users:   {icon:<Users size={16}/>,accent:'#0ea5e9',title:'Users Archive',sub:'Deactivated or removed user accounts',label:'users',count:USER_DATA.length,cards:[
      {dot:'#0ea5e9',label:'Resigned',    sub:'Voluntary departure',  avatars:[{bg:'#ef4444',l:'JD'},{bg:'#f59e0b',l:'AL'}],                                            count:2,  countLabel:'users'},
      {dot:'#6366f1',label:'Contract ended',sub:'Fixed-term concluded',avatars:[{bg:'#8b5cf6',l:'MS'},{bg:'#10b981',l:'CV'}],                                           count:2,  countLabel:'users'},
      {dot:'#ef4444',label:'Terminated',  sub:'Employment ended',     avatars:[{bg:'#0ea5e9',l:'PR'}],                                                                  count:1,  countLabel:'users'},
      {dot:'#94a3b8',label:'Deactivated', sub:'Access suspended',     avatars:[],                                                                                       count:0,  countLabel:'users'},
    ]},
    activity:{icon:<Activity size={16}/>,accent:'#10b981',title:'Activity Logs Archive',sub:'Historical audit logs — read-only for compliance',label:'entries',count:LOG_DATA.length,cards:[
      {dot:'#0ea5e9',label:'Login',       sub:'Auth & session events',avatars:[{bg:'#0ea5e9',l:'SA'},{bg:'#38bdf8',l:'AA'}],                                            count:2,  countLabel:'entries'},
      {dot:'#8b5cf6',label:'Bug',         sub:'Bug report activity',  avatars:[{bg:'#8b5cf6',l:'AA'},{bg:'#6366f1',l:'AA'}],                                            count:2,  countLabel:'entries'},
      {dot:'#ef4444',label:'Email',       sub:'Messaging events',     avatars:[{bg:'#ef4444',l:'SB'},{bg:'#f97316',l:'AD'}],                                            count:2,  countLabel:'entries'},
      {dot:'#f59e0b',label:'User',        sub:'Account changes',      avatars:[{bg:'#f59e0b',l:'SA'}],                                                                  count:1,  countLabel:'entries'},
      {dot:'#10b981',label:'System',      sub:'System-level events',  avatars:[{bg:'#10b981',l:'SY'}],                                                                  count:1,  countLabel:'entries'},
    ]},
  };
  const c=cfg[tab];if(!c)return null;
  return <SectionHeader tab={tab} icon={c.icon} accent={c.accent} title={c.title} sub={c.sub} count={c.count} label={c.label} cards={c.cards}/>;
}

/* ════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════ */
export default function ArchivePage() {
  const [tab,setTab]=useState('emails');
  const [dark,setDark]=useState(getDark);
  const s=T(dark);

  useEffect(()=>{const h=(e)=>setDark(e.detail.darkMode);window.addEventListener('darkModeChange',h);return()=>window.removeEventListener('darkModeChange',h);},[]);
  useEffect(()=>{const id=setInterval(()=>{try{const v=localStorage.getItem('darkMode');if(v!==null)setDark(p=>(v==='true')!==p?v==='true':p);}catch{}},400);return()=>clearInterval(id);},[]);

  const activeCfg=TABS.find(t=>t.id===tab);

  return (
    <div className="arc-page" style={{minHeight:'100%',background:s.bgGrad,display:'flex',flexDirection:'column',gap:20,fontFamily:F,transition:'background .25s'}}>
      <style>{GLOBAL_CSS}</style>
      <style>{`:root{--arc-row-hover:${dark?'rgba(255,255,255,0.025)':'rgba(26,32,64,0.025)'}}`}</style>

      <div style={{marginBottom:4}}>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:s.sec,marginBottom:8,fontWeight:500,flexWrap:'wrap'}}>
          <LayoutDashboard size={13} style={{color:s.sec}}/><span>Dashboard</span><span style={{opacity:0.5}}>/</span><span style={{color:s.pri,fontWeight:500}}>Archive</span>
        </div>
        <h1 style={{fontSize:24,fontWeight:700,color:s.pri,margin:'0 0 4px',lineHeight:1.2}}>Archive</h1>
        <p style={{fontSize:13,color:s.sec,margin:0}}>{activeCfg.desc}</p>
      </div>

      <ActiveSectionHeader tab={tab}/>

      {/* ── TABS: always 1 row ── */}
      <div className="tab-grid">
        {TABS.map(cfg=>(<TabCard key={cfg.id} cfg={cfg} active={tab===cfg.id} dark={dark} onClick={()=>setTab(cfg.id)}/>))}
      </div>

      <div key={tab} className="arc-fade-up">
        {tab==='emails'   && <EmailsTab   s={s} dark={dark}/>}
        {tab==='bugs'     && <BugsTab     s={s} dark={dark}/>}
        {tab==='users'    && <UsersTab    s={s} dark={dark}/>}
        {tab==='activity' && <ActivityTab s={s} dark={dark}/>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   EMAILS TAB
   — default view is now 'table'; order: Table → Card → List
════════════════════════════════════════════════ */
function EmailsTab({ s, dark }) {
  const [search,setSearch]=useState('');
  const [dept,setDept]=useState('All');const [deptOp,setDeptOp]=useState(false);
  const [status,setStatus]=useState('All');const [statusOp,setStatusOp]=useState(false);
  const [date,setDate]=useState('All');const [dateOp,setDateOp]=useState(false);
  // ── default changed to 'table' ──
  const [view,setView]=useState('table');
  const [items,setItems]=useState(EMAIL_DATA);
  const [pins,setPins]=useState([1,2,5]);
  const [preview,setPreview]=useState(null);
  const [confirm,setConfirm]=useState(null);
  const [sort,setSort]=useState('asc');
  const [refreshing,setRefreshing]=useState(false);

  const depts=useMemo(()=>['All',...new Set(items.map(i=>i.dept))],[items]);
  const statuses=useMemo(()=>['All',...new Set(items.map(i=>i.status))],[items]);
  const dateOpts=['All','Last 30 days','Last 3 months','Last 6 months','Over 6 months'];

  const filtered=useMemo(()=>{
    const now=Date.now(),q=search.toLowerCase();
    return items.filter(i=>{
      if(dept!=='All'&&i.dept!==dept)return false;
      if(status!=='All'&&i.status!==status)return false;
      if(date!=='All'){const diff=now-new Date(i.date).getTime(),day=86400000;if(date==='Last 30 days'&&diff>30*day)return false;if(date==='Last 3 months'&&diff>90*day)return false;if(date==='Last 6 months'&&diff>180*day)return false;if(date==='Over 6 months'&&diff<180*day)return false;}
      if(q&&!i.title.toLowerCase().includes(q)&&!i.from.toLowerCase().includes(q)&&!i.tags.some(t=>t.includes(q)))return false;
      return true;
    });
  },[items,search,dept,status,date]);

  const pinned=filtered.filter(i=>pins.includes(i.id));
  const rest=filtered.filter(i=>!pins.includes(i.id));
  const doUnarchive=(id)=>{setItems(p=>p.filter(i=>i.id!==id));setPins(p=>p.filter(x=>x!==id));setConfirm(null);setPreview(null);};
  const accent='#ef4444';

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <SearchRow search={search} setSearch={setSearch} placeholder="Search emails, senders, tags…" accent={accent} s={s} view={view} setView={setView}
        // ── view toggle order: Table → Card → List ──
        viewModes={[
          {m:'table', label:'Table', icon:<Table2 size={12}/>},
          {m:'grid',  label:'Card',  icon:<LayoutGrid size={12}/>},
          {m:'list',  label:'List',  icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>},
        ]}
        onRefresh={()=>{setRefreshing(true);setTimeout(()=>setRefreshing(false),800);}} refreshing={refreshing}
        right={<>
          <DropFilter label={sort==='asc'?'A → Z':'Z → A'} open={false} toggle={()=>setSort(p=>p==='asc'?'desc':'asc')} options={[]} value="All" onSelect={()=>{}} s={s} accent={accent} icon={<ArrowUpDown size={11}/>} isSort sortVal={sort}/>
          <DropFilter label={dept==='All'?'Dept':dept} open={deptOp} toggle={()=>{setDeptOp(o=>!o);setStatusOp(false);setDateOp(false);}} options={depts} value={dept} onSelect={v=>{setDept(v);setDeptOp(false);}} s={s} accent={accent} icon={<Filter size={11}/>}/>
          <DropFilter label={status==='All'?'Status':status} open={statusOp} toggle={()=>{setStatusOp(o=>!o);setDeptOp(false);setDateOp(false);}} options={statuses} value={status} onSelect={v=>{setStatus(v);setStatusOp(false);}} s={s} accent={accent} icon={<Filter size={11}/>}/>
          <DropFilter label={date==='All'?'Date':date} open={dateOp} toggle={()=>{setDateOp(o=>!o);setDeptOp(false);setStatusOp(false);}} options={dateOpts} value={date} onSelect={v=>{setDate(v);setDateOp(false);}} s={s} accent={accent} icon={<Clock size={11}/>} alignRight/>
        </>}/>

      {preview&&<EmailPreviewModal item={preview} s={s} dark={dark} onClose={()=>setPreview(null)} onUnarchive={()=>setConfirm(preview)}/>}
      {confirm&&<ConfirmActionModal s={s} dark={dark} icon={<RotateCcw size={16}/>} iconColor="#10b981" iconBg={dark?'rgba(16,185,129,.15)':'#f0fdf4'} title="Unarchive Email" actionLabel="Yes, Unarchive" actionColor="#10b981" msg="This email will be moved back to the active inbox and visible to the team." itemIcon={<Mail size={13}/>} itemTitle={confirm.title} itemSub={confirm.from} onClose={()=>setConfirm(null)} onConfirm={()=>doUnarchive(confirm.id)}/>}

      {pinned.length>0&&(<Bucket title="Pinned" icon={<Star size={12} style={{color:'#f59e0b'}}/>} s={s}><EmailList items={pinned} pins={pins} setPins={setPins} view={view} s={s} onPreview={setPreview} onAction={setConfirm} dark={dark}/></Bucket>)}
      <Bucket title="All Archived Emails" icon={<Archive size={12}/>} s={s}>
        {rest.length===0?<Empty s={s} icon={<Mail size={28}/>} msg={filtered.length===0?"No emails match your search":"All results are pinned above"}/>:<EmailList items={rest} pins={pins} setPins={setPins} view={view} s={s} onPreview={setPreview} onAction={setConfirm} dark={dark}/>}
      </Bucket>
    </div>
  );
}

/* ════════════════════════════════════════════════
   BUGS TAB
   — default view is now 'table'; order: Table → Card → List
════════════════════════════════════════════════ */
function BugsTab({ s, dark }) {
  const [search,setSearch]=useState('');
  const [sev,setSev]=useState('All');const [sevOp,setSevOp]=useState(false);
  const [stat,setStat]=useState('All');const [statOp,setStatOp]=useState(false);
  // ── default changed to 'table' ──
  const [view,setView]=useState('table');
  const [bugs,setBugs]=useState([]);const [loading,setLoading]=useState(true);
  const [pins,setPins]=useState([]);
  const [preview,setPreview]=useState(null);const [restore,setRestore]=useState(null);
  const [doing,setDoing]=useState(false);const [err,setErr]=useState('');const [sort,setSort]=useState('asc');

  const load=useCallback(async()=>{
    setLoading(true);
    try{const p=new URLSearchParams({limit:100,sortBy:'archivedAt',sortOrder:'desc'});if(search.trim())p.set('search',search.trim());if(sev!=='All')p.set('severity',sev);if(stat!=='All')p.set('status',stat);const r=await api.get(`/bugs/archived?${p}`);setBugs(r.data.bugs||[]);}
    catch{setBugs([]);}finally{setLoading(false);}
  },[search,sev,stat]);
  useEffect(()=>{load();},[load]);

  const doRestore=async()=>{
    if(!restore||doing)return;setDoing(true);setErr('');
    try{await api.patch(`/bugs/${restore._id}/restore`);setBugs(p=>p.filter(b=>b._id!==restore._id));setPins(p=>p.filter(id=>id!==restore._id));setRestore(null);setPreview(null);}
    catch(e){setErr(e.response?.data?.message||'Failed to restore.');}finally{setDoing(false);}
  };

  const pinned=bugs.filter(b=>pins.includes(b._id));const rest=bugs.filter(b=>!pins.includes(b._id));const accent='#8b5cf6';

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <SearchRow search={search} setSearch={setSearch} placeholder="Search archived bugs…" accent={accent} s={s} view={view} setView={setView}
        // ── view toggle order: Table → Card → List ──
        viewModes={[
          {m:'table', label:'Table', icon:<Table2 size={12}/>},
          {m:'grid',  label:'Card',  icon:<LayoutGrid size={12}/>},
          {m:'list',  label:'List',  icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>},
        ]}
        onRefresh={load} refreshing={loading}
        right={<>
          <DropFilter label={sort==='asc'?'A → Z':'Z → A'} open={false} toggle={()=>setSort(p=>p==='asc'?'desc':'asc')} options={[]} value="All" onSelect={()=>{}} s={s} accent={accent} icon={<ArrowUpDown size={11}/>} isSort sortVal={sort}/>
          <DropFilter label={sev==='All'?'Severity':sev} open={sevOp} toggle={()=>{setSevOp(o=>!o);setStatOp(false);}} options={['All','Critical','High','Medium','Low']} value={sev} onSelect={v=>{setSev(v);setSevOp(false);}} s={s} accent={accent} icon={<Filter size={11}/>}/>
          <DropFilter label={stat==='All'?'Status':stat} open={statOp} toggle={()=>{setStatOp(o=>!o);setSevOp(false);}} options={['All','Open','In Progress','Resolved','Closed','Reopened']} value={stat} onSelect={v=>{setStat(v);setStatOp(false);}} s={s} accent={accent} icon={<Filter size={11}/>} alignRight/>
        </>}/>

      {preview&&<BugPreviewModal bug={preview} s={s} dark={dark} onClose={()=>setPreview(null)} onRestore={()=>setRestore(preview)}/>}
      {restore&&<ConfirmActionModal s={s} dark={dark} icon={<RotateCcw size={16}/>} iconColor="#10b981" iconBg={dark?'rgba(16,185,129,.15)':'#f0fdf4'} title="Restore Bug" actionLabel={doing?'Restoring…':'Yes, Restore'} actionColor="#10b981" msg="This bug will be moved back to Bug Reports and appear in the main list." itemIcon={<Bug size={13}/>} itemTitle={restore.title} itemSub={`${restore.severity} · ${restore.status}`} error={err} loading={doing} onClose={()=>{setRestore(null);setErr('');}} onConfirm={doRestore}/>}

      {loading&&<Spin s={s} accent={accent}/>}
      {!loading&&bugs.length===0&&<Empty s={s} icon={<Bug size={28}/>} msg="No archived bugs yet. Archive a bug from Bug Reports to see it here."/>}
      {!loading&&bugs.length>0&&<>
        {pinned.length>0&&(<Bucket title="Pinned" icon={<Star size={12} style={{color:'#f59e0b'}}/>} s={s}><BugList items={pinned} pins={pins} setPins={setPins} view={view} s={s} onPreview={setPreview} onAction={setRestore}/></Bucket>)}
        <Bucket title="All Archived Bugs" icon={<Archive size={12}/>} s={s}>
          {rest.length===0?<Empty s={s} icon={<Bug size={28}/>} msg="All results are pinned above"/>:<BugList items={rest} pins={pins} setPins={setPins} view={view} s={s} onPreview={setPreview} onAction={setRestore}/>}
        </Bucket>
      </>}
    </div>
  );
}

/* ════════════════════════════════════════════════
   USERS TAB
════════════════════════════════════════════════ */
function UsersTab({ s, dark }) {
  const [search,setSearch]=useState('');const [preview,setPreview]=useState(null);
  const [sort,setSort]=useState('asc');
  const [deptF,setDeptF]=useState('All');const [deptOp,setDeptOp]=useState(false);
  const [reasonF,setReasonF]=useState('All');const [reasonOp,setReasonOp]=useState(false);
  const [dateF,setDateF]=useState('All');const [dateOp,setDateOp]=useState(false);
  const [archivedUsers,setArchivedUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [restoreTarget,setRestoreTarget]=useState(null);
  const [restorePassword,setRestorePassword]=useState('');
  const [showRestorePw,setShowRestorePw]=useState(false);
  const [restoreLoading,setRestoreLoading]=useState(false);
  const [restoreErr,setRestoreErr]=useState('');

  const loadArchived=useCallback(async()=>{
    setLoading(true);
    try{
      const token=localStorage.getItem('adminToken');
      const res=await fetch('/api/users/archived',{headers:{Authorization:`Bearer ${token}`}});
      if(!res.ok)throw new Error('Failed to load');
      const data=await res.json();
      setArchivedUsers(data.users||[]);
    }catch(e){console.error(e);setArchivedUsers([]);}
    finally{setLoading(false);}
  },[]);

  useEffect(()=>{loadArchived();},[loadArchived]);

  const depts=useMemo(()=>['All',...new Set(archivedUsers.map(u=>u.role).filter(Boolean))],[archivedUsers]);
  const reasons=useMemo(()=>['All',...new Set(archivedUsers.map(u=>u.inactiveReason).filter(Boolean))],[archivedUsers]);
  const dateOpts=['All','Last 30 days','Last 3 months','Last 6 months','Over 6 months'];

  const filtered=useMemo(()=>{
    const now=Date.now(),day=86400000,q=search.toLowerCase();
    return archivedUsers.filter(u=>{
      if(deptF!=='All'&&u.role!==deptF)return false;
      if(reasonF!=='All'&&u.inactiveReason!==reasonF)return false;
      if(dateF!=='All'){const diff=now-new Date(u.archivedAt||u.updatedAt).getTime();if(dateF==='Last 30 days'&&diff>30*day)return false;if(dateF==='Last 3 months'&&diff>90*day)return false;if(dateF==='Last 6 months'&&diff>180*day)return false;if(dateF==='Over 6 months'&&diff<180*day)return false;}
      if(q&&!u.name?.toLowerCase().includes(q)&&!u.email?.toLowerCase().includes(q)&&!u.role?.toLowerCase().includes(q)&&!(u.firstName||'').toLowerCase().includes(q)&&!(u.surname||'').toLowerCase().includes(q))return false;
      return true;
    });
  },[archivedUsers,search,deptF,reasonF,dateF]);

  const doRestore=async()=>{
    if(!restoreTarget||restoreLoading)return;
    if(!restorePassword.trim()){setRestoreErr('Your password is required.');return;}
    setRestoreLoading(true);setRestoreErr('');
    try{
      const token=localStorage.getItem('adminToken');
      const res=await fetch(`/api/users/${restoreTarget._id}/restore-archive`,{
        method:'PATCH',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({adminPassword:restorePassword.trim()}),
      });
      const data=await res.json();
      if(!res.ok){setRestoreErr(data.message||'Failed to restore.');setRestoreLoading(false);return;}
      setArchivedUsers(p=>p.filter(u=>u._id!==restoreTarget._id));
      setRestoreTarget(null);setRestorePassword('');setRestoreErr('');setPreview(null);
    }catch{setRestoreErr('Network error. Please try again.');}
    finally{setRestoreLoading(false);}
  };

  // Generate initials + color from name
  const getInitials=(u)=>{const n=(u.firstName||u.name||'?');const s=u.surname||'';return(n[0]+(s?s[0]:'')).toUpperCase();};
  const COLORS=['#ef4444','#8b5cf6','#0ea5e9','#f59e0b','#10b981','#e11d48','#ea580c','#0284c7'];
  const getColor=(u)=>COLORS[(u.email||'').charCodeAt(0)%COLORS.length]||'#6b7280';

  const accent='#0ea5e9';const stripe='linear-gradient(135deg,#0ea5e9,#2563eb)';

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <Notice accent={accent} s={s} text="Archived users are deactivated and cannot log in. Their records and activity history are preserved for audit purposes. Restore an account to return it to the inactive user list — then activate to restore access."/>
      <SearchRow search={search} setSearch={setSearch} placeholder="Search by name, email, role…" accent={accent} s={s} view={null} setView={null}
        onRefresh={loadArchived} refreshing={loading}
        right={<>
          <DropFilter label={sort==='asc'?'A → Z':'Z → A'} open={false} toggle={()=>setSort(p=>p==='asc'?'desc':'asc')} options={[]} value="All" onSelect={()=>{}} s={s} accent={accent} icon={<ArrowUpDown size={11}/>} isSort sortVal={sort}/>
          <DropFilter label={deptF==='All'?'Role':deptF} open={deptOp} toggle={()=>{setDeptOp(o=>!o);setReasonOp(false);setDateOp(false);}} options={depts} value={deptF} onSelect={v=>{setDeptF(v);setDeptOp(false);}} s={s} accent={accent} icon={<Filter size={11}/>}/>
          <DropFilter label={reasonF==='All'?'Reason':reasonF} open={reasonOp} toggle={()=>{setReasonOp(o=>!o);setDeptOp(false);setDateOp(false);}} options={reasons} value={reasonF} onSelect={v=>{setReasonF(v);setReasonOp(false);}} s={s} accent={accent} icon={<Filter size={11}/>}/>
          <DropFilter label={dateF==='All'?'Date':dateF} open={dateOp} toggle={()=>{setDateOp(o=>!o);setDeptOp(false);setReasonOp(false);}} options={dateOpts} value={dateF} onSelect={v=>{setDateF(v);setDateOp(false);}} s={s} accent={accent} icon={<Clock size={11}/>} alignRight/>
        </>}/>

      {/* Restore confirm modal */}
      {restoreTarget&&(
        <ConfirmActionModal s={s} dark={dark}
          icon={<RotateCcw size={16}/>} iconColor="#10b981" iconBg={dark?'rgba(16,185,129,.15)':'#f0fdf4'}
          title="Restore User Account"
          actionLabel={restoreLoading?'Restoring…':'Yes, Restore'}
          actionColor="#10b981"
          msg="This account will be moved back to the User List as Inactive. An admin must activate it to restore login access."
          itemIcon={<Users size={13}/>}
          itemTitle={restoreTarget.firstName?`${restoreTarget.firstName} ${restoreTarget.surname||''}`.trim():restoreTarget.name}
          itemSub={`${restoreTarget.role} · ${restoreTarget.email}`}
          error={restoreErr}
          loading={restoreLoading}
          onClose={()=>{setRestoreTarget(null);setRestorePassword('');setRestoreErr('');}}
          onConfirm={doRestore}
          extraField={
            <div style={{padding:'0 22px 12px'}}>
              <label style={{fontSize:12,fontWeight:600,color:s.sec,display:'flex',alignItems:'center',gap:5,marginBottom:5}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Your Password <span style={{color:'#ef4444',fontSize:11}}>*</span>
              </label>
              <div style={{position:'relative'}}>
                <input
                  type={showRestorePw?'text':'password'}
                  placeholder="Your account password"
                  value={restorePassword}
                  onChange={e=>{setRestorePassword(e.target.value);if(restoreErr)setRestoreErr('');}}
                  style={{width:'100%',background:s.surf2,border:`1px solid ${restoreErr?'#ef4444':s.border}`,borderRadius:10,padding:'9px 36px 9px 12px',fontSize:13,color:s.pri,fontFamily:"'Poppins',sans-serif",outline:'none',boxSizing:'border-box'}}
                />
                <button type="button" onClick={()=>setShowRestorePw(p=>!p)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:s.sec,display:'flex',padding:2}}>
                  {showRestorePw
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
          }
        />
      )}

      {preview&&(
        <SlideinModal onClose={()=>setPreview(null)} s={s}>
          <UserPreviewContent user={{
            ...preview,
            initials:getInitials(preview),
            color:getColor(preview),
            dept:preview.role,
            archivedAt:preview.archivedAt||preview.updatedAt,
            reason:preview.inactiveReason||'—',
          }} s={s} dark={dark} accent={accent} stripe={stripe} onClose={()=>setPreview(null)} onRestore={()=>setRestoreTarget(preview)}/>
        </SlideinModal>
      )}

      {loading&&<Spin s={s} accent={accent}/>}
      {!loading&&archivedUsers.length===0&&<Empty s={s} icon={<Users size={28}/>} msg="No archived users yet. Archive an inactive account from User Management to see it here."/>}
      {!loading&&archivedUsers.length>0&&(
        <div style={{background:s.surface,border:`1px solid ${s.border}`,borderRadius:14,overflow:'hidden',boxShadow:s.shadow}}>
          <div className="users-table-header" style={{background:s.surf2,borderBottom:`1px solid ${s.border}`,fontSize:11,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'.07em'}}>
            <span>User</span><span className="users-col-dept">Role</span><span className="users-col-reason">Reason</span><span className="users-col-date">Archived</span><span>Actions</span>
          </div>
          {filtered.length===0
            ?<div style={{padding:'32px',textAlign:'center',fontSize:13,color:s.muted}}>No users match your search.</div>
            :filtered.map((u,i)=>{
              const initials=getInitials(u);const color=getColor(u);
              return(
                <div key={u._id||u.id} className="arc-hover-row users-table-row" style={{borderBottom:i===filtered.length-1?'none':`1px solid ${s.border2}`}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:13,flexShrink:0,boxShadow:`0 3px 8px ${color}50`}}>{initials}</div>
                    <div style={{minWidth:0}}>
                      <p style={{fontSize:13,fontWeight:600,color:s.pri,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.firstName?`${u.firstName} ${u.surname||''}`.trim():u.name}</p>
                      <p style={{fontSize:11,color:s.sec,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.email}</p>
                    </div>
                  </div>
                  <span className="users-col-dept"><Chip label={u.role||'—'} s={s}/></span>
                  <span className="users-col-reason"><Chip label={u.inactiveReason||'—'} s={s}/></span>
                  <span className="users-col-date" style={{fontSize:12,color:s.sec,whiteSpace:'nowrap'}}>{fmtDate(u.archivedAt||u.updatedAt)}</span>
                  <div className="users-col-act" style={{display:'flex',gap:2,justifyContent:'flex-end'}}>
                    <ABtn title="View" s={s} hc={s.pri} hb={s.surf3} onClick={()=>setPreview(u)}><Eye size={13}/></ABtn>
                    <ABtn title="Restore" s={s} hc={accent} hb={dark?'rgba(14,165,233,.12)':'#f0f9ff'} onClick={()=>setRestoreTarget(u)}><RotateCcw size={13}/></ABtn>
                  </div>
                </div>
              );
            })
          }
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   ACTIVITY TAB
════════════════════════════════════════════════ */
function ActivityTab({ s, dark }) {
  const [search,setSearch]=useState('');
  const [type,setType]=useState('All');const [typeOp,setTypeOp]=useState(false);
  const [moduleF,setModuleF]=useState('All');const [moduleOp,setModuleOp]=useState(false);
  const [dateF,setDateF]=useState('All');const [dateOp,setDateOp]=useState(false);
  const [sort,setSort]=useState('asc');const [refreshing,setRefreshing]=useState(false);

  const modules=useMemo(()=>['All',...new Set(LOG_DATA.map(l=>l.module))],[]);
  const dateOpts=['All','Last 30 days','Last 3 months','Last 6 months','Over 6 months'];

  const filtered=useMemo(()=>{
    const now=Date.now(),day=86400000;
    return LOG_DATA.filter(l=>{
      if(type!=='All'&&l.type!==type)return false;if(moduleF!=='All'&&l.module!==moduleF)return false;
      if(dateF!=='All'){const diff=now-new Date(l.ts).getTime();if(dateF==='Last 30 days'&&diff>30*day)return false;if(dateF==='Last 3 months'&&diff>90*day)return false;if(dateF==='Last 6 months'&&diff>180*day)return false;if(dateF==='Over 6 months'&&diff<180*day)return false;}
      if(search&&!l.action.toLowerCase().includes(search.toLowerCase())&&!l.actor.toLowerCase().includes(search.toLowerCase())&&!l.module.toLowerCase().includes(search.toLowerCase()))return false;
      return true;
    });
  },[search,type,moduleF,dateF]);

  const accent='#10b981';

  return (
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      <Notice accent={accent} s={s} text="Activity logs older than 90 days are automatically archived here. These are read-only records for audit and compliance. They cannot be restored or deleted."/>
      <SearchRow search={search} setSearch={setSearch} placeholder="Search logs by action, actor, module…" accent={accent} s={s} view={null} setView={null}
        onRefresh={()=>{setRefreshing(true);setTimeout(()=>setRefreshing(false),800);}} refreshing={refreshing}
        right={<>
          <DropFilter label={sort==='asc'?'A → Z':'Z → A'} open={false} toggle={()=>setSort(p=>p==='asc'?'desc':'asc')} options={[]} value="All" onSelect={()=>{}} s={s} accent={accent} icon={<ArrowUpDown size={11}/>} isSort sortVal={sort}/>
          <DropFilter label={type==='All'?'Log Type':LOG_TYPES[type]?.label||type} open={typeOp} toggle={()=>{setTypeOp(o=>!o);setModuleOp(false);setDateOp(false);}} options={['All',...Object.keys(LOG_TYPES)]} value={type} onSelect={v=>{setType(v);setTypeOp(false);}} s={s} accent={accent} icon={<Filter size={11}/>}/>
          <DropFilter label={moduleF==='All'?'Module':moduleF} open={moduleOp} toggle={()=>{setModuleOp(o=>!o);setTypeOp(false);setDateOp(false);}} options={modules} value={moduleF} onSelect={v=>{setModuleF(v);setModuleOp(false);}} s={s} accent={accent} icon={<Filter size={11}/>}/>
          <DropFilter label={dateF==='All'?'Date':dateF} open={dateOp} toggle={()=>{setDateOp(o=>!o);setTypeOp(false);setModuleOp(false);}} options={dateOpts} value={dateF} onSelect={v=>{setDateF(v);setDateOp(false);}} s={s} accent={accent} icon={<Clock size={11}/>} alignRight/>
        </>}/>
      <div style={{background:s.surface,border:`1px solid ${s.border}`,borderRadius:14,overflow:'hidden',boxShadow:s.shadow}}>
        <div className="arc-table-scroll">
          <div className="act-table-header" style={{background:s.surf2,borderBottom:`1px solid ${s.border}`,fontSize:11,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'.07em'}}>
            <span>Type</span><span>Action</span><span className="act-col-module">Module</span><span className="act-col-ts">Timestamp</span>
          </div>
          {filtered.length===0
            ?<div style={{padding:'32px',textAlign:'center',fontSize:13,color:s.muted}}>No logs match your filters.</div>
            :filtered.map((log,i)=>{const cfg=LOG_TYPES[log.type]||LOG_TYPES.system;const LIcon=cfg.icon;return(
              <div key={log.id} className="arc-hover-row act-table-row" style={{borderBottom:i===filtered.length-1?'none':`1px solid ${s.border2}`}}>
                <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',background:`${cfg.color}18`,borderRadius:20,fontSize:11,fontWeight:600,color:cfg.color,width:'fit-content',whiteSpace:'nowrap'}}><LIcon size={10}/>{cfg.label}</span>
                <div style={{minWidth:0}}><p style={{fontSize:13,color:s.pri,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:500}}>{log.action}</p><p style={{fontSize:11,color:s.sec,margin:'1px 0 0'}}>by {log.actor}</p></div>
                <span className="act-col-module" style={{display:'inline-flex',alignItems:'center',padding:'3px 9px',background:s.surf2,border:`1px solid ${s.border}`,borderRadius:20,fontSize:11,color:s.sec,width:'fit-content',whiteSpace:'nowrap'}}>{log.module}</span>
                <span className="act-col-ts" style={{fontSize:12,color:s.sec,whiteSpace:'nowrap'}}>{log.ts}</span>
              </div>
            );})}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   EMAIL LIST
════════════════════════════════════════════════ */
function EmailList({ items, pins, setPins, view, s, onPreview, onAction, dark }) {
  const [showAll,setShowAll]=useState(false);
  const vis=showAll?items:items.slice(0,LIMIT);const hasMore=items.length>LIMIT;

  if(view==='grid') return(<>
    <div className="email-grid-container">
      {vis.map(item=>{const ec=s.estat[item.status]||s.estat.Archived;const isPinned=pins.includes(item.id);return(
        <div key={item.id} className="arc-card-lift" onClick={()=>onPreview(item)} style={{background:dark?s.surface:'#ffffff',borderRadius:28,overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:dark?'0 4px 20px rgba(0,0,0,0.3)':'0 12px 40px rgba(0,0,0,0.08),0 2px 8px rgba(0,0,0,0.04)',cursor:'pointer',position:'relative'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px 0'}}><span style={{fontSize:10,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'.06em'}}>{item.dept}</span><span style={{display:'inline-flex',alignItems:'center',gap:4,background:`${ec.t}18`,color:ec.t,border:`1px solid ${ec.t}35`,fontSize:9,fontWeight:700,padding:'2px 8px',borderRadius:5,textTransform:'uppercase'}}><span style={{width:5,height:5,borderRadius:'50%',background:ec.t}}/>{item.status}</span></div>
          <div style={{padding:'8px 14px 6px'}}><p style={{fontSize:12,fontWeight:600,color:s.pri,lineHeight:1.5,margin:0,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{item.title}</p></div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4,padding:'0 14px 8px'}}>{item.tags.map(t=>(<span key={t} style={{fontSize:10,color:s.sec,background:s.surf2,border:`1px solid ${s.border2}`,borderRadius:20,padding:'2px 8px'}}>#{t}</span>))}</div>
          <div style={{height:1,background:s.border2,margin:'0 14px'}}/>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px 10px',gap:6}}><span style={{fontSize:10,color:s.sec,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,minWidth:0}}>{item.from}</span><span style={{fontSize:10,color:s.muted,flexShrink:0,whiteSpace:'nowrap'}}>{item.date}</span></div>
          <div style={{position:'absolute',top:8,right:84}} onClick={e=>e.stopPropagation()}><PinBtn pinned={isPinned} onToggle={()=>setPins(p=>isPinned?p.filter(x=>x!==item.id):[...p,item.id])} s={s} size={12}/></div>
        </div>
      );})}
    </div>
    {hasMore&&<ShowMoreBtn showAll={showAll} total={items.length} onToggle={()=>setShowAll(p=>!p)} s={s}/>}
  </>);

  if(view==='table') return(
    <div style={{background:s.surface,border:`1px solid ${s.border}`,borderRadius:14,overflow:'hidden',boxShadow:s.shadow}}>
      <div className="arc-table-scroll">
        <table style={{width:'100%',borderCollapse:'collapse',minWidth:600}}>
          <thead><tr style={{background:s.surf2,borderBottom:`1px solid ${s.border}`}}>{['','Subject','From','Department','Tags','Date','Status','Actions'].map((h,i)=>(<th key={i} style={{padding:i===0?'10px 8px 10px 16px':'10px 12px',textAlign:'left',fontSize:11,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'.07em',whiteSpace:'nowrap'}}>{h}</th>))}</tr></thead>
          <tbody>{vis.map((item,i)=>{const ec=s.estat[item.status]||s.estat.Archived;const isPinned=pins.includes(item.id);return(
            <tr key={item.id} className="arc-hover-row" style={{borderBottom:i===vis.length-1&&!hasMore?'none':`1px solid ${s.border2}`,cursor:'pointer'}} onClick={()=>onPreview(item)}>
              <td style={{padding:'10px 4px 10px 16px',width:28}} onClick={e=>e.stopPropagation()}><PinBtn pinned={isPinned} onToggle={()=>setPins(p=>isPinned?p.filter(x=>x!==item.id):[...p,item.id])} s={s} size={12}/></td>
              <td style={{padding:'10px 12px',maxWidth:200}}><p style={{fontSize:13,fontWeight:600,color:s.pri,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</p></td>
              <td style={{padding:'10px 12px',maxWidth:160}}><span style={{fontSize:12,color:s.sec,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}}>{item.from}</span></td>
              <td style={{padding:'10px 12px',whiteSpace:'nowrap'}}><Chip label={item.dept} s={s}/></td>
              <td style={{padding:'10px 12px'}}><div style={{display:'flex',gap:4,flexWrap:'wrap'}}>{item.tags.slice(0,2).map(t=>(<span key={t} style={{fontSize:10,color:s.sec,background:s.surf2,border:`1px solid ${s.border2}`,borderRadius:20,padding:'1px 7px'}}>#{t}</span>))}{item.tags.length>2&&<span style={{fontSize:10,color:s.muted}}>+{item.tags.length-2}</span>}</div></td>
              <td style={{padding:'10px 12px',whiteSpace:'nowrap'}}><span style={{fontSize:12,color:s.sec}}>{item.date}</span></td>
              <td style={{padding:'10px 12px',whiteSpace:'nowrap'}}><Pill label={item.status} bg={ec.b} text={ec.t}/></td>
              <td style={{padding:'10px 12px'}} onClick={e=>e.stopPropagation()}><div style={{display:'flex',gap:3}}><ABtn title="View" s={s} hc={s.pri} hb={s.surf3} onClick={()=>onPreview(item)}><Eye size={13}/></ABtn><ABtn title="Unarchive" s={s} hc="#10b981" hb={dark?'rgba(16,185,129,.12)':'#f0fdf4'} onClick={()=>onAction(item)}><RotateCcw size={13}/></ABtn></div></td>
            </tr>
          );})}</tbody>
        </table>
      </div>
      {hasMore&&<ShowMoreBtn showAll={showAll} total={items.length} onToggle={()=>setShowAll(p=>!p)} s={s}/>}
    </div>
  );

  // list (default fallback)
  return(
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {vis.map(item=>{const ec=s.estat[item.status]||s.estat.Archived;const isPinned=pins.includes(item.id);return(
        <div key={item.id} className="arc-card-lift" onClick={()=>onPreview(item)} style={{background:dark?s.surface:'#ffffff',borderRadius:16,boxShadow:dark?'0 2px 12px rgba(0,0,0,0.3)':'0 4px 16px rgba(0,0,0,0.07),0 1px 4px rgba(0,0,0,0.04)',cursor:'pointer',display:'flex',alignItems:'center',gap:10,padding:'12px 14px',overflow:'hidden'}}>
          <div onClick={e=>e.stopPropagation()} style={{flexShrink:0}}><PinBtn pinned={isPinned} onToggle={()=>setPins(p=>isPinned?p.filter(x=>x!==item.id):[...p,item.id])} s={s} size={12}/></div>
          <div style={{width:32,height:32,borderRadius:9,background:dark?'rgba(239,68,68,.12)':'#fff5f5',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#ef4444'}}><Mail size={14}/></div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:13,fontWeight:600,color:s.pri,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title}</p>
            <span style={{fontSize:11,color:s.sec,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}}>{item.from}</span>
          </div>
          <span className="email-col-dept" style={{flexShrink:0}}><Chip label={item.dept} s={s}/></span>
          <span className="email-col-date" style={{fontSize:11,color:s.muted,whiteSpace:'nowrap',flexShrink:0}}>{item.date}</span>
          <span className="email-col-status" style={{flexShrink:0}}><Pill label={item.status} bg={ec.b} text={ec.t}/></span>
          <div className="email-col-act" style={{display:'flex',gap:2,flexShrink:0}} onClick={e=>e.stopPropagation()}>
            <ABtn title="View" s={s} hc={s.pri} hb={s.surf3} onClick={()=>onPreview(item)}><Eye size={13}/></ABtn>
            <ABtn title="Unarchive" s={s} hc="#10b981" hb={dark?'rgba(16,185,129,.12)':'#f0fdf4'} onClick={()=>onAction(item)}><RotateCcw size={13}/></ABtn>
          </div>
        </div>
      );})}
      {hasMore&&<ShowMoreBtn showAll={showAll} total={items.length} onToggle={()=>setShowAll(p=>!p)} s={s}/>}
    </div>
  );
}

/* ════════════════════════════════════════════════
   BUG LIST
════════════════════════════════════════════════ */
function BugList({ items, pins, setPins, view, s, onPreview, onAction }) {
  const [showAll,setShowAll]=useState(false);
  const vis=showAll?items:items.slice(0,LIMIT);const hasMore=items.length>LIMIT;

  if(view==='grid') return(<>
    <div className="bug-grid-container">
      {vis.map(bug=>{const sv=s.sev[bug.severity]||s.sev.Low;return(
        <div key={bug._id} className="arc-card-lift" style={{background:s.dark?s.surface:'#ffffff',borderRadius:28,overflow:'hidden',display:'flex',flexDirection:'column',boxShadow:s.dark?'0 4px 20px rgba(0,0,0,0.3)':'0 12px 40px rgba(0,0,0,0.08),0 2px 8px rgba(0,0,0,0.04)'}}>
          <div style={{height:3,background:sv.t}}/>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'14px 14px 6px'}}>
            <div style={{width:36,height:36,borderRadius:10,background:sv.b,display:'flex',alignItems:'center',justifyContent:'center',color:sv.t}}><Bug size={16}/></div>
            <PinBtn pinned={pins.includes(bug._id)} onToggle={()=>setPins(p=>p.includes(bug._id)?p.filter(x=>x!==bug._id):[...p,bug._id])} s={s}/>
          </div>
          <div style={{padding:'6px 14px 12px',flex:1,display:'flex',flexDirection:'column',gap:7}}>
            <p style={{fontSize:13,fontWeight:600,color:s.pri,lineHeight:1.4,margin:0,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{bug.title}</p>
            <div style={{fontSize:11,color:s.sec}}>{fmtBugId(bug._id,bug.createdAt)}</div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap'}}><Pill label={bug.severity} bg={sv.b} text={sv.t}/><Pill label={bug.status} bg={s.bstat[bug.status]?.b||s.bstat.Closed.b} text={s.bstat[bug.status]?.t||s.bstat.Closed.t} dot/></div>
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 14px',borderTop:`1px solid ${s.border2}`,background:s.surf2}}>
            <span style={{fontSize:11,color:s.muted}}>{fmtDate(bug.archivedAt)}</span>
            <div style={{display:'flex',gap:3}}><ABtn title="View" s={s} hc={s.pri} hb={s.surf3} onClick={()=>onPreview(bug)}><Eye size={13}/></ABtn><ABtn title="Restore" s={s} hc="#10b981" hb="rgba(16,185,129,.12)" onClick={()=>onAction(bug)}><RotateCcw size={13}/></ABtn></div>
          </div>
        </div>
      );})}
    </div>
    {hasMore&&<ShowMoreBtn showAll={showAll} total={items.length} onToggle={()=>setShowAll(p=>!p)} s={s}/>}
  </>);

  // table view (default) — same as original list view but rendered as table
  if(view==='table') return(
    <div style={{background:s.surface,border:`1px solid ${s.border}`,borderRadius:14,overflow:'hidden',boxShadow:s.shadow}}>
      <div className="arc-table-scroll">
        <div className="bug-list-header" style={{background:s.surf2,borderBottom:`1px solid ${s.border}`,fontSize:11,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'.07em'}}>
          <span/><span>Bug Title</span><span className="bug-col-sev">Severity</span><span className="bug-col-stat">Status</span><span className="bug-col-archived">Archived</span><span className="bug-col-act">Act.</span>
        </div>
        {vis.map((bug,i)=>{const sv=s.sev[bug.severity]||s.sev.Low;const bst=s.bstat[bug.status]||s.bstat.Closed;return(
          <div key={bug._id} className="arc-hover-row bug-list-row" style={{borderBottom:i===vis.length-1&&!hasMore?'none':`1px solid ${s.border2}`}}>
            <PinBtn pinned={pins.includes(bug._id)} onToggle={()=>setPins(p=>p.includes(bug._id)?p.filter(x=>x!==bug._id):[...p,bug._id])} s={s} size={12}/>
            <div style={{minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                <div style={{width:23,height:23,borderRadius:7,background:sv.b,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:sv.t}}><Bug size={11}/></div>
                <p style={{fontSize:13,fontWeight:600,color:s.pri,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{bug.title}</p>
              </div>
              <span style={{paddingLeft:31,fontSize:11,color:s.sec}}>{bug.reportedBy?.name} · {fmtBugId(bug._id,bug.createdAt)}</span>
            </div>
            <span className="bug-col-sev"><Pill label={bug.severity} bg={sv.b} text={sv.t}/></span>
            <span className="bug-col-stat"><Pill label={bug.status} bg={bst.b} text={bst.t} dot/></span>
            <div className="bug-col-archived" style={{fontSize:12,color:s.sec}}>{fmtDate(bug.archivedAt)}{bug.archivedBy&&<div style={{fontSize:11,color:s.muted}}>by {bug.archivedBy}</div>}</div>
            <div className="bug-col-act" style={{display:'flex',gap:2}}><ABtn title="View" s={s} hc={s.pri} hb={s.surf3} onClick={()=>onPreview(bug)}><Eye size={13}/></ABtn><ABtn title="Restore" s={s} hc="#10b981" hb="rgba(16,185,129,.12)" onClick={()=>onAction(bug)}><RotateCcw size={13}/></ABtn></div>
          </div>
        );})}
      </div>
      {hasMore&&<ShowMoreBtn showAll={showAll} total={items.length} onToggle={()=>setShowAll(p=>!p)} s={s}/>}
    </div>
  );

  // list view (compact cards)
  return(
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      {vis.map(bug=>{const sv=s.sev[bug.severity]||s.sev.Low;const bst=s.bstat[bug.status]||s.bstat.Closed;return(
        <div key={bug._id} className="arc-card-lift" onClick={()=>onPreview(bug)} style={{background:s.surface,borderRadius:16,boxShadow:s.shadow,cursor:'pointer',display:'flex',alignItems:'center',gap:10,padding:'12px 14px',overflow:'hidden'}}>
          <div onClick={e=>e.stopPropagation()} style={{flexShrink:0}}><PinBtn pinned={pins.includes(bug._id)} onToggle={()=>setPins(p=>p.includes(bug._id)?p.filter(x=>x!==bug._id):[...p,bug._id])} s={s} size={12}/></div>
          <div style={{width:32,height:32,borderRadius:9,background:sv.b,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:sv.t}}><Bug size={14}/></div>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:13,fontWeight:600,color:s.pri,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{bug.title}</p>
            <span style={{fontSize:11,color:s.sec}}>{fmtBugId(bug._id,bug.createdAt)}</span>
          </div>
          <span className="bug-col-sev" style={{flexShrink:0}}><Pill label={bug.severity} bg={sv.b} text={sv.t}/></span>
          <span className="bug-col-stat" style={{flexShrink:0}}><Pill label={bug.status} bg={bst.b} text={bst.t} dot/></span>
          <div style={{display:'flex',gap:2,flexShrink:0}} onClick={e=>e.stopPropagation()}>
            <ABtn title="View" s={s} hc={s.pri} hb={s.surf3} onClick={()=>onPreview(bug)}><Eye size={13}/></ABtn>
            <ABtn title="Restore" s={s} hc="#10b981" hb="rgba(16,185,129,.12)" onClick={()=>onAction(bug)}><RotateCcw size={13}/></ABtn>
          </div>
        </div>
      );})}
      {hasMore&&<ShowMoreBtn showAll={showAll} total={items.length} onToggle={()=>setShowAll(p=>!p)} s={s}/>}
    </div>
  );
}

/* ════════════════════════════════════════════════
   SLIDE-IN MODAL WRAPPER
════════════════════════════════════════════════ */
function SlideinModal({ children, onClose, s, zIndex=1000 }) {
  return (
    <>
      <div className="arc-overlay-bg" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.40)',backdropFilter:'blur(3px)',WebkitBackdropFilter:'blur(3px)',zIndex,pointerEvents:'none'}}/>
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:zIndex+1,pointerEvents:'auto'}}/>
      <div style={{position:'fixed',top:0,right:0,bottom:0,zIndex:zIndex+2,display:'flex',alignItems:'stretch',pointerEvents:'none'}}>
        <div className="arc-modal-anim" onClick={e=>e.stopPropagation()} style={{pointerEvents:'auto',width:420,maxWidth:'100vw',height:'100%',overflowY:'auto',background:'transparent',display:'flex',flexDirection:'column'}}>
          {children}
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════
   EMAIL PREVIEW MODAL
════════════════════════════════════════════════ */
function EmailPreviewModal({ item, s, dark, onClose, onUnarchive }) {
  const ec=s.estat[item.status]||s.estat.Archived;
  const accent='#ef4444';

  const STATUS_ICONS={Resolved:<CheckCircle2 size={12}/>,Closed:<Archive size={12}/>,Superseded:<RefreshCw size={12}/>,Archived:<Archive size={12}/>};

  return (
    <SlideinModal onClose={onClose} s={s}>
      <div style={{flex:1,background:s.surface,display:'flex',flexDirection:'column',height:'100%',boxShadow:'-8px 0 40px rgba(0,0,0,0.18)'}}>
        <div style={{height:4,background:'linear-gradient(90deg,#ef4444 0%,#f97316 50%,#fbbf24 100%)',flexShrink:0}}/>
        <div style={{padding:'20px 22px 16px',borderBottom:`1px solid ${s.border}`,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:14}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:12,minWidth:0,flex:1}}>
              <div style={{width:44,height:44,borderRadius:14,background:dark?'rgba(239,68,68,0.15)':'#fff1f1',border:`1.5px solid ${dark?'rgba(239,68,68,0.3)':'#fecaca'}`,display:'flex',alignItems:'center',justifyContent:'center',color:'#ef4444',flexShrink:0,boxShadow:dark?'0 0 20px rgba(239,68,68,0.2)':'0 4px 12px rgba(239,68,68,0.15)'}}><MailOpen size={20}/></div>
              <div style={{minWidth:0,flex:1}}>
                <div style={{fontSize:11,fontWeight:600,color:accent,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4}}>Archived Email</div>
                <p style={{fontSize:14,fontWeight:700,color:s.pri,margin:0,lineHeight:1.35}}>{item.title}</p>
              </div>
            </div>
            <IBtn onClick={onClose} s={s}><X size={15}/></IBtn>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',background:dark?'rgba(239,68,68,0.12)':'#fff1f1',border:`1px solid ${dark?'rgba(239,68,68,0.25)':'#fecaca'}`,borderRadius:20,fontSize:11,fontWeight:600,color:accent}}><Inbox size={10}/>{item.from}</span>
            <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',background:`${ec.t}15`,border:`1px solid ${ec.t}35`,borderRadius:20,fontSize:11,fontWeight:600,color:ec.t}}>{STATUS_ICONS[item.status]||null}{item.status}</span>
          </div>
        </div>
        <div style={{padding:'16px 22px',borderBottom:`1px solid ${s.border}`,flexShrink:0}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div style={{background:s.surf2,border:`1px solid ${s.border}`,borderRadius:12,padding:'11px 14px',display:'flex',alignItems:'flex-start',gap:9}}>
              <div style={{width:28,height:28,borderRadius:8,background:dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',display:'flex',alignItems:'center',justifyContent:'center',color:s.muted,flexShrink:0}}><Building2 size={13}/></div>
              <div style={{minWidth:0}}><div style={{fontSize:10,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3}}>Department</div><div style={{fontSize:13,fontWeight:600,color:s.pri,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.dept}</div></div>
            </div>
            <div style={{background:s.surf2,border:`1px solid ${s.border}`,borderRadius:12,padding:'11px 14px',display:'flex',alignItems:'flex-start',gap:9}}>
              <div style={{width:28,height:28,borderRadius:8,background:dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',display:'flex',alignItems:'center',justifyContent:'center',color:s.muted,flexShrink:0}}><CalendarDays size={13}/></div>
              <div style={{minWidth:0}}><div style={{fontSize:10,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3}}>Date</div><div style={{fontSize:13,fontWeight:600,color:s.pri}}>{fmtDate(item.date)}</div></div>
            </div>
          </div>
          <div style={{marginTop:10,background:s.surf2,border:`1px solid ${s.border}`,borderRadius:12,padding:'11px 14px',display:'flex',alignItems:'flex-start',gap:9}}>
            <div style={{width:28,height:28,borderRadius:8,background:dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',display:'flex',alignItems:'center',justifyContent:'center',color:s.muted,flexShrink:0}}><Tag size={13}/></div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:10,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6}}>Tags</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:5}}>{item.tags.map(t=>(<span key={t} style={{padding:'3px 10px',background:dark?'rgba(239,68,68,0.1)':'#fff1f1',border:`1px solid ${dark?'rgba(239,68,68,0.2)':'#fecaca'}`,borderRadius:20,fontSize:11,color:accent,fontWeight:500}}>#{t}</span>))}</div>
            </div>
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'18px 22px'}}>
          <div style={{fontSize:11,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:12}}>Email Thread Preview</div>
          <div style={{background:s.surf2,border:`1px solid ${s.border}`,borderRadius:14,padding:'16px 18px'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${s.border}`}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#ef4444,#f97316)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:11,fontWeight:700,flexShrink:0}}>SYS</div>
              <div><div style={{fontSize:12,fontWeight:600,color:s.pri}}>System Archive</div><div style={{fontSize:11,color:s.muted}}>{item.from}</div></div>
            </div>
            <p style={{fontSize:13,color:s.sec,lineHeight:1.75,margin:0,whiteSpace:'pre-line'}}>{`Hi,\n\nThis is an archived email thread:\n"${item.title}"\n\nDepartment: ${item.dept}\nSender: ${item.from}\nDate: ${fmtDate(item.date)}\nStatus: ${item.status}\n\nTags: ${item.tags.map(t=>'#'+t).join(' ')}\n\n— System Archive`}</p>
          </div>
        </div>
        <div style={{padding:'14px 22px 20px',borderTop:`1px solid ${s.border}`,background:s.surf2,flexShrink:0}}>
          <div style={{display:'flex',gap:10}}>
            <button className="arc-btn" onClick={onClose} style={{flex:1,padding:'10px',borderRadius:11,background:'transparent',border:`1.5px solid ${s.border}`,color:s.sec,fontSize:13,fontWeight:600,cursor:'pointer'}}>Close</button>
            <button className="arc-btn" onClick={onUnarchive} style={{flex:2,padding:'10px',borderRadius:11,background:'linear-gradient(135deg,#10b981,#0891b2)',border:'none',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7,boxShadow:'0 4px 14px rgba(16,185,129,0.35)'}}><RotateCcw size={14}/>Unarchive Email</button>
          </div>
        </div>
      </div>
    </SlideinModal>
  );
}

/* ════════════════════════════════════════════════
   BUG PREVIEW MODAL
════════════════════════════════════════════════ */
function BugPreviewModal({ bug, s, dark, onClose, onRestore }) {
  const sv=s.sev[bug.severity]||s.sev.Low;
  const bst=s.bstat[bug.status]||s.bstat.Closed;

  return (
    <SlideinModal onClose={onClose} s={s}>
      <div style={{flex:1,background:s.surface,display:'flex',flexDirection:'column',height:'100%',boxShadow:'-8px 0 40px rgba(0,0,0,0.18)'}}>
        <div style={{height:4,background:`linear-gradient(90deg,${sv.t},${sv.t}88)`,flexShrink:0}}/>
        <div style={{padding:'20px 22px 16px',borderBottom:`1px solid ${s.border}`,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:14}}>
            <div style={{display:'flex',alignItems:'flex-start',gap:12,minWidth:0,flex:1}}>
              <div style={{width:44,height:44,borderRadius:14,background:sv.b,border:`1.5px solid ${sv.t}40`,display:'flex',alignItems:'center',justifyContent:'center',color:sv.t,flexShrink:0,boxShadow:`0 4px 12px ${sv.t}25`}}><Bug size={20}/></div>
              <div style={{minWidth:0,flex:1}}>
                <div style={{fontSize:11,fontWeight:600,color:sv.t,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:4}}>Bug Report</div>
                <p style={{fontSize:14,fontWeight:700,color:s.pri,margin:0,lineHeight:1.35}}>{bug.title}</p>
              </div>
            </div>
            <IBtn onClick={onClose} s={s}><X size={15}/></IBtn>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <Pill label={bug.severity} bg={sv.b} text={sv.t}/>
            <Pill label={bug.status} bg={bst.b} text={bst.t} dot/>
            <span style={{fontSize:11,color:s.muted,marginLeft:'auto',whiteSpace:'nowrap'}}>{fmtBugId(bug._id,bug.createdAt)}</span>
          </div>
        </div>
        <div style={{padding:'16px 22px',borderBottom:`1px solid ${s.border}`,flexShrink:0}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            {[['Reporter',bug.reportedBy?.name||'—',<User size={13}/>],['Email',bug.reportedBy?.email||'—',<Mail size={13}/>],['Category',bug.category||'—',<Tag size={13}/>],['Archived',fmtDate(bug.archivedAt),<CalendarDays size={13}/>]].map(([l,v,icon])=>(
              <div key={l} style={{background:s.surf2,border:`1px solid ${s.border}`,borderRadius:12,padding:'11px 14px',display:'flex',alignItems:'flex-start',gap:9}}>
                <div style={{width:28,height:28,borderRadius:8,background:dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',display:'flex',alignItems:'center',justifyContent:'center',color:s.muted,flexShrink:0}}>{icon}</div>
                <div style={{minWidth:0}}><div style={{fontSize:10,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3}}>{l}</div><div style={{fontSize:12,fontWeight:600,color:s.pri,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'18px 22px'}}>
          {bug.description&&(<><div style={{fontSize:11,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:10}}>Description</div><div style={{background:s.surf2,border:`1px solid ${s.border}`,borderRadius:14,padding:'14px 16px',fontSize:13,color:s.sec,lineHeight:1.75}}>{bug.description.replace(/<[^>]*>/g,' ').slice(0,400)}{bug.description.length>400?'…':''}</div></>)}
          {!bug.description&&<div style={{textAlign:'center',padding:'32px 0',color:s.muted,fontSize:13}}>No description provided.</div>}
        </div>
        <div style={{padding:'14px 22px 20px',borderTop:`1px solid ${s.border}`,background:s.surf2,flexShrink:0}}>
          <div style={{display:'flex',gap:10}}>
            <button className="arc-btn" onClick={onClose} style={{flex:1,padding:'10px',borderRadius:11,background:'transparent',border:`1.5px solid ${s.border}`,color:s.sec,fontSize:13,fontWeight:600,cursor:'pointer'}}>Close</button>
            <button className="arc-btn" onClick={onRestore} style={{flex:2,padding:'10px',borderRadius:11,background:'linear-gradient(135deg,#10b981,#0891b2)',border:'none',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7,boxShadow:'0 4px 14px rgba(16,185,129,0.35)'}}><RotateCcw size={14}/>Restore Bug</button>
          </div>
        </div>
      </div>
    </SlideinModal>
  );
}

/* ════════════════════════════════════════════════
   USER PREVIEW CONTENT
════════════════════════════════════════════════ */
function UserPreviewContent({ user, s, dark, accent, stripe, onClose, onRestore }) {
  return (
    <div style={{flex:1,background:s.surface,display:'flex',flexDirection:'column',height:'100%',boxShadow:'-8px 0 40px rgba(0,0,0,0.18)'}}>
      <div style={{height:4,background:stripe,flexShrink:0}}/>
      <div style={{padding:'22px 22px 16px',borderBottom:`1px solid ${s.border}`,flexShrink:0}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,marginBottom:16}}>
          <div style={{display:'flex',alignItems:'center',gap:14,minWidth:0,flex:1}}>
            <div style={{width:52,height:52,borderRadius:'50%',background:user.color,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:18,flexShrink:0,boxShadow:`0 6px 18px ${user.color}50`}}>{user.initials}</div>
            <div style={{minWidth:0}}>
              <p style={{fontSize:15,fontWeight:700,color:s.pri,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.firstName?`${user.firstName} ${user.surname||''}`.trim():user.name}</p>
              <p style={{fontSize:12,color:s.sec,margin:'3px 0 0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.email}</p>
            </div>
          </div>
          <IBtn onClick={onClose} s={s}><X size={15}/></IBtn>
        </div>
        <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'5px 12px',background:'rgba(180,83,9,0.1)',border:'1px solid rgba(180,83,9,0.25)',borderRadius:20}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:'#b45309'}}/>
          <span style={{fontSize:11,fontWeight:600,color:'#b45309'}}>Archived Account</span>
        </div>
      </div>
      <div style={{padding:'16px 22px',flex:1,overflowY:'auto'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
          {[
            ['Role',user.role||user.dept,<User size={13}/>],
            ['Employee No.',user.employeeNumber||'—',<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="8" x2="10" y2="8"/><line x1="8" y1="16" x2="14" y2="16"/></svg>],
            ['Archived',fmtDate(user.archivedAt||user.updatedAt),<CalendarDays size={13}/>],
            ['Reason',user.reason||user.inactiveReason||'—',<Info size={13}/>],
          ].map(([l,v,icon])=>(
            <div key={l} style={{background:s.surf2,border:`1px solid ${s.border}`,borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'flex-start',gap:9}}>
              <div style={{width:28,height:28,borderRadius:8,background:dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',display:'flex',alignItems:'center',justifyContent:'center',color:s.muted,flexShrink:0}}>{icon}</div>
              <div style={{minWidth:0}}><div style={{fontSize:10,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3}}>{l}</div><div style={{fontSize:13,fontWeight:600,color:s.pri,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v}</div></div>
            </div>
          ))}
        </div>
        {user.archivedBy&&(
          <div style={{marginTop:10,background:s.surf2,border:`1px solid ${s.border}`,borderRadius:12,padding:'12px 14px',display:'flex',alignItems:'flex-start',gap:9}}>
            <div style={{width:28,height:28,borderRadius:8,background:dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',display:'flex',alignItems:'center',justifyContent:'center',color:s.muted,flexShrink:0}}><User size={13}/></div>
            <div style={{minWidth:0}}><div style={{fontSize:10,fontWeight:700,color:s.muted,textTransform:'uppercase',letterSpacing:'.07em',marginBottom:3}}>Archived By</div><div style={{fontSize:13,fontWeight:600,color:s.pri}}>{user.archivedBy}</div></div>
          </div>
        )}
      </div>
      <div style={{padding:'14px 22px 20px',borderTop:`1px solid ${s.border}`,background:s.surf2,flexShrink:0}}>
        <div style={{display:'flex',gap:10}}>
          <button className="arc-btn" onClick={onClose} style={{flex:1,padding:'10px',borderRadius:11,background:'transparent',border:`1.5px solid ${s.border}`,color:s.sec,fontSize:13,fontWeight:600,cursor:'pointer'}}>Close</button>
          {onRestore&&(<button className="arc-btn" onClick={onRestore} style={{flex:2,padding:'10px',borderRadius:11,background:`linear-gradient(135deg,${accent},#2563eb)`,border:'none',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7,boxShadow:`0 4px 14px ${accent}40`}}><RotateCcw size={14}/>Restore User</button>)}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   CONFIRM ACTION MODAL
════════════════════════════════════════════════ */
function ConfirmActionModal({ s, dark, icon, iconColor, iconBg, title, msg, itemIcon, itemTitle, itemSub, actionLabel, actionColor, error, loading, onClose, onConfirm, extraField }) {
  return (
    <>
      <div className="arc-overlay-bg" style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',zIndex:1100,pointerEvents:'none'}}/>
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:1101,pointerEvents:'auto'}}/>
      <div style={{position:'fixed',inset:0,zIndex:1102,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',pointerEvents:'none'}}>
        <div className="arc-modal-anim" onClick={e=>e.stopPropagation()} style={{pointerEvents:'auto',background:s.surface,border:`1px solid ${s.border}`,borderRadius:20,boxShadow:'0 24px 60px rgba(0,0,0,0.25)',width:'100%',maxWidth:400,overflow:'hidden'}}>
          <div style={{height:4,background:`linear-gradient(90deg,${actionColor},${actionColor}88)`}}/>
          <div style={{padding:'20px 22px 0'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:11}}>
                <div style={{width:38,height:38,borderRadius:12,background:iconBg,display:'flex',alignItems:'center',justifyContent:'center',color:iconColor,flexShrink:0}}>{icon}</div>
                <span style={{fontSize:15,fontWeight:700,color:s.pri}}>{title}</span>
              </div>
              <IBtn onClick={onClose} s={s}><X size={15}/></IBtn>
            </div>
            {error&&(<div style={{display:'flex',alignItems:'center',gap:7,padding:'9px 12px',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:10,marginBottom:12,fontSize:12,color:'#dc2626'}}><AlertTriangle size={12}/>{error}</div>)}
            <div style={{background:s.surf2,border:`1px solid ${s.border}`,borderRadius:13,padding:'13px 15px',marginBottom:12}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:12}}>
                <AlertTriangle size={14} style={{color:iconColor,flexShrink:0,marginTop:1}}/>
                <p style={{fontSize:13,color:s.sec,margin:0,lineHeight:1.6}}>{msg}</p>
              </div>
              <div style={{height:1,background:s.border,marginBottom:12}}/>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{width:30,height:30,borderRadius:9,background:s.surf3,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:s.sec}}>{itemIcon}</span>
                <div style={{minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:600,color:s.pri,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{itemTitle}</p>
                  <p style={{fontSize:11,color:s.sec,margin:'2px 0 0'}}>{itemSub}</p>
                </div>
              </div>
            </div>
          </div>
          {extraField&&<div>{extraField}</div>}
          <div style={{display:'flex',gap:10,padding:'4px 22px 20px'}}>
            <button className="arc-btn" onClick={onClose} style={{flex:1,padding:'10px',borderRadius:11,background:'transparent',border:`1.5px solid ${s.border}`,color:s.sec,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
            <button className="arc-btn" onClick={onConfirm} disabled={loading} style={{flex:2,padding:'10px',borderRadius:11,background:`linear-gradient(135deg,${actionColor},${actionColor}cc)`,border:'none',color:'#fff',fontSize:13,fontWeight:600,opacity:loading?.7:1,cursor:loading?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:7,boxShadow:`0 4px 14px ${actionColor}40`}}>
              {loading?<RefreshCw size={13} className="arc-spinning"/>:<RotateCcw size={13}/>}
              {loading?'Processing…':actionLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════
   SHARED ATOMS
════════════════════════════════════════════════ */
function Notice({ accent, s, text }) {
  return(
    <div style={{display:'flex',alignItems:'flex-start',gap:10,padding:'11px 15px',background:`${accent}0f`,border:`1px solid ${accent}30`,borderRadius:11}}>
      <Info size={14} style={{color:accent,flexShrink:0,marginTop:1}}/>
      <p style={{fontSize:12,color:s.sec,margin:0,lineHeight:1.55}}>{text}</p>
    </div>
  );
}

/* ─── SearchRow now accepts optional viewModes prop ─── */
function SearchRow({ search, setSearch, placeholder, accent, s, view, setView, viewModes, right, onRefresh, refreshing }) {
  // Default order when viewModes not provided: Table → Card → List
  const modes = viewModes || [
    {m:'table', label:'Table', icon:<Table2 size={12}/>},
    {m:'grid',  label:'Card',  icon:<LayoutGrid size={12}/>},
    {m:'list',  label:'List',  icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>},
  ];

  return(
    <div className="search-row">
      <div className="search-input-wrap" style={{display:'flex',alignItems:'center',gap:8,background:s.surface,borderRadius:10,padding:'0 12px',height:36,border:`1px solid ${s.border}`,boxShadow:s.shadow}}>
        <Search size={13} style={{color:s.sec,flexShrink:0}}/>
        <input type="text" className="arc-input" placeholder={placeholder} value={search} onChange={e=>setSearch(e.target.value)} style={{background:'none',border:'none',outline:'none',fontSize:12,color:s.pri,fontFamily:F,fontWeight:400,flex:1,width:'100%',minWidth:0}}/>
        {search&&(<button className="arc-icon-btn" onClick={()=>setSearch('')} style={{background:'none',color:s.muted,padding:0,display:'flex',flexShrink:0}}><X size={13}/></button>)}
      </div>
      <div className="filter-group">{right}</div>
      <div className="view-right">
        {onRefresh&&(<button className="arc-icon-btn" onClick={onRefresh} title="Refresh" style={{width:34,height:34,borderRadius:9,background:s.surf2,border:`1px solid ${s.border}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:s.sec,flexShrink:0}}><RefreshCw size={14} style={{animation:refreshing?'arcSpin .8s linear infinite':'none'}}/></button>)}
        {onRefresh&&view!==null&&setView&&<div style={{width:1,height:22,background:s.border,flexShrink:0}}/>}
        {view!==null&&setView&&(
          <div style={{display:'flex',background:s.surf2,border:`1px solid ${s.border}`,borderRadius:10,padding:3,gap:2,boxShadow:s.shadow,flexShrink:0}}>
            {modes.map(({m,label,icon})=>(
              <button key={m} className="arc-btn" onClick={()=>setView(m)} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 10px',borderRadius:8,border:'none',cursor:'pointer',background:view===m?s.surface:'transparent',color:view===m?s.pri:s.muted,boxShadow:view===m?'0 1px 4px rgba(0,0,0,0.1)':'none',fontSize:11,fontWeight:view===m?500:400,whiteSpace:'nowrap'}}>{icon}{label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DropFilter({ label, open, toggle, options, value, onSelect, s, accent, icon, isSort, sortVal, alignRight }) {
  if(isSort) return(
    <button className="arc-btn" onClick={toggle} style={{display:'flex',alignItems:'center',gap:6,height:36,padding:'0 12px',background:s.surface,border:`1px solid ${s.border}`,borderRadius:10,fontSize:12,color:s.sec,whiteSpace:'nowrap',boxShadow:s.shadow,cursor:'pointer',flexShrink:0}}>
      <ArrowUpDown size={12}/>{sortVal==='asc'?'A → Z':'Z → A'}<ChevronDown size={11}/>
    </button>
  );
  return(
    <div style={{position:'relative',flexShrink:0}}>
      <button className="arc-btn" onClick={toggle} style={{display:'flex',alignItems:'center',gap:5,height:36,padding:'0 11px',background:value!=='All'?`${accent}10`:s.surface,border:`1px solid ${value!=='All'?accent:s.border}`,borderRadius:10,fontSize:12,color:value!=='All'?accent:s.sec,whiteSpace:'nowrap',boxShadow:s.shadow,cursor:'pointer'}}>
        {icon&&<span style={{display:'flex',color:value!=='All'?accent:s.sec,flexShrink:0}}>{icon}</span>}
        {value!=='All'&&<span style={{width:7,height:7,borderRadius:'50%',background:accent,flexShrink:0}}/>}
        <span style={{overflow:'hidden',textOverflow:'ellipsis',maxWidth:80}}>{label}</span>
        <ChevronDown size={11} style={{transition:'transform .2s',transform:open?'rotate(180deg)':'none',flexShrink:0}}/>
      </button>
      {open&&(
        <div className={`arc-dropdown${alignRight?' arc-dropdown-right':''}`} style={{position:'absolute',top:'calc(100% + 6px)',left:alignRight?'auto':0,right:alignRight?0:'auto',background:s.surface,border:`1px solid ${s.border}`,borderRadius:12,boxShadow:'0 8px 24px rgba(0,0,0,.15)',zIndex:200,minWidth:160,padding:'6px 0'}}>
          {options.map(opt=>(<button key={opt} className="arc-btn" onClick={()=>onSelect(opt)} style={{width:'100%',padding:'8px 14px',borderRadius:0,fontSize:12,color:value===opt?accent:s.sec,background:value===opt?`${accent}10`:'transparent',border:'none',textAlign:'left',display:'flex',alignItems:'center',gap:8}}>{value===opt&&<span style={{width:7,height:7,borderRadius:'50%',background:accent,flexShrink:0}}/>}{opt}</button>))}
        </div>
      )}
    </div>
  );
}

function Bucket({ title, icon, children, s }) {
  return(
    <div style={{display:'flex',flexDirection:'column',gap:8}}>
      <div style={{display:'flex',alignItems:'center',gap:7}}>
        <span style={{color:s.muted,display:'flex'}}>{icon}</span>
        <span style={{fontSize:13,fontWeight:700,color:s.sec,letterSpacing:'-.01em'}}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function PinBtn({ pinned, onToggle, s, size=13 }) {
  const [h,setH]=useState(false);
  return(<button className="arc-icon-btn" onClick={onToggle} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{display:'flex',alignItems:'center',justifyContent:'center',width:28,height:28,borderRadius:8,background:h?s.surf3:'transparent',color:pinned?'#f59e0b':s.muted}}>{pinned?<Star size={size}/>:<StarOff size={size}/>}</button>);
}

function ABtn({ children, title, hc, hb, s, onClick }) {
  const [h,setH]=useState(false);
  return(<button title={title} className="arc-icon-btn" onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{display:'flex',alignItems:'center',justifyContent:'center',width:28,height:28,borderRadius:8,background:h?hb:'transparent',color:h?hc:s.muted}}>{children}</button>);
}

function IBtn({ children, onClick, s }) {
  const [h,setH]=useState(false);
  return(<button className="arc-icon-btn" onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)} style={{display:'flex',alignItems:'center',justifyContent:'center',width:30,height:30,borderRadius:9,background:h?s.surf3:'transparent',color:s.muted,flexShrink:0}}>{children}</button>);
}

function Pill({ label, bg, text, dot }) {
  return(<span className="arc-pill-truncate" style={{display:'inline-flex',alignItems:'center',gap:dot?4:0,padding:'2px 9px',borderRadius:20,fontSize:11,fontWeight:600,background:bg,color:text,whiteSpace:'nowrap'}}>{dot&&<span style={{width:5,height:5,borderRadius:'50%',background:text,flexShrink:0}}/>}{label}</span>);
}

function Chip({ label, s }) {
  return(<span className="arc-chip" style={{background:s.surf2,border:`1px solid ${s.border2}`,color:s.sec}}>{label}</span>);
}

function ShowMoreBtn({ showAll, total, onToggle, s }) {
  const hidden=total-LIMIT;
  return(<button className="arc-btn" onClick={onToggle} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:5,width:'100%',padding:'10px',background:s.surf2,border:'none',borderTop:`1px solid ${s.border}`,fontSize:12,fontWeight:600,color:s.sec}}>{showAll?<><ChevronUp size={13}/>Show less</>:<><ChevronDown size={13}/>Show {hidden} more</>}</button>);
}

function Empty({ s, icon, msg }) {
  return(<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:10,padding:'48px 20px',background:s.surface,border:`1px solid ${s.border}`,borderRadius:14}}><span style={{color:s.muted,opacity:.35}}>{icon}</span><p style={{fontSize:13,color:s.muted,margin:0,textAlign:'center'}}>{msg}</p></div>);
}

function Spin({ s, accent }) {
  return(<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'48px',color:s.sec,fontSize:13}}><RefreshCw size={17} className="arc-spinning" style={{color:accent}}/>Loading…</div>);
}