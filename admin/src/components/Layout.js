import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bug,
  Settings,
  Menu,
  X,
  Bell,
  RefreshCw,
  LogOut,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  FileText,
  Building2,
  TrendingUp,
  Clock,
  BarChart3,
  LayoutList,
  MessageCircle,
  Moon,
  Sun,
  UserPlus,
  Archive,
  CheckCircle2,
  AlertTriangle,
  ScrollText,
  Edit,
  Trash2,
  Eye,
  LogIn,
  UserCheck,
  Star,
  MailOpen,
} from 'lucide-react';
import './Layout.css';

// ─────────────────────────────────────────────
//  NEUMORPHIC DESIGN TOKENS
// ─────────────────────────────────────────────
const NEU = {
  bg:          '#f0f0f3',
  bgCard:      '#ffffff',
  bgDark:      '#16171c',
  bgCardDark:  '#1e2028',

  shadow:      '6px 6px 16px rgba(13,39,80,0.13), -4px -4px 12px rgba(255,255,255,0.92)',
  shadowHover: '8px 8px 20px rgba(13,39,80,0.17), -5px -5px 14px rgba(255,255,255,0.95)',
  shadowInset: 'inset 3px 3px 8px rgba(13,39,80,0.14), inset -2px -2px 6px rgba(255,255,255,0.85)',
  shadowDark:      '6px 6px 16px rgba(0,0,0,0.45), -4px -4px 10px rgba(255,255,255,0.03)',
  shadowHoverDark: '8px 8px 20px rgba(0,0,0,0.55), -5px -5px 12px rgba(255,255,255,0.04)',
  shadowInsetDark: 'inset 3px 3px 8px rgba(0,0,0,0.4), inset -2px -2px 5px rgba(255,255,255,0.04)',

  maroon:      '#8b0000',
  maroonBright:'#6b0000',
  maroonLo:    'rgba(139,0,0,0.08)',
  maroonMd:    'rgba(139,0,0,0.18)',
  indigo:      '#818cf8',
  text0:       '#111827',
  text1:       '#374151',
  text2:       '#9ca3af',

  font: "'Poppins', system-ui, sans-serif",
};

// ─────────────────────────────────────────────
//  TYPE CONFIG
// ─────────────────────────────────────────────
const TYPE_CONFIG = {
  critical:     { icon: Bug,           color: '#DC2626', letter: 'B', avatarBg: '#FEE2E2', avatarColor: '#DC2626' },
  progress:     { icon: Clock,         color: '#B45309', letter: 'P', avatarBg: '#FEF3C7', avatarColor: '#B45309' },
  resolved:     { icon: CheckCircle2,  color: '#16A34A', letter: 'R', avatarBg: '#D1FAE5', avatarColor: '#16A34A' },
  assigned:     { icon: AlertTriangle, color: '#DC2626', letter: 'A', avatarBg: '#FEE2E2', avatarColor: '#DC2626' },
  sync:         { icon: CheckCircle2,  color: '#2563EB', letter: 'S', avatarBg: '#DBEAFE', avatarColor: '#2563EB' },
  user:         { icon: MessageCircle, color: '#7C3AED', letter: 'U', avatarBg: '#EDE9FE', avatarColor: '#7C3AED' },
  alert:        { icon: AlertTriangle, color: '#DC2626', letter: '!', avatarBg: '#FEE2E2', avatarColor: '#DC2626' },
  system:       { icon: CheckCircle2,  color: '#16A34A', letter: 'S', avatarBg: '#D1FAE5', avatarColor: '#16A34A' },
  login:        { icon: LogIn,         color: '#2563EB', letter: 'L', avatarBg: '#DBEAFE', avatarColor: '#2563EB' },
  edit:         { icon: Edit,          color: '#B45309', letter: 'E', avatarBg: '#FEF3C7', avatarColor: '#B45309' },
  delete:       { icon: Trash2,        color: '#DC2626', letter: 'D', avatarBg: '#FEE2E2', avatarColor: '#DC2626' },
  view:         { icon: Eye,           color: '#6B7280', letter: 'V', avatarBg: '#F3F4F6', avatarColor: '#6B7280' },
  user_created: { icon: UserCheck,     color: '#16A34A', letter: 'U', avatarBg: '#D1FAE5', avatarColor: '#16A34A' },
};

const ACOLORS = ['#1d4ed8','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#9d174d','#0f766e','#6d28d9','#b45309'];
function neuAvatarColor(name) {
  let h = 0;
  for (let c of (name || '')) h = (h * 31 + c.charCodeAt(0)) % ACOLORS.length;
  return ACOLORS[h];
}

// ─────────────────────────────────────────────
//  NOTIFICATION ITEM
// ─────────────────────────────────────────────
function NotifItem({ notif, darkMode, onRead, onNavigate }) {
  const cfg  = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
  const Icon = cfg.icon;
  const [hovered, setHovered] = useState(false);
  const [starred, setStarred] = useState(false);

  const accent   = darkMode ? NEU.indigo : NEU.maroon;
  const accentBr = darkMode ? '#a5b4fc' : NEU.maroonBright;
  const rowBg    = hovered
    ? (darkMode ? '#1a1c22' : '#e8e8eb')
    : (notif.unread ? (darkMode ? '#1a1b22' : '#ebebee') : 'transparent');

  const shadow    = darkMode ? NEU.shadowDark      : NEU.shadow;
  const shadowHov = darkMode ? NEU.shadowHoverDark : NEU.shadowHover;

  const titleColor = darkMode
    ? (notif.unread ? '#ffffff' : 'rgba(255,255,255,0.65)')
    : (notif.unread ? NEU.text0 : NEU.text1);
  const descColor  = darkMode ? 'rgba(255,255,255,0.42)' : NEU.text2;
  const metaColor  = darkMode ? 'rgba(255,255,255,0.25)' : '#b0b8c8';

  const handleClick = () => {
    if (notif.unread) onRead(notif.id);
    onNavigate(notif.id);
  };

  const avatarColor = neuAvatarColor(notif.title || '');

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 11,
        padding: '10px 14px 10px 13px',
        background: rowBg, cursor: 'pointer',
        transition: 'background 0.13s', position: 'relative',
        borderLeft: `3px solid ${notif.unread ? accent : 'transparent'}`,
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 12, flexShrink: 0,
        background: avatarColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: NEU.font,
        letterSpacing: '0.02em',
        boxShadow: `0 0 0 2px ${darkMode ? '#1e2028' : '#ebebee'}, 0 4px 10px ${avatarColor}45`,
        position: 'relative',
      }}>
        {cfg.letter}
        <span style={{
          position: 'absolute', bottom: -3, right: -3,
          width: 16, height: 16, borderRadius: '50%',
          background: darkMode ? '#16171c' : '#f0f0f3',
          boxShadow: darkMode
            ? '2px 2px 5px rgba(0,0,0,0.5), -1px -1px 3px rgba(255,255,255,0.04)'
            : '2px 2px 5px rgba(13,39,80,0.15), -1px -1px 3px rgba(255,255,255,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={8} color={cfg.color} />
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
          <span style={{
            fontSize: 12, fontWeight: notif.unread ? 700 : 500,
            color: titleColor, fontFamily: NEU.font,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '72%',
          }}>{notif.title}</span>
          <span style={{ fontSize: 10, color: metaColor, fontFamily: NEU.font, flexShrink: 0 }}>{notif.time}</span>
        </div>
        <div style={{ fontSize: 11, color: descColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: NEU.font, lineHeight: 1.45, marginBottom: 3 }}>
          {notif.desc}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: metaColor, fontFamily: NEU.font, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '74%' }}>
            {notif.email}
          </span>
          {notif.unread && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 9, fontWeight: 700, color: accent, fontFamily: NEU.font,
              background: darkMode ? `${accent}18` : NEU.maroonLo,
              padding: '2px 8px 2px 5px', borderRadius: 999,
              boxShadow: darkMode
                ? 'inset 1px 1px 3px rgba(0,0,0,0.3), inset -1px -1px 2px rgba(255,255,255,0.04)'
                : 'inset 2px 2px 4px rgba(139,0,0,0.08), inset -1px -1px 3px rgba(255,255,255,0.8)',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent, display: 'inline-block' }} />
              New
            </span>
          )}
        </div>
      </div>

      <button
        onClick={e => { e.stopPropagation(); setStarred(s => !s); }}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered || starred ? 1 : 0, transition: 'opacity 0.15s', flexShrink: 0,
          color: starred ? '#f59e0b' : (darkMode ? 'rgba(255,255,255,0.3)' : NEU.text2),
        }}
        title={starred ? 'Unstar' : 'Star'}
      >
        <Star size={13} fill={starred ? '#f59e0b' : 'none'} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
//  NOTIFICATION BELL
// ─────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function NotificationBell({ darkMode, userRole }) {
  const isInnovation = ['innovation', 'super admin'].includes(userRole?.trim().toLowerCase());
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [tab,  setTab]  = useState('unread');
  const [bugs,    setBugs]    = useState([]);
  const [system,  setSystem]  = useState([]);
  const [loading, setLoading] = useState({ bugs: false, system: false });
  const [error,   setError]   = useState({ bugs: null,  system: null  });

  const userId = (() => {
    try { return JSON.parse(localStorage.getItem('adminData') || '{}')._id || 'guest'; }
    catch { return 'guest'; }
  })();
  const KEY_SEEN_BUGS    = `notif_seen_bugs_${userId}`;
  const KEY_SEEN_SYSTEM  = `notif_seen_system_${userId}`;
  const KEY_BELL_BADGE   = `notif_bell_badge_${userId}`;
  const KEY_KNOWN_BUGS   = `notif_known_bugs_${userId}`;
  const KEY_KNOWN_SYSTEM = `notif_known_system_${userId}`;
  const KEY_LAST_LOGIN   = `notif_last_login_${userId}`;

  const seenBugIds    = useRef(new Set(JSON.parse(localStorage.getItem(KEY_SEEN_BUGS)   || '[]')));
  const seenSystemIds = useRef(new Set(JSON.parse(localStorage.getItem(KEY_SEEN_SYSTEM) || '[]')));

  const [bellBadge, setBellBadge] = useState(
    () => parseInt(localStorage.getItem(KEY_BELL_BADGE) || '0', 10)
  );

  const isFirstLoad    = useRef(true);
  const knownBugIds    = useRef(new Set(JSON.parse(localStorage.getItem(KEY_KNOWN_BUGS)   || '[]')));
  const knownSystemIds = useRef(new Set(JSON.parse(localStorage.getItem(KEY_KNOWN_SYSTEM) || '[]')));

  const [toast, setToast]               = useState(null);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef                   = useRef(null);

  const showToast = (notif) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(notif); setToastVisible(true);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
      setTimeout(() => setToast(null), 350);
    }, 5000);
  };

  const prevLastLogin = useRef(parseInt(localStorage.getItem(KEY_LAST_LOGIN) || '0', 10));
  useEffect(() => { localStorage.setItem(KEY_LAST_LOGIN, String(Date.now())); }, []); // eslint-disable-line

  const ref = useRef(null);
  const authHeader = () => {
    const token = localStorage.getItem('adminToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchBugs = async () => {
    setLoading(l => ({ ...l, bugs: true }));
    setError(e => ({ ...e, bugs: null }));
    try {
      const res  = await fetch(`${API_BASE}/notifications/bugs`, { headers: authHeader() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      function timeAgo(date) {
        if (!date) return '—';
        const diff = Math.floor((Date.now() - new Date(date)) / 1000);
        if (diff < 60)    return 'Just now';
        if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
      }

      const newItems = [];
      const items = (data.notifications || []).map(n => {
        const strId     = String(n.id);
        const isNew     = n.status === 'Open' && new Date(n.createdAt) > Date.now() - 86400000;
        const isUnknown = !knownBugIds.current.has(strId);
        if (isUnknown) newItems.push({ strId, type: n.type, title: n.title, desc: n.desc, time: n.time, raw: n.createdAt });
        return {
          id: n.id, type: n.type, title: n.title, desc: n.desc,
          email: n.email || '—', time: timeAgo(n.createdAt),
          unread: seenBugIds.current.has(strId) ? false : isNew, raw: n.createdAt,
          bugTitle: n.bugTitle || '—', status: n.status || '—',
          severity: n.severity || '—', priority: n.priority || '—',
          category: n.category || '—', reportedBy: n.reportedBy || null,
          assignedTo: n.assignedTo || null, acceptedBy: n.acceptedBy || null,
          description: n.description || '', stepsToReproduce: n.stepsToReproduce || '',
          expectedBehavior: n.expectedBehavior || '', actualBehavior: n.actualBehavior || '',
          environment: n.environment || null, screenshots: n.screenshots || [],
          tags: n.tags || [], comments: n.comments || [],
          slaHours: n.slaHours || null, slaDeadline: n.slaDeadline || null,
          startedAt: n.startedAt || null, resolvedAt: n.resolvedAt || null,
          closedAt: n.closedAt || null, invalidReason: n.invalidReason || null,
          receivedDateTime: n.receivedDateTime || null,
          createdAt: n.createdAt, updatedAt: n.updatedAt,
        };
      });

      if (isFirstLoad.current) {
        items.forEach(n => knownBugIds.current.add(String(n.id)));
        localStorage.setItem(KEY_KNOWN_BUGS, JSON.stringify([...knownBugIds.current]));
        const awayMs = Date.now() - prevLastLogin.current;
        if (prevLastLogin.current > 0 && awayMs > 86400000 && items.length > 0) {
          const recent = [...items].sort((a, b) => new Date(b.raw) - new Date(a.raw))[0];
          showToast({ title: recent.title, desc: recent.desc, type: recent.type, time: recent.time, isLogin: true });
        }
      } else if (newItems.length > 0) {
        setBellBadge(prev => { const next = prev + newItems.length; localStorage.setItem(KEY_BELL_BADGE, String(next)); return next; });
        items.forEach(n => knownBugIds.current.add(String(n.id)));
        localStorage.setItem(KEY_KNOWN_BUGS, JSON.stringify([...knownBugIds.current]));
        const newest = newItems.sort((a, b) => new Date(b.raw) - new Date(a.raw))[0];
        showToast({ title: newest.title, desc: newest.desc, type: newest.type, time: newest.time, isLogin: false });
      }
      setBugs(items);
    } catch (err) {
      console.error('fetchBugs error:', err);
      setError(e => ({ ...e, bugs: 'Failed to load bug notifications.' }));
    } finally { setLoading(l => ({ ...l, bugs: false })); }
  };

  const fetchSystem = async () => {
    setLoading(l => ({ ...l, system: true }));
    setError(e => ({ ...e, system: null }));
    try {
      const res = await fetch(`${API_BASE}/notifications/system`, { headers: authHeader() });
      if (res.status === 403) { if (isFirstLoad.current) isFirstLoad.current = false; setSystem([]); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const newItems = [];
      const items = (data.notifications || []).map(n => {
        const strId     = String(n.id);
        const isUnknown = !knownSystemIds.current.has(strId);
        if (isUnknown) newItems.push({ strId, title: n.title, desc: n.desc, type: n.type, time: n.time, raw: n.raw });
        return { ...n, unread: seenSystemIds.current.has(strId) ? false : n.unread };
      });

      if (isFirstLoad.current) {
        items.forEach(n => knownSystemIds.current.add(String(n.id)));
        localStorage.setItem(KEY_KNOWN_SYSTEM, JSON.stringify([...knownSystemIds.current]));
        const awayMs = Date.now() - prevLastLogin.current;
        if (prevLastLogin.current > 0 && awayMs > 86400000 && items.length > 0) {
          const recent = [...items].sort((a, b) => new Date(b.raw) - new Date(a.raw))[0];
          setTimeout(() => showToast({ title: recent.title, desc: recent.desc, type: recent.type || 'system', time: recent.time, isLogin: true }), 0);
        }
        isFirstLoad.current = false;
      } else if (newItems.length > 0) {
        setBellBadge(prev => { const next = prev + newItems.length; localStorage.setItem(KEY_BELL_BADGE, String(next)); return next; });
        items.forEach(n => knownSystemIds.current.add(String(n.id)));
        localStorage.setItem(KEY_KNOWN_SYSTEM, JSON.stringify([...knownSystemIds.current]));
        const newest = newItems.sort((a, b) => new Date(b.raw) - new Date(a.raw))[0];
        showToast({ title: newest.title, desc: newest.desc, type: newest.type || 'system', time: newest.time, isLogin: false });
      }
      setSystem(items);
    } catch (err) { setError(e => ({ ...e, system: 'Failed to load system notifications.' })); }
    finally { setLoading(l => ({ ...l, system: false })); }
  };

  useEffect(() => {
    fetchBugs(); fetchSystem();
    const poll = setInterval(() => { fetchBugs(); fetchSystem(); }, 60000);
    return () => clearInterval(poll);
  }, []); // eslint-disable-line

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const bugUnread    = bugs.filter(n => n.unread).length;
  const systemUnread = system.filter(n => n.unread).length;
  const unreadList   = [
    ...(isInnovation ? bugs.filter(n => n.unread).map(n => ({ ...n, _source: 'bugs' })) : []),
    ...system.filter(n => n.unread).map(n => ({ ...n, _source: 'system' })),
  ];
  const unreadCount = unreadList.length;

  const markAsRead = (listKey, id) => {
    const strId = String(id);
    if (listKey === 'bugs') {
      seenBugIds.current.add(strId);
      localStorage.setItem(KEY_SEEN_BUGS, JSON.stringify([...seenBugIds.current]));
      setBugs(prev => prev.map(n => String(n.id) === strId ? { ...n, unread: false } : n));
    } else {
      seenSystemIds.current.add(strId);
      localStorage.setItem(KEY_SEEN_SYSTEM, JSON.stringify([...seenSystemIds.current]));
      setSystem(prev => prev.map(n => String(n.id) === strId ? { ...n, unread: false } : n));
    }
  };

  const markAllAsRead = () => {
    bugs.forEach(n => seenBugIds.current.add(String(n.id)));
    system.forEach(n => seenSystemIds.current.add(String(n.id)));
    localStorage.setItem(KEY_SEEN_BUGS,   JSON.stringify([...seenBugIds.current]));
    localStorage.setItem(KEY_SEEN_SYSTEM, JSON.stringify([...seenSystemIds.current]));
    setBugs(prev   => prev.map(n => ({ ...n, unread: false })));
    setSystem(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleBellClick = () => {
    setBellBadge(0); localStorage.setItem(KEY_BELL_BADGE, '0');
    bugs.forEach(n => knownBugIds.current.add(String(n.id)));
    system.forEach(n => knownSystemIds.current.add(String(n.id)));
    localStorage.setItem(KEY_KNOWN_BUGS,   JSON.stringify([...knownBugIds.current]));
    localStorage.setItem(KEY_KNOWN_SYSTEM, JSON.stringify([...knownSystemIds.current]));
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastVisible(false); setTimeout(() => setToast(null), 350);
    setOpen(o => !o);
  };

  const TAB_ROUTES = { bugs: '/admin/bug-reports', system: '/admin/activity-logs' };
  const listMap    = { bugs, system, unread: unreadList };
  const list       = listMap[tab] || [];
  const isLoadingCurrent = tab === 'unread' ? (loading.bugs || loading.system) : loading[tab];
  const errorCurrent     = tab === 'unread' ? (error.bugs  || error.system)    : error[tab];

  const accent     = darkMode ? NEU.indigo  : NEU.maroon;
  const accentBr   = darkMode ? '#a5b4fc'   : NEU.maroonBright;
  const surfaceBg  = darkMode ? NEU.bgDark  : NEU.bg;
  const textPri    = darkMode ? '#f0f0f5'   : NEU.text0;
  const textSec    = darkMode ? 'rgba(240,240,245,0.55)' : NEU.text1;
  const textMut    = darkMode ? 'rgba(240,240,245,0.3)'  : NEU.text2;
  const shadow     = darkMode ? NEU.shadowDark      : NEU.shadow;
  const shadowHov  = darkMode ? NEU.shadowHoverDark : NEU.shadowHover;
  const shadowIn   = darkMode ? NEU.shadowInsetDark : NEU.shadowInset;
  const divider    = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(13,39,80,0.06)';

  const tabList = [
    ...(isInnovation ? [{ key: 'bugs',   label: 'Bug Reports',    count: bugUnread    }] : []),
    ...(isInnovation
      ? [{ key: 'system', label: 'System Reports', count: systemUnread }]
      : [{ key: 'system', label: 'System Reports', count: systemUnread }]),
    { key: 'unread', label: 'Unread', count: unreadCount },
  ];

  const footerViewLabel = { unread: 'View All', bugs: 'View Bug Reports', system: 'View All Logs' };

  const PillTab = ({ tabKey, label, count }) => {
    const active = tab === tabKey;
    return (
      <button
        onClick={() => setTab(tabKey)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 20, border: 'none',
          background: surfaceBg,
          boxShadow: active ? shadowIn : shadow,
          color: active ? accentBr : textSec,
          fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.15s', fontFamily: NEU.font, whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.boxShadow = shadowHov; e.currentTarget.style.color = accentBr; } }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.boxShadow = shadow;    e.currentTarget.style.color = textSec; } }}
      >
        {label}
        {count > 0 && (
          <span style={{ fontSize: 9, fontWeight: 700, background: accent, color: '#fff', padding: '1px 6px', borderRadius: 999, minWidth: 16, textAlign: 'center', boxShadow: 'none' }}>
            {count}
          </span>
        )}
      </button>
    );
  };

  const IconBtn = ({ onClick, title, children, active }) => (
    <button
      onClick={onClick} title={title}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 34, height: 34, borderRadius: '50%', border: 'none',
        background: surfaceBg, boxShadow: active ? shadowIn : shadow,
        color: active ? accentBr : textMut, cursor: 'pointer',
        transition: 'all 0.15s', flexShrink: 0,
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.boxShadow = shadowHov; e.currentTarget.style.color = textPri; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.boxShadow = shadow;    e.currentTarget.style.color = textMut; } }}
    >
      {children}
    </button>
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <style>{`
        @keyframes nd-dropIn { from{opacity:0;transform:translateY(-8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes nd-spin { to{transform:rotate(360deg)} }
        @keyframes nd-toastIn  { from{opacity:0;transform:translateY(-8px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes nd-toastOut { from{opacity:1;transform:translateY(0) scale(1)} to{opacity:0;transform:translateY(-8px) scale(0.97)} }
        @keyframes nd-toastBar { from{width:100%} to{width:0%} }
        .nd-card { animation: nd-dropIn 0.22s cubic-bezier(0.34,1.2,0.6,1) forwards; }
        .nd-toast        { animation: nd-toastIn  0.22s ease forwards; }
        .nd-toast.hiding { animation: nd-toastOut 0.28s ease forwards; }
        .nd-toast-bar { position:absolute;bottom:0;left:0;height:3px;background:${accent};border-radius:0 0 16px 16px;animation:nd-toastBar 5s linear forwards; }
        .nd-spinner { width:20px;height:20px;border:2.5px solid ${darkMode?'rgba(255,255,255,0.08)':'rgba(13,39,80,0.08)'};border-top-color:${accent};border-radius:50%;animation:nd-spin 0.65s linear infinite;margin:0 auto; }
        .nd-scroll::-webkit-scrollbar{width:3px}.nd-scroll::-webkit-scrollbar-track{background:transparent}.nd-scroll::-webkit-scrollbar-thumb{background:${darkMode?'rgba(255,255,255,0.08)':'rgba(13,39,80,0.10)'};border-radius:3px}
        .nd-row-divider{height:1px;background:${divider};margin:0 13px}
        @media(min-width:768px){.nd-card{position:absolute!important;top:calc(100% + 10px)!important;right:0!important;left:auto!important;width:430px!important}}
        @media(max-width:767px){.nd-card{position:fixed!important;top:60px!important;left:8px!important;right:8px!important;width:auto!important;border-radius:20px!important;max-height:82vh!important;overflow-y:auto!important}}
      `}</style>

      {toast && (
        <div
          className={`nd-toast${toastVisible ? '' : ' hiding'}`}
          onClick={() => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); setToastVisible(false); setTimeout(() => setToast(null), 350); setOpen(true); }}
          style={{ position:'absolute',top:'calc(100% + 10px)',right:0,width:300,background:surfaceBg,borderRadius:16,boxShadow:darkMode?'10px 10px 28px rgba(0,0,0,0.55), -6px -6px 16px rgba(255,255,255,0.03)':'10px 10px 28px rgba(13,39,80,0.18), -6px -6px 16px rgba(255,255,255,0.92)',borderLeft:`4px solid ${accent}`,padding:'12px 13px 17px',zIndex:10000,fontFamily:NEU.font,overflow:'hidden',cursor:'pointer' }}
        >
          <div className="nd-toast-bar" />
          <div style={{ display:'flex',alignItems:'flex-start',gap:10 }}>
            {(() => { const cfg=TYPE_CONFIG[toast.type]||TYPE_CONFIG.system; const color=neuAvatarColor(toast.title||''); return (
              <div style={{width:32,height:32,borderRadius:10,flexShrink:0,background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#fff',fontFamily:NEU.font,boxShadow:`0 0 0 2px ${darkMode?'#1e2028':NEU.bg}, 0 4px 8px ${color}45`}}>{cfg.letter}</div>
            );})()}
            <div style={{flex:1,minWidth:0}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:2}}>
                <span style={{fontSize:9,fontWeight:700,color:accent,textTransform:'uppercase',letterSpacing:'0.07em'}}>{toast.isLogin?'🔔 Missed':'🔔 New'}</span>
                <button onClick={e=>{e.stopPropagation();if(toastTimerRef.current)clearTimeout(toastTimerRef.current);setToastVisible(false);setTimeout(()=>setToast(null),350);}} style={{background:'transparent',border:'none',cursor:'pointer',color:textMut,padding:'1px',lineHeight:1}}><X size={11}/></button>
              </div>
              <div style={{fontSize:12,fontWeight:700,color:textPri,marginBottom:2,lineHeight:1.3}}>{toast.title}</div>
              <div style={{fontSize:10.5,color:textSec,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:2}}>{toast.desc}</div>
              <span style={{fontSize:9.5,color:textMut}}>{toast.time}</span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleBellClick}
        title="Notifications"
        style={{
          position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 38, height: 38, borderRadius: '50%', border: 'none',
          background: surfaceBg, boxShadow: shadow,
          color: textSec, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
          padding: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = shadowHov; e.currentTarget.style.color = textPri; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = shadow;    e.currentTarget.style.color = textSec; }}
      >
        <Bell size={18} />
        {bellBadge > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            minWidth: 16, height: 16, borderRadius: 8,
            background: accent, color: '#fff',
            fontSize: 9, fontWeight: 700, fontFamily: NEU.font,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px', boxShadow: 'none',
          }}>{bellBadge}</span>
        )}
      </button>

      {open && (
        <div className="nd-card" style={{ position:'absolute',top:'calc(100% + 10px)',right:0,width:430,background:surfaceBg,borderRadius:20,boxShadow:darkMode?'12px 12px 32px rgba(0,0,0,0.6), -8px -8px 20px rgba(255,255,255,0.03)':'12px 12px 32px rgba(13,39,80,0.18), -8px -8px 20px rgba(255,255,255,0.92)',overflow:'hidden',zIndex:9999,fontFamily:NEU.font }}>
          <div style={{ display:'flex',alignItems:'center',gap:6,padding:'12px 14px',background:surfaceBg,borderBottom:`1px solid ${divider}`,flexWrap:'wrap' }}>
            <div style={{ display:'flex',alignItems:'center',gap:7,marginRight:4 }}>
              <Bell size={14} color={accent} strokeWidth={2.5} />
              <span style={{ fontSize:13,fontWeight:700,color:textPri,letterSpacing:'-0.01em',fontFamily:NEU.font }}>Notifications</span>
              {unreadCount > 0 && <span style={{ fontSize:9,fontWeight:700,background:accent,color:'#fff',padding:'2px 8px',borderRadius:999,boxShadow:'none',fontFamily:NEU.font }}>{unreadCount} unread</span>}
            </div>
            <div style={{ flex:1 }} />
            <IconBtn onClick={() => { fetchBugs(); fetchSystem(); }} title="Refresh">
              <RefreshCw size={13} style={(loading.bugs||loading.system)?{animation:'nd-spin 0.65s linear infinite'}:{}} />
            </IconBtn>
            <IconBtn onClick={() => setOpen(false)} title="Close"><X size={13} /></IconBtn>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:6,padding:'10px 14px',background:surfaceBg,borderBottom:`1px solid ${divider}`,flexWrap:'wrap' }}>
            {tabList.map(t => <PillTab key={t.key} tabKey={t.key} label={t.label} count={t.count} />)}
          </div>
          <div className="nd-scroll" style={{ maxHeight:340,overflowY:'auto',overflowX:'hidden',background:surfaceBg }}>
            {isLoadingCurrent ? (
              <div style={{ padding:'44px 20px',textAlign:'center' }}>
                <div className="nd-spinner" />
                <div style={{ color:textMut,fontSize:11,marginTop:12,fontFamily:NEU.font }}>Loading…</div>
              </div>
            ) : errorCurrent ? (
              <div style={{ padding:'36px 20px',textAlign:'center' }}>
                <div style={{ width:44,height:44,borderRadius:14,margin:'0 auto 12px',background:surfaceBg,boxShadow:shadow,display:'flex',alignItems:'center',justifyContent:'center' }}><AlertTriangle size={20} color={accent} /></div>
                <div style={{ color:textSec,fontSize:12,marginBottom:14,fontFamily:NEU.font }}>{errorCurrent}</div>
                <button onClick={() => tab==='bugs'?fetchBugs():fetchSystem()} style={{ padding:'7px 18px',borderRadius:20,border:'none',background:accent,color:'#fff',fontSize:11.5,fontWeight:600,cursor:'pointer',fontFamily:NEU.font,boxShadow:'none' }}>Retry</button>
              </div>
            ) : list.length === 0 ? (
              <div style={{ padding:'48px 20px',textAlign:'center' }}>
                <div style={{ width:52,height:52,borderRadius:16,margin:'0 auto 14px',background:surfaceBg,boxShadow:shadow,display:'flex',alignItems:'center',justifyContent:'center' }}><MailOpen size={22} color={textMut} /></div>
                <div style={{ fontSize:13,fontWeight:600,color:textPri,fontFamily:NEU.font,marginBottom:4 }}>{tab==='unread'?"You're all caught up!":'No notifications'}</div>
                <div style={{ fontSize:11,color:textMut,fontFamily:NEU.font }}>{tab==='unread'?'New alerts will appear here.':'Nothing to show right now.'}</div>
              </div>
            ) : (
              list.map((n, i) => (
                <div key={n.id}>
                  <NotifItem
                    notif={n} darkMode={darkMode}
                    onRead={(id) => { const listKey = tab==='unread'?(n._source||'bugs'):tab; markAsRead(listKey, id); }}
                    onNavigate={(id) => { setOpen(false); const route=tab==='unread'?TAB_ROUTES[n._source||'bugs']:TAB_ROUTES[tab]; navigate(route,{state:{openId:String(id),fromNotification:true}}); }}
                  />
                  {i < list.length - 1 && <div className="nd-row-divider" />}
                </div>
              ))
            )}
          </div>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px 12px',background:surfaceBg,borderTop:`1px solid ${divider}`,gap:8 }}>
            <button
              onClick={markAllAsRead} disabled={unreadCount===0}
              style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:20,border:'none',background:surfaceBg,boxShadow:unreadCount===0?'none':shadow,color:unreadCount===0?textMut:textSec,fontSize:11.5,fontWeight:600,cursor:unreadCount===0?'default':'pointer',transition:'all 0.15s',fontFamily:NEU.font,opacity:unreadCount===0?0.45:1 }}
              onMouseEnter={e=>{if(unreadCount>0){e.currentTarget.style.boxShadow=shadowHov;e.currentTarget.style.color=accentBr;}}}
              onMouseLeave={e=>{if(unreadCount>0){e.currentTarget.style.boxShadow=shadow;e.currentTarget.style.color=textSec;}}}
            >
              <CheckCircle2 size={12} />Mark all read
            </button>
            <button
              onClick={() => { setOpen(false); if(tab==='unread') navigate(bugUnread>0?TAB_ROUTES.bugs:TAB_ROUTES.system); else navigate(TAB_ROUTES[tab]); }}
              style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 18px',borderRadius:20,border:'none',background:accent,color:'#fff',fontSize:11.5,fontWeight:700,cursor:'pointer',transition:'opacity 0.15s',fontFamily:NEU.font,whiteSpace:'nowrap',boxShadow:'none' }}
              onMouseEnter={e=>{ e.currentTarget.style.opacity='0.88'; }}
              onMouseLeave={e=>{ e.currentTarget.style.opacity='1'; }}
            >
              {footerViewLabel[tab]||'View All'}<ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  LOGOUT MODAL
// ─────────────────────────────────────────────
function LogoutModal({ darkMode, onConfirm, onCancel }) {
  return (
    <>
      <div onClick={onCancel} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.60)',zIndex:99998 }} />
      <div style={{ position:'fixed',top:'50%',left:'50%',transform:'translate(-50%, -50%)',zIndex:99999,width:360,maxWidth:'calc(100vw - 32px)',background:darkMode?'#1a1a1a':'#ffffff',borderRadius:16,boxShadow:darkMode?'0 32px 80px rgba(0,0,0,0.85)':'0 32px 80px rgba(0,0,0,0.22)',fontFamily:"'Poppins', sans-serif",overflow:'visible',animation:'logoutModalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
        <style>{`@keyframes logoutModalIn{from{opacity:0;transform:translate(-50%,-54%) scale(0.93)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}`}</style>
        <div style={{ background:'linear-gradient(160deg, #7f1d1d 0%, #991b1b 60%, #b91c1c 100%)',borderRadius:'16px 16px 0 0',height:110,position:'relative',display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
          <div style={{ width:72,height:72,borderRadius:'50%',background:'#ffffff',border:'4px solid #ffffff',boxShadow:'0 8px 24px rgba(0,0,0,0.25)',display:'flex',alignItems:'center',justifyContent:'center',position:'absolute',bottom:-36,left:'50%',transform:'translateX(-50%)',zIndex:2 }}>
            <LogOut size={32} color="#991b1b" strokeWidth={2.2} />
          </div>
        </div>
        <div style={{ padding:'52px 28px 28px',textAlign:'center' }}>
          <div style={{ fontSize:18,fontWeight:700,color:darkMode?'#ffffff':'#111827',marginBottom:10,letterSpacing:'-0.01em' }}>Confirm Logout</div>
          <div style={{ fontSize:12,fontStyle:'italic',color:darkMode?'rgba(255,255,255,0.55)':'#6b7280',lineHeight:1.65,marginBottom:28 }}>Once logged out, your session will end<br/>and you'll be redirected to the login page.</div>
          <div style={{ display:'flex',gap:12 }}>
            <button onClick={onCancel} style={{ flex:1,height:42,border:darkMode?'1px solid #3a3a3a':'1px solid #d1d5db',background:darkMode?'#2a2a2a':'#f3f4f6',borderRadius:10,fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:darkMode?'#cccccc':'#4b5563',cursor:'pointer',fontFamily:"'Poppins', sans-serif",transition:'all 0.15s' }} onMouseEnter={e=>{e.currentTarget.style.background=darkMode?'#333333':'#e5e7eb'}} onMouseLeave={e=>{e.currentTarget.style.background=darkMode?'#2a2a2a':'#f3f4f6'}}>Cancel</button>
            <button onClick={onConfirm} style={{ flex:1,height:42,border:'none',background:'linear-gradient(135deg, #991b1b, #dc2626)',borderRadius:10,fontSize:11,fontWeight:700,letterSpacing:'0.08em',textTransform:'uppercase',color:'#ffffff',cursor:'pointer',fontFamily:"'Poppins', sans-serif",boxShadow:'0 4px 14px rgba(185,28,28,0.4)',transition:'all 0.15s',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }} onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(135deg, #b91c1c, #ef4444)';e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 6px 18px rgba(185,28,28,0.5)'}} onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(135deg, #991b1b, #dc2626)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 4px 14px rgba(185,28,28,0.4)'}}><LogOut size={13}/>Logout</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
//  LAYOUT — neumorphic sidebar + header
// ─────────────────────────────────────────────
const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen]         = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [adminData, setAdminData] = useState(() => {
    try { const s = localStorage.getItem('adminData'); return s ? JSON.parse(s) : null; }
    catch (_) { return null; }
  });
  const [slaOpen, setSlaOpen]           = useState(false);
  const [deptLogsOpen, setDeptLogsOpen] = useState(false);
  const [darkMode, setDarkMode]         = useState(() => localStorage.getItem('darkMode') === 'true');

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => { if (window.innerWidth <= 768) setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth > 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = (window.innerWidth <= 768 && sidebarOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  useEffect(() => { if (location.pathname.startsWith('/admin/sla')) setSlaOpen(true); }, [location.pathname]);
  useEffect(() => {
    if (location.pathname === '/admin/sla/department-logs' || location.pathname === '/admin/sla/compliance-logs')
      setDeptLogsOpen(true);
  }, [location.pathname]);

  const userRole          = adminData?.role?.trim() || '';
  const FULL_ACCESS_ROLES = ['Super Admin', 'Innovation'];
  const isFullAccess      = FULL_ACCESS_ROLES.includes(userRole);

  const commonItems      = [];
  const fullTopMenuItems = [
    { path: '/admin/messaging',       icon: MessageCircle,   label: 'Messaging'     },
    { path: '/admin/user-creation',   icon: UserPlus,        label: 'User Creation' },
  ];
  const ROLE_TOP_MENUS = {
    'Audit and Compliance': [{ path: '/admin/messaging', icon: MessageCircle, label: 'Messaging' }],
    'Human Resource':       [{ path: '/admin/messaging', icon: MessageCircle, label: 'Messaging' }],
    'Accounting':           [{ path: '/admin/messaging', icon: MessageCircle, label: 'Messaging' }],
    'Recruitment':          [{ path: '/admin/messaging', icon: MessageCircle, label: 'Messaging' }],
    'Creatives':            [{ path: '/admin/messaging', icon: MessageCircle, label: 'Messaging' }],
    'Marketing':            [{ path: '/admin/messaging', icon: MessageCircle, label: 'Messaging' }],
    'Operations':           [{ path: '/admin/messaging', icon: MessageCircle, label: 'Messaging' }],
    'User':                 [{ path: '/admin/messaging', icon: MessageCircle, label: 'Messaging' }],
  };
  const roleBottomItems = [
    { path: '/admin/activity-logs', icon: ScrollText, label: 'Activity Logs' },
    { path: '/admin/notifications', icon: Bell,       label: 'Notifications'  },
  ];
  const ROLE_BOTTOM_MENUS = {
    'Audit and Compliance': roleBottomItems, 'Human Resource': roleBottomItems,
    'Accounting': roleBottomItems,           'Recruitment':    roleBottomItems,
    'Creatives':  roleBottomItems,           'Marketing':      roleBottomItems,
    'Operations': roleBottomItems,           'User':           roleBottomItems,
  };
  const ROLES_WITH_SLA  = ['Audit and Compliance','Operations','Super Admin','Innovation','Human Resource','Accounting','Recruitment','Creatives','Marketing','User'];
  const showSLA         = isFullAccess || ROLES_WITH_SLA.includes(userRole);
  const topMenuItems    = isFullAccess ? fullTopMenuItems : (ROLE_TOP_MENUS[userRole] || []);
  const bottomMenuItems = isFullAccess
    ? [{ path: '/admin/activity-logs', icon: ScrollText, label: 'Activity Logs' }]
    : (ROLE_BOTTOM_MENUS[userRole] || []);

  const slaSubItems = [
    { path: '/admin/sla/executive-summary',    icon: BarChart3,  label: 'Executive Summary'    },
    { path: '/admin/sla/escalation-analytics', icon: TrendingUp, label: 'Escalation Analytics' },
    { path: '/admin/sla/response-time-trends', icon: Clock,      label: 'Response Time Trends' },
  ];
  const deptLogsChildren = [
    { path: '/admin/sla/department-logs', icon: LayoutList, label: 'Department Logs' },
    { path: '/admin/sla/compliance-logs', icon: FileText,   label: 'Compliance Logs' },
  ];

  const isActive         = (path) => location.pathname === path || location.pathname.startsWith(path);
  const isSlaActive      = location.pathname.startsWith('/admin/sla');
  const isDeptLogsActive = location.pathname === '/admin/sla/department-logs' || location.pathname === '/admin/sla/compliance-logs';
  const isMobile         = () => window.innerWidth <= 768;

  const handleLogoutClick   = () => setShowLogoutModal(true);
  const handleLogoutCancel  = () => setShowLogoutModal(false);
  const handleLogoutConfirm = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/logout`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) { console.error('Logout error:', err); }
    finally {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      localStorage.removeItem('rememberMe');
      setShowLogoutModal(false);
      navigate('/admin/login');
    }
  };

  const getUserInitials = () => {
    if (!adminData?.name) return 'A';
    const names = adminData.name.split(' ');
    return names.length >= 2 ? names[0][0] + names[1][0] : names[0][0];
  };

  // ── neumorphic tokens resolved per dark/light ──
  const surfaceBg = darkMode ? NEU.bgDark  : NEU.bg;
  const accent    = darkMode ? NEU.indigo  : NEU.maroon;
  const accentBr  = darkMode ? '#a5b4fc'   : NEU.maroonBright;
  const textPri   = darkMode ? '#f0f0f5'   : NEU.text0;
  const textSec   = darkMode ? 'rgba(240,240,245,0.55)' : NEU.text1;
  const textMut   = darkMode ? 'rgba(240,240,245,0.3)'  : NEU.text2;
  const shadow    = darkMode ? NEU.shadowDark      : NEU.shadow;
  const shadowHov = darkMode ? NEU.shadowHoverDark : NEU.shadowHover;
  const shadowIn  = darkMode ? NEU.shadowInsetDark : NEU.shadowInset;
  const divider   = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(13,39,80,0.06)';

  const SIDEBAR_W     = sidebarOpen ? 228 : 64;
  const HEADER_H      = 56;

  // ── Nav Item — flat inactive, neumorphic active only ──
  const NavPill = ({ path, icon: Icon, label, depth = 0 }) => {
    const active = isActive(path);
    const [hov, setHov] = useState(false);
    const indent = depth === 1 ? 8 : depth === 2 ? 16 : 0;

    const bgColor = active
      ? (darkMode ? `${accent}18` : `${accent}0d`)
      : hov
        ? (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(13,39,80,0.04)')
        : 'transparent';

    const boxShadow = active
      ? shadowIn
      : hov
        ? (darkMode ? '2px 2px 8px rgba(0,0,0,0.25), -1px -1px 4px rgba(255,255,255,0.02)' : '2px 2px 8px rgba(13,39,80,0.08), -1px -1px 4px rgba(255,255,255,0.7)')
        : 'none';

    return (
      <Link
        to={path}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: sidebarOpen ? `9px 14px 9px ${14 + indent}px` : '9px 0',
          justifyContent: sidebarOpen ? 'flex-start' : 'center',
          borderRadius: 12, textDecoration: 'none',
          margin: '1px 8px',
          background: bgColor,
          boxShadow,
          color: active ? (darkMode ? '#fff' : accent) : hov ? textPri : textSec,
          fontSize: depth > 0 ? 12 : 13, fontWeight: active ? 600 : 500,
          fontFamily: NEU.font, transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
          borderLeft: active ? `3px solid ${accent}` : '3px solid transparent',
        }}
        title={!sidebarOpen ? label : undefined}
      >
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? accent : hov ? textPri : textMut, transition: 'color 0.15s' }}>
          <Icon size={depth > 0 ? 15 : 18} />
        </span>
        {sidebarOpen && (
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {label}
          </span>
        )}
      </Link>
    );
  };

  // ── Accordion trigger — flat inactive, subtle active ──
  const AccordionTrigger = ({ icon: Icon, label, isOpen, onToggle, active }) => {
    const [hov, setHov] = useState(false);

    const bgColor = active
      ? (darkMode ? `${accent}18` : `${accent}0d`)
      : hov
        ? (darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(13,39,80,0.04)')
        : 'transparent';

    const boxShadow = active
      ? shadowIn
      : hov
        ? (darkMode ? '2px 2px 8px rgba(0,0,0,0.25), -1px -1px 4px rgba(255,255,255,0.02)' : '2px 2px 8px rgba(13,39,80,0.08), -1px -1px 4px rgba(255,255,255,0.7)')
        : 'none';

    return (
      <button
        onClick={onToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: sidebarOpen ? '9px 14px' : '9px 0',
          justifyContent: sidebarOpen ? 'flex-start' : 'center',
          borderRadius: 12, border: 'none', cursor: 'pointer',
          margin: '1px 8px', width: 'calc(100% - 16px)',
          background: bgColor, boxShadow,
          color: active ? (darkMode ? '#fff' : accent) : hov ? textPri : textSec,
          fontSize: 13, fontWeight: active ? 600 : 500,
          fontFamily: NEU.font,
          transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
          borderLeft: active ? `3px solid ${accent}` : '3px solid transparent',
        }}
        title={!sidebarOpen ? label : undefined}
      >
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: active ? accent : hov ? textPri : textMut, transition: 'color 0.15s' }}>
          <Icon size={18} />
        </span>
        {sidebarOpen && (
          <>
            <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
            <ChevronDown size={13} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0, color: textMut }} />
          </>
        )}
      </button>
    );
  };

  // ── Neumorphic icon-only header button ──
  const HeaderIconBtn = ({ onClick, title, children, badge }) => {
    const [hov, setHov] = useState(false);
    return (
      <button
        onClick={onClick} title={title}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 38, height: 38, borderRadius: '50%', border: 'none', position: 'relative',
          background: surfaceBg,
          boxShadow: hov ? shadowHov : shadow,
          color: hov ? textPri : textSec,
          cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
        }}
      >
        {children}
        {badge > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            minWidth: 16, height: 16, borderRadius: 8,
            background: accent, color: '#fff',
            fontSize: 9, fontWeight: 700, fontFamily: NEU.font,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
            boxShadow: `0 2px 6px ${accent}60`,
          }}>{badge}</span>
        )}
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: surfaceBg, fontFamily: NEU.font, transition: 'background 0.2s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes backdropIn { from{opacity:0} to{opacity:1} }
        @keyframes sidebarSlideIn { from{transform:translateX(-100%)} to{transform:translateX(0)} }

        /* ── Neumorphic scrollbar ── */
        .neu-scroll::-webkit-scrollbar { width: 4px; }
        .neu-scroll::-webkit-scrollbar-track { background: transparent; }
        .neu-scroll::-webkit-scrollbar-thumb {
          background: ${darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(13,39,80,0.09)'};
          border-radius: 4px;
        }

        /* ── Accordion body ── */
        .neu-acc-body {
          max-height: 0; overflow: hidden;
          transition: max-height 0.28s cubic-bezier(0.4,0,0.2,1);
        }
        .neu-acc-body.open { max-height: 480px; }

        /* ── Sidebar backdrop (mobile) ── */
        .neu-backdrop {
          position: fixed; inset: 0; z-index: 199;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
        }

        /* ── DM switch track/thumb (unused now, keep for safety) ── */
        .dm-sw { display:none; }

        /* ── User avatar fallback ── */
        .neu-avatar { display:none; }

        /* Header bell override — kill old CSS class styles */
        .header-btn, .notification-btn, .notification-badge { all: unset; }

        @media (max-width: 767px) {
          .neu-sidebar {
            position: fixed !important;
            z-index: 200 !important;
            left: 0 !important;
            transform: ${sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
            transition: transform 0.26s cubic-bezier(0.4,0,0.2,1) !important;
            width: 228px !important;
          }
        }
      `}</style>

      {showLogoutModal && <LogoutModal darkMode={darkMode} onConfirm={handleLogoutConfirm} onCancel={handleLogoutCancel} />}

      {/* Backdrop (mobile) */}
      {sidebarOpen && isMobile() && (
        <div className="neu-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ════════════════════════════════════════
          NEUMORPHIC SIDEBAR
      ════════════════════════════════════════ */}
      <aside
        className="neu-sidebar"
        style={{
          width: SIDEBAR_W,
          minWidth: SIDEBAR_W,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: surfaceBg,
          boxShadow: darkMode
            ? '4px 0 24px rgba(0,0,0,0.5)'
            : '4px 0 24px rgba(13,39,80,0.10)',
          transition: 'width 0.26s cubic-bezier(0.4,0,0.2,1), min-width 0.26s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
          flexShrink: 0,
          zIndex: 100,
        }}
      >
        {/* ── Logo bar ── */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: sidebarOpen ? 'space-between' : 'center',
          padding: sidebarOpen ? '0 14px' : '0',
          height: HEADER_H,
          borderBottom: `1px solid ${divider}`,
          flexShrink: 0,
        }}>
          {/* Logo mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10, flexShrink: 0,
              background: surfaceBg, boxShadow: shadow,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              <img src="/uploads/bugg.png" alt="TEXIONIX" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            </div>
            {sidebarOpen && (
              <span style={{ fontSize: 14, fontWeight: 700, color: textPri, letterSpacing: '-0.01em', fontFamily: NEU.font, whiteSpace: 'nowrap' }}>
                TEXIONIX
              </span>
            )}
          </div>

          {/* Collapse toggle */}
          {sidebarOpen && (
            <button
              className="desktop-only"
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 8, border: 'none',
                background: surfaceBg, boxShadow: shadow,
                color: textMut, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = shadowHov; e.currentTarget.style.color = textPri; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = shadow;    e.currentTarget.style.color = textMut; }}
            >
              <ChevronLeft size={14} />
            </button>
          )}
          {!sidebarOpen && (
            <button
              className="desktop-only"
              onClick={() => setSidebarOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 10, border: 'none',
                background: surfaceBg, boxShadow: shadow,
                color: textMut, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = shadowHov; e.currentTarget.style.color = textPri; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = shadow;    e.currentTarget.style.color = textMut; }}
            >
              <ChevronRight size={14} />
            </button>
          )}
          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, border: 'none', background: surfaceBg, boxShadow: shadow, color: textMut, cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Nav items ── */}
        <nav className="neu-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 0' }}>

          {topMenuItems.map(({ path, icon, label }) => (
            <NavPill key={path} path={path} icon={icon} label={label} />
          ))}

          {commonItems.map(({ path, icon, label }) => (
            <NavPill key={path} path={path} icon={icon} label={label} />
          ))}

          
          {bottomMenuItems.map(({ path, icon, label }) => (
            <NavPill key={path} path={path} icon={icon} label={label} />
          ))}
        </nav>

        {/* ── Sidebar footer ── */}
        <div style={{ borderTop: `1px solid ${divider}`, padding: '8px 0 10px', flexShrink: 0 }}>

          {/* Dark mode row — same style as a nav item */}
          <button
            onClick={() => setDarkMode(d => !d)}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: sidebarOpen ? '9px 14px' : '9px 0',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              width: 'calc(100% - 16px)', margin: '1px 8px',
              borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'transparent', boxShadow: 'none',
              color: textSec, fontSize: 13, fontWeight: 500,
              fontFamily: NEU.font, transition: 'background 0.15s, color 0.15s',
              borderLeft: '3px solid transparent',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(13,39,80,0.04)'; e.currentTarget.style.color = textPri; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = textSec; }}
          >
            <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: textMut }}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </span>
            {sidebarOpen && (
              <>
                <span style={{ flex: 1, textAlign: 'left' }}>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                {/* Toggle switch — visual only, click handled by parent button */}
                <span
                  style={{
                    width: 36, height: 20, borderRadius: 10, flexShrink: 0,
                    background: darkMode ? accent : '#d1d5db',
                    boxShadow: shadowIn,
                    position: 'relative', display: 'inline-flex', alignItems: 'center',
                    transition: 'background 0.2s',
                    pointerEvents: 'none',
                  }}
                >
                  <span style={{
                    position: 'absolute',
                    left: darkMode ? 18 : 2,
                    width: 16, height: 16, borderRadius: 8,
                    background: '#fff',
                    boxShadow: '1px 1px 4px rgba(0,0,0,0.25)',
                    transition: 'left 0.2s',
                  }} />
                </span>
              </>
            )}
          </button>

          {/* User card — clean, no duplicate, just avatar + name + role */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: sidebarOpen ? '8px 14px' : '8px 0',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
            margin: '1px 8px',
            borderRadius: 12,
            background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(13,39,80,0.04)',
            borderLeft: '3px solid transparent',
          }}>
            {/* Avatar circle */}
            <div style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              background: neuAvatarColor(adminData?.name || 'Admin'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden',
              fontFamily: NEU.font,
            }}>
              {adminData?.profilePicture
                ? <img src={adminData.profilePicture} alt={adminData.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : getUserInitials()}
            </div>
            {sidebarOpen && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: textPri, fontFamily: NEU.font, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                  {adminData?.name || 'Admin'}
                </div>
                <div style={{ fontSize: 10.5, color: textMut, fontFamily: NEU.font, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.4 }}>
                  {adminData?.role || 'Administrator'}
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <NavPill path="/admin/settings" icon={Settings} label="Settings" />
        </div>
      </aside>

      {/* ════════════════════════════════════════
          MAIN AREA
      ════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* ── NEUMORPHIC HEADER ── */}
        <header style={{
          height: HEADER_H, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 18px',
          background: surfaceBg,
          boxShadow: darkMode
            ? '0 4px 20px rgba(0,0,0,0.45)'
            : '0 4px 20px rgba(13,39,80,0.09)',
          zIndex: 50,
          gap: 12,
        }}>
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Mobile hamburger */}
            <button
              className="mobile-only"
              onClick={() => setSidebarOpen(o => !o)}
              style={{
                display: 'none', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 12, border: 'none',
                background: surfaceBg, boxShadow: shadow,
                color: textSec, cursor: 'pointer',
              }}
            >
              <Menu size={18} />
            </button>

            {/* Title chip — neumorphic inset card */}
            <div style={{
              background: surfaceBg,
              boxShadow: shadowIn,
              borderRadius: 12,
              padding: '6px 14px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: textPri, fontFamily: NEU.font, lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                Bug Reporting System
              </span>
              <span style={{ fontSize: 10, fontWeight: 400, color: textMut, fontFamily: NEU.font, whiteSpace: 'nowrap' }}>
                TelexPH
              </span>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Notification bell (keeps its own internal button, just wrapped) */}
            <NotificationBell darkMode={darkMode} userRole={adminData?.role?.trim() || ''} />

            {/* Logout pill button */}
            <button
              onClick={handleLogoutClick}
              title="Logout"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '7px 15px', borderRadius: 20, border: 'none',
                background: surfaceBg, boxShadow: shadow,
                color: textSec, fontSize: 12, fontWeight: 600,
                fontFamily: NEU.font, cursor: 'pointer', transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = shadowHov; e.currentTarget.style.color = '#dc2626'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = shadow;    e.currentTarget.style.color = textSec; }}
            >
              <LogOut size={14} />
              <span className="header-logout-text">Logout</span>
            </button>
          </div>
        </header>

        {/* ── Main content ── */}
        <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: surfaceBg }}>
          {children}
        </main>
      </div>

      {/* Keep Layout.css for any page-level overrides, but override its sidebar/header rules */}
      <style>{`
        /* Override Layout.css sidebar/header with neumorphic styles */
        .layout-container { display:contents; }
        .sidebar { display:none !important; }
        .main-wrapper { display:contents; }
        .main-header { display:none !important; }
        .main-content { display:contents; }

        /* Mobile visibility helpers */
        @media (max-width: 767px) {
          .mobile-only { display:flex !important; }
          .desktop-only { display:none !important; }
          .header-logout-text { display:none; }
        }
        @media (min-width: 768px) {
          .mobile-only { display:none !important; }
          .desktop-only { display:flex !important; }
        }
      `}</style>
    </div>
  );
};

export default Layout;