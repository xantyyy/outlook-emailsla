import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  RefreshCw,
  Download,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Users,
  ShieldCheck,
  AlertCircle,
  LogIn,
  LogOut,
  FilePlus,
  FileEdit,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal,
  Calendar,
  Hash,
  Zap,
  UserCheck,
  UserPlus,
  Archive,
  UserX,
  UserCog,
  LayoutDashboard,
  Filter,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import './ActivityLogs.css';
import { useNotifAutoOpen } from '../../hooks/useNotifAutoOpen';

/* ═══════════════════════════════════════════════════
   DARK MODE — identical to ResponseTimeTrends
═══════════════════════════════════════════════════ */
const getDarkModeFromStorage = () => {
  try {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  } catch { return false; }
};

/* ═══════════════════════════════════════════════════
   THEME — exact makeStyles from ResponseTimeTrends
═══════════════════════════════════════════════════ */
const makeStyles = (dark) => {
  const bg        = dark ? '#0c0b0b'  : '#f0f0f3';
  const surface   = dark ? '#1a1d27'  : '#f0f0f3';
  const surface2  = dark ? '#22263a'  : '#e8e8eb';
  const border    = dark ? '#2e3347'  : 'rgba(139,0,0,0.10)';
  const border2   = dark ? '#252840'  : 'rgba(139,0,0,0.06)';
  const textPri   = dark ? '#e2e8f0'  : '#111827';
  const textSec   = dark ? '#94a3b8'  : '#374151';
  const textMuted = dark ? '#64748b'  : '#9ca3af';
  const shadow    = dark
    ? '0 4px 16px rgba(0,0,0,0.4)'
    : '8px 8px 24px rgba(13,39,80,0.13)';
  const shadowHero = dark
    ? '0 4px 20px rgba(0,0,0,0.5)'
    : '8px 8px 24px rgba(13,39,80,0.13)';
  const shadowInset = dark
    ? 'inset 0 2px 8px rgba(0,0,0,0.3)'
    : 'inset 3px 3px 8px rgba(13,39,80,0.12), inset -2px -2px 6px rgba(255,255,255,0.85)';

  return {
    bg, surface, surface2, border, border2,
    textPri, textSec, textMuted, shadow, shadowHero, shadowInset, dark,

    cardHero:  { background: 'linear-gradient(135deg, #4a0a0a 0%, #bb0000 100%)', borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s ease, box-shadow 0.2s ease', border: 'none', boxShadow: shadowHero },
    cardWhite: { background: surface, borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s ease, box-shadow 0.2s ease', border: dark ? `1px solid ${border}` : 'none', boxShadow: shadow },

    iconHero:  { width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#fca5a5' },
    iconBlue:  { width: '44px', height: '44px', borderRadius: '12px', background: dark ? 'rgba(37,99,235,0.15)'  : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#2563eb' },
    iconGreen: { width: '44px', height: '44px', borderRadius: '12px', background: dark ? 'rgba(22,163,74,0.15)'  : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#16a34a' },
    iconAmber: { width: '44px', height: '44px', borderRadius: '12px', background: dark ? 'rgba(217,119,6,0.15)'  : '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#d97706' },
    iconRed:   { width: '44px', height: '44px', borderRadius: '12px', background: dark ? 'rgba(220,38,38,0.15)'  : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#b91c1c' },

    labelHero:  { fontSize: '11px', fontWeight: 400, color: 'rgba(255,210,210,0.60)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' },
    labelWhite: { fontSize: '11px', fontWeight: 400, color: textMuted, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' },
    valueHero:  { fontSize: '32px', fontWeight: 600, color: 'rgba(255,255,255,0.90)', lineHeight: 1.1, marginBottom: '10px' },
    valueWhite: { fontSize: '32px', fontWeight: 600, color: textPri, lineHeight: 1.1, marginBottom: '10px' },

    badgeHero:  { display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(255,255,255,0.15)', color: '#fca5a5',  fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px' },
    badgeBlue:  { display: 'inline-flex', alignItems: 'center', gap: '3px', background: dark ? 'rgba(37,99,235,0.15)'  : '#eff6ff',  color: '#2563eb', fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px' },
    badgeGreen: { display: 'inline-flex', alignItems: 'center', gap: '3px', background: dark ? 'rgba(22,163,74,0.15)'  : '#f0fdf4',  color: '#16a34a', fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px' },
    badgeAmber: { display: 'inline-flex', alignItems: 'center', gap: '3px', background: dark ? 'rgba(217,119,6,0.15)'  : '#fffbeb',  color: '#d97706', fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px' },
    badgeRed:   { display: 'inline-flex', alignItems: 'center', gap: '3px', background: dark ? 'rgba(220,38,38,0.15)'  : '#fef2f2',  color: '#dc2626', fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px' },

    searchBox:   { display: 'flex', alignItems: 'center', gap: '8px', background: dark ? surface2 : '#f0f0f3', borderRadius: '20px', padding: '8px 14px', border: dark ? `1px solid ${border}` : 'none', boxShadow: dark ? 'none' : '6px 6px 16px rgba(13,39,80,0.13)' },
    searchInput: { background: 'none', border: 'none', outline: 'none', fontSize: '12px', color: textPri, fontFamily: "'Poppins', sans-serif", fontWeight: 400, flex: 1, width: '100%' },
    clearSearch: { background: 'none', border: 'none', cursor: 'pointer', color: textSec, display: 'flex', padding: 0 },
  };
};

/* ═══════════════════════════════════════════════════
   CONSTANTS (unchanged from original)
═══════════════════════════════════════════════════ */
const API           = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const ROWS_PER_PAGE = 8;
const ACTIVE_USERS_POLL_MS = 10000;

const ACTION_META = {
  'User Login':              { icon: LogIn,       color: 'login',      label: 'User Login'              },
  'User Logout':             { icon: LogOut,      color: 'logout',     label: 'User Logout'             },
  'Updated Name':            { icon: FileEdit,    color: 'update',     label: 'Updated Name'            },
  'Updated Profile Picture': { icon: FileEdit,    color: 'update',     label: 'Updated Profile Picture' },
  'Updated Password':        { icon: ShieldCheck, color: 'update',     label: 'Updated Password'        },
  'Created Bug Report':      { icon: FilePlus,    color: 'create',     label: 'Created Bug Report'      },
  'Updated Bug Report':      { icon: FileEdit,    color: 'update',     label: 'Updated Bug Report'      },
  'Deleted Bug Report':      { icon: Trash2,      color: 'delete',     label: 'Deleted Bug Report'      },
  'Add User':                { icon: UserPlus,    color: 'create',     label: 'Add User'                },
  'Archive':                 { icon: Archive,     color: 'archive',    label: 'Archive'                 },
  'Deactivated User':        { icon: UserX,       color: 'deactivate', label: 'Deactivated User'        },
  'Activated User':          { icon: UserCog,     color: 'activate',   label: 'Activated User'          },
};

const ACTION_FILTER_OPTIONS = [
  { value: '',           label: 'All Actions'       },
  { value: 'login',      label: 'Login'             },
  { value: 'logout',     label: 'Logout'            },
  { value: 'update',     label: 'Update'            },
  { value: 'create',     label: 'Create / Add User' },
  { value: 'archive',    label: 'Archive'           },
  { value: 'delete',     label: 'Delete'            },
  { value: 'deactivate', label: 'Deactivate'        },
  { value: 'activate',   label: 'Activate'          },
];

const ROLE_FILTER_OPTIONS = [
  { value: '',                     label: 'All Roles'          },
  { value: 'Accounting',           label: 'Accounting'         },
  { value: 'Audit and Compliance', label: 'Audit & Compliance' },
  { value: 'Creatives',            label: 'Creatives'          },
  { value: 'Human Resource',       label: 'Human Resource'     },
  { value: 'Innovation',           label: 'Innovation'         },
  { value: 'Marketing',            label: 'Marketing'          },
  { value: 'Operations',           label: 'Operations'         },
  { value: 'Recruitment',          label: 'Recruitment'        },
  { value: 'User',                 label: 'User'               },
];

const ACTION_FILTER_COLOR_MAP = {
  login:      ['login'],
  logout:     ['logout'],
  update:     ['update'],
  create:     ['create'],
  archive:    ['archive'],
  delete:     ['delete'],
  deactivate: ['deactivate'],
  activate:   ['activate'],
};

const ACTION_COLOR_HEX = {
  login:      '#2563EB',
  logout:     '#7C3AED',
  update:     '#D97706',
  create:     '#16A34A',
  archive:    '#0891B2',
  delete:     '#DC2626',
  deactivate: '#6B7280',
  activate:   '#059669',
  view:       '#475569',
};

const getActionMeta = (action) =>
  ACTION_META[action] || { icon: Zap, color: 'view', label: action };

const formatDate = (iso) => {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
    full: d.toLocaleDateString('en-PH', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    }) + ' at ' + d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
};

const getInitials = (name = '') =>
  name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

/* RT-style gradient avatars */
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#1d4ed8,#3b82f6)',
  'linear-gradient(135deg,#7c3aed,#a78bfa)',
  'linear-gradient(135deg,#16a34a,#4ade80)',
  'linear-gradient(135deg,#d97706,#fbbf24)',
  'linear-gradient(135deg,#0891b2,#22d3ee)',
  'linear-gradient(135deg,#dc2626,#f87171)',
  'linear-gradient(135deg,#9d174d,#f472b6)',
  'linear-gradient(135deg,#0f766e,#2dd4bf)',
];
const getAvatarGradient = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

const VIEW_MODES = [
  { mode: 'table', label: 'Table', icon: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="4" rx="1"/><rect x="3" y="17" width="18" height="4" rx="1"/></svg>) },
  { mode: 'card',  label: 'Cards', icon: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>) },
  { mode: 'list',  label: 'List',  icon: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/></svg>) },
];

/* ═══════════════════════════════════════════════════
   SPARKLINE — inline SVG mini bar chart
═══════════════════════════════════════════════════ */
const Sparkline = ({ data, color, filled = false }) => {
  const w = 64, h = 28;
  const max = Math.max(...data, 1);
  const barW = Math.floor(w / data.length) - 2;

  if (filled) {
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / max) * (h - 4);
      return `${x},${y}`;
    });
    const area = `M0,${h} L${pts.join(' L')} L${w},${h} Z`;
    const line = `M${pts.join(' L')}`;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#sg-${color.replace('#','')})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle
          cx={(data.length - 1) / (data.length - 1) * w}
          cy={h - (data[data.length - 1] / max) * (h - 4)}
          r="2.5"
          fill={color}
        />
      </svg>
    );
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const barH = Math.max(3, (v / max) * (h - 2));
        const x = i * (barW + 2);
        const isLast = i === data.length - 1;
        return (
          <rect
            key={i}
            x={x} y={h - barH}
            width={barW} height={barH}
            rx="2"
            fill={isLast ? color : `${color}55`}
          />
        );
      })}
    </svg>
  );
};

/* ═══════════════════════════════════════════════════
   ACTION BADGE
═══════════════════════════════════════════════════ */
const ActionBadge = ({ action }) => {
  const { icon: Icon, color } = getActionMeta(action);
  const hex = ACTION_COLOR_HEX[color] || '#475569';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: `${hex}18`, color: hex,
      border: `1px solid ${hex}30`,
      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
      letterSpacing: 0.2, whiteSpace: 'nowrap',
      fontFamily: "'Poppins', sans-serif",
    }}>
      <Icon size={10} />{action}
    </span>
  );
};

/* ═══════════════════════════════════════════════════
   SKELETON ROWS
═══════════════════════════════════════════════════ */
const SkeletonRows = ({ T }) =>
  Array.from({ length: ROWS_PER_PAGE }).map((_, i) => (
    <tr key={i}>
      {[130, 160, 100, 110, 80].map((w, j) => (
        <td key={j} style={{ padding: '12px 16px' }}>
          <div style={{
            width: w, height: 11, borderRadius: 6,
            background: T.dark ? 'rgba(255,255,255,0.07)' : 'rgba(13,39,80,0.07)',
            animation: 'alSkeletonPulse 1.4s ease-in-out infinite',
          }} />
        </td>
      ))}
    </tr>
  ));

/* ═══════════════════════════════════════════════════
   SUMMARY STAT CARDS
═══════════════════════════════════════════════════ */
const makeSparkData = (seed, length = 10) => {
  let s = seed || 1;
  return Array.from({ length }, (_, i) => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return 20 + Math.abs(s % 60) + (i * 2);
  });
};

const SummaryCards = ({ stats, T }) => {
  const cards = [
    {
      label:       'Total Activities',
      value:       stats.totalActivities ?? 0,
      subLabel:    stats.activitiesToday > 0 ? `+${stats.activitiesToday} today` : 'No new today',
      trend:       stats.activitiesToday > 0 ? 'up' : 'neutral',
      trendPct:    stats.activitiesToday > 0 ? `+${stats.activitiesToday}` : '0',
      icon:        Activity,
      accentColor: '#ef4444',
      sparkSeed:   stats.totalActivities,
      sparkFilled: true,
    },
    {
      label:       'Unique Users',
      value:       stats.uniqueUsers ?? 0,
      subLabel:    'Active this period',
      trend:       'up',
      trendPct:    '+' + (stats.uniqueUsers ?? 0),
      icon:        Users,
      accentColor: '#3b82f6',
      sparkSeed:   stats.uniqueUsers,
      sparkFilled: true,
    },
    {
      label:       'Login Events',
      value:       stats.loginEvents ?? 0,
      subLabel:    'Auth logs',
      trend:       'up',
      trendPct:    '+' + (stats.loginEvents ?? 0),
      icon:        ShieldCheck,
      accentColor: '#f59e0b',
      sparkSeed:   stats.loginEvents,
      sparkFilled: false,
    },
    {
      label:       'Archive Actions',
      value:       stats.archiveActions ?? 0,
      subLabel:    (stats.archiveActions ?? 0) > 0 ? 'Requires review' : 'None today',
      trend:       (stats.archiveActions ?? 0) > 0 ? 'warn' : 'neutral',
      trendPct:    (stats.archiveActions ?? 0) > 0 ? `${stats.archiveActions}` : '0',
      icon:        Archive,
      accentColor: (stats.archiveActions ?? 0) > 0 ? '#ef4444' : '#22c55e',
      sparkSeed:   stats.archiveActions,
      sparkFilled: false,
    },
  ];

  return (
    <>
      {cards.map((c) => {
        const Icon = c.icon;
        const sparkData = makeSparkData(c.sparkSeed ?? 42);
        const trendUp = c.trend === 'up';
        const trendWarn = c.trend === 'warn';
        const trendNeutral = c.trend === 'neutral';

        let badgeBg, badgeColor;
        if (trendUp)        { badgeBg = 'rgba(34,197,94,0.15)';  badgeColor = '#22c55e'; }
        else if (trendWarn) { badgeBg = 'rgba(239,68,68,0.15)';  badgeColor = '#ef4444'; }
        else                { badgeBg = 'rgba(148,163,184,0.15)'; badgeColor = '#94a3b8'; }

        const cardBg = T.dark
          ? 'linear-gradient(145deg, #1e2130 0%, #161825 100%)'
          : '#ffffff';
        const cardBorder = T.dark
          ? '1px solid rgba(255,255,255,0.07)'
          : `1px solid ${T.border}`;
        const cardShadow = T.dark
          ? '0 8px 32px rgba(0,0,0,0.35)'
          : T.shadow;
        const labelColor = T.dark ? 'rgba(255,255,255,0.55)' : T.textMuted;
        const valueColor = T.dark ? '#ffffff' : T.textPri;

        return (
          <div
            key={c.label}
            className="al-stat-card"
            style={{
              background: cardBg,
              borderRadius: '18px',
              padding: '20px 22px 16px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              border: cardBorder,
              boxShadow: cardShadow,
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              cursor: 'default',
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0,
              width: '70%', height: '70%',
              background: `radial-gradient(ellipse at top left, ${c.accentColor}${T.dark ? 'cc' : 'bb'} 0%, ${c.accentColor}${T.dark ? '55' : '40'} 35%, transparent 65%)`,
              borderRadius: '18px 0 0 0',
              pointerEvents: 'none',
            }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{
                fontSize: 11, fontWeight: 500,
                color: labelColor,
                fontFamily: "'Poppins', sans-serif",
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                lineHeight: 1,
              }}>{c.label}</span>

              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: `${c.accentColor}${T.dark ? '22' : '15'}`,
                border: `1px solid ${c.accentColor}${T.dark ? '40' : '30'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={14} color={c.accentColor} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{
                fontSize: 28, fontWeight: 700,
                color: valueColor,
                fontFamily: "'Poppins', sans-serif",
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}>
                {(c.value ?? 0).toLocaleString()}
              </div>
              <div style={{ flexShrink: 0 }}>
                <Sparkline data={sparkData} color={c.accentColor} filled={c.sparkFilled} />
              </div>
            </div>

            <div style={{ height: '0.5px', background: T.dark ? 'rgba(255,255,255,0.08)' : T.border, marginBottom: 10 }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: 11, color: T.dark ? 'rgba(255,255,255,0.40)' : T.textMuted,
                fontFamily: "'Poppins', sans-serif",
              }}>{c.subLabel}</span>

              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                background: badgeBg, color: badgeColor,
                fontSize: 10, fontWeight: 600,
                padding: '2px 7px', borderRadius: 20,
                fontFamily: "'Poppins', sans-serif",
              }}>
                {trendUp   && <TrendingUp   size={9} />}
                {trendWarn && <TrendingDown size={9} />}
                {c.trendPct}
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
};

/* ═══════════════════════════════════════════════════
   ACTIVE USERS — right-side card layout
═══════════════════════════════════════════════════ */
const ActiveUsersSection = ({ users, T }) => {
  const [open, setOpen] = useState(true);
  if (!users || users.length === 0) return null;

  return (
    <div style={{
      background: T.dark ? T.surface : '#f0f0f3',
      borderRadius: 18,
      border: T.dark ? `1px solid ${T.border}` : 'none',
      boxShadow: T.shadow,
      overflow: 'hidden',
    }}>
      {/* ── Header bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px',
        borderBottom: open ? `1px solid ${T.dark ? T.border2 : 'rgba(139,0,0,0.05)'}` : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Pulse dot */}
          <div style={{ position: 'relative', width: 10, height: 10, flexShrink: 0 }}>
            <span style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: '#22c55e', opacity: 0.4,
              animation: 'alPulseRing 1.8s ease-out infinite',
            }} />
            <span style={{
              position: 'absolute', inset: '2px', borderRadius: '50%',
              background: '#22c55e',
            }} />
          </div>

          <span style={{
            fontSize: 13, fontWeight: 600, color: T.textPri,
            fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.01em',
          }}>
            Active Users
          </span>

          {/* Count pill */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: T.dark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.12)',
            color: '#16a34a',
            fontSize: 10, fontWeight: 700,
            minWidth: 20, height: 20, padding: '0 7px',
            borderRadius: 20,
            fontFamily: "'Poppins', sans-serif",
            border: `1px solid ${T.dark ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.25)'}`,
          }}>{users.length}</span>

          {/* Subtext */}
          <span style={{
            fontSize: 11, color: T.textMuted,
            fontFamily: "'Poppins', sans-serif",
          }}>
            · {users.length} user{users.length !== 1 ? 's' : ''} currently online
          </span>
        </div>

        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: 26, height: 26, borderRadius: '50%',
            border: 'none',
            background: T.dark ? T.surface2 : '#f0f0f3',
            boxShadow: T.dark ? 'none' : open
              ? 'inset 2px 2px 6px rgba(13,39,80,0.12), inset -2px -2px 5px rgba(255,255,255,0.85)'
              : '3px 3px 8px rgba(13,39,80,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: T.textMuted, transition: 'all 0.2s',
          }}
        >
          <ChevronDown size={12} style={{
            transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
            transform: open ? 'rotate(180deg)' : 'none',
          }} />
        </button>
      </div>

      {/* ── User cards grid ── */}
      {open && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
          padding: '16px 18px',
        }}>
          {users.map((u) => (
            <div
              key={u._id}
              title={`${u.name} — ${u.role}`}
              className="al-active-user-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: T.dark ? T.surface2 : '#ffffff',
                border: T.dark ? `1px solid ${T.border}` : `1px solid rgba(139,0,0,0.07)`,
                borderRadius: 14,
                padding: '10px 14px',
                boxShadow: T.dark
                  ? 'none'
                  : '5px 5px 14px rgba(13,39,80,0.09)',
                transition: 'all 0.15s ease',
                cursor: 'default',
              }}
            >
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: getAvatarGradient(u.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff',
                  fontFamily: "'Poppins', sans-serif", overflow: 'hidden',
                  boxShadow: T.dark
                    ? `0 0 0 2px ${T.surface2}`
                    : '3px 3px 8px rgba(13,39,80,0.18)',
                }}>
                  {u.profilePicture
                    ? <img src={u.profilePicture} alt={u.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : getInitials(u.name)}
                </div>
                {/* Green online dot */}
                <span style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#22c55e',
                  border: `2px solid ${T.dark ? T.surface2 : '#ffffff'}`,
                  boxShadow: '0 0 0 1px rgba(34,197,94,0.3)',
                }} />
              </div>

              {/* Name + role */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, color: T.textPri,
                  fontFamily: "'Poppins', sans-serif",
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  lineHeight: 1.3, marginBottom: 2,
                }}>{u.name}</div>
                <div style={{
                  fontSize: 10, color: T.textMuted,
                  fontFamily: "'Poppins', sans-serif",
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  lineHeight: 1.3,
                }}>{u.role}</div>
              </div>

              {/* Online badge — right side */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: T.dark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.10)',
                color: '#16a34a',
                fontSize: 9, fontWeight: 700,
                padding: '3px 8px', borderRadius: 20,
                fontFamily: "'Poppins', sans-serif",
                border: `1px solid ${T.dark ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.20)'}`,
                letterSpacing: '0.02em',
                flexShrink: 0,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#22c55e', display: 'inline-block',
                  animation: 'alPulseDot 2s ease-in-out infinite',
                }} />
                Online
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Subtext footer ── */}
      {open && (
        <div style={{
          padding: '10px 18px 14px',
          borderTop: `1px solid ${T.dark ? T.border2 : 'rgba(139,0,0,0.04)'}`,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#22c55e', display: 'inline-block', flexShrink: 0,
            animation: 'alPulseDot 2s ease-in-out infinite',
          }} />
          <span style={{
            fontSize: 11, color: T.textMuted,
            fontFamily: "'Poppins', sans-serif",
          }}>
            Showing {users.length} active session{users.length !== 1 ? 's' : ''} · auto-refreshes every 10s
          </span>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   DETAIL MODAL
═══════════════════════════════════════════════════ */
const DetailModal = ({ log, onClose, onArchive, T }) => {
  if (!log) return null;

  const { icon: ActionIcon, color } = getActionMeta(log.action);
  const hex        = ACTION_COLOR_HEX[color] || '#475569';
  const dt         = formatDate(log.createdAt || log.timestamp);
  const avatarGrad = getAvatarGradient(log.name);
  const hasBefore  = log.changes?.before && Object.keys(log.changes.before).length > 0;
  const hasAfter   = log.changes?.after  && Object.keys(log.changes.after).length  > 0;
  const hasChanges = hasBefore || hasAfter;
  const isStatusAction = log.action === 'Deactivated User' || log.action === 'Activated User';

  const SectionTitle = ({ children }) => (
    <div style={{
      fontSize: 10, fontWeight: 700, color: T.textMuted,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      marginBottom: 10, fontFamily: "'Poppins', sans-serif",
    }}>{children}</div>
  );

  const rowStyle = (i, arr) => ({
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: i < arr.length - 1 ? `1px solid ${T.dark ? T.border2 : 'rgba(139,0,0,0.06)'}` : 'none',
  });

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)', padding: 16,
      }}
    >
      <div style={{
        background: T.dark ? T.surface : '#f0f0f3',
        borderRadius: 22,
        width: 500, maxWidth: '100%', maxHeight: '90vh',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: T.dark
          ? '0 24px 64px rgba(0,0,0,0.6)'
          : '0 16px 48px rgba(13,39,80,0.22), 0 4px 16px rgba(13,39,80,0.10)',
        border: 'none',
        animation: 'alModalIn 0.22s cubic-bezier(0.34,1.2,0.6,1) forwards',
      }}>

        <div style={{
          background: T.dark ? T.surface2 : '#f0f0f3',
          borderBottom: `1px solid ${T.dark ? T.border : 'rgba(139,0,0,0.08)'}`,
          padding: '18px 20px 16px', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <ActionBadge action={log.action} />
            <button onClick={onClose} style={{
              width: 30, height: 30, borderRadius: '50%', border: 'none',
              background: T.dark ? 'rgba(255,255,255,0.08)' : '#f0f0f3',
              boxShadow: T.dark ? 'none' : '3px 3px 8px rgba(13,39,80,0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: T.textMuted, transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#8b0000'; e.currentTarget.style.boxShadow = T.dark ? 'none' : '4px 4px 10px rgba(13,39,80,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.boxShadow = T.dark ? 'none' : '3px 3px 8px rgba(13,39,80,0.14)'; }}
            ><X size={13} /></button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 14, flexShrink: 0,
              background: avatarGrad,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: '#fff', overflow: 'hidden',
              fontFamily: "'Poppins', sans-serif",
              boxShadow: T.dark ? 'none' : '4px 4px 12px rgba(13,39,80,0.18)',
            }}>
              {log.profilePicture
                ? <img src={log.profilePicture} alt={log.name} style={{ width: '100%', height: '100%', borderRadius: 14, objectFit: 'cover' }} />
                : getInitials(log.name)}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.textPri, fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.01em', marginBottom: 2 }}>{log.name}</div>
              <div style={{ fontSize: 11, color: T.textMuted, fontFamily: "'Poppins', sans-serif" }}>{log.email}</div>
            </div>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div>
            <SectionTitle>Activity Details</SectionTitle>
            <div style={{
              background: T.dark ? T.surface2 : '#f0f0f3',
              borderRadius: 14, overflow: 'hidden', border: 'none',
              boxShadow: T.dark ? 'none' : 'inset 3px 3px 7px rgba(13,39,80,0.09), inset -2px -2px 5px rgba(255,255,255,0.72)',
            }}>
              {[
                { label: 'Action Type', icon: <Zap size={11}/>,        val: <ActionBadge action={log.action} /> },
                { label: 'Module',      icon: <Hash size={11}/>,        val: log.module },
                { label: 'Date & Time', icon: <Calendar size={11}/>,    val: <span style={{ fontSize: 11 }}>{dt.full}</span> },
                { label: 'IP Address',  icon: <ShieldCheck size={11}/>, val: <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{log.ipAddress || '—'}</span> },
              ].map(({ label, icon, val }, i, arr) => (
                <div key={label} style={rowStyle(i, arr)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: T.textMuted, fontFamily: "'Poppins', sans-serif" }}>
                    <span style={{ color: T.textMuted, display: 'flex' }}>{icon}</span>{label}
                  </div>
                  <div style={{ fontSize: 12, color: T.textPri, fontFamily: "'Poppins', sans-serif", textAlign: 'right', fontWeight: 500 }}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {isStatusAction && log.targetUser && (
            <div>
              <SectionTitle>Affected User</SectionTitle>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12,
                background: log.action === 'Deactivated User'
                  ? (T.dark ? 'rgba(220,38,38,0.08)' : 'rgba(220,38,38,0.06)')
                  : (T.dark ? 'rgba(16,185,129,0.08)' : 'rgba(5,150,105,0.06)'),
                border: `1px solid ${
                  log.action === 'Deactivated User'
                    ? (T.dark ? 'rgba(220,38,38,0.25)' : 'rgba(220,38,38,0.18)')
                    : (T.dark ? 'rgba(16,185,129,0.25)' : 'rgba(5,150,105,0.18)')
                }`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: getAvatarGradient(log.targetUser.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden',
                }}>
                  {log.targetUser.profilePicture
                    ? <img src={log.targetUser.profilePicture} alt={log.targetUser.name} style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'cover' }} />
                    : getInitials(log.targetUser.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: T.textPri, fontFamily: "'Poppins', sans-serif" }}>{log.targetUser.name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, fontFamily: "'Poppins', sans-serif" }}>{log.targetUser.email}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, fontFamily: "'Poppins', sans-serif" }}>{log.targetUser.role}</div>
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 5,
                  background: log.action === 'Deactivated User' ? '#dc2626' : '#16a34a',
                  color: '#fff', fontFamily: "'Poppins', sans-serif",
                }}>
                  {log.action === 'Deactivated User'
                    ? <><UserX size={10} /> Deactivated</>
                    : <><UserCog size={10} /> Activated</>}
                </span>
              </div>

              {log.action === 'Deactivated User' && log.targetUser?.reason && (
                <div style={{
                  marginTop: 8, padding: '10px 14px', borderRadius: 10,
                  background: T.dark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.07)',
                  border: `1px solid ${T.dark ? 'rgba(245,158,11,0.25)' : 'rgba(245,158,11,0.25)'}`,
                  fontSize: 11, color: T.dark ? '#fbbf24' : '#92400e',
                  fontFamily: "'Poppins', sans-serif", lineHeight: 1.5,
                  display: 'flex', alignItems: 'flex-start', gap: 6,
                }}>
                  <ShieldCheck size={11} style={{ marginTop: 1, flexShrink: 0 }} />
                  <div><span style={{ fontWeight: 600 }}>Reason:</span> {log.targetUser.reason}</div>
                </div>
              )}
            </div>
          )}

          {hasChanges && (
            <div>
              <SectionTitle>Changes</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { title: 'Before', data: hasBefore ? log.changes.before : null, accentBg: T.dark ? 'rgba(220,38,38,0.08)' : 'rgba(220,38,38,0.05)', accentBorder: T.dark ? 'rgba(220,38,38,0.25)' : 'rgba(220,38,38,0.15)', labelColor: T.dark ? '#f87171' : '#dc2626' },
                  { title: 'After',  data: hasAfter  ? log.changes.after  : null, accentBg: T.dark ? 'rgba(16,185,129,0.08)' : 'rgba(5,150,105,0.05)', accentBorder: T.dark ? 'rgba(16,185,129,0.25)' : 'rgba(5,150,105,0.15)', labelColor: T.dark ? '#4ade80' : '#16a34a' },
                ].map(({ title, data, accentBg, accentBorder, labelColor }) => (
                  <div key={title} style={{
                    background: accentBg, border: `1px solid ${accentBorder}`,
                    borderRadius: 12, padding: '10px 12px', overflow: 'hidden',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: labelColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontFamily: "'Poppins', sans-serif" }}>{title}</div>
                    {data
                      ? Object.entries(data).map(([k, v]) => (
                        <div key={k} style={{ marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: T.textMuted, fontFamily: "'Poppins', sans-serif" }}>{k}: </span>
                          {k === 'profilePicture' && v
                            ? <img src={v} alt={title} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle' }} />
                            : <span style={{ fontSize: 11, color: T.textPri, fontFamily: "'Poppins', sans-serif" }}>{String(v || '—')}</span>}
                        </div>
                      ))
                      : <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "'Poppins', sans-serif" }}>—</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderTop: `1px solid ${T.dark ? T.border : 'rgba(139,0,0,0.08)'}`,
          background: T.dark ? T.surface2 : '#f0f0f3',
          flexShrink: 0, gap: 10,
        }}>
          <button
            onClick={() => onArchive && onArchive(log)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 20, border: 'none',
              background: T.dark ? 'rgba(220,38,38,0.15)' : '#f0f0f3',
              color: T.dark ? '#f87171' : '#8b0000',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif",
              boxShadow: T.dark ? 'none' : '4px 4px 10px rgba(13,39,80,0.13)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#6b0000'; e.currentTarget.style.boxShadow = T.dark ? 'none' : '6px 6px 14px rgba(13,39,80,0.17)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.dark ? '#f87171' : '#8b0000'; e.currentTarget.style.boxShadow = T.dark ? 'none' : '4px 4px 10px rgba(13,39,80,0.13)'; }}
          >
            <Archive size={13} />Archive
          </button>
          <button
            onClick={onClose}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 22px', borderRadius: 20, border: 'none',
              background: T.dark ? 'rgba(255,255,255,0.08)' : '#f0f0f3',
              color: T.textSec, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
              boxShadow: T.dark ? 'none' : '4px 4px 10px rgba(13,39,80,0.13)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = T.dark ? 'none' : '6px 6px 14px rgba(13,39,80,0.17)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = T.dark ? 'none' : '4px 4px 10px rgba(13,39,80,0.13)'; }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════ */
const ActivityLogs = () => {

  const [logs,            setLogs]            = useState([]);
  const [stats,           setStats]           = useState({});
  const [activeUsers,     setActiveUsers]     = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [searchQuery,     setSearchQuery]     = useState('');
  const [nameSort,        setNameSort]        = useState('none');
  const [dateSort,        setDateSort]        = useState('desc');
  const [actionFilter,    setActionFilter]    = useState('');
  const [roleFilter,      setRoleFilter]      = useState('');
  const [activeSortField, setActiveSortField] = useState('timestamp');
  const [currentPage,     setCurrentPage]     = useState(1);
  const [selectedLog,     setSelectedLog]     = useState(null);
  const [viewMode,        setViewMode]        = useState('table');
  const [error,           setError]           = useState(null);

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

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/activity-logs?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch activity logs');
      const data = await res.json();
      setLogs(data.logs || []);
      setStats(data.stats || {});
      setActiveUsers(data.activeUsers || []);
    } catch (err) {
      console.error('ActivityLogs fetch error:', err);
      setError('Failed to load activity logs. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchActiveUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/activity-logs?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setActiveUsers(data.activeUsers || []);
    } catch (err) {
      console.error('Active users poll error:', err);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useNotifAutoOpen((logId) => {
    const found = logs.find(l => l._id === logId);
    if (found) {
      setSelectedLog(found);
    } else {
      const token = localStorage.getItem('adminToken');
      fetch(`${API}/activity-logs/${logId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.log) setSelectedLog(data.log); })
        .catch(() => {});
    }
  }, [logs]);

  useEffect(() => {
    const interval = setInterval(() => { fetchActiveUsers(); }, ACTIVE_USERS_POLL_MS);
    return () => clearInterval(interval);
  }, [fetchActiveUsers]);

  const handleNameSort = () => {
    setActiveSortField('name');
    setNameSort(prev => (prev === 'none' || prev === 'desc') ? 'asc' : 'desc');
    setCurrentPage(1);
  };

  const handleDateSort = () => {
    setActiveSortField('timestamp');
    setDateSort(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1);
  };

  const handleArchiveLog = useCallback(async (log) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API}/activity-logs/${log._id}/archive`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Archive failed');
      setLogs(prev => prev.filter(l => l._id !== log._id));
      setSelectedLog(null);
    } catch (err) {
      console.error('Archive error:', err);
    }
  }, []);

  const filtered = useMemo(() => {
    let rows = [...logs];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        d => (d.name  || '').toLowerCase().includes(q) ||
             (d.email || '').toLowerCase().includes(q) ||
             (d.action|| '').toLowerCase().includes(q)
      );
    }
    if (actionFilter) {
      const allowedColors = ACTION_FILTER_COLOR_MAP[actionFilter] || [];
      rows = rows.filter(d => allowedColors.includes(getActionMeta(d.action).color));
    }
    if (roleFilter) {
      rows = rows.filter(d => (d.role || '').toLowerCase() === roleFilter.toLowerCase());
    }
    rows.sort((a, b) => {
      if (activeSortField === 'name') {
        const dir = nameSort === 'asc' ? 1 : -1;
        return (a.name || '').localeCompare(b.name || '') * dir;
      }
      const aT = new Date(a.createdAt || a.timestamp).getTime();
      const bT = new Date(b.createdAt || b.timestamp).getTime();
      return dateSort === 'asc' ? aT - bT : bT - aT;
    });
    return rows;
  }, [logs, searchQuery, actionFilter, roleFilter, nameSort, dateSort, activeSortField]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, actionFilter, roleFilter, nameSort, dateSort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  const handleExport = () => {
    const headers = ['Name', 'Email', 'Action', 'Module', 'IP Address', 'Date & Time'];
    const rows = filtered.map(d => [
      d.name, d.email, d.action, d.module, d.ipAddress || '',
      new Date(d.createdAt || d.timestamp).toLocaleString('en-PH'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'activity-logs.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setNameSort('none');
    setDateSort('desc');
    setActionFilter('');
    setRoleFilter('');
    setActiveSortField('timestamp');
  };

  const hasActiveFilters = searchQuery || nameSort !== 'none' || actionFilter !== '' || roleFilter !== '';

  const nameSortIcon = () => {
    if (activeSortField !== 'name' || nameSort === 'none')
      return <ArrowUpDown size={12} style={{ opacity: 0.4 }} />;
    return nameSort === 'asc'
      ? <ArrowUp   size={12} style={{ color: '#ef4444' }} />
      : <ArrowDown size={12} style={{ color: '#ef4444' }} />;
  };

  const filterPill = (active) => ({
    display: 'flex', alignItems: 'center', gap: 6,
    background: active ? (T.dark ? 'rgba(139,0,0,0.18)' : '#f0f0f3') : T.dark ? T.surface : '#f0f0f3',
    border: active ? '1px solid rgba(139,0,0,0.25)' : (T.dark ? `1px solid ${T.border}` : 'none'),
    borderRadius: 20, padding: '0 14px', height: 36,
    boxShadow: active
      ? (T.dark ? 'none' : 'inset 3px 3px 8px rgba(13,39,80,0.12), inset -2px -2px 6px rgba(255,255,255,0.85)')
      : (T.dark ? 'none' : '6px 6px 16px rgba(13,39,80,0.13)'),
  });
  const filterLabel = (active) => ({
    fontSize: 10, fontWeight: 600,
    color: active ? '#8b0000' : T.textMuted,
    fontFamily: "'Poppins', sans-serif",
    textTransform: 'uppercase', letterSpacing: '0.05em',
  });
  const selectStyle = {
    background: 'none', border: 'none', outline: 'none',
    fontSize: 12, color: T.textPri, cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
  };

  /* ═════════════════════════════════════════
     TABLE VIEW — borderless card rows
  ═════════════════════════════════════════ */
  const renderTableView = () => (
    <div style={{ overflowX: 'auto', padding: '8px 12px 12px' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px', fontFamily: "'Poppins', sans-serif" }}>
        <thead>
          <tr style={{ background: 'transparent' }}>
            {[
              { label: 'Name',            onClick: handleNameSort, icon: nameSortIcon() },
              { label: 'Email',           onClick: null,           icon: null },
              { label: 'Specific Action', onClick: null,           icon: null },
              { label: 'Date & Time',     onClick: handleDateSort, icon: activeSortField === 'timestamp'
                  ? (dateSort === 'asc' ? <ArrowUp size={12} style={{ color: '#ef4444' }} /> : <ArrowDown size={12} style={{ color: '#ef4444' }} />)
                  : <ArrowUpDown size={12} style={{ opacity: 0.4 }} /> },
              { label: 'Actions',         onClick: null,           icon: null },
            ].map(({ label, onClick, icon }) => (
              <th key={label} onClick={onClick || undefined} style={{
                padding: '6px 16px', textAlign: 'left',
                fontSize: 10, fontWeight: 600, color: T.textMuted,
                textTransform: 'uppercase', letterSpacing: '0.06em',
                fontFamily: "'Poppins', sans-serif",
                cursor: onClick ? 'pointer' : 'default',
                userSelect: 'none', whiteSpace: 'nowrap',
                border: 'none', background: 'transparent',
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{label}{icon}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? <SkeletonRows T={T} /> : paginated.length === 0 ? (
            <tr><td colSpan={5} style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <Activity size={28} strokeWidth={1.5} style={{ color: T.textMuted }} />
                <div style={{ fontSize: 13, fontWeight: 500, color: T.textPri, fontFamily: "'Poppins', sans-serif" }}>No activity logs found</div>
                <div style={{ fontSize: 12, color: T.textMuted, fontFamily: "'Poppins', sans-serif" }}>Try adjusting your filters or search query.</div>
              </div>
            </td></tr>
          ) : paginated.map((log) => {
            const dt         = formatDate(log.createdAt || log.timestamp);
            const avatarGrad = getAvatarGradient(log.name);
            return (
              <tr key={log._id} className="al-table-row" style={{ transition: 'all 0.15s' }}>
                <td style={{
                  padding: '11px 16px',
                  background: T.dark ? T.surface2 : '#f0f0f3',
                  border: 'none',
                  borderRadius: '14px 0 0 14px',
                  boxShadow: T.dark ? 'none' : '5px 5px 14px rgba(13,39,80,0.09)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: avatarGrad,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden',
                      fontFamily: "'Poppins', sans-serif",
                    }}>
                      {log.profilePicture
                        ? <img src={log.profilePicture} alt={log.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        : getInitials(log.name)}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: T.textPri, fontFamily: "'Poppins', sans-serif" }}>{log.name}</span>
                  </div>
                </td>
                <td style={{
                  padding: '11px 16px',
                  background: T.dark ? T.surface2 : '#f0f0f3',
                  border: 'none',
                  boxShadow: T.dark ? 'none' : '5px 5px 14px rgba(13,39,80,0.09)',
                }}>
                  <span style={{ fontSize: 12, color: T.textSec, fontFamily: "'Poppins', sans-serif" }}>{log.email}</span>
                </td>
                <td style={{
                  padding: '11px 16px',
                  background: T.dark ? T.surface2 : '#f0f0f3',
                  border: 'none',
                  boxShadow: T.dark ? 'none' : '5px 5px 14px rgba(13,39,80,0.09)',
                }}>
                  <ActionBadge action={log.action} />
                </td>
                <td style={{
                  padding: '11px 16px',
                  background: T.dark ? T.surface2 : '#f0f0f3',
                  border: 'none',
                  boxShadow: T.dark ? 'none' : '5px 5px 14px rgba(13,39,80,0.09)',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: T.textPri, fontFamily: "'Poppins', sans-serif" }}>{dt.date}</span>
                    <span style={{ fontSize: 10, color: T.textMuted, fontFamily: "'Poppins', sans-serif" }}>{dt.time}</span>
                  </div>
                </td>
                <td style={{
                  padding: '11px 16px',
                  background: T.dark ? T.surface2 : '#f0f0f3',
                  border: 'none',
                  borderRadius: '0 14px 14px 0',
                  boxShadow: T.dark ? 'none' : '5px 5px 14px rgba(13,39,80,0.09)',
                }}>
                  <button
                    onClick={() => setSelectedLog(log)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '5px 12px', borderRadius: 20, border: 'none',
                      background: T.dark ? 'rgba(139,0,0,0.15)' : '#f0f0f3',
                      color: T.dark ? '#f87171' : '#8b0000',
                      fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                      border: T.dark ? `1px solid ${T.border}` : 'none', boxShadow: T.dark ? 'none' : '4px 4px 10px rgba(13,39,80,0.12)',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.color='#6b0000';e.currentTarget.style.boxShadow='6px 6px 14px rgba(13,39,80,0.17)';}}
                    onMouseLeave={e=>{e.currentTarget.style.color=T.dark?'#f87171':'#8b0000';e.currentTarget.style.boxShadow=T.dark?'none':'4px 4px 10px rgba(13,39,80,0.12)';}}
                  >
                    <Eye size={12} />View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  /* ═════════════════════════════════════════
     CARD VIEW
  ═════════════════════════════════════════ */
  const renderCardView = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16, padding: 16 }}>
      {paginated.map((log) => {
        const { color } = getActionMeta(log.action);
        const hex        = ACTION_COLOR_HEX[color] || '#475569';
        const dt         = formatDate(log.createdAt || log.timestamp);
        const avatarGrad = getAvatarGradient(log.name);
        return (
          <div key={log._id} className="al-card-item" style={{
            background: T.dark ? T.surface : '#f0f0f3',
            borderRadius: 20,
            border: T.dark ? `1px solid ${T.border}` : 'none',
            boxShadow: T.dark ? T.shadow : '8px 8px 24px rgba(13,39,80,0.13)',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            transition: 'all 0.18s ease',
          }}>
            <div style={{
              height: 4,
              background: `linear-gradient(90deg, ${hex}, ${hex}99)`,
              flexShrink: 0,
            }} />

            <div style={{ padding: '16px 16px 14px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 14,
                    background: avatarGrad,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden',
                    boxShadow: T.dark
                      ? `0 0 0 2px ${T.surface2}`
                      : '4px 4px 10px rgba(13,39,80,0.18)',
                  }}>
                    {log.profilePicture
                      ? <img src={log.profilePicture} alt={log.name} style={{ width: '100%', height: '100%', borderRadius: 14, objectFit: 'cover' }} />
                      : getInitials(log.name)}
                  </div>
                  <span style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 10, height: 10, borderRadius: '50%',
                    background: hex,
                    border: `2px solid ${T.dark ? T.surface : '#f0f0f3'}`,
                  }} />
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                  <div style={{
                    fontSize: 12.5, fontWeight: 700, color: T.textPri,
                    fontFamily: "'Poppins', sans-serif",
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    letterSpacing: '-0.01em', marginBottom: 2,
                  }}>{log.name}</div>
                  <div style={{
                    fontSize: 10, color: T.textMuted,
                    fontFamily: "'Poppins', sans-serif",
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{log.email}</div>
                </div>
              </div>

              <div style={{
                padding: '7px 12px', borderRadius: 12,
                background: T.dark ? `${hex}18` : `${hex}12`,
                border: T.dark ? `1px solid ${hex}30` : 'none',
                boxShadow: T.dark ? 'none' : 'inset 2px 2px 6px rgba(13,39,80,0.08), inset -1px -1px 4px rgba(255,255,255,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ActionBadge action={log.action} />
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 12,
                background: T.dark ? 'rgba(255,255,255,0.03)' : '#f0f0f3',
                border: T.dark ? `1px solid ${T.border2}` : 'none',
                boxShadow: T.dark ? 'none' : 'inset 2px 2px 5px rgba(13,39,80,0.08), inset -1px -1px 4px rgba(255,255,255,0.7)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: T.dark ? 'rgba(255,255,255,0.06)' : '#f0f0f3',
                  boxShadow: T.dark ? 'none' : '3px 3px 7px rgba(13,39,80,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: T.textMuted,
                }}>
                  <Calendar size={12} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.textPri, fontFamily: "'Poppins', sans-serif" }}>{dt.date}</span>
                  <span style={{ fontSize: 10, color: T.textMuted, fontFamily: "'Poppins', sans-serif" }}>{dt.time}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '0 16px 14px' }}>
              <button
                onClick={() => setSelectedLog(log)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 0', borderRadius: 14, border: 'none',
                  background: T.dark ? 'rgba(139,0,0,0.18)' : '#f0f0f3',
                  color: T.dark ? '#f87171' : '#8b0000',
                  fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                  letterSpacing: '0.02em',
                  boxShadow: T.dark ? 'none' : '5px 5px 12px rgba(13,39,80,0.13)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = T.dark ? '#fca5a5' : '#6b0000';
                  e.currentTarget.style.boxShadow = T.dark ? 'none' : '7px 7px 16px rgba(13,39,80,0.18)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = T.dark ? '#f87171' : '#8b0000';
                  e.currentTarget.style.boxShadow = T.dark ? 'none' : '5px 5px 12px rgba(13,39,80,0.13)';
                }}
              >
                <Eye size={13} /> View Details
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ═════════════════════════════════════════
     LIST VIEW — activity feed / timeline style
  ═════════════════════════════════════════ */
  const renderListView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: 0 }}>
      {paginated.map((log, idx) => {
        const { icon: ActionIcon, color } = getActionMeta(log.action);
        const hex        = ACTION_COLOR_HEX[color] || '#475569';
        const dt         = formatDate(log.createdAt || log.timestamp);
        const avatarGrad = getAvatarGradient(log.name);
        const isLast     = idx === paginated.length - 1;

        return (
          <div key={log._id} style={{ display: 'flex', gap: 0, position: 'relative' }}>

            {/* ── Timeline spine ── */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 40, flexShrink: 0 }}>
              {/* Action icon circle */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: T.dark ? `${hex}22` : `${hex}18`,
                border: `2px solid ${hex}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1,
              }}>
                <ActionIcon size={14} color={hex} />
              </div>
              {/* Connector line */}
              {!isLast && (
                <div style={{
                  width: 2, flex: 1, minHeight: 12,
                  background: T.dark
                    ? `linear-gradient(to bottom, ${hex}44, ${hex}11)`
                    : `linear-gradient(to bottom, ${hex}33, ${hex}08)`,
                  marginTop: 2, marginBottom: 2,
                }} />
              )}
            </div>

            {/* ── Content ── */}
            <div
              className="al-list-row"
              style={{
                flex: 1, minWidth: 0,
                marginLeft: 14,
                marginBottom: isLast ? 0 : 10,
                background: T.dark ? T.surface2 : '#ffffff',
                border: T.dark ? `1px solid ${T.border}` : `1px solid ${hex}18`,
                borderLeft: `3px solid ${hex}`,
                borderRadius: '0 14px 14px 0',
                padding: '12px 14px 12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'all 0.15s ease',
                boxShadow: T.dark ? 'none' : '3px 3px 10px rgba(13,39,80,0.07)',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: avatarGrad,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden',
              }}>
                {log.profilePicture
                  ? <img src={log.profilePicture} alt={log.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : getInitials(log.name)}
              </div>

              {/* Main content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.textPri, fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.01em' }}>{log.name}</span>
                  <ActionBadge action={log.action} />
                  {log.module && (
                    <span style={{
                      fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
                      background: T.dark ? 'rgba(255,255,255,0.06)' : 'rgba(13,39,80,0.06)',
                      color: T.textMuted, fontFamily: "'Poppins', sans-serif",
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{log.module}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "'Poppins', sans-serif" }}>{log.email}</span>
                  {log.ipAddress && (
                    <>
                      <span style={{ fontSize: 10, color: T.textMuted, opacity: 0.4 }}>·</span>
                      <span style={{ fontSize: 10, color: T.textMuted, fontFamily: 'monospace', opacity: 0.7 }}>{log.ipAddress}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Right: time + button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, textAlign: 'right' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.textPri, fontFamily: "'Poppins', sans-serif" }}>{dt.date}</span>
                  <span style={{
                    fontSize: 10, color: T.textMuted, fontFamily: "'Poppins', sans-serif",
                    display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end',
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: hex, display: 'inline-block', opacity: 0.8,
                    }} />
                    {dt.time}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedLog(log)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 11px', borderRadius: 20,
                    border: `1px solid ${hex}40`,
                    background: T.dark ? `${hex}15` : `${hex}10`,
                    color: hex, fontSize: 10, fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                    transition: 'all 0.15s', letterSpacing: '0.02em',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${hex}25`; e.currentTarget.style.borderColor = `${hex}70`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = T.dark ? `${hex}15` : `${hex}10`; e.currentTarget.style.borderColor = `${hex}40`; }}
                >
                  <Eye size={10} /> View
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ═══════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════ */
  return (
    <div style={{
      fontFamily: "'Poppins','Segoe UI',sans-serif",
      background: T.dark ? T.bg : '#f0f0f3', minHeight: '100vh', color: T.textPri,
      transition: 'background 0.3s ease',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');

        @keyframes alModalIn       { from{opacity:0;transform:scale(0.96) translateY(-8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes alSkeletonPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes alSpin          { to { transform: rotate(360deg); } }
        @keyframes alPulseRing     { 0%{transform:scale(1);opacity:0.5} 70%{transform:scale(2.4);opacity:0} 100%{transform:scale(2.4);opacity:0} }
        @keyframes alPulseDot      { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .al-stat-card:hover        { transform: translateY(-3px) !important; box-shadow: ${T.dark ? '0 8px 24px rgba(0,0,0,0.5)' : '10px 10px 28px rgba(13,39,80,0.17)'} !important; }
        .al-table-row:hover td     { box-shadow: ${T.dark ? '0 4px 16px rgba(0,0,0,0.4)' : '7px 7px 18px rgba(13,39,80,0.13)'} !important; }
        .al-card-item:hover        { transform: translateY(-2px) !important; box-shadow: ${T.dark ? '0 8px 24px rgba(0,0,0,0.5)' : '10px 10px 28px rgba(13,39,80,0.17)'} !important; }
        .al-list-row:hover         { transform: translateY(-1px) !important; box-shadow: ${T.dark ? '0 4px 16px rgba(0,0,0,0.4)' : '7px 7px 18px rgba(13,39,80,0.15)'} !important; }
        .al-active-user-card:hover { transform: translateY(-2px) !important; box-shadow: ${T.dark ? '0 4px 16px rgba(0,0,0,0.4)' : '7px 7px 18px rgba(13,39,80,0.13)'} !important; }

        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 10px; }

        @media (max-width: 768px) {
          .al-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .al-toolbar    { flex-wrap: wrap !important; }
        }
        @media (max-width: 480px) { .al-stats-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {selectedLog && (
        <DetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onArchive={handleArchiveLog}
          T={T}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24, minHeight: '100vh' }}>

        {/* ── Page header ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 12, color: T.textSec, fontFamily: "'Poppins', sans-serif" }}>
            <LayoutDashboard size={13} /> Dashboard
            <span style={{ opacity: 0.4 }}>/</span>
            <span>Activity Logs</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: T.textPri, margin: '0 0 2px 0', letterSpacing: '-0.01em', fontFamily: "'Poppins', sans-serif" }}>
                Activity Logs
              </h1>
              <p style={{ fontSize: 12, color: T.textSec, margin: 0, fontFamily: "'Poppins', sans-serif" }}>
                Track and audit user actions across all modules
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleExport}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 20, border: 'none',
                  background: T.dark ? T.surface : '#f0f0f3',
                  color: T.textSec, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                  boxShadow: T.dark ? 'none' : '6px 6px 16px rgba(13,39,80,0.13)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = T.dark ? '#fff' : '#111827'; e.currentTarget.style.boxShadow = T.dark ? 'none' : '8px 8px 20px rgba(13,39,80,0.17)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.textSec; e.currentTarget.style.boxShadow = T.dark ? 'none' : '6px 6px 16px rgba(13,39,80,0.13)'; }}
              >
                <Download size={14} /><span>Export CSV</span>
              </button>
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 20, border: 'none',
                  background: T.dark ? '#7f0a0a' : '#f0f0f3',
                  color: T.dark ? '#fff' : '#8b0000',
                  fontSize: 12, fontWeight: 700,
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  fontFamily: "'Poppins', sans-serif",
                  opacity: refreshing ? 0.7 : 1,
                  boxShadow: T.dark ? 'none' : '6px 6px 16px rgba(13,39,80,0.13)',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!refreshing) e.currentTarget.style.boxShadow = T.dark ? 'none' : '8px 8px 20px rgba(13,39,80,0.17)'; }}
                onMouseLeave={e => { if (!refreshing) e.currentTarget.style.boxShadow = T.dark ? 'none' : '6px 6px 16px rgba(13,39,80,0.13)'; }}
              >
                <RefreshCw size={14} style={{ animation: refreshing ? 'alSpin 0.7s linear infinite' : 'none' }} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="al-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
          <SummaryCards stats={stats} T={T} />
        </div>

        {/* ── Active users ── */}
        <ActiveUsersSection users={activeUsers} T={T} />

        {/* ── Error banner ── */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderRadius: 12,
            background: T.dark ? 'rgba(220,38,38,0.12)' : 'rgba(220,38,38,0.06)',
            border: `1px solid ${T.dark ? 'rgba(220,38,38,0.3)' : 'rgba(220,38,38,0.15)'}`,
            fontSize: 12, color: '#dc2626', fontFamily: "'Poppins', sans-serif",
          }}>
            <AlertCircle size={15} />
            <span style={{ flex: 1 }}>{error}</span>
            <button
              onClick={() => fetchData()}
              style={{
                background: '#dc2626', color: '#fff', border: 'none',
                padding: '4px 12px', borderRadius: 20,
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'Poppins', sans-serif",
              }}
            >Retry</button>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="al-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ ...T.searchBox, flex: '1 1 160px', maxWidth: 280 }}>
            <Search size={14} style={{ color: T.textSec, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search name, email, or action..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={T.searchInput}
            />
            {searchQuery && (
              <button style={T.clearSearch} onClick={() => setSearchQuery('')}>
                <X size={13} />
              </button>
            )}
          </div>

          <div style={filterPill(activeSortField === 'name' && nameSort !== 'none')}>
            <span style={filterLabel(activeSortField === 'name' && nameSort !== 'none')}>Name</span>
            <select
              value={activeSortField === 'name' ? nameSort : 'none'}
              onChange={e => { setActiveSortField('name'); setNameSort(e.target.value); setCurrentPage(1); }}
              style={selectStyle}
            >
              <option value="none">Default</option>
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
          </div>

          <div style={filterPill(false)}>
            <span style={filterLabel(false)}>Date</span>
            <select
              value={activeSortField === 'timestamp' ? dateSort : 'desc'}
              onChange={e => { setActiveSortField('timestamp'); setDateSort(e.target.value); setCurrentPage(1); }}
              style={selectStyle}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          <div style={filterPill(!!actionFilter)}>
            <Filter size={12} style={{ color: actionFilter ? '#8b0000' : T.textSec }} />
            <select
              value={actionFilter}
              onChange={e => { setActionFilter(e.target.value); setCurrentPage(1); }}
              style={{ ...selectStyle, color: actionFilter ? '#8b0000' : T.textPri }}
            >
              {ACTION_FILTER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={filterPill(!!roleFilter)}>
            <span style={filterLabel(!!roleFilter)}>Role</span>
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              style={{ ...selectStyle, color: roleFilter ? '#8b0000' : T.textPri }}
            >
              {ROLE_FILTER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '0 14px', height: 36, borderRadius: 20, border: 'none',
                background: T.dark ? 'rgba(255,255,255,0.06)' : '#f0f0f3',
                color: T.textSec, fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
                boxShadow: T.dark ? 'none' : '6px 6px 16px rgba(13,39,80,0.13)',
              }}
            >
              <X size={13} />Clear
            </button>
          )}

          <div style={{ marginLeft: 'auto' }}>
            <div style={{
              display: 'flex',
              background: T.dark ? T.surface2 : '#f0f0f3',
              border: T.dark ? `1px solid ${T.border}` : 'none',
              borderRadius: 20, padding: 3, gap: 2,
              boxShadow: T.dark ? 'none' : 'inset 3px 3px 8px rgba(13,39,80,0.12), inset -2px -2px 6px rgba(255,255,255,0.85)',
            }}>
              {VIEW_MODES.map(({ mode, label, icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={label}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    background: viewMode === mode
                      ? (T.dark ? T.surface : '#f0f0f3')
                      : 'transparent',
                    color: viewMode === mode ? (T.dark ? '#fff' : '#8b0000') : T.textSec,
                    boxShadow: viewMode === mode
                      ? (T.dark ? '0 1px 4px rgba(0,0,0,0.4)' : '4px 4px 10px rgba(13,39,80,0.13)')
                      : 'none',
                    transition: 'all 0.15s', fontSize: 11,
                    fontWeight: viewMode === mode ? 600 : 400,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {icon}{label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Main panel ── */}
        <div style={{
          background: T.dark ? T.surface : '#f0f0f3',
          borderRadius: 20,
          boxShadow: T.shadow,
          border: T.dark ? `1px solid ${T.border}` : 'none',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', borderBottom: `1px solid ${T.border}`,
            background: T.dark ? T.surface2 : '#f0f0f3',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.textPri, fontFamily: "'Poppins', sans-serif", letterSpacing: '-0.01em', marginBottom: 2 }}>
                User Activity Overview
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "'Poppins', sans-serif" }}>
                  {loading ? 'Loading...' : `${filtered.length} log${filtered.length !== 1 ? 's' : ''} found`}
                </span>
                {actionFilter && !loading && (
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: T.dark ? 'rgba(139,0,0,0.15)' : 'rgba(139,0,0,0.08)', color: '#8b0000', fontFamily: "'Poppins', sans-serif" }}>
                    {ACTION_FILTER_OPTIONS.find(o => o.value === actionFilter)?.label}
                  </span>
                )}
                {roleFilter && !loading && (
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: T.dark ? 'rgba(139,0,0,0.15)' : 'rgba(139,0,0,0.08)', color: '#8b0000', fontFamily: "'Poppins', sans-serif" }}>
                    {ROLE_FILTER_OPTIONS.find(o => o.value === roleFilter)?.label}
                  </span>
                )}
              </div>
            </div>
            <button title="Column settings" style={{
              width: 32, height: 32, borderRadius: '50%',
              border: 'none', background: T.dark ? T.surface : '#f0f0f3',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: T.textMuted,
              border: T.dark ? `1px solid ${T.border}` : 'none', boxShadow: T.dark ? 'none' : '4px 4px 10px rgba(13,39,80,0.12)',
            }}>
              <SlidersHorizontal size={14} />
            </button>
          </div>

          {loading && viewMode !== 'table' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 12 }}>
              <div style={{ width: 24, height: 24, border: `2.5px solid ${T.border}`, borderTopColor: '#8b0000', borderRadius: '50%', animation: 'alSpin 0.7s linear infinite' }} />
              <span style={{ fontSize: 12, color: T.textMuted, fontFamily: "'Poppins', sans-serif" }}>Loading logs…</span>
            </div>
          ) : !loading && filtered.length === 0 && viewMode !== 'table' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 10 }}>
              <Activity size={28} strokeWidth={1.5} style={{ color: T.textMuted }} />
              <div style={{ fontSize: 13, fontWeight: 500, color: T.textPri, fontFamily: "'Poppins', sans-serif" }}>No activity logs found</div>
              <div style={{ fontSize: 12, color: T.textMuted, fontFamily: "'Poppins', sans-serif" }}>Try adjusting your filters or search query.</div>
            </div>
          ) : viewMode === 'table' ? renderTableView()
            : viewMode === 'card'  ? renderCardView()
            : renderListView()}

          {/* ── Pagination ── */}
          {!loading && filtered.length > ROWS_PER_PAGE && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 18px', borderTop: `1px solid ${T.border}`,
              background: T.dark ? T.surface2 : '#f0f0f3', flexWrap: 'wrap', gap: 8,
            }}>
              <span style={{ fontSize: 11, color: T.textMuted, fontFamily: "'Poppins', sans-serif" }}>
                Showing {((currentPage - 1) * ROWS_PER_PAGE) + 1}–{Math.min(currentPage * ROWS_PER_PAGE, filtered.length)} of {filtered.length}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 1}
                  style={{ height: 32, padding: '0 14px', borderRadius: 20, border: 'none', background: T.dark ? T.surface : '#f0f0f3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? T.textMuted : T.textPri, opacity: currentPage === 1 ? 0.4 : 1, border: T.dark ? `1px solid ${T.border}` : 'none', fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 600 }}
                ><ChevronLeft size={14} /></button>

                {(() => {
                  const WINDOW = 5;
                  const pages = [];
                  let start = Math.max(1, currentPage - Math.floor(WINDOW / 2));
                  let end   = start + WINDOW - 1;
                  if (end > totalPages) { end = totalPages; start = Math.max(1, end - WINDOW + 1); }
                  if (start > 1) {
                    pages.push(<button key={1} onClick={() => setCurrentPage(1)} style={{ height: 32, minWidth: 32, padding: '0 10px', borderRadius: 20, border: 'none', background: T.dark ? T.surface : '#f0f0f3', cursor: 'pointer', fontSize: 11, fontWeight: 500, color: T.textPri, fontFamily: "'Poppins', sans-serif", border: T.dark ? `1px solid ${T.border}` : 'none' }}>1</button>);
                    if (start > 2) pages.push(<span key="s" style={{ fontSize: 12, color: T.textMuted, padding: '0 2px' }}>…</span>);
                  }
                  for (let pg = start; pg <= end; pg++) {
                    pages.push(<button key={pg} onClick={() => setCurrentPage(pg)} style={{ height: 32, minWidth: 32, padding: '0 10px', borderRadius: 20, border: 'none', background: T.dark ? T.surface : '#f0f0f3', cursor: 'pointer', fontSize: 11, fontWeight: pg === currentPage ? 700 : 500, color: pg === currentPage ? '#8b0000' : T.textPri, fontFamily: "'Poppins', sans-serif", boxShadow: pg === currentPage ? (T.dark ? `inset 0 0 0 1px ${T.border}` : 'inset 3px 3px 8px rgba(13,39,80,0.12), inset -2px -2px 6px rgba(255,255,255,0.85)') : (T.dark ? 'none' : '4px 4px 10px rgba(13,39,80,0.12)') }}>{pg}</button>);
                  }
                  if (end < totalPages) {
                    if (end < totalPages - 1) pages.push(<span key="e" style={{ fontSize: 12, color: T.textMuted, padding: '0 2px' }}>…</span>);
                    pages.push(<button key={totalPages} onClick={() => setCurrentPage(totalPages)} style={{ height: 32, minWidth: 32, padding: '0 10px', borderRadius: 20, border: 'none', background: T.dark ? T.surface : '#f0f0f3', cursor: 'pointer', fontSize: 11, fontWeight: 500, color: T.textPri, fontFamily: "'Poppins', sans-serif", border: T.dark ? `1px solid ${T.border}` : 'none' }}>{totalPages}</button>);
                  }
                  return pages;
                })()}

                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage === totalPages}
                  style={{ height: 32, padding: '0 14px', borderRadius: 20, border: 'none', background: T.dark ? T.surface : '#f0f0f3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? T.textMuted : T.textPri, opacity: currentPage === totalPages ? 0.4 : 1, border: T.dark ? `1px solid ${T.border}` : 'none', fontFamily: "'Poppins', sans-serif", fontSize: 11, fontWeight: 600 }}
                ><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ActivityLogs;