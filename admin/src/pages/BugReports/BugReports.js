import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bug, Search, SortAsc, SortDesc, AlertCircle, AlertTriangle, Info, CheckCircle,
  RefreshCw, Plus, Eye, Mail, User, X, Calendar, Clock,
  Tag, Activity, FileText, ChevronDown, Filter, Copy, Check,
  Trash2, ImageOff, ChevronRight, ChevronLeft, TrendingUp, ArrowUpRight,
  Archive, ChevronUp, Paperclip, Send
} from 'lucide-react';
import api from '../../services/api';
import { useNotifAutoOpen } from '../../hooks/useNotifAutoOpen';

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */
const SEVERITY_CONFIG = {
  Critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.10)',  border: 'rgba(220,38,38,0.25)',  icon: AlertCircle,   label: 'Critical' },
  High:     { color: '#ea580c', bg: 'rgba(234,88,12,0.10)',  border: 'rgba(234,88,12,0.25)',  icon: AlertTriangle, label: 'High'     },
  Medium:   { color: '#d97706', bg: 'rgba(217,119,6,0.10)',  border: 'rgba(217,119,6,0.25)',  icon: Info,          label: 'Medium'   },
  Low:      { color: '#16a34a', bg: 'rgba(22,163,74,0.10)',  border: 'rgba(22,163,74,0.25)',  icon: CheckCircle,   label: 'Low'      },
};

const STATUS_CONFIG = {
  'Open':        { color: '#2563eb', bg: 'rgba(37,99,235,0.10)',  border: 'rgba(37,99,235,0.25)'  },
  'In Progress': { color: '#d97706', bg: 'rgba(217,119,6,0.10)',  border: 'rgba(217,119,6,0.25)'  },
  'Resolved':    { color: '#16a34a', bg: 'rgba(22,163,74,0.10)',  border: 'rgba(22,163,74,0.25)'  },
  'Closed':      { color: '#6b7280', bg: 'rgba(107,114,128,0.10)',border: 'rgba(107,114,128,0.25)'},
  'Reopened':    { color: '#7c3aed', bg: 'rgba(124,58,237,0.10)', border: 'rgba(124,58,237,0.25)' },
};

const SOURCE_CONFIG = {
  outlook: { color: '#0078D4', bg: 'rgba(0,120,212,0.10)', border: 'rgba(0,120,212,0.25)', label: 'Outlook' },
  manual:  { color: '#7c3aed', bg: 'rgba(124,58,237,0.10)',border: 'rgba(124,58,237,0.25)', label: 'Manual'  },
};

const SLA_HOURS_MAP   = { Low: 4, Medium: 8, High: 12, Critical: 24 };
const INITIAL_VISIBLE = 5;
const SHOW_MORE_STEP  = 5;

/* ─────────────────────────────────────────────
   useTimer
───────────────────────────────────────────── */
const useTimer = (startedAt, slaHours, severity) => {
  const [display, setDisplay] = React.useState('--:--:--');
  const [phase,   setPhase]   = React.useState('safe');

  React.useEffect(() => {
    if (!startedAt) return;
    const hours  = SLA_HOURS_MAP[severity] || slaHours || 8; // severity map takes priority over stored slaHours
    const SLA_MS = hours * 60 * 60 * 1000;
    const warn50 = SLA_MS * 0.50;
    const warn25 = SLA_MS * 0.25;

    const tick = () => {
      const elapsed = Date.now() - new Date(startedAt).getTime();
      const left    = SLA_MS - elapsed;
      if (left <= 0) {
        const abs = Math.abs(left);
        const oH  = Math.floor(abs / 3600000);
        const oM  = Math.floor((abs % 3600000) / 60000);
        const oS  = Math.floor((abs % 60000) / 1000);
        setDisplay(`+${String(oH).padStart(2,'0')}:${String(oM).padStart(2,'0')}:${String(oS).padStart(2,'0')}`);
        setPhase('overdue');
        return;
      }
      const h = Math.floor(left / 3600000);
      const m = Math.floor((left % 3600000) / 60000);
      const s = Math.floor((left % 60000) / 1000);
      setDisplay(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
      setPhase(left < warn25 ? 'urgent' : left < warn50 ? 'warning' : 'safe');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, slaHours, severity]);

  return { display, phase };
};

/* ─────────────────────────────────────────────
   TimerCell
───────────────────────────────────────────── */
const TimerCell = ({ bug }) => {
  const { display, phase } = useTimer(bug.startedAt, bug.slaHours, bug.severity);

  if (bug.status === 'Closed' && bug.invalidReason)
    return <span style={{ fontSize: '12px', color: '#6b7280' }}>🚫 Invalid</span>;

  if (bug.status === 'Resolved' || (bug.status === 'Closed' && !bug.invalidReason)) {
    const hours      = SLA_HOURS_MAP[bug.severity] || bug.slaHours || 8;
    const deadline   = bug.startedAt ? new Date(bug.startedAt).getTime() + hours * 3600000 : null;
    const resolvedAt = bug.resolvedAt ? new Date(bug.resolvedAt).getTime() : null;
    if (deadline && resolvedAt) {
      const diffMs  = resolvedAt - deadline;
      const onTime  = diffMs <= 0;
      const absDiff = Math.abs(diffMs);
      const dH = Math.floor(absDiff / 3600000);
      const dM = Math.floor((absDiff % 3600000) / 60000);
      const timeStr = dH > 0 ? `${dH}h ${dM}m` : `${dM}m`;
      if (onTime) return (
        <span style={{ display:'inline-flex', flexDirection:'column', alignItems:'flex-start', gap:'1px' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:'#f0fdf4', color:'#15803d', border:'1px solid #bbf7d0', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:700, whiteSpace:'nowrap' }}>Solved · On Time</span>
        </span>
      );
      return (
        <span style={{ display:'inline-flex', flexDirection:'column', alignItems:'flex-start', gap:'1px' }}>
          <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:'#fff7ed', color:'#c2410c', border:'1px solid #fed7aa', borderRadius:'6px', padding:'2px 8px', fontSize:'11px', fontWeight:700, whiteSpace:'nowrap' }}>Solved · Late</span>
        </span>
      );
    }
    return <span style={{ fontSize:'12px', color:'#16a34a' }}>✅ Solved</span>;
  }

  if (bug.status === 'In Progress' && bug.startedAt) {
    const palette = {
      safe:    { bg:'#dbeafe', color:'#1d4ed8', border:'#bfdbfe' },
      warning: { bg:'#ffedd5', color:'#c2410c', border:'#fed7aa' },
      urgent:  { bg:'#fee2e2', color:'#dc2626', border:'#fca5a5' },
      overdue: { bg:'#7f1d1d', color:'#fef2f2', border:'#991b1b' },
    };
    const p     = palette[phase] || palette.safe;
    const pulse = phase === 'urgent' || phase === 'overdue';
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', background:p.bg, color:p.color, border:`1px solid ${p.border}`, borderRadius:'6px', padding:'3px 8px', fontSize:'11px', fontWeight:600, fontFamily:'Courier New, monospace', whiteSpace:'nowrap', animation: pulse ? 'brPulse 1s ease-in-out infinite' : 'none' }}>
        ⏱ {display}
      </span>
    );
  }
  return <span style={{ fontSize:'12px', color:'#9ca3af' }}>—</span>;
};

/* ─────────────────────────────────────────────
   ModalTimer
───────────────────────────────────────────── */
const ModalTimer = ({ bug, dark = false }) => {
  const { display, phase } = useTimer(bug.startedAt, bug.slaHours, bug.severity);
  const hours    = SLA_HOURS_MAP[bug.severity] || bug.slaHours || 8;
  const slaLabel = hours < 24 ? `${hours}-hour SLA` : `${hours}-hour SLA (1 day)`;

  const PALETTES = {
    closed: {
      bg:     dark ? 'rgba(107,114,128,0.12)' : '#f9fafb',
      border: dark ? 'rgba(107,114,128,0.25)' : '#e5e7eb',
      color:  dark ? '#9ca3af'                : '#4b5563',
    },
    onTime: {
      bg:     dark ? 'rgba(22,163,74,0.12)'   : '#f0fdf4',
      border: dark ? 'rgba(22,163,74,0.28)'   : '#bbf7d0',
      color:  dark ? '#4ade80'                : '#15803d',
    },
    late: {
      bg:     dark ? 'rgba(194,65,12,0.12)'   : '#fff7ed',
      border: dark ? 'rgba(194,65,12,0.28)'   : '#fed7aa',
      color:  dark ? '#fb923c'                : '#c2410c',
    },
    safe: {
      bg:     dark ? 'rgba(37,99,235,0.12)'   : '#eff6ff',
      border: dark ? 'rgba(37,99,235,0.28)'   : '#bfdbfe',
      color:  dark ? '#60a5fa'                : '#1d4ed8',
      label:  'On Track',
    },
    warning: {
      bg:     dark ? 'rgba(194,65,12,0.12)'   : '#fff7ed',
      border: dark ? 'rgba(194,65,12,0.28)'   : '#fed7aa',
      color:  dark ? '#fb923c'                : '#c2410c',
      label:  'Warning',
    },
    urgent: {
      bg:     dark ? 'rgba(220,38,38,0.15)'   : '#fef2f2',
      border: dark ? 'rgba(220,38,38,0.30)'   : '#fca5a5',
      color:  dark ? '#f87171'                : '#dc2626',
      label:  'Critical',
    },
    overdue: {
      bg:     dark ? 'rgba(127,29,29,0.55)'   : '#7f1d1d',
      border: dark ? '#991b1b'                : '#991b1b',
      color:  dark ? '#fecaca'                : '#fee2e2',
      label:  'OVERDUE',
    },
  };

  if (bug.status === 'Closed' && bug.invalidReason) {
    const p = PALETTES.closed;
    return (
      <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 14px', borderRadius:'10px', margin:'12px 0', background:p.bg, border:`1px solid ${p.border}`, color:p.color, fontSize:'13px', fontWeight:500 }}>
        <div style={{ width:32, height:32, borderRadius:'8px', background: dark ? 'rgba(107,114,128,0.18)' : '#e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <X size={16} color={p.color} />
        </div>
        <div><span style={{ fontWeight:700, display:'block' }}>Closed as Invalid</span><span style={{ fontSize:'12px', opacity:0.8 }}>{bug.invalidReason}</span></div>
      </div>
    );
  }

  if (bug.status === 'Resolved') {
    const deadline   = bug.startedAt ? new Date(bug.startedAt).getTime() + hours * 3600000 : null;
    const resolvedAt = bug.resolvedAt ? new Date(bug.resolvedAt).getTime() : null;
    let onTime = null, diffLabel = '';
    if (deadline && resolvedAt) {
      const diffMs = resolvedAt - deadline;
      onTime = diffMs <= 0;
      const absDiff = Math.abs(diffMs);
      const dH = Math.floor(absDiff / 3600000);
      const dM = Math.floor((absDiff % 3600000) / 60000);
      diffLabel = dH > 0 ? `${dH}h ${dM}m` : `${dM}m`;
    }
    const p     = onTime === false ? PALETTES.late : PALETTES.onTime;
    const Icon  = onTime === false ? AlertTriangle : CheckCircle;
    return (
      <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'12px 16px', borderRadius:'10px', margin:'12px 0', background:p.bg, border:`1px solid ${p.border}`, color:p.color, fontSize:'13px', fontWeight:500 }}>
        <div style={{ width:32, height:32, borderRadius:'8px', background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={16} color={p.color} />
        </div>
        <div style={{ flex:1 }}>
          <span style={{ fontWeight:700, fontSize:'13px', display:'block' }}>{onTime === false ? 'Solved — Late' : onTime === true ? 'Solved — On Time' : 'Resolved'} · {slaLabel}</span>
          {bug.resolvedAt && <span style={{ fontSize:'11px', opacity:0.8 }}>Solved on {new Date(bug.resolvedAt).toLocaleString()}{diffLabel && onTime !== null && <> · <strong>{onTime ? `${diffLabel} early` : `${diffLabel} past deadline`}</strong></>}</span>}
        </div>
      </div>
    );
  }

  if (bug.status === 'In Progress' && bug.startedAt) {
    const cfg   = PALETTES[phase] || PALETTES.safe;
    const pulse = phase === 'urgent' || phase === 'overdue';
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderRadius:'10px', margin:'12px 0', background:cfg.bg, border:`1px solid ${cfg.border}`, color:cfg.color, animation: pulse ? 'brPulse 1s ease-in-out infinite' : 'none', gap:'12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:32, height:32, borderRadius:'8px', background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Clock size={16} color={cfg.color} />
          </div>
          <div>
            <span style={{ fontWeight:700, fontSize:'13px', display:'block' }}>{cfg.label} · {slaLabel}</span>
            <span style={{ fontSize:'11px', opacity:0.75 }}>Started: {new Date(bug.startedAt).toLocaleString()}</span>
          </div>
        </div>
        <span style={{ fontFamily:'Courier New, monospace', fontSize:'22px', fontWeight:800, letterSpacing:'1px', flexShrink:0 }}>{display}</span>
      </div>
    );
  }
  return null;
};

/* ─────────────────────────────────────────────
   DARK MODE HELPER
───────────────────────────────────────────── */
const getDarkModeFromStorage = () => {
  const stored = localStorage.getItem('darkMode');
  if (stored !== null) return stored === 'true';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
};

const makeStyles = (dark) => {
  const bg        = dark ? '#0c0b0b'  : '#f8fafc';
  const surface   = dark ? '#1a1d27'  : '#ffffff';
  const surface2  = dark ? '#22263a'  : '#f9fafb';
  const border    = dark ? '#2e3347'  : '#e5e7eb';
  const border2   = dark ? '#252840'  : '#f3f4f6';
  const textPri   = dark ? '#e2e8f0'  : '#454545';
  const textSec   = dark ? '#94a3b8'  : '#9ca3af';
  const textMuted = dark ? '#64748b'  : '#b0a0a0';
  const shadow    = dark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)';
  return { bg, surface, surface2, border, border2, textPri, textSec, textMuted, shadow };
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const sanitizeHtml = (html) => {
  if (!html) return '';
  if (!/<[a-z][\s\S]*>/i.test(html)) return html.replace(/\n/g, '<br/>');
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/\s+on\w+="[^"]*"/gi, '')
    .replace(/\s+on\w+='[^']*'/gi, '')
    .replace(/href="javascript:[^"]*"/gi, '')
    .replace(/<img[^>]*cid:[^>]*>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<hr[^>]*>/gi, '<div class="br-html-divider"></div>')
    .replace(/(<p[^>]*>\s*(&nbsp;|\s)*\s*<\/p>)/gi, '')
    .replace(/(\s*style="[^"]*(?:color|background-color|font-family|font-size)[^"]*")/gi, '')
    .replace(/\s*style="\s*"/gi, '').trim();
};

const getScreenshotUrl = (s) => {
  if (!s) return null;
  if (typeof s === 'string') return s;
  if (typeof s === 'object' && s.url) return s.url;
  return null;
};

const getBugSource = (bug) => {
  if (!bug) return 'manual';
  return bug.source || (bug.emailId ? 'outlook' : 'manual');
};

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════ */
const BugReports = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [bugs,           setBugs]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [totalCount,     setTotalCount]     = useState(0);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter,   setStatusFilter]   = useState('All');
  const [sortOrder,      setSortOrder]      = useState('newest');
  const [dateFrom,       setDateFrom]       = useState('');
  const [dateTo,         setDateTo]         = useState('');
  const [severityOpen,   setSeverityOpen]   = useState(false);
  const [statusOpen,     setStatusOpen]     = useState(false);
  const [sortOpen,       setSortOpen]       = useState(false);
  const [currentPage,    setCurrentPage]    = useState(1);
  const [totalPages,     setTotalPages]     = useState(1);
  const [pageInputValue, setPageInputValue] = useState('1');
  const ITEMS_PER_PAGE = 20;

  const [visibleCount,       setVisibleCount]       = useState(INITIAL_VISIBLE);
  const [newlyRevealedStart, setNewlyRevealedStart] = useState(null);

  const [selectedBug,    setSelectedBug]    = useState(null);
  const [modalLoading,   setModalLoading]   = useState(false);
  const [modalOpen,      setModalOpen]      = useState(false);
  const [lightboxSrc,    setLightboxSrc]    = useState(null);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [actionError,    setActionError]    = useState('');
  const [copiedId,       setCopiedId]       = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [solveConfirm,   setSolveConfirm]   = useState(false);

  // ── Solve email compose ────────────────────────────────────
  const [solveCompose,      setSolveCompose]      = useState(false);
  const solveEmailBodyRef   = useRef('');
  const [solveEmailBody,    setSolveEmailBody]    = useState('');
  const [solveBodyFilled,   setSolveBodyFilled]   = useState(false);
  const [solveAttachments,  setSolveAttachments]  = useState([]);
  const [attachUploading,   setAttachUploading]   = useState(false);
  const [outlookConnected,  setOutlookConnected]  = useState(false);
  const [outlookChecked,    setOutlookChecked]    = useState(false);
  const [viewMode,       setViewMode]       = useState('table');

  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage);
  const T = makeStyles(darkMode);

  useEffect(() => {
    const handler = (e) => setDarkMode(e.detail.darkMode);
    window.addEventListener('darkModeChange', handler);
    return () => window.removeEventListener('darkModeChange', handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem('darkMode');
      if (stored !== null) { const val = stored === 'true'; setDarkMode(prev => prev !== val ? val : prev); }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q) setSearchQuery(q);
  }, [location.search]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (lightboxSrc)    { setLightboxSrc(null); return; }
        if (solveConfirm)   { setSolveConfirm(false); return; }
        if (solveCompose)   { setSolveCompose(false); return; }
        if (archiveConfirm) { setArchiveConfirm(false); return; }
        closeModal();
        setSeverityOpen(false); setStatusOpen(false); setSortOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [archiveConfirm, solveConfirm, lightboxSrc]);

  useEffect(() => {
    document.body.style.overflow = (modalOpen || lightboxSrc) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen, lightboxSrc]);

  useEffect(() => {
    const handleClick = (e) => {
      if (!e.target.closest('.br-filter-dd')) { setSeverityOpen(false); setStatusOpen(false); setSortOpen(false); }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setPageInputValue(String(currentPage)); }, [currentPage]);

  const fetchBugs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page',      currentPage);
      params.set('limit',     ITEMS_PER_PAGE);
      params.set('sortBy',    'createdAt');
      params.set('sortOrder', sortOrder === 'newest' ? 'desc' : 'asc');
      if (searchQuery.trim())       params.set('search',   searchQuery.trim());
      if (severityFilter !== 'All') params.set('severity', severityFilter);
      if (statusFilter   !== 'All') params.set('status',   statusFilter);
      if (dateFrom)                 params.set('dateFrom', dateFrom);
      if (dateTo)                   params.set('dateTo',   dateTo);
      const res = await api.get(`/bugs?${params.toString()}`);
      setBugs(res.data.bugs || []);
      const total = res.data.total ?? res.data.pagination?.total ?? 0;
      setTotalCount(total);
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));
    } catch (err) {
      console.error('Error fetching bugs:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, severityFilter, statusFilter, sortOrder, dateFrom, dateTo]);

  useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(INITIAL_VISIBLE);
    setNewlyRevealedStart(null);
  }, [searchQuery, severityFilter, statusFilter, sortOrder, dateFrom, dateTo]);

  useEffect(() => { fetchBugs(); }, [fetchBugs]);

  useNotifAutoOpen((bugId) => {
    openBugModal(bugId);
  });

  const visibleBugs = bugs.slice(0, visibleCount);
  const hasMore     = visibleCount < bugs.length || currentPage < totalPages;
  const remaining   = totalCount - visibleCount;

  const handleShowMore = async () => {
    const prevVisible = visibleCount;
    const nextVisible = visibleCount + SHOW_MORE_STEP;
    setNewlyRevealedStart(prevVisible);

    if (nextVisible <= bugs.length) {
      setVisibleCount(nextVisible);
    } else if (currentPage < totalPages) {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set('page',      currentPage + 1);
        params.set('limit',     ITEMS_PER_PAGE);
        params.set('sortBy',    'createdAt');
        params.set('sortOrder', sortOrder === 'newest' ? 'desc' : 'asc');
        if (searchQuery.trim())       params.set('search',   searchQuery.trim());
        if (severityFilter !== 'All') params.set('severity', severityFilter);
        if (statusFilter   !== 'All') params.set('status',   statusFilter);
        if (dateFrom)                 params.set('dateFrom', dateFrom);
        if (dateTo)                   params.set('dateTo',   dateTo);
        const res = await api.get(`/bugs?${params.toString()}`);
        const newBugs = res.data.bugs || [];
        setBugs(prev => [...prev, ...newBugs]);
        setCurrentPage(p => p + 1);
        setVisibleCount(nextVisible);
      } catch (err) {
        console.error('Error fetching more bugs:', err);
      } finally {
        setLoading(false);
      }
    } else {
      setVisibleCount(nextVisible);
    }
    setTimeout(() => setNewlyRevealedStart(null), 600);
  };

  const handleShowLess = () => { setVisibleCount(INITIAL_VISIBLE); setNewlyRevealedStart(null); };

  const openBugModal = async (bugId) => {
    setSolveCompose(false); setSolveEmailBody(''); solveEmailBodyRef.current = ''; setSolveAttachments([]); setSolveBodyFilled(false);
    setOutlookChecked(false);
    setModalOpen(true); setModalLoading(true); setSelectedBug(null);
    try {
      const res = await api.get(`/bugs/${bugId}`);
      setSelectedBug(res.data);
    } catch {
      setSelectedBug(bugs.find(b => b._id === bugId) || null);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false); setSelectedBug(null); setLightboxSrc(null);
    setActionError(''); setArchiveConfirm(false); setSolveConfirm(false);
    setSolveCompose(false); setSolveEmailBody(''); solveEmailBodyRef.current = ''; setSolveAttachments([]); setSolveBodyFilled(false);
    setOutlookChecked(false);
  };

  const handleArchive = async () => {
    if (!selectedBug || actionLoading) return;
    setActionLoading(true); setActionError('');
    try {
      await api.patch(`/bugs/${selectedBug._id}/archive`);
      setBugs(prev => prev.filter(b => b._id !== selectedBug._id));
      setTotalCount(prev => prev - 1);
      closeModal();
    } catch {
      try {
        await api.delete(`/bugs/${selectedBug._id}`);
        setBugs(prev => prev.filter(b => b._id !== selectedBug._id));
        setTotalCount(prev => prev - 1);
        closeModal();
      } catch {
        setActionError('Failed to archive bug. Please try again.');
        setArchiveConfirm(false);
      }
    } finally { setActionLoading(false); }
  };

  const handleMarkSolved = async () => {
    if (!selectedBug || actionLoading) return;
    setActionLoading(true); setActionError('');
    try {
      if (outlookConnected && selectedBug.reportedBy?.email && solveEmailBodyRef.current.trim()) {
        try {
          const formatBugIdLocal = (id, createdAt) => {
            if (!id) return '—';
            const d = createdAt ? new Date(createdAt) : new Date();
            return `BUG-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}-${id.slice(-3).toUpperCase()}`;
          };
          const bugId = formatBugIdLocal(selectedBug._id, selectedBug.createdAt);
          const emailHtml = `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#1f2937;">
  <div style="background:#a10304;padding:24px 32px;border-radius:8px 8px 0 0;">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">TelexPH Bug Reporting System</p>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:12px;">Bug Resolution Notice</p>
  </div>
  <div style="padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;background:#fff;">
    <p style="margin:0 0 6px;font-size:15px;">Good day <strong>${selectedBug.reportedBy?.name || 'there'}</strong>,</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#374151;">
      We are pleased to inform you that your reported bug has been resolved.
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px;">
        <span style="font-size:13px;color:#6b7280;font-weight:600;min-width:110px;">Bug ID</span>
        <span style="font-size:13px;color:#111827;font-weight:700;">${bugId}</span>
      </div>
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px;">
        <span style="font-size:13px;color:#6b7280;font-weight:600;min-width:110px;">Title</span>
        <span style="font-size:13px;color:#111827;">${selectedBug.title}</span>
      </div>
      <div style="display:flex;align-items:baseline;gap:8px;">
        <span style="font-size:13px;color:#6b7280;font-weight:600;min-width:110px;">Status</span>
        <span style="display:inline-block;background:rgba(22,163,74,0.1);color:#16a34a;font-size:12px;font-weight:700;padding:2px 12px;border-radius:999px;">Resolved</span>
      </div>
    </div>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#15803d;">Resolution Details</p>
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;">${solveEmailBodyRef.current.replace(/\n/g,'<br/>')}</p>
    </div>
    <p style="margin:0 0 4px;font-size:14px;color:#374151;">Thank you for your cooperation.</p>
  </div>
  <div style="padding:14px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">This is an automated notice from the TelexPH Bug Reporting System.</p>
  </div>
</div>`;
          await api.post('/outlook/send', {
            subject:      `[Bug Resolved] ${selectedBug.title}`,
            body:         emailHtml,
            toRecipients: [selectedBug.reportedBy.email],
            attachments:  solveAttachments.map(a => ({ name: a.name, contentType: a.contentType, base64: a.base64 })),
          });
        } catch (emailErr) {
          console.error('Resolution email failed:', emailErr.response?.data || emailErr.message);
          setActionError(`Bug marked as solved but email failed to send: ${emailErr.response?.data?.message || emailErr.message}`);
        }
      }

      const res = await api.put(`/bugs/${selectedBug._id}`, { status: 'Resolved', resolvedAt: new Date().toISOString() });
      const updated = res.data.bug || res.data;
      setSelectedBug(updated);
      setBugs(prev => prev.map(b => b._id === updated._id ? updated : b));
      setSolveConfirm(false);
      setSolveCompose(false);
      setSolveEmailBody('');
      solveEmailBodyRef.current = '';
      setSolveBodyFilled(false);
      setSolveAttachments([]);
    } catch {
      setActionError('Failed to mark as solved. Please try again.');
      setSolveConfirm(false);
    } finally { setActionLoading(false); }
  };

  useEffect(() => {
    if (!modalOpen || outlookChecked) return;
    api.get('/outlook/status')
      .then(r => { setOutlookConnected(r.data.connected); setOutlookChecked(true); })
      .catch(() => { setOutlookConnected(false); setOutlookChecked(true); });
  }, [modalOpen, outlookChecked]);

  /* ─────────────────────────────────────────────
     PATCHED: handleSolveAttach — docs & PDF only
  ───────────────────────────────────────────── */
  const handleSolveAttach = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // ── Allowed MIME types ──
    const ALLOWED_TYPES = [
      'application/pdf',
      'application/msword',
    ];
    // Fallback extension check (some browsers report empty MIME for Office files)
    const ALLOWED_EXTS = /\.(pdf|doc|docx)$/i;

    const invalid = files.filter(f => !ALLOWED_TYPES.includes(f.type) && !ALLOWED_EXTS.test(f.name));
    if (invalid.length > 0) {
      alert(
        `Only document and PDF files are allowed.\nRejected: ${invalid.map(f => f.name).join(', ')}`
      );
      e.target.value = '';
      return;
    }

    setAttachUploading(true);
    const results = await Promise.all(files.map(file => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve({
        name:        file.name,
        contentType: file.type || 'application/octet-stream',
        size:        file.size,
        base64:      ev.target.result.split(',')[1],
      });
      reader.readAsDataURL(file);
    })));
    setSolveAttachments(prev => [...prev, ...results]);
    setAttachUploading(false);
    e.target.value = '';
  };

  const handleCopyId = (id, createdAt) => {
    navigator.clipboard.writeText(formatBugId(id, createdAt)).then(() => {
      setCopiedId(true); setTimeout(() => setCopiedId(false), 2000);
    });
  };

  const handlePageInputChange  = (e) => setPageInputValue(e.target.value);
  const handlePageInputBlur    = () => {
    const parsed = parseInt(pageInputValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) setCurrentPage(parsed);
    else setPageInputValue(String(currentPage));
  };
  const handlePageInputKeyDown = (e) => { if (e.key === 'Enter') e.target.blur(); };

  const clearSearch = () => { setSearchQuery(''); navigate('/admin/bug-reports'); };
  const clearAll    = () => { clearSearch(); setSeverityFilter('All'); setStatusFilter('All'); setDateFrom(''); setDateTo(''); };
  const hasActiveFilters = searchQuery || severityFilter !== 'All' || statusFilter !== 'All' || dateFrom || dateTo;

  const formatDateRange = () => {
    if (!dateFrom && !dateTo) return 'Date Range';
    const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    if (dateFrom && dateTo) return `${fmt(dateFrom)} – ${fmt(dateTo)}`;
    if (dateFrom) return `From ${fmt(dateFrom)}`;
    return `Until ${fmt(dateTo)}`;
  };

  const formatDateTime = (ds) => {
    if (!ds) return '—';
    const d = new Date(ds);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const formatBugId = (id, createdAt) => {
    if (!id) return '—';
    const d = createdAt ? new Date(createdAt) : new Date();
    return `BUG-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${id.slice(-3).toUpperCase()}`;
  };

  const getSevDotColor = (s) => ({ Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#22c55e' })[s] || '#d1d5db';

  const openCount       = bugs.filter(b => b.status === 'Open').length;
  const criticalCount   = bugs.filter(b => b.severity === 'Critical').length;
  const inProgressCount = bugs.filter(b => b.status === 'In Progress').length;

  const font = (size = 13, weight = 400, color = T.textPri) => ({
    fontFamily: "'Poppins', sans-serif", fontSize: `${size}px`, fontWeight: weight, color,
  });

  /* ── Badge Components ── */
  const SeverityBadge = ({ severity, large }) => {
    const cfg = SEVERITY_CONFIG[severity] || {};
    const Icon = cfg.icon || Bug;
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize: large ? '12px' : '11px', fontWeight:500, color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}`, padding: large ? '3px 10px' : '2px 8px', borderRadius:'5px', whiteSpace:'nowrap', fontFamily:"'Poppins', sans-serif" }}>
        <Icon size={large ? 12 : 10} />{severity}
      </span>
    );
  };

  const StatusBadge = ({ status, large }) => {
    const cfg = STATUS_CONFIG[status] || {};
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize: large ? '12px' : '11px', fontWeight:500, color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}`, padding: large ? '3px 10px' : '2px 8px', borderRadius:'5px', whiteSpace:'nowrap', fontFamily:"'Poppins', sans-serif" }}>
        <span style={{ width:6, height:6, borderRadius:'50%', background:cfg.color, flexShrink:0 }} />{status}
      </span>
    );
  };

  const SourceBadge = ({ source }) => {
    const cfg  = SOURCE_CONFIG[source] || SOURCE_CONFIG.manual;
    const Icon = source === 'outlook' ? Mail : Bug;
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontSize:'11px', fontWeight:500, color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}`, padding:'2px 8px', borderRadius:'5px', whiteSpace:'nowrap', fontFamily:"'Poppins', sans-serif" }}>
        <Icon size={10} />{cfg.label}
      </span>
    );
  };

  const FilterBtn = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{ display:'flex', alignItems:'center', gap:'5px', background: active ? (darkMode ? 'rgba(185,28,28,0.15)' : '#fff0f0') : T.surface, border:`1px solid ${active ? '#b91c1c' : T.border}`, borderRadius:'10px', padding:'0 12px', height:'36px', fontFamily:"'Poppins', sans-serif", fontSize:'12px', fontWeight:400, color: active ? '#b91c1c' : T.textSec, cursor:'pointer', whiteSpace:'nowrap', boxShadow:T.shadow, transition:'all 0.15s' }}>
      {children}
    </button>
  );

  const DropdownMenu = ({ items, onSelect, selected, right }) => (
    <div style={{ position:'absolute', top:'calc(100% + 6px)', [right ? 'right' : 'left']:0, zIndex:300, background:T.surface, border:`1px solid ${T.border}`, borderRadius:'12px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', minWidth:'160px', overflow:'hidden', animation:'brDropIn 0.14s ease' }}>
      {items.map((item, i) => (
        <button key={i} onClick={() => onSelect(item.value)} style={{ display:'flex', alignItems:'center', gap:'8px', width:'100%', padding:'9px 14px', background: item.value === selected ? (darkMode ? 'rgba(185,28,28,0.12)' : '#fff0f0') : 'none', border:'none', cursor:'pointer', textAlign:'left', fontFamily:"'Poppins', sans-serif", fontSize:'12px', fontWeight:400, color: item.value === selected ? '#b91c1c' : T.textSec, transition:'background 0.12s' }}>
          {item.icon && item.icon}{item.label}
        </button>
      ))}
    </div>
  );

  /* ════════════════════════════════════════
     SHOW MORE FOOTER
  ════════════════════════════════════════ */
  const ShowMoreFooter = () => {
    if (bugs.length === 0 || (loading && visibleBugs.length === 0)) return null;

    const moreCount    = Math.min(SHOW_MORE_STEP, remaining);
    const showShowMore = hasMore;
    const showShowLess = visibleCount > INITIAL_VISIBLE;

    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'0' }}>
        {showShowMore && (
          <button
            onClick={handleShowMore}
            disabled={loading}
            style={{ display:'flex', alignItems:'center', gap:'7px', width:'100%', padding:'11px 20px', background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border:'none', borderTop:`1px solid ${T.border2}`, borderBottomLeftRadius:'20px', borderBottomRightRadius:'20px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily:"'Poppins', sans-serif", fontSize:'12px', fontWeight:500, color:T.textSec, transition:'all 0.15s', justifyContent:'center', opacity: loading ? 0.6 : 1 }}
            onMouseEnter={e => { e.currentTarget.style.background = darkMode ? 'rgba(185,28,28,0.08)' : 'rgba(185,28,28,0.04)'; e.currentTarget.style.color = '#b91c1c'; }}
            onMouseLeave={e => { e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; e.currentTarget.style.color = T.textSec; }}
          >
            {loading ? (
              <><span style={{ width:'12px', height:'12px', borderRadius:'50%', border:'2px solid rgba(185,28,28,0.3)', borderTopColor:'#bb0000', animation:'brSpin 0.7s linear infinite', display:'inline-block', flexShrink:0 }} />Loading…</>
            ) : (
              <>
                <ChevronDown size={14} style={{ flexShrink:0 }} />
                Show {moreCount > 0 ? moreCount : ''} more bug{moreCount !== 1 ? 's' : ''}
                {showShowLess && (
                  <span
                    onClick={e => { e.stopPropagation(); handleShowLess(); }}
                    style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'4px', fontSize:'11px', color:T.textMuted, fontWeight:400, padding:'2px 8px', borderRadius:'6px', background: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}
                    onMouseEnter={e => e.currentTarget.style.color = T.textSec}
                    onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
                  >
                    <ChevronUp size={11} /> Collapse
                  </span>
                )}
              </>
            )}
          </button>
        )}
        {!showShowMore && showShowLess && (
          <button
            onClick={handleShowLess}
            style={{ display:'flex', alignItems:'center', gap:'7px', width:'100%', padding:'11px 20px', background: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border:'none', borderTop:`1px solid ${T.border2}`, borderBottomLeftRadius:'20px', borderBottomRightRadius:'20px', cursor:'pointer', fontFamily:"'Poppins', sans-serif", fontSize:'12px', fontWeight:500, color:T.textSec, transition:'all 0.15s', justifyContent:'center' }}
            onMouseEnter={e => { e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'; }}
          >
            <ChevronUp size={14} style={{ flexShrink:0 }} /> Show less
          </button>
        )}
      </div>
    );
  };

  /* ════════════════════════════════════════
     CONTENT VIEWS
  ════════════════════════════════════════ */
  const renderContent = () => {
    if (loading && bugs.length === 0) return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'16px', padding:'64px', background:T.surface, borderRadius:'20px', boxShadow:T.shadow, border: darkMode ? `1px solid ${T.border}` : 'none' }}>
        <div style={{ width:'36px', height:'36px', borderRadius:'50%', border:`3px solid ${T.border}`, borderTopColor:'#bb0000', animation:'brSpin 0.7s linear infinite' }} />
        <p style={{ ...font(13, 400, T.textSec), margin:0 }}>Loading bugs…</p>
      </div>
    );

    if (bugs.length === 0) return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', padding:'64px', textAlign:'center', background:T.surface, borderRadius:'20px', boxShadow:T.shadow, border: darkMode ? `1px solid ${T.border}` : 'none' }}>
        <Bug size={44} style={{ color:T.textMuted, opacity:0.35 }} />
        <h3 style={{ ...font(15, 600, T.textPri), margin:0 }}>No bugs found</h3>
        <p style={{ ...font(13, 400, T.textSec), margin:0 }}>{hasActiveFilters ? 'Try adjusting your filters or search.' : 'No bugs have been reported yet.'}</p>
        {hasActiveFilters && <button onClick={clearAll} style={{ background:'none', border:`1px solid ${T.border}`, borderRadius:'8px', padding:'7px 16px', cursor:'pointer', ...font(12, 400, T.textSec), marginTop:'4px' }}>Clear Filters</button>}
      </div>
    );

    if (viewMode === 'table') return (
      <div style={{ background:T.surface, borderRadius:'20px', boxShadow:T.shadow, border: darkMode ? `1px solid ${T.border}` : 'none', overflow:'hidden' }}>
        <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:'640px' }}>
            <thead>
              <tr style={{ background:T.surface2, borderBottom:`1px solid ${T.border}` }}>
                {['Bug','Timer','Severity','Status','Source','Reporter','Action'].map(h => (
                  <th key={h} style={{ padding:'11px 16px', textAlign:'left', ...font(11, 600, T.textMuted), textTransform:'uppercase', letterSpacing:'0.05em', whiteSpace:'nowrap', background:T.surface2 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleBugs.map((bug, idx) => {
                const isNew = newlyRevealedStart !== null && idx >= newlyRevealedStart;
                return (
                  <tr key={bug._id} className="br-table-row" style={{
                    borderBottom: idx === visibleBugs.length - 1 ? 'none' : `1px solid ${T.border2}`,
                    transition:'background 0.12s',
                    animation: isNew
                      ? `brSlideReveal 0.35s cubic-bezier(0.16,1,0.3,1) ${(idx - newlyRevealedStart) * 0.06}s both`
                      : `brFadeRow 0.3s ease ${idx * 0.03}s both`,
                  }}>
                    <td style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:'3px', height:'36px', borderRadius:'2px', flexShrink:0, background:getSevDotColor(bug.severity) }} />
                        <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                          <span style={{ ...font(13, 500, T.textPri), lineHeight:1.3 }}>{bug.title}</span>
                          {bug.description && <span style={{ ...font(11, 400, T.textSec), lineHeight:1.4 }}>{bug.description.replace(/<[^>]*>/g, '').slice(0, 70)}{bug.description.length > 70 ? '…' : ''}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="br-col-timer" style={{ padding:'13px 16px', whiteSpace:'nowrap' }}><TimerCell bug={bug} /></td>
                    <td style={{ padding:'13px 16px' }}><SeverityBadge severity={bug.severity} /></td>
                    <td style={{ padding:'13px 16px' }}><StatusBadge status={bug.status} /></td>
                    <td className="br-col-source" style={{ padding:'13px 16px' }}><SourceBadge source={getBugSource(bug)} /></td>
                    <td className="br-col-reporter" style={{ padding:'13px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px', ...font(12, 400, T.textSec) }}>
                        <User size={12} />{bug.reportedBy?.name || '—'}
                      </div>
                    </td>
                    <td style={{ padding:'13px 16px' }}>
                      <button onClick={() => openBugModal(bug._id)} className="br-view-row-btn" style={{ display:'flex', alignItems:'center', gap:'5px', background: darkMode ? 'rgba(185,28,28,0.12)' : '#fff0f0', border:'1px solid rgba(185,28,28,0.3)', borderRadius:'8px', padding:'5px 11px', cursor:'pointer', transition:'all 0.12s', ...font(12, 500, darkMode ? '#ffffff' : '#b91c1c') }}>
                        <Eye size={12} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {bugs.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 20px 0 20px' }}>
            <span style={{ ...font(11, 400, T.textMuted) }}>
              Showing <strong style={{ color:T.textSec, fontWeight:600 }}>{visibleBugs.length}</strong> of{' '}
              <strong style={{ color:T.textSec, fontWeight:600 }}>{totalCount}</strong> bugs
            </span>
          </div>
        )}
        <ShowMoreFooter />
      </div>
    );

    if (viewMode === 'card') return (
      <div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'14px' }}>
          {visibleBugs.map((bug, idx) => {
            const sevCfg = SEVERITY_CONFIG[bug.severity] || {};
            const isNew  = newlyRevealedStart !== null && idx >= newlyRevealedStart;
            return (
              <div key={bug._id} className="br-card-item" style={{
                background:T.surface, borderRadius:'20px',
                border: darkMode ? `1px solid ${T.border}` : 'none',
                boxShadow:T.shadow, overflow:'hidden', cursor:'pointer',
                transition:'transform 0.2s, box-shadow 0.2s',
                animation: isNew
                  ? `brSlideReveal 0.35s cubic-bezier(0.16,1,0.3,1) ${(idx - newlyRevealedStart) * 0.06}s both`
                  : `brCardIn 0.35s ease ${idx * 0.04}s both`,
              }} onClick={() => openBugModal(bug._id)}>
                <div style={{ height:'4px', background: sevCfg.color || '#bb0000' }} />
                <div style={{ padding:'16px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'8px', marginBottom:'8px' }}>
                    <span style={{ ...font(13, 500, T.textPri), lineHeight:1.4, flex:1 }}>{bug.title}</span>
                    <SeverityBadge severity={bug.severity} />
                  </div>
                  {bug.description && <p style={{ ...font(11, 400, T.textSec), lineHeight:1.5, margin:'0 0 10px 0' }}>{bug.description.replace(/<[^>]*>/g, '').slice(0, 90)}{bug.description.length > 90 ? '…' : ''}</p>}
                  <div style={{ marginBottom:'10px' }}><TimerCell bug={bug} /></div>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px', flexWrap:'wrap' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'4px', ...font(11, 400, T.textSec) }}><User size={10} />{bug.reportedBy?.name || '—'}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:'4px', ...font(11, 400, T.textSec) }}><Calendar size={10} />{new Date(bug.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric' })}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', flexWrap:'wrap', marginBottom:'12px' }}>
                    <StatusBadge status={bug.status} /><SourceBadge source={getBugSource(bug)} />
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'10px', borderTop:`1px solid ${T.border2}` }} onClick={e => e.stopPropagation()}>
                    <span style={{ ...font(10, 400, T.textMuted) }}>{formatBugId(bug._id, bug.createdAt)}</span>
                    <button onClick={() => openBugModal(bug._id)} style={{ display:'flex', alignItems:'center', gap:'4px', background: darkMode ? 'rgba(185,28,28,0.12)' : '#fff0f0', border:'1px solid rgba(185,28,28,0.3)', borderRadius:'7px', padding:'4px 10px', cursor:'pointer', ...font(11, 500, '#b91c1c') }}>
                      <Eye size={11} /> View
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ background:T.surface, borderRadius:'20px', marginTop:'14px', overflow:'hidden', boxShadow:T.shadow, border: darkMode ? `1px solid ${T.border}` : 'none' }}>
          {bugs.length > 0 && (
            <div style={{ padding:'8px 20px 0 20px' }}>
              <span style={{ ...font(11, 400, T.textMuted) }}>
                Showing <strong style={{ color:T.textSec, fontWeight:600 }}>{visibleBugs.length}</strong> of{' '}
                <strong style={{ color:T.textSec, fontWeight:600 }}>{totalCount}</strong> bugs
              </span>
            </div>
          )}
          <ShowMoreFooter />
        </div>
      </div>
    );

    return (
      <div style={{ background:T.surface, borderRadius:'20px', boxShadow:T.shadow, border: darkMode ? `1px solid ${T.border}` : 'none', overflow:'hidden' }}>
        {visibleBugs.map((bug, idx) => {
          const isNew = newlyRevealedStart !== null && idx >= newlyRevealedStart;
          return (
            <div key={bug._id} className="br-list-row" style={{
              display:'flex', alignItems:'center', gap:'12px', padding:'12px 20px',
              borderBottom: idx === visibleBugs.length - 1 ? 'none' : `1px solid ${T.border2}`,
              cursor:'pointer', transition:'background 0.12s',
              animation: isNew
                ? `brSlideReveal 0.35s cubic-bezier(0.16,1,0.3,1) ${(idx - newlyRevealedStart) * 0.06}s both`
                : `brFadeRow 0.3s ease ${idx * 0.03}s both`,
            }} onClick={() => openBugModal(bug._id)}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:getSevDotColor(bug.severity), flexShrink:0 }} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ ...font(13, 500, T.textPri), overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{bug.title}</div>
                {bug.description && <div style={{ ...font(11, 400, T.textSec), marginTop:'2px' }}>{bug.description.replace(/<[^>]*>/g, '').slice(0, 80)}{bug.description.length > 80 ? '…' : ''}</div>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', flexShrink:0 }}>
                <TimerCell bug={bug} /><SeverityBadge severity={bug.severity} /><StatusBadge status={bug.status} />
                <span style={{ ...font(11, 400, T.textSec), whiteSpace:'nowrap' }}>{bug.reportedBy?.name || '—'}</span>
              </div>
            </div>
          );
        })}
        {bugs.length > 0 && (
          <div style={{ padding:'8px 20px 0 20px' }}>
            <span style={{ ...font(11, 400, T.textMuted) }}>
              Showing <strong style={{ color:T.textSec, fontWeight:600 }}>{visibleBugs.length}</strong> of{' '}
              <strong style={{ color:T.textSec, fontWeight:600 }}>{totalCount}</strong> bugs
            </span>
          </div>
        )}
        <ShowMoreFooter />
      </div>
    );
  };

  /* ════════════════════════════════════════
     BUG DETAIL MODAL
  ════════════════════════════════════════ */
  const BugDetailModal = () => {
    if (!modalOpen) return null;
    const bug         = selectedBug;
    const screenshots = bug ? (Array.isArray(bug.screenshots) ? bug.screenshots : []).map(getScreenshotUrl).filter(Boolean) : [];
    const bugId  = bug ? formatBugId(bug._id, bug.createdAt) : '';
    const sevCfg = bug ? (SEVERITY_CONFIG[bug.severity] || {}) : {};
    const isFinished = bug && (bug.status === 'Resolved' || bug.status === 'Closed');

    const sectionLabel = (icon, text, color) => (
      <div style={{ display:'flex', alignItems:'center', gap:'6px', ...font(11, 600, color || T.textMuted), textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'8px' }}>
        {icon}<span>{text}</span>
      </div>
    );

    const descBox = (html) => (
      <div style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:'10px', padding:'14px', ...font(13, 400, T.textSec), lineHeight:1.7 }} dangerouslySetInnerHTML={{ __html: html }} />
    );

    return (
      <div style={{ position:'fixed', inset:0, zIndex:500, background: darkMode ? 'rgba(0,0,0,0.72)' : 'rgba(15,23,42,0.5)', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)', animation:'brFadeOverlay 0.2s ease', padding:'16px' }} onClick={closeModal}>
        <div style={{
          width:'100%', maxWidth:'660px', maxHeight:'88vh',
          background:T.surface,
          border: darkMode ? `1px solid ${T.border}` : 'none',
          borderRadius:'20px',
          boxShadow:'0 20px 60px rgba(0,0,0,0.2)',
          display:'flex', flexDirection:'column',
          animation:'brSlideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
          overflow:'hidden', position:'relative',
          borderTop:`3px solid ${sevCfg.color || '#bb0000'}`,
        }} onClick={e => e.stopPropagation()}>

          {/* ── HEADER ── */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px 14px', borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:'linear-gradient(135deg, #4a0a0a, #bb0000)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Bug size={18} color="#fff" />
              </div>
              <div>
                <p style={{ ...font(11, 600, T.textMuted), textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 2px 0' }}>Bug Report</p>
                {bug && (
                  <button style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', cursor:'pointer', padding:0 }} onClick={() => handleCopyId(bug._id, bug.createdAt)}>
                    <span style={{ ...font(13, 600, T.textPri) }}>{bugId}</span>
                    {copiedId ? <Check size={11} style={{ color:'#16a34a' }} /> : <Copy size={11} style={{ color:T.textSec }} />}
                  </button>
                )}
              </div>
            </div>
            <button onClick={closeModal} style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'32px', height:'32px', borderRadius:'8px', background:T.surface2, border:`1px solid ${T.border}`, color:T.textSec, cursor:'pointer' }}>
              <X size={16} />
            </button>
          </div>

          {/* ── BODY ── */}
          <div style={{ overflowY:'auto', flex:1, padding:'20px 22px' }}>
            {modalLoading ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px', padding:'48px 0' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', border:`3px solid ${T.border}`, borderTopColor:'#bb0000', animation:'brSpin 0.7s linear infinite' }} />
                <p style={{ ...font(13, 400, T.textSec), margin:0 }}>Loading bug details…</p>
              </div>
            ) : !bug ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px', padding:'48px 0' }}>
                <Bug size={36} style={{ opacity:0.25, color:T.textSec }} />
                <p style={{ ...font(13, 400, T.textSec), margin:0 }}>Could not load bug details.</p>
              </div>
            ) : (
              <>
                {actionError && (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', background: darkMode ? 'rgba(239,68,68,0.12)' : '#fef2f2', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'10px', padding:'10px 14px', marginBottom:'16px', ...font(13, 400, '#dc2626') }}>
                    <AlertCircle size={14} />{actionError}
                    <button onClick={() => setActionError('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#dc2626', marginLeft:'auto', display:'flex' }}><X size={12} /></button>
                  </div>
                )}

                <div style={{ display:'flex', alignItems:'flex-start', gap:'12px', marginBottom:'12px' }}>
                  <div style={{ width:'4px', minHeight:'42px', borderRadius:'2px', flexShrink:0, background: sevCfg.color || '#bb0000', marginTop:'3px' }} />
                  <div>
                    <h2 style={{ ...font(18, 600, T.textPri), lineHeight:1.4, margin:'0 0 8px 0' }}>{bug.title}</h2>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                      <SeverityBadge severity={bug.severity} large /><StatusBadge status={bug.status} large />
                    </div>
                  </div>
                </div>

                {bug.acceptedBy && (() => {
                  const pic = bug.acceptedBy?.profilePicture;
                  const BASE = process.env.REACT_APP_API_URL
                    ? process.env.REACT_APP_API_URL.replace('/api','')
                    : 'http://localhost:5000';
                  const picUrl = pic
                    ? (pic.startsWith('http') ? pic : `${BASE}/${pic.replace(/^\//, '')}`)
                    : null;
                  return (
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px', padding:'2px 0' }}>
                      {picUrl ? (
                        <img src={picUrl} alt="avatar"
                          style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover', flexShrink:0,
                            boxShadow:'0 2px 8px rgba(37,99,235,0.30)',
                            border:`2px solid ${darkMode ? 'rgba(37,99,235,0.40)' : 'rgba(37,99,235,0.25)'}` }}
                          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                        />
                      ) : null}
                      <div style={{
                        width:40, height:40, borderRadius:'50%', flexShrink:0,
                        background:'linear-gradient(135deg,#1e3a5f,#2563eb)',
                        display: picUrl ? 'none' : 'flex',
                        alignItems:'center', justifyContent:'center',
                        boxShadow:'0 2px 8px rgba(37,99,235,0.35)',
                        ...font(15, 700, '#fff'),
                      }}>
                        {(bug.acceptedBy?.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ width:'1px', height:'34px', background: darkMode ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)', flexShrink:0 }} />
                      <div style={{ display:'flex', flexDirection:'column', gap:'1px' }}>
                        <span style={{ ...font(10, 600, darkMode ? '#60a5fa' : '#2563eb'), textTransform:'uppercase', letterSpacing:'0.06em' }}>
                          Developer Associate
                        </span>
                        <span style={{ ...font(14, 600, T.textPri), lineHeight:1.3 }}>
                          {bug.acceptedBy?.name || bug.acceptedBy}
                        </span>
                        {bug.acceptedBy?.role && (
                          <span style={{ ...font(11, 400, T.textSec) }}>{bug.acceptedBy.role}</span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {(bug.status === 'In Progress' || bug.status === 'Resolved' || bug.status === 'Closed') && <ModalTimer bug={bug} dark={darkMode} />}

                {screenshots.length > 0 ? (
                  <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginBottom:'16px' }}>
                    {screenshots.map((src, i) => (
                      <button key={i} onClick={() => setLightboxSrc(src)} className="br-ss-btn" style={{ position:'relative', border:`1px solid ${T.border}`, borderRadius:'10px', overflow:'hidden', cursor:'pointer', background:'none', padding:0, transition:'border-color 0.15s, transform 0.15s' }}>
                        <img src={src} alt={`screenshot-${i+1}`} style={{ display:'block', width:'120px', height:'80px', objectFit:'cover' }} />
                        <div className="br-ss-overlay" style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity 0.15s', color:'#fff' }}><Eye size={18} /></div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px', ...font(12, 400, T.textSec) }}>
                    <ImageOff size={14} /><span>No screenshots attached</span>
                  </div>
                )}

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'16px' }}>
                  {[
                    { icon:<Tag size={11} />, label:'Bug ID', val:(
                      <button style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', cursor:'pointer', padding:0 }} onClick={() => handleCopyId(bug._id, bug.createdAt)}>
                        <span style={{ ...font(12, 500, T.textPri) }}>{bugId}</span>
                        {copiedId ? <Check size={11} style={{ color:'#16a34a' }} /> : <Copy size={11} style={{ color:T.textSec }} />}
                      </button>
                    )},
                    { icon:<User size={11} />,     label:'Reporter',   val: bug.reportedBy?.name  || '—' },
                    { icon:<Mail size={11} />,     label:'Email',      val: bug.reportedBy?.email || '—' },
                    { icon:<Calendar size={11} />, label:'Reported',   val: formatDateTime(bug.createdAt) },
                    { icon:<Clock size={11} />,    label:'Updated',    val: formatDateTime(bug.updatedAt) },
                    ...(bug.resolvedAt ? [{ icon:<CheckCircle size={11} />, label:'Resolved At', val: formatDateTime(bug.resolvedAt) }] : []),
                    ...(bug.category   ? [{ icon:<Tag size={11} />, label:'Category', val: bug.category }] : []),
                    ...(bug.assignedTo ? [{ icon:<User size={11} />, label:'Assigned To', val: bug.assignedTo?.name || bug.assignedTo }] : []),
                    ...(bug.environment?.browser ? [{ icon:<Activity size={11} />, label:'Browser', val: bug.environment.browser }] : []),
                    ...(bug.environment?.os      ? [{ icon:<Activity size={11} />, label:'OS',      val: bug.environment.os      }] : []),
                  ].map((item, i) => (
                    <div key={i} style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:'10px', padding:'10px 12px', display:'flex', flexDirection:'column', gap:'4px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px', ...font(10, 600, T.textMuted), textTransform:'uppercase', letterSpacing:'0.04em' }}>{item.icon}{item.label}</div>
                      {typeof item.val === 'string' ? <span style={{ ...font(13, 400, T.textPri) }}>{item.val}</span> : item.val}
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom:'16px' }}>
                  {sectionLabel(<FileText size={13} />, 'Description')}
                  {descBox(bug.description ? sanitizeHtml(bug.description) : `<em style="color:${T.textSec}">No description provided.</em>`)}
                </div>

                {bug.stepsToReproduce && (
                  <div style={{ marginBottom:'16px' }}>
                    {sectionLabel(<Activity size={13} />, 'Steps to Reproduce')}
                    {descBox(sanitizeHtml(bug.stepsToReproduce))}
                  </div>
                )}

                {(bug.expectedBehavior || bug.actualBehavior) && (
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px' }}>
                    {bug.expectedBehavior && <div>{sectionLabel(<CheckCircle size={13} />, 'Expected', '#16a34a')}{descBox(sanitizeHtml(bug.expectedBehavior))}</div>}
                    {bug.actualBehavior   && <div>{sectionLabel(<AlertCircle  size={13} />, 'Actual',   '#dc2626')}{descBox(sanitizeHtml(bug.actualBehavior))}</div>}
                  </div>
                )}

                {bug.comments?.length > 0 && (
                  <div style={{ marginBottom:'16px' }}>
                    {sectionLabel(<FileText size={13} />, `Comments (${bug.comments.length})`)}
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      {bug.comments.map((c, i) => (
                        <div key={i} style={{ background:T.surface2, border:`1px solid ${T.border}`, borderRadius:'10px', padding:'12px' }}>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
                            <span style={{ ...font(12, 600, '#b91c1c') }}>{c.authorName || c.author?.name || 'Admin'}</span>
                            <span style={{ ...font(11, 400, T.textSec) }}>{formatDateTime(c.createdAt)}</span>
                          </div>
                          <p style={{ ...font(13, 400, T.textSec), lineHeight:1.5, margin:0 }}>{c.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── FOOTER ── */}
          {bug && !modalLoading && (
            <div style={{ borderTop:`1px solid ${T.border}`, padding:'14px 22px', background:T.surface2, flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                {!isFinished && (
                  <button onClick={() => { solveEmailBodyRef.current = ''; setSolveEmailBody(''); setSolveBodyFilled(false); setSolveAttachments([]); setSolveCompose(true); }} style={{ display:'flex', alignItems:'center', gap:'7px', background: darkMode ? 'rgba(22,163,74,0.15)' : '#f0fdf4', border:'1px solid rgba(22,163,74,0.4)', borderRadius:'10px', padding:'9px 18px', flex:1, cursor:'pointer', ...font(13, 600, '#16a34a'), transition:'all 0.15s', justifyContent:'center' }}>
                    <CheckCircle size={15} /> Confirm & Compose Email
                  </button>
                )}
                <button onClick={() => setArchiveConfirm(true)} disabled={actionLoading} style={{ display:'flex', alignItems:'center', gap:'7px', background: darkMode ? 'rgba(107,114,128,0.15)' : '#f9fafb', border:`1px solid ${T.border}`, borderRadius:'10px', padding:'9px 18px', flex: isFinished ? 1 : 0, cursor:'pointer', ...font(13, 600, T.textSec), transition:'all 0.15s', justifyContent:'center', whiteSpace:'nowrap' }}>
                  <Archive size={15} /> Archive Bug
                </button>
              </div>
            </div>
          )}

          {/* ── ARCHIVE CONFIRM ── */}
          {archiveConfirm && bug && (
            <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', animation:'brFadeOverlay 0.18s ease' }} onClick={() => setArchiveConfirm(false)}>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius:'20px', padding:'32px 28px 28px', width:'100%', maxWidth:'380px', boxShadow: darkMode ? '0 20px 60px rgba(0,0,0,0.7)' : '0 20px 60px rgba(0,0,0,0.18)', display:'flex', flexDirection:'column', alignItems:'center', animation:'brSlideUp 0.22s cubic-bezier(0.16,1,0.3,1)' }} onClick={e => e.stopPropagation()}>
                <div style={{ width:'56px', height:'56px', borderRadius:'50%', background: darkMode ? 'rgba(107,114,128,0.18)' : '#f3f4f6', border: darkMode ? '1px solid rgba(107,114,128,0.3)' : 'none', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'18px' }}>
                  <Archive size={26} style={{ color: T.textSec }} />
                </div>
                <h3 style={{ ...font(17, 600, T.textPri), margin:'0 0 6px 0', textAlign:'center' }}>Archive this Bug?</h3>
                <p style={{ ...font(13, 400, T.textSec), margin:'0 0 20px 0', textAlign:'center', lineHeight:1.5 }}>You are about to archive this bug report:</p>
                <div style={{ width:'100%', background: T.surface2, border: `1px solid ${T.border}`, borderRadius:'12px', padding:'14px 16px', marginBottom:'14px', display:'flex', flexDirection:'column', gap:'7px' }}>
                  {[
                    { label:'Severity', value: bug.severity },
                    { label:'Status',   value: bug.status },
                    { label:'Action',   value: 'Hidden from main list' },
                  ].map((item, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ width:'5px', height:'5px', borderRadius:'50%', background: T.textMuted, flexShrink:0 }} />
                      <span style={{ ...font(13, 400, T.textSec) }}><strong style={{ color: T.textPri }}>{item.label}:</strong> {item.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ width:'100%', background: darkMode ? 'rgba(245,158,11,0.10)' : '#fffbeb', border: darkMode ? '1px solid rgba(245,158,11,0.25)' : '1px solid #fde68a', borderRadius:'10px', padding:'10px 14px', marginBottom:'22px', display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontSize:'14px' }}>⚠️</span>
                  <span style={{ ...font(12, 500, darkMode ? '#fbbf24' : '#92400e') }}>Archived bugs can be restored from the archive section.</span>
                </div>
                <div style={{ display:'flex', gap:'10px', width:'100%' }}>
                  <button onClick={() => setArchiveConfirm(false)} style={{ flex:1, padding:'11px 0', borderRadius:'10px', border: `1.5px solid ${T.border}`, background: T.surface2, cursor:'pointer', ...font(13, 600, T.textSec) }}>Cancel</button>
                  <button onClick={handleArchive} disabled={actionLoading} style={{ flex:1, padding:'11px 0', borderRadius:'10px', border:'none', background:'linear-gradient(135deg, #374151, #4b5563)', cursor: actionLoading ? 'not-allowed' : 'pointer', ...font(13, 600, '#fff'), boxShadow:'0 3px 10px rgba(75,85,99,0.35)', opacity: actionLoading ? 0.7 : 1 }}>
                    {actionLoading ? '…' : 'Yes, Archive Bug'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  };

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div style={{ fontFamily:"'Poppins', sans-serif", background:T.bg, minHeight:'100vh', color:T.textPri, transition:'background 0.3s ease' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Poppins', sans-serif !important; box-sizing: border-box !important; }

        @keyframes brDropIn      { from { opacity:0; transform:translateY(-6px); }   to { opacity:1; transform:translateY(0); } }
        @keyframes brSpin        { to   { transform:rotate(360deg); } }
        @keyframes brFadeRow     { from { opacity:0; transform:translateX(-4px); }   to { opacity:1; transform:translateX(0); } }
        @keyframes brCardIn      { from { opacity:0; transform:translateY(8px); }    to { opacity:1; transform:translateY(0); } }
        @keyframes brFadeOverlay { from { opacity:0; } to { opacity:1; } }
        @keyframes brSlideUp     { from { opacity:0; transform:translateY(16px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes brPulse       { 0%,100% { opacity:1; } 50% { opacity:0.55; } }
        @keyframes brSlideReveal { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }

        .br-html-divider { height:1px; background:${T.border}; margin:10px 0; }
        .br-ss-btn:hover .br-ss-overlay { opacity:1 !important; }
        .br-table-row:hover    { background:${darkMode ? 'rgba(255,255,255,0.03)' : '#fafafa'} !important; }
        .br-card-item:hover    { transform:translateY(-2px) !important; box-shadow:0 10px 28px rgba(0,0,0,${darkMode ? '0.4' : '0.1'}) !important; }
        .br-list-row:hover     { background:${darkMode ? 'rgba(255,255,255,0.03)' : '#fafafa'} !important; }
        .br-view-row-btn:hover { background:${darkMode ? 'rgba(185,28,28,0.22)' : '#ffe4e4'} !important; }
        .br-stat-card:hover    { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,${darkMode ? '0.4' : '0.1'}) !important; }

        .br-date-dd:hover .br-date-pop       { display:flex !important; }
        .br-date-dd:focus-within .br-date-pop { display:flex !important; }

        select option { background: ${T.surface} !important; color: ${T.textPri} !important; }
        ::-webkit-scrollbar       { width:5px; }
        ::-webkit-scrollbar-track { background:${T.bg}; }
        ::-webkit-scrollbar-thumb { background:${T.border}; border-radius:3px; }

        @media (max-width:400px) { .br-hide-xs { display:none !important; } }

        @media (max-width:768px) {
          .br-stats-row  { grid-template-columns:1fr 1fr !important; }
          .br-modal-ig   { grid-template-columns:1fr !important; }
          .br-modal-2col { grid-template-columns:1fr !important; }
          .br-col-source, .br-col-reporter { display:none !important; }
        }
        @media (max-width:480px) {
          .br-stats-row { grid-template-columns:1fr 1fr !important; }
          .br-col-timer { display:none !important; }
        }
      `}</style>

      {/* Lightbox */}
      {lightboxSrc && (
        <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', animation:'brFadeOverlay 0.2s ease' }} onClick={() => setLightboxSrc(null)}>
          <button onClick={() => setLightboxSrc(null)} style={{ position:'absolute', top:'16px', right:'16px', background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'8px', width:'36px', height:'36px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer' }}><X size={18} /></button>
          <img src={lightboxSrc} alt="screenshot" style={{ maxWidth:'90vw', maxHeight:'85vh', borderRadius:'12px', objectFit:'contain' }} onClick={e => e.stopPropagation()} />
        </div>
      )}

      <BugDetailModal />

      {/* ── SOLVE MODALS ── */}
      {/* ── STEP 1: COMPOSE RESOLUTION EMAIL ── */}
      {selectedBug && solveCompose && !solveConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', animation:'brFadeOverlay 0.18s ease' }} onClick={() => setSolveCompose(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius:'20px', width:'100%', maxWidth:'520px', boxShadow: darkMode ? '0 20px 60px rgba(0,0,0,0.7)' : '0 20px 60px rgba(0,0,0,0.18)', display:'flex', flexDirection:'column', animation:'brSlideUp 0.22s cubic-bezier(0.16,1,0.3,1)', maxHeight:'90vh', overflow:'hidden' }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding:'20px 24px 16px', borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background: darkMode ? 'rgba(22,163,74,0.15)' : '#f0fdf4', border: darkMode ? '1px solid rgba(22,163,74,0.3)' : '1px solid rgba(22,163,74,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Send size={16} style={{ color:'#16a34a' }} />
                </div>
                <div>
                  <p style={{ margin:0, ...font(14, 700, T.textPri) }}>Resolution Email</p>
                  <p style={{ margin:0, ...font(11, 400, T.textMuted) }}>
                    {outlookConnected && selectedBug.reportedBy?.email
                      ? `Will be sent to ${selectedBug.reportedBy.email}`
                      : 'Outlook not connected — email will not be sent'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSolveCompose(false)} style={{ background:'none', border:'none', cursor:'pointer', color:T.textMuted, padding:4 }}><X size={18}/></button>
            </div>

            {/* Body */}
            <div style={{ padding:'20px 24px', overflowY:'auto', flex:1 }}>

              {/* To field */}
              <div style={{ marginBottom:14 }}>
                <label style={{ ...font(11, 600, T.textMuted), display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' }}>To</label>
                <div style={{ padding:'8px 12px', background: T.surface2, border:`1px solid ${T.border}`, borderRadius:'8px', ...font(13, 500, T.textSec) }}>
                  {selectedBug.reportedBy?.email || <em style={{ color: T.textMuted }}>No reporter email</em>}
                </div>
              </div>

              {/* Subject field */}
              <div style={{ marginBottom:14 }}>
                <label style={{ ...font(11, 600, T.textMuted), display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' }}>Subject</label>
                <div style={{ padding:'8px 12px', background: T.surface2, border:`1px solid ${T.border}`, borderRadius:'8px', ...font(13, 500, T.textSec) }}>
                  {`${selectedBug.title}`}
                </div>
              </div>

              {/* Resolution message */}
              <div style={{ marginBottom:14 }}>
                <label style={{ ...font(11, 600, T.textMuted), display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  Resolution Details <span style={{ color:'#ef4444' }}>*</span>
                </label>
                <textarea
                  defaultValue={solveEmailBodyRef.current}
                  onChange={e => {
                    solveEmailBodyRef.current = e.target.value;
                    setSolveBodyFilled(e.target.value.trim().length > 0);
                  }}
                  onBlur={e => setSolveEmailBody(e.target.value)}
                  placeholder="Describe what was done to resolve this bug, what was the root cause, and any additional notes for the reporter..."
                  rows={6}
                  style={{ width:'100%', padding:'10px 12px', background: T.surface2, border:`1px solid ${T.border}`, borderRadius:'8px', ...font(13, 400, T.textPri), resize:'vertical', outline:'none', boxSizing:'border-box', lineHeight:1.6, color: T.textPri, fontFamily:'inherit' }}
                />
              </div>

              {/* ── PATCHED: Attachments — docs & PDF only ── */}
              <div style={{ marginBottom:4 }}>
                <label style={{ ...font(11, 600, T.textMuted), display:'block', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  Attachments <span style={{ ...font(10, 400, T.textMuted), textTransform:'none', letterSpacing:0 }}>(PDF & Word file only)</span>
                </label>

                <label style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'7px 14px', background: T.surface2, border:`1px dashed ${T.border}`, borderRadius:'8px', cursor:'pointer', ...font(12, 600, T.textSec) }}>
                  <Paperclip size={13} />
                  {attachUploading ? 'Uploading…' : 'Attach files'}
                  {/* ── PATCHED accept attribute ── */}
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    style={{ display:'none' }}
                    onChange={handleSolveAttach}
                    disabled={attachUploading}
                  />
                </label>

                {solveAttachments.length > 0 && (
                  <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:'6px' }}>
                    {solveAttachments.map((a, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 10px', background: T.surface2, border:`1px solid ${T.border}`, borderRadius:'8px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px', minWidth:0 }}>
                          <Paperclip size={12} style={{ color:T.textMuted, flexShrink:0 }} />
                          <span style={{ ...font(12, 500, T.textPri), overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.name}</span>
                          <span style={{ ...font(11, 400, T.textMuted), flexShrink:0 }}>({(a.size/1024).toFixed(0)} KB)</span>
                        </div>
                        <button onClick={() => setSolveAttachments(prev => prev.filter((_, j) => j !== i))} style={{ background:'none', border:'none', cursor:'pointer', color:T.textMuted, padding:'2px 4px', flexShrink:0 }}><X size={13}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div style={{ padding:'14px 24px', borderTop:`1px solid ${T.border}`, display:'flex', gap:'10px', flexShrink:0 }}>
              <button onClick={() => setSolveCompose(false)} style={{ flex:1, padding:'10px 0', borderRadius:'10px', border:`1.5px solid ${T.border}`, background:T.surface2, cursor:'pointer', ...font(13, 600, T.textSec) }}>Cancel</button>
              <button
                onClick={() => {
                  const body = solveEmailBodyRef.current.trim();
                  if (!body && outlookConnected && selectedBug.reportedBy?.email) return;
                  setSolveEmailBody(solveEmailBodyRef.current);
                  setSolveConfirm(true);
                }}
                disabled={outlookConnected && selectedBug.reportedBy?.email && !solveBodyFilled}
                style={{ flex:2, padding:'10px 0', borderRadius:'10px', border:'none', background: (outlookConnected && selectedBug.reportedBy?.email && !solveBodyFilled) ? '#d1d5db' : 'linear-gradient(135deg,#15803d,#16a34a)', cursor: (outlookConnected && selectedBug.reportedBy?.email && !solveBodyFilled) ? 'not-allowed' : 'pointer', ...font(13, 700, '#fff'), display:'flex', alignItems:'center', justifyContent:'center', gap:'7px' }}>
                <CheckCircle size={14}/> Mark as Solved
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── STEP 2: CONFIRM SOLVE ── */}
      {selectedBug && solveConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', animation:'brFadeOverlay 0.18s ease' }} onClick={() => setSolveConfirm(false)}>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius:'20px', padding:'32px 28px 28px', width:'100%', maxWidth:'380px', boxShadow: darkMode ? '0 20px 60px rgba(0,0,0,0.7)' : '0 20px 60px rgba(0,0,0,0.18)', display:'flex', flexDirection:'column', alignItems:'center', animation:'brSlideUp 0.22s cubic-bezier(0.16,1,0.3,1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ width:'56px', height:'56px', borderRadius:'50%', background: darkMode ? 'rgba(37,99,235,0.15)' : '#eff6ff', border: darkMode ? '1px solid rgba(37,99,235,0.3)' : 'none', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'18px' }}>
              <CheckCircle size={26} style={{ color:'#3b82f6' }} />
            </div>
            <h3 style={{ ...font(17, 600, T.textPri), margin:'0 0 6px 0', textAlign:'center' }}>Confirm & Mark as Solved?</h3>
            <p style={{ ...font(13, 400, T.textSec), margin:'0 0 20px 0', textAlign:'center', lineHeight:1.5 }}>You are about to mark this bug report as resolved:</p>
            <div style={{ width:'100%', background: T.surface2, border: `1px solid ${T.border}`, borderRadius:'12px', padding:'14px 16px', marginBottom:'14px', display:'flex', flexDirection:'column', gap:'7px' }}>
              {[
                { label:'Severity',    value: selectedBug.severity },
                { label:'Status →',    value: 'Resolved' },
                { label:'Resolved At', value: new Date().toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:true }) },
                ...(outlookConnected && selectedBug.reportedBy?.email ? [{ label:'Email to', value: selectedBug.reportedBy.email }] : []),
                ...(solveAttachments.length > 0 ? [{ label:'Attachments', value: `${solveAttachments.length} file(s)` }] : []),
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ width:'5px', height:'5px', borderRadius:'50%', background: T.textMuted, flexShrink:0 }} />
                  <span style={{ ...font(13, 400, T.textSec) }}><strong style={{ color: T.textPri }}>{item.label}:</strong> {item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ width:'100%', background: darkMode ? 'rgba(245,158,11,0.10)' : '#fffbeb', border: darkMode ? '1px solid rgba(245,158,11,0.25)' : '1px solid #fde68a', borderRadius:'10px', padding:'10px 14px', marginBottom:'22px', display:'flex', alignItems:'center', gap:'8px' }}>
              <span style={{ fontSize:'14px' }}>⚠️</span>
              <span style={{ ...font(12, 500, darkMode ? '#fbbf24' : '#92400e') }}>This cannot be edited once confirmed.</span>
            </div>
            <div style={{ display:'flex', gap:'10px', width:'100%' }}>
              <button onClick={() => { setSolveConfirm(false); setSolveCompose(true); }} style={{ flex:1, padding:'11px 0', borderRadius:'10px', border: `1.5px solid ${T.border}`, background: T.surface2, cursor:'pointer', ...font(13, 600, T.textSec) }}>← Back</button>
              <button onClick={handleMarkSolved} disabled={actionLoading} style={{ flex:1, padding:'11px 0', borderRadius:'10px', border:'none', background:'linear-gradient(135deg,#1e40af,#2563eb)', cursor: actionLoading ? 'not-allowed' : 'pointer', ...font(13, 600, '#fff'), boxShadow:'0 3px 10px rgba(37,99,235,0.35)', opacity: actionLoading ? 0.7 : 1 }}>
                {actionLoading ? '…' : 'Yes, Mark as Solved'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding:'clamp(12px, 3vw, 24px)', display:'flex', flexDirection:'column', gap:'16px' }}>

        {/* Page Header */}
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'4px', marginBottom:'8px' }}>
            <Link to="/admin/dashboard" style={{ ...font(12, 400, T.textSec), textDecoration:'none' }}>Dashboard</Link>
            <span style={{ ...font(12, 400, T.textMuted) }}>/</span>
            <span style={{ ...font(12, 400, T.textSec) }}>Bug Reports</span>
          </div>
          <h1 style={{ ...font(22, 600, T.textPri), margin:'0 0 2px 0', lineHeight:1.2 }}>Bug Reports</h1>
          <p style={{ ...font(11, 400, T.textSec), margin:0 }}>View, filter, and manage all reported bugs</p>
        </div>

        {/* Stats Row */}
        <div className="br-stats-row" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:'14px' }}>
          {[
            { label:'Total Bugs',  value:totalCount,      icon:<Bug size={18} />,          gradient:'linear-gradient(135deg, #4a0a0a 0%, #bb0000 100%)' },
            { label:'Open',        value:openCount,       icon:<AlertCircle size={18} />,   color:'#2563eb', iconBg: darkMode ? 'rgba(37,99,235,0.15)'  : '#eff6ff' },
            { label:'Critical',    value:criticalCount,   icon:<AlertTriangle size={18} />, color:'#dc2626', iconBg: darkMode ? 'rgba(220,38,38,0.15)'  : '#fef2f2' },
            { label:'In Progress', value:inProgressCount, icon:<Activity size={18} />,      color:'#d97706', iconBg: darkMode ? 'rgba(217,119,6,0.15)'  : '#fffbeb' },
          ].map((s, i) => (
            <div key={i} className="br-stat-card" style={{ background: s.gradient || T.surface, borderRadius:'20px', padding:'22px', border: !s.gradient && darkMode ? `1px solid ${T.border}` : 'none', boxShadow:T.shadow, overflow:'hidden', position:'relative', transition:'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'10px', marginBottom:'14px', background: s.gradient ? 'rgba(255,255,255,0.15)' : s.iconBg, display:'flex', alignItems:'center', justifyContent:'center', color: s.gradient ? '#fca5a5' : s.color }}>{s.icon}</div>
              <div style={{ ...font(11, 400, s.gradient ? 'rgba(255,210,210,0.65)' : T.textMuted), textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:'4px' }}>{s.label}</div>
              <div style={{ ...font(28, 600, s.gradient ? 'rgba(255,255,255,0.9)' : T.textPri), lineHeight:1.1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ════════════════════════════════════════
            TOOLBAR
        ════════════════════════════════════════ */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>

          {/* Search */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', background:T.surface, border:`1px solid ${T.border}`, borderRadius:'10px', padding:'0 12px', height:'36px', flex:'1 1 160px', minWidth:'120px', boxShadow:T.shadow }}>
            <Search size={14} style={{ color:T.textSec, flexShrink:0 }} />
            <input
              type="text"
              placeholder="Search bugs…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border:'none', background:'transparent', outline:'none', ...font(13, 400, T.textPri), width:'100%', minWidth:0 }}
            />
            {searchQuery && (
              <button onClick={clearSearch} style={{ background:'none', border:'none', cursor:'pointer', color:T.textSec, display:'flex', padding:0, flexShrink:0 }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Date Range */}
          <div className="br-filter-dd br-date-dd" style={{ position:'relative', flexShrink:0 }}>
            <FilterBtn active={!!(dateFrom || dateTo)} onClick={() => {}}>
              <Calendar size={12} />
              <span className="br-hide-xs">{formatDateRange()}</span>
            </FilterBtn>
            <div className="br-date-pop" style={{ position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:300, background:T.surface, border:`1px solid ${T.border}`, borderRadius:'12px', boxShadow:'0 8px 24px rgba(0,0,0,0.18)', padding:'14px', minWidth:'200px', display:'none', flexDirection:'column', gap:'8px' }}>
              <label style={{ ...font(11, 600, T.textMuted), textTransform:'uppercase', letterSpacing:'0.05em' }}>From</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ border:`1px solid ${T.border}`, borderRadius:'8px', background:T.surface2, ...font(13, 400, T.textPri), padding:'6px 10px', outline:'none', width:'100%' }} />
              <label style={{ ...font(11, 600, T.textMuted), textTransform:'uppercase', letterSpacing:'0.05em' }}>To</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ border:`1px solid ${T.border}`, borderRadius:'8px', background:T.surface2, ...font(13, 400, T.textPri), padding:'6px 10px', outline:'none', width:'100%' }} />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ display:'flex', alignItems:'center', gap:'5px', background:'none', border:'none', cursor:'pointer', ...font(12, 400, '#dc2626'), padding:'2px 0' }}>
                  <X size={11} /> Clear dates
                </button>
              )}
            </div>
          </div>

          {/* Severity */}
          <div className="br-filter-dd" style={{ position:'relative', flexShrink:0 }}>
            <FilterBtn active={severityFilter !== 'All'} onClick={() => { setSeverityOpen(o => !o); setStatusOpen(false); setSortOpen(false); }}>
              <Filter size={12} />
              {severityFilter === 'All' ? 'Severity' : severityFilter}
              <ChevronDown size={11} style={{ transform: severityOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
            </FilterBtn>
            {severityOpen && (
              <DropdownMenu
                selected={severityFilter}
                onSelect={v => { setSeverityFilter(v); setSeverityOpen(false); }}
                items={[
                  { value:'All', label:'All Severities' },
                  ...Object.entries(SEVERITY_CONFIG).map(([k, cfg]) => ({ value:k, label:k, icon:<cfg.icon size={12} style={{ color:cfg.color }} /> }))
                ]}
              />
            )}
          </div>

          {/* Status */}
          <div className="br-filter-dd" style={{ position:'relative', flexShrink:0 }}>
            <FilterBtn active={statusFilter !== 'All'} onClick={() => { setStatusOpen(o => !o); setSeverityOpen(false); setSortOpen(false); }}>
              {statusFilter === 'All' ? 'Status' : statusFilter}
              <ChevronDown size={11} style={{ transform: statusOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
            </FilterBtn>
            {statusOpen && (
              <DropdownMenu
                selected={statusFilter}
                onSelect={v => { setStatusFilter(v); setStatusOpen(false); }}
                items={[
                  { value:'All', label:'All Statuses' },
                  ...Object.keys(STATUS_CONFIG).map(k => ({ value:k, label:k, icon:<span style={{ width:6, height:6, borderRadius:'50%', background:STATUS_CONFIG[k].color, display:'inline-block', flexShrink:0 }} /> }))
                ]}
              />
            )}
          </div>

          {/* Clear all filters */}
          {hasActiveFilters && (
            <button onClick={clearAll} style={{ display:'flex', alignItems:'center', gap:'5px', background: darkMode ? 'rgba(220,38,38,0.12)' : '#fef2f2', border:'1px solid rgba(220,38,38,0.3)', borderRadius:'10px', padding:'0 12px', height:'36px', cursor:'pointer', ...font(12, 500, '#dc2626'), flexShrink:0 }}>
              <X size={11} /> Clear
            </button>
          )}

          {/* Refresh */}
          <button onClick={fetchBugs} title="Refresh" style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'36px', height:'36px', flexShrink:0, background:T.surface, border:`1px solid ${T.border}`, borderRadius:'10px', cursor:'pointer', color:T.textSec, boxShadow:T.shadow }}>
            <RefreshCw size={14} />
          </button>

          {/* Sort */}
          <div className="br-filter-dd" style={{ position:'relative', flexShrink:0 }}>
            <FilterBtn active={false} onClick={() => { setSortOpen(o => !o); setSeverityOpen(false); setStatusOpen(false); }}>
              {sortOrder === 'newest' ? <SortDesc size={12} /> : <SortAsc size={12} />}
              {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
              <ChevronDown size={11} style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
            </FilterBtn>
            {sortOpen && (
              <DropdownMenu
                right
                selected={sortOrder}
                onSelect={v => { setSortOrder(v); setSortOpen(false); }}
                items={[
                  { value:'newest', label:'Newest to Oldest', icon:<SortDesc size={12} /> },
                  { value:'oldest', label:'Oldest to Newest', icon:<SortAsc size={12} /> }
                ]}
              />
            )}
          </div>

          {/* View Toggle */}
          <div style={{ display:'flex', background:T.surface2, border:`1px solid ${T.border}`, borderRadius:'10px', padding:'3px', gap:'2px', boxShadow:T.shadow, flexShrink:0 }}>
            {[
              {
                mode:'table', label:'Table',
                icon: (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="4" rx="1"/>
                    <rect x="3" y="10" width="18" height="4" rx="1"/>
                    <rect x="3" y="17" width="18" height="4" rx="1"/>
                  </svg>
                )
              },
              {
                mode:'card', label:'Cards',
                icon: (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                  </svg>
                )
              },
              {
                mode:'list', label:'List',
                icon: (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <circle cx="3" cy="6" r="1" fill="currentColor"/>
                    <circle cx="3" cy="12" r="1" fill="currentColor"/>
                    <circle cx="3" cy="18" r="1" fill="currentColor"/>
                  </svg>
                )
              },
            ].map(v => {
              const isActive = viewMode === v.mode;
              const btnColor = isActive
                ? (darkMode ? '#ffffff' : T.textPri)
                : (darkMode ? '#64748b' : T.textSec);
              return (
                <button
                  key={v.mode}
                  onClick={() => setViewMode(v.mode)}
                  title={v.label}
                  style={{
                    display:'flex', alignItems:'center', gap:'5px',
                    padding:'5px 10px', borderRadius:'8px', border:'none',
                    cursor:'pointer',
                    background: isActive ? T.surface : 'transparent',
                    color: btnColor,
                    boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    transition:'all 0.15s',
                    ...font(11, isActive ? 500 : 400),
                  }}
                >
                  {v.icon}{v.label}
                </button>
              );
            })}
          </div>

        </div>

        {/* Content */}
        {renderContent()}

      </div>
    </div>
  );
};

export default BugReports;