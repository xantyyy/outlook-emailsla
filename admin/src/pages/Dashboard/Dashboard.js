import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Bug, AlertCircle, Zap, CheckCircle, FileText, Mail,
  Plus, List, X, User, TrendingUp,
  PieChart as PieChartIcon, Search, ArrowUpRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import api from '../../services/api';
import BugReportModal from '../../components/BugReportModal';
import useRealtimeNotifications from '../../hooks/useRealtimeNotifications';

const getDarkModeFromStorage = () => {
  const stored = localStorage.getItem('darkMode');
  if (stored !== null) return stored === 'true';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
};

const makeStyles = (dark) => {
  const bg        = dark ? '#0c0b0b' : '#f8fafc';
  const surface   = dark ? '#1a1d27' : '#ffffff';
  const surface2  = dark ? '#22263a' : '#f9fafb';
  const border    = dark ? '#2e3347' : '#e5e7eb';
  const border2   = dark ? '#252840' : '#f3f4f6';
  const textPri   = dark ? '#e2e8f0' : '#454545';
  const textSec   = dark ? '#94a3b8' : '#9ca3af';
  const textMuted = dark ? '#64748b' : '#b0a0a0';
  const shadow    = dark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04)';
  const shadowHero= dark ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.08)';

  return {
    dashboard: { display: 'flex', gap: '20px', padding: '24px', minHeight: '100vh', background: bg, fontFamily: "'Poppins', sans-serif", position: 'relative', boxSizing: 'border-box', transition: 'background 0.3s ease' },
    main:    { flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, overflow: 'hidden' },
    sidebar: { width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 },
    toast: { position: 'fixed', top: '20px', right: '20px', zIndex: 9999, background: '#4a0a0a', border: '1px solid #7f1d1d', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 8px 32px rgba(120,0,0,0.4)', maxWidth: '360px', animation: 'slideIn 0.3s ease' },
    toastIcon: { width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, background: 'linear-gradient(135deg, #b91c1c, #7f1d1d)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' },
    toastContent: { flex: 1 },
    toastTitle:   { color: '#fca5a5', fontWeight: 700, fontSize: '13px', marginBottom: '2px' },
    toastMessage: { color: '#fecaca', fontSize: '12px', fontWeight: 400 },
    toastClose:   { background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
    cardHero:  { background: 'linear-gradient(135deg, #4a0a0a 0%, #bb0000 100%)', borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden', cursor: 'default', transition: 'transform 0.2s ease, box-shadow 0.2s ease', border: 'none', boxShadow: shadowHero },
    cardWhite: { background: surface, borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden', cursor: 'default', transition: 'transform 0.2s ease, box-shadow 0.2s ease', border: dark ? `1px solid ${border}` : 'none', boxShadow: shadow },
    card:      { background: surface, borderRadius: '20px', padding: '24px', border: dark ? `1px solid ${border}` : 'none', boxShadow: shadow },
    chartsGrid:{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    iconHero:   { width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#fca5a5' },
    iconRed:    { width: '44px', height: '44px', borderRadius: '12px', background: dark ? 'rgba(220,38,38,0.15)' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#b91c1c' },
    iconMaroon: { width: '44px', height: '44px', borderRadius: '12px', background: dark ? 'rgba(127,29,29,0.2)' : '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#7f1d1d' },
    iconCheck:  { width: '44px', height: '44px', borderRadius: '12px', background: dark ? 'rgba(21,128,61,0.15)' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: dark ? '#4ade80' : '#15803d' },
    labelHero:  { fontSize: '11px', fontWeight: 400, color: 'rgba(255,210,210,0.60)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' },
    labelWhite: { fontSize: '11px', fontWeight: 400, color: textMuted, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' },
    valueHero:  { fontSize: '32px', fontWeight: 600, color: 'rgba(255,255,255,0.90)', lineHeight: 1.1, marginBottom: '10px' },
    valueWhite: { fontSize: '32px', fontWeight: 600, color: textPri, lineHeight: 1.1, marginBottom: '10px' },
    badgeHero:   { display: 'inline-flex', alignItems: 'center', gap: '3px', background: 'rgba(255,255,255,0.15)', color: '#fca5a5', fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px' },
    badgeRed:    { display: 'inline-flex', alignItems: 'center', gap: '3px', background: dark ? 'rgba(220,38,38,0.15)' : '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px' },
    badgeMaroon: { display: 'inline-flex', alignItems: 'center', gap: '3px', background: dark ? 'rgba(127,29,29,0.2)' : '#ffeaea', color: '#b91c1c', fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px' },
    badgeGreen:  { display: 'inline-flex', alignItems: 'center', gap: '3px', background: dark ? 'rgba(21,128,61,0.15)' : '#f0fff4', color: dark ? '#4ade80' : '#15803d', fontSize: '11px', fontWeight: 500, padding: '3px 8px', borderRadius: '20px' },
    cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' },
    cardTitle:  { fontSize: '14px', fontWeight: 600, color: textPri, margin: 0 },
    cardSub:    { fontSize: '11px', color: textSec, fontWeight: 400, marginBottom: '16px' },
    chipBtn:    { display: 'flex', alignItems: 'center', gap: '4px', background: dark ? border : '#f3f4f6', borderRadius: '8px', padding: '4px 10px', fontSize: '11px', fontWeight: 500, color: textSec, border: 'none', cursor: 'pointer' },
    legendRow:   { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' },
    legendItem:  { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: surface2, borderRadius: '10px', border: `1px solid ${border2}` },
    legendDot:   { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
    legendLabel: { fontSize: '13px', fontWeight: 400, color: textSec, flex: 1 },
    legendValue: { fontSize: '13px', fontWeight: 600, color: textPri },
    legendPct:   { fontSize: '11px', fontWeight: 500, color: textSec, background: dark ? border : '#e5e7eb', padding: '1px 6px', borderRadius: '20px' },
    bugsList:  { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' },
    bugItem:   { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px 14px', background: surface2, borderRadius: '12px', border: `1px solid ${border2}`, cursor: 'pointer', transition: 'all 0.15s ease', minHeight: '80px', position: 'relative', overflow: 'hidden' },
    bugDot:    { width: '100%', height: '3px', borderRadius: '3px 3px 0 0', position: 'absolute', top: 0, left: 0 },
    bugTitle:  { fontSize: '12px', fontWeight: 500, color: textPri, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '8px', paddingTop: '4px' },
    bugMeta:   { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: textSec, fontWeight: 400 },
    bugTitleWrap: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 },
    bugBadges:    { display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 },
    bCritical: { background: dark ? 'rgba(220,38,38,0.15)'  : '#fef2f2', color: '#dc2626', fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '5px', whiteSpace: 'nowrap' },
    bHigh:     { background: dark ? 'rgba(234,88,12,0.15)'  : '#fff7ed', color: '#ea580c', fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '5px', whiteSpace: 'nowrap' },
    bMedium:   { background: dark ? 'rgba(217,119,6,0.15)'  : '#fffbeb', color: '#d97706', fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '5px', whiteSpace: 'nowrap' },
    bLow:      { background: dark ? 'rgba(22,163,74,0.15)'  : '#f0fdf4', color: dark ? '#4ade80' : '#16a34a', fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '5px', whiteSpace: 'nowrap' },
    sOpen:     { background: dark ? 'rgba(37,99,235,0.15)'  : '#eff6ff', color: dark ? '#60a5fa' : '#2563eb', fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '5px', whiteSpace: 'nowrap' },
    sProgress: { background: dark ? 'rgba(217,119,6,0.15)'  : '#fffbeb', color: '#d97706', fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '5px', whiteSpace: 'nowrap' },
    sResolved: { background: dark ? 'rgba(22,163,74,0.15)'  : '#f0fdf4', color: dark ? '#4ade80' : '#16a34a', fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '5px', whiteSpace: 'nowrap' },
    sClosed:   { background: dark ? border                  : '#f9fafb', color: textSec, fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '5px', whiteSpace: 'nowrap' },
    sReopened: { background: dark ? 'rgba(124,58,237,0.15)' : '#faf5ff', color: dark ? '#a78bfa' : '#7c3aed', fontSize: '11px', fontWeight: 500, padding: '3px 9px', borderRadius: '5px', whiteSpace: 'nowrap' },
    searchBox:   { display: 'flex', alignItems: 'center', gap: '8px', background: surface2, borderRadius: '10px', padding: '8px 12px', flex: 1, maxWidth: '280px', border: `1px solid ${border}` },
    searchInput: { background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: textPri, fontFamily: "'Poppins', sans-serif", fontWeight: 400, flex: 1, width: '100%' },
    clearSearch: { background: 'none', border: 'none', cursor: 'pointer', color: textSec, display: 'flex', padding: 0 },
    sectionHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', gap: '12px', flexWrap: 'wrap' },
    headerActions: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
    viewAllBtn: { background: dark ? '#e2e8f0' : '#111827', color: dark ? '#111827' : '#fff', border: 'none', borderRadius: '10px', padding: '8px 16px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", transition: 'background 0.15s ease' },
    emptyState: { padding: '32px', textAlign: 'center', color: textSec, fontSize: '13px' },
    bugsTableHeader:     { display: 'none' },
    bugsTableHeaderText: { display: 'none' },
    profileCard:   { background: 'linear-gradient(135deg, #4a0a0a 0%, #bb0000 100%)', borderRadius: '20px', padding: '24px', textAlign: 'center', border: 'none', boxShadow: shadowHero },
    profileAvatar: { width: '72px', height: '72px', borderRadius: '16px', overflow: 'hidden', margin: '0 auto 12px', border: '2px solid rgba(255,150,150,0.4)', background: 'rgba(255,255,255,0.1)' },
    profileName:   { fontSize: '16px', fontWeight: 600, color: 'rgba(255,255,255,0.90)', marginBottom: '2px' },
    profileRole:   { fontSize: '11px', color: 'rgba(255,220,220,0.70)', fontWeight: 400, marginBottom: '20px' },
    profileStats:  { display: 'flex', justifyContent: 'center', gap: '32px', borderTop: '1px solid rgba(255,150,150,0.2)', paddingTop: '16px' },
    profileVal:    { fontSize: '22px', fontWeight: 600, color: '#fca5a5' },
    profileLabel:  { fontSize: '11px', color: 'rgba(255,200,200,0.6)', fontWeight: 400 },
    quickCard:  { background: surface, borderRadius: '20px', padding: '20px', border: dark ? `1px solid ${border}` : 'none', boxShadow: shadow },
    quickTitle: { fontSize: '14px', fontWeight: 600, color: textPri, marginBottom: '4px' },
    quickBtn:   { width: '100%', display: 'flex', alignItems: 'center', gap: '10px', background: surface2, border: `1px solid ${border}`, borderRadius: '12px', padding: '12px 14px', fontSize: '13px', fontWeight: 400, color: textPri, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", marginBottom: '8px', textAlign: 'left', transition: 'all 0.15s ease', position: 'relative' },
    quickIcon:  { width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0, background: 'linear-gradient(135deg, #4a0a0a, #bb0000)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' },
    quickBadge: { marginLeft: 'auto', background: '#4a0a0a', color: '#fff', borderRadius: '20px', padding: '2px 7px', fontSize: '11px', fontWeight: 700 },
    activityCard:    { background: surface, borderRadius: '20px', padding: '20px', flex: 1, border: dark ? `1px solid ${border}` : 'none', boxShadow: shadow },
    activityTitle:   { fontSize: '14px', fontWeight: 600, color: textPri, marginBottom: '4px' },
    activityItem:    { display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px', paddingBottom: '12px', borderBottom: `1px solid ${border2}` },
    actIconBug:      { width: '30px', height: '30px', borderRadius: '8px', background: dark ? 'rgba(220,38,38,0.15)' : '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    actIconResolved: { width: '30px', height: '30px', borderRadius: '8px', background: dark ? 'rgba(22,163,74,0.15)' : '#f0fdf4', color: dark ? '#4ade80' : '#15803d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    actText: { fontSize: '13px', color: textPri, fontWeight: 400, lineHeight: 1.4 },
    actTime: { fontSize: '11px', color: textSec, fontWeight: 400, marginTop: '2px' },
    loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', fontFamily: "'Poppins', sans-serif", background: bg },
    loadingText: { color: '#bb0000', fontSize: '14px', fontWeight: 500 },
    dmToggle: { position: 'fixed', bottom: '24px', right: '24px', zIndex: 999, width: '44px', height: '44px', borderRadius: '50%', background: dark ? '#e2e8f0' : '#1a1d27', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'all 0.2s ease', color: dark ? '#1a1d27' : '#e2e8f0', fontSize: '18px' },
    textSec, textPri, border, border2, surface, surface2,
  };
};

const Dashboard = () => {
  const [stats, setStats]               = useState(null);
  const [recentBugs, setRecentBugs]     = useState([]);
  const [filteredBugs, setFilteredBugs] = useState([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [loading, setLoading]           = useState(true);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [pendingBugsCount, setPendingBugsCount] = useState(0);
  const [notification, setNotification] = useState(null);
  const [adminData, setAdminData]       = useState(null);
  const [showAllBugs, setShowAllBugs]   = useState(false);
  const [viewMode, setViewMode]         = useState('card');
  const [sortBy, setSortBy]             = useState('newest');
  const [currentPage, setCurrentPage]   = useState(1);

  const [darkMode, setDarkMode] = useState(getDarkModeFromStorage);

  const PAGE_SIZE = 4;
  const S = makeStyles(darkMode);

  useEffect(() => {
    const handleDarkModeChange = (e) => { setDarkMode(e.detail.darkMode); };
    window.addEventListener('darkModeChange', handleDarkModeChange);
    return () => window.removeEventListener('darkModeChange', handleDarkModeChange);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem('darkMode');
      if (stored !== null) {
        const val = stored === 'true';
        setDarkMode(prev => prev !== val ? val : prev);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      window.dispatchEvent(new CustomEvent('darkModeChange', { detail: { darkMode: next } }));
      return next;
    });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('adminData');
    if (stored) {
      try { setAdminData(JSON.parse(stored)); }
      catch (e) { console.error('Error parsing admin data:', e); }
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (localStorage.getItem('darkMode') === null) setDarkMode(e.matches);
    };
    mq?.addEventListener('change', handler);
    return () => mq?.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    let base = [...recentBugs];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = base.filter(bug =>
        bug.title?.toLowerCase().includes(q) ||
        bug.description?.toLowerCase().includes(q) ||
        bug.severity?.toLowerCase().includes(q) ||
        bug.status?.toLowerCase().includes(q) ||
        bug.priority?.toLowerCase().includes(q) ||
        bug.reportedBy?.name?.toLowerCase().includes(q)
      );
    }
    const sevOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    if (sortBy === 'newest')   base.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortBy === 'oldest')   base.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortBy === 'severity') base.sort((a, b) => (sevOrder[a.severity] ?? 4) - (sevOrder[b.severity] ?? 4));
    if (sortBy === 'title')    base.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    setFilteredBugs(base);
    setCurrentPage(1);
  }, [searchQuery, recentBugs, sortBy]);

  const playNotificationSound = () => {
    try {
      const beep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSh+zPLaizsIGGS57OihUBELTKXh8bllHAU2jdXzzn0vBSF1xvDglEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z1YU2Bhxqvu7mnEoODlOq5O+zYBoGPJPY88p2KwUme8rx3I0+CRZiturqpVITC0mi4PK8aB8GM4nU8tGAMQYfccLu45ZFDBFYr+ftrVoXCECY3PLEcSYELIHO8diJOQcZaLvt559NEAxPqOPwtmMcBjiP1/PMeS0GI3fH8N2RQAoUXrTp66hVFApGnt/yvmwhBTCG0fPTgjQGHW/A7eSaRw0PVqzl77BeGQc9ltvyxnUoBSh+zPDaizsIGGS56+mjTxELTKXh8bllHAU1jdXzzn0vBSF1xe/glEILElyx6OyrWRUIRJve8sFuJAUug8/y1YU2Bhxqvu3mnEoPDlSq5O+zYRsGPJLZ88p3KwUme8rx3I4+CRVht+rqpVMSC0mh4fK8aiAFM4nU8tGBMQYfccPu45ZFDBFYr+ftrVwWCECY3PLEcSYELIHO8tiJOQcZZ7zs56BODwxPpuPxt2McBjiP1/PMeS0GI3fH8N+RQAoUXrTp66hWEwlGnt/yv2wiBDCG0fPTgzQGHG/A7eSaSQ0PVqzl77BeGQc9ltrzxnUoBSh9zPDaizsIGGS56+mjUREKTKPi8blnHAU1jdT0z3wvBSF1xe/glEILElyx6OyrWRUIRJve8sFuJAUug8/y1YU2Bhxqvu3mnEoPDlSq5O+zYRsGPJLZ88p3KwUme8rx3I4+CRVht+rqpVMSC0mh4fK8aiAFM4nU8tGBMQYfccLu45ZFDBFYr+ftrVwWCECY3PLEcSYEK4DN8tiJOQcZZ7zs56BODwxPpuPxt2McBjiP1/PMey0GI3fH8N+RQAoUXrTp66hWEwlGnt/yv2wiBDCG0fPTgzQGHG/A7eSaSQ0PVqzl77BeGQc9ltrzxnUoBSh9zPDaizsIGGS56+mjUREKTKPi8blnHAU1jdT0z3wvBSF1xe/glEILElyx6OyrWRUIRJve8sFuJAUug8/y1YU2Bhxqvu3mnEoPDlSq5O+zYhsGPJLZ88p3KwUme8rx3I4+CRVhtuvqpVMSC0mh4fK8aiAFM4nU8tGBMQYfccLu45ZFDBFYr+ftrVwWCECY3PLEcSYEK4DN8tiJOQcZZ7zs56BODwxPpuPxt2McBjiP1/PMey0GI3fH8N+RQQoUXrTp66hWEwlGnt/yv2wiBDCG0fPTgzQGHG/A7eSaSg0PVqzl77BeGQc9ltrzxnUoBSh9zPDaizsIGGS56+mjUREKTKPi8blnHAU1jdT0z3wvBSF1xe/glEMLElyx6OyrWRUIRJve8sFuJAUug8/y1YU2Bhxqvu3mnEoPDlSq5O+zYhsGPJLZ88p3KwUme8rx3I4+CRVhtuvqpVMSC0mh4fK8aiAFM4nU8tGBMQYfccLu45ZFDBFYr+ftrVwWCECY3PLEcSYEK4DN8tiJOQcZZ7zs56BODwxPpuPxt2McBjiP1/PMey0GI3fH8N+RQQoUXrTp66hWEwlGnt/yv2wiBDCG0fPTgzQGHG/A7eSaSg0PVqzl77BeGQc9ltrzxnUoBSh9zPDaizsIGGS56+mjUREKTKPi8blnHAU1jdT0z3wvBSF1xe/glEMLElyx6OyrWRUIRJve8sFuJAUug8/y1YU2Bhxqvu3mnEoPDlSq5O+zYhsGPJLZ88p3KwUme8rx3I4+CRVhtuvqpVMSC0mh4fK8aiAF');
      beep.volume = 0.3;
      beep.play().catch(() => {});
    } catch (e) {}
  };

  const showNotification = useCallback((message, type = 'bug') => {
    setNotification({ message, type, id: Date.now() });
    playNotificationSound();
    setTimeout(() => setNotification(null), 8000);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const statsRes = await api.get('/bugs/stats');
      setStats(statsRes.data);
      const bugsRes  = await api.get('/bugs?limit=8&sortBy=createdAt&sortOrder=desc');
      setRecentBugs(bugsRes.data.bugs || []);
      setFilteredBugs(bugsRes.data.bugs || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkForNewBugs = useCallback(async () => {
    try {
      const res = await api.get('/bugs/pending');
      setPendingBugsCount(res.data.length);
    } catch (e) {}
  }, []);

  const handleRealtimeNotification = useCallback((data) => {
    showNotification(data.message || data.title, data.type);
    if (['new_bug_outlook', 'bug_status_change', 'bug_assigned'].includes(data.type)) {
      fetchDashboardData();
      checkForNewBugs();
    }
  }, [showNotification, fetchDashboardData, checkForNewBugs]);

  const { isConnected, connectionStatus } = useRealtimeNotifications(handleRealtimeNotification);

  useEffect(() => {
    fetchDashboardData();
    checkForNewBugs();
  }, [fetchDashboardData, checkForNewBugs]);

  const getSevStyle    = (s) => ({ Critical: S.bCritical, High: S.bHigh, Medium: S.bMedium, Low: S.bLow })[s] || S.bLow;
  const getStatStyle   = (s) => ({ 'Open': S.sOpen, 'In Progress': S.sProgress, 'Resolved': S.sResolved, 'Closed': S.sClosed, 'Reopened': S.sReopened })[s] || S.sClosed;
  const getSevDotColor = (s) => ({ Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#22c55e' })[s] || '#d1d5db';

  const formatDate = (d) => {
    const diff = Date.now() - new Date(d);
    const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), day = Math.floor(diff / 86400000);
    if (m  < 60)  return `${m}m ago`;
    if (h  < 24)  return `${h}h ago`;
    if (day < 7)  return `${day}d ago`;
    return new Date(d).toLocaleDateString();
  };

  const statusData = [
    { name: 'Open',        value: stats?.byStatus?.open       || 0, color: '#3b82f6' },
    { name: 'In Progress', value: stats?.byStatus?.inProgress || 0, color: '#f59e0b' },
    { name: 'Resolved',    value: stats?.byStatus?.resolved   || 0, color: '#22c55e' },
    { name: 'Closed',      value: stats?.byStatus?.closed     || 0, color: '#d1d5db' },
  ].filter(d => d.value > 0);

  const severityBarData = [
    { name: 'Critical', value: stats?.bySeverity?.critical || 0, fill: '#ef4444' },
    { name: 'High',     value: stats?.bySeverity?.high     || 0, fill: '#f97316' },
    { name: 'Medium',   value: stats?.bySeverity?.medium   || 0, fill: '#f59e0b' },
    { name: 'Low',      value: stats?.bySeverity?.low      || 0, fill: '#22c55e' },
  ];

  const ThemedTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: '10px', padding: '10px 14px', fontSize: '12px', fontWeight: 600, color: S.textPri, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontFamily: "'Poppins', sans-serif" }}>
        {label && <p style={{ marginBottom: 4, color: S.textSec, fontWeight: 500 }}>{label}</p>}
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.fill || p.color || '#bb0000' }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={S.loadingWrap}>
        <div style={{ width: '40px', height: '40px', border: `3px solid ${S.border}`, borderTop: `3px solid #bb0000`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={S.loadingText}>Loading dashboard...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={S.dashboard} className="dash-wrap">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Poppins', sans-serif !important; box-sizing: border-box !important; }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes spin    { to   { transform:rotate(360deg); } }

        .bug-link         { display:block; width:100%; }
        .bug-link:hover .bug-row   { background:${darkMode ? '#22263a' : '#f8fafc'} !important; border-color:${darkMode ? '#3a3f58' : '#d1d9e6'} !important; transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,${darkMode ? '0.3' : '0.08'}) !important; }
        .qa-btn:hover              { background:${darkMode ? '#2a2f45' : '#f3f4f6'} !important; border-color:${darkMode ? '#3a3f58' : '#e5e7eb'} !important; color:${darkMode ? '#e2e8f0' : '#374151'} !important; }
        .card-hero:hover,
        .card-white:hover          { transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,${darkMode ? '0.5' : '0.12'}), 0 3px 8px rgba(0,0,0,${darkMode ? '0.3' : '0.07'}) !important; }
        .view-all:hover            { background:${darkMode ? '#cbd5e1' : '#374151'} !important; }
        .dm-toggle:hover           { transform:scale(1.1); }
        .breadcrumb-link:hover     { color: #bb0000 !important; }

        select option { background: ${darkMode ? '#1a1d27' : '#ffffff'} !important; color: ${darkMode ? '#e2e8f0' : '#454545'} !important; }

        ::-webkit-scrollbar            { width:5px; }
        ::-webkit-scrollbar-track      { background:${darkMode ? '#0f1117' : '#f8fafc'}; }
        ::-webkit-scrollbar-thumb      { background:${darkMode ? '#2e3347' : '#e2e8f0'}; border-radius:3px; }

        @media (max-width:1200px){
          .dash-wrap        { flex-direction:column !important; }
          .dash-sidebar     { width:100% !important; flex-direction:row !important; flex-wrap:wrap !important; }
          .dash-sidebar > * { flex:1 1 260px !important; min-width:0 !important; }
          .charts-grid      { grid-template-columns:1fr 1fr !important; }
        }
        @media (max-width:860px){
          .charts-grid      { grid-template-columns:1fr !important; }
          .bugs-grid        { grid-template-columns:1fr 1fr !important; }
          .sec-header       { flex-direction:column !important; align-items:flex-start !important; }
          .sec-header > div:last-child { width:100% !important; flex-wrap:wrap !important; }
          .search-box-wrap  { max-width:100% !important; flex:1 1 auto !important; min-width:0 !important; }
        }
        @media (max-width:600px){
          .dash-wrap        { padding:12px !important; gap:10px !important; }
          .stats-grid       { grid-template-columns:1fr 1fr !important; }
          .bugs-grid        { grid-template-columns:1fr !important; }
          .charts-grid      { grid-template-columns:1fr !important; }
          .dash-sidebar     { flex-direction:column !important; }
          .dash-sidebar > * { flex:1 1 auto !important; width:100% !important; }
          .sec-header       { flex-direction:column !important; align-items:flex-start !important; gap:8px !important; }
          .sec-header > div:last-child { width:100% !important; gap:6px !important; }
          .search-box-wrap  { max-width:100% !important; width:100% !important; }
          .pagination-row   { flex-direction:column !important; align-items:flex-start !important; gap:8px !important; }
          .bug-toolbar      { flex-wrap:wrap !important; gap:6px !important; }
        }
        @media (max-width:400px){
          .stats-grid       { grid-template-columns:1fr !important; }
          .bugs-grid        { grid-template-columns:1fr !important; }
          .page-btns button { padding:4px 6px !important; font-size:11px !important; }
        }
      `}</style>

      {/* Toast */}
      {notification && (
        <div style={S.toast}>
          <div style={S.toastIcon}><Bug size={20} /></div>
          <div style={S.toastContent}>
            <div style={S.toastTitle}>New Bug Report!</div>
            <div style={S.toastMessage}>{notification.message}</div>
          </div>
          <button style={S.toastClose} onClick={() => setNotification(null)}><X size={16} /></button>
        </div>
      )}

      {/* ══ MAIN ══ */}
      <div style={S.main}>

        {/* ── Page Header ── */}
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: S.textPri, margin: '0 0 2px 0', lineHeight: 1.2 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: '12px', fontWeight: 400, color: S.textSec, margin: 0 }}>
            Overview of your bug tracking activity
          </p>
        </div>

        {/* Stat Cards */}
        <div style={S.statsGrid} className="stats-grid">

          <div style={S.cardHero} className="card-hero">
            <div style={S.iconHero}><Bug size={20} /></div>
            <div style={S.labelHero}>Total Bugs</div>
            <div style={S.valueHero}>{stats?.total || 0}</div>
            <span style={S.badgeHero}><ArrowUpRight size={10} /> All time</span>
          </div>

          <div style={S.cardWhite} className="card-white">
            <div style={S.iconRed}><AlertCircle size={20} /></div>
            <div style={S.labelWhite}>Critical</div>
            <div style={S.valueWhite}>{stats?.bySeverity?.critical || 0}</div>
            <span style={S.badgeRed}><ArrowUpRight size={10} /> Needs attention</span>
          </div>

          <div style={S.cardWhite} className="card-white">
            <div style={S.iconMaroon}><Zap size={20} /></div>
            <div style={S.labelWhite}>In Progress</div>
            <div style={S.valueWhite}>{stats?.byStatus?.inProgress || 0}</div>
            <span style={S.badgeMaroon}><TrendingUp size={10} /> Active</span>
          </div>

          <div style={S.cardWhite} className="card-white">
            <div style={S.iconCheck}><CheckCircle size={20} /></div>
            <div style={S.labelWhite}>Resolved</div>
            <div style={S.valueWhite}>{stats?.byStatus?.resolved || 0}</div>
            <span style={S.badgeGreen}><ArrowUpRight size={10} /> Fixed</span>
          </div>
        </div>

        {/* Charts */}
        <div style={S.chartsGrid} className="charts-grid">

          <div style={S.card}>
            <div style={S.cardHeader}>
              <h2 style={S.cardTitle}>Status Overview</h2>
              <button style={S.chipBtn}><PieChartIcon size={12} /> Today</button>
            </div>
            <p style={S.cardSub}>Track your bug statuses</p>
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={4} dataKey="value">
                  {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<ThemedTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={S.legendRow}>
              {statusData.map((item, i) => (
                <div key={i} style={S.legendItem}>
                  <div style={{ ...S.legendDot, background: item.color }} />
                  <span style={S.legendLabel}>{item.name}</span>
                  <span style={S.legendValue}>{item.value}</span>
                  <span style={S.legendPct}>{((item.value / (stats?.total || 1)) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <div style={S.cardHeader}>
              <h2 style={S.cardTitle}>Severity Breakdown</h2>
              <button style={S.chipBtn}><TrendingUp size={12} /> This Year</button>
            </div>
            <p style={S.cardSub}>Track your bug severity</p>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={severityBarData} barSize={30}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#2e3347' : '#f3f4f6'} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: S.textSec, fontWeight: 500, fontSize: 11, fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: S.textSec, fontWeight: 500, fontSize: 11, fontFamily: 'Poppins' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ThemedTooltip />} cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Bugs">
                  {severityBarData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={S.legendRow}>
              {severityBarData.map((item, i) => (
                <div key={i} style={S.legendItem}>
                  <div style={{ ...S.legendDot, background: item.fill }} />
                  <span style={S.legendLabel}>{item.name}</span>
                  <span style={S.legendValue}>{item.value}</span>
                  <span style={S.legendPct}>{((item.value / (stats?.total || 1)) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Bugs */}
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px', gap: '10px', flexWrap: 'wrap' }} className="sec-header">
            <div>
              <h2 style={S.cardTitle}>Recent Bugs</h2>
              <p style={{ ...S.cardSub, marginBottom: 0 }}>Latest reported issues</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }} className="bug-toolbar">
              <div style={{ ...S.searchBox, maxWidth: '220px', flex: '1 1 160px' }} className="search-box-wrap">
                <Search size={14} style={{ color: S.textSec, flexShrink: 0 }} />
                <input type="text" placeholder="Search bugs..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={S.searchInput} />
                {searchQuery && <button style={S.clearSearch} onClick={() => setSearchQuery('')}><X size={14} /></button>}
              </div>

              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: S.surface2, border: `1px solid ${S.border}`, borderRadius: '10px', padding: '7px 28px 7px 10px', fontSize: '12px', color: S.textPri, fontFamily: "'Poppins', sans-serif", cursor: 'pointer', outline: 'none', appearance: 'none', flexShrink: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="severity">Severity</option>
                <option value="title">Title A–Z</option>
              </select>

              <div style={{ display: 'flex', background: S.surface2, borderRadius: '10px', padding: '3px', gap: '2px', flexShrink: 0, border: `1px solid ${S.border2}` }}>
                <button onClick={() => setViewMode('card')} title="Card view" style={{ padding: '5px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: viewMode === 'card' ? S.surface : 'transparent', color: viewMode === 'card' ? S.textPri : S.textSec, boxShadow: viewMode === 'card' ? '0 1px 4px rgba(0,0,0,0.12)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </button>
                <button onClick={() => setViewMode('list')} title="List view" style={{ padding: '5px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: viewMode === 'list' ? S.surface : 'transparent', color: viewMode === 'list' ? S.textPri : S.textSec, boxShadow: viewMode === 'list' ? '0 1px 4px rgba(0,0,0,0.12)' : 'none', transition: 'all 0.15s', display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </button>
              </div>

              <Link to="/admin/bug-list" style={{ textDecoration: 'none', flexShrink: 0 }}>
                <button style={S.viewAllBtn} className="view-all">View All</button>
              </Link>
            </div>
          </div>

          {(() => {
            const totalPages = Math.ceil(filteredBugs.length / PAGE_SIZE);
            const pageBugs   = filteredBugs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
            return (
              <>
                {filteredBugs.length === 0 ? (
                  <div style={{ ...S.emptyState, gridColumn: '1 / -1' }}>
                    {searchQuery ? `No bugs found matching "${searchQuery}"` : 'No recent bugs'}
                  </div>
                ) : viewMode === 'card' ? (
                  <div style={S.bugsList} className="bugs-grid">
                    {pageBugs.map((bug) => (
                      <Link to={`/admin/bug/${bug._id}`} key={bug._id} style={{ textDecoration: 'none' }} className="bug-link">
                        <div className="bug-row" style={{
                          ...S.bugItem,
                          padding: 0,
                          borderRadius: '14px',
                          overflow: 'hidden',
                          minHeight: '110px',
                          border: `1px solid ${S.border2}`,
                          background: S.surface,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        }}>
                          <div style={{ height: '3px', width: '100%', background: getSevDotColor(bug.severity), flexShrink: 0 }} />
                          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: 500, color: S.textPri, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {bug.title}
                            </div>
                            {bug.description && (
                              <div style={{ fontSize: '11px', fontWeight: 400, color: S.textSec, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {bug.description.replace(/<[^>]*>/g, '')}
                              </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginTop: 'auto', paddingTop: '4px', borderTop: `1px solid ${S.border2}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: S.textSec, fontWeight: 400, fontFamily: "'Poppins', sans-serif", minWidth: 0 }}>
                                <User size={9} style={{ flexShrink: 0 }} />
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>{bug.reportedBy?.name}</span>
                                <span style={{ opacity: 0.4, flexShrink: 0 }}>·</span>
                                <span style={{ flexShrink: 0 }}>{formatDate(bug.createdAt)}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                <span style={getSevStyle(bug.severity)}>{bug.severity}</span>
                                <span style={getStatStyle(bug.status)}>{bug.status}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {pageBugs.map((bug, idx) => (
                      <Link to={`/admin/bug/${bug._id}`} key={bug._id} style={{ textDecoration: 'none' }} className="bug-link">
                        <div className="bug-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 4px', borderBottom: idx === pageBugs.length - 1 ? 'none' : `1px solid ${S.border2}`, background: 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}>
                          <div style={{ width: '3px', height: '32px', borderRadius: '3px', background: getSevDotColor(bug.severity), flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 500, color: S.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{bug.title}</div>
                            <div style={S.bugMeta}>
                              <User size={9} /><span>{bug.reportedBy?.name}</span>
                              <span style={{ color: S.border }}>·</span>
                              <span>{formatDate(bug.createdAt)}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <span style={getSevStyle(bug.severity)}>{bug.severity}</span>
                            <span style={getStatStyle(bug.status)}>{bug.status}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {filteredBugs.length > PAGE_SIZE && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${S.border2}`, flexWrap: 'wrap', gap: '8px' }} className="pagination-row">
                    <span style={{ fontSize: '12px', color: S.textSec }}>Page {currentPage} of {totalPages}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="page-btns">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, border: `1px solid ${S.border}`, background: S.surface, color: currentPage === 1 ? S.border : S.textPri, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s' }}>Prev</button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
                        <button key={pg} onClick={() => setCurrentPage(pg)} style={{ width: '32px', height: '32px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, border: pg === currentPage ? 'none' : `1px solid ${S.border}`, background: pg === currentPage ? 'linear-gradient(135deg, #4a0a0a, #bb0000)' : S.surface, color: pg === currentPage ? '#fff' : S.textPri, cursor: 'pointer', fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s' }}>{pg}</button>
                      ))}
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 500, border: `1px solid ${S.border}`, background: S.surface, color: currentPage === totalPages ? S.border : S.textPri, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontFamily: "'Poppins', sans-serif", transition: 'all 0.15s' }}>Next</button>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* ══ SIDEBAR ══ */}
      <div style={S.sidebar} className="dash-sidebar">

        <div style={S.profileCard}>
          <div style={S.profileAvatar}>
            <img src="/uploads/logo.png" alt="TEXIONIX Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />
          </div>
          <div style={S.profileName}>TEXIONIX</div>
          <div style={S.profileRole}>Admin Dashboard</div>
          <div style={S.profileStats}>
            <div style={{ textAlign: 'center' }}>
              <div style={S.profileVal}>{stats?.byStatus?.inProgress || 0}</div>
              <div style={S.profileLabel}>Active</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={S.profileVal}>{stats?.byStatus?.resolved || 0}</div>
              <div style={S.profileLabel}>Resolved</div>
            </div>
          </div>
        </div>

        <div style={S.quickCard}>
          <div style={S.quickTitle}>Quick Actions</div>
          <div style={{ fontSize: '11px', color: S.textSec, fontWeight: 400, marginBottom: '14px', marginTop: '-8px' }}>Manage and create bug reports</div>
          <button className="qa-btn" style={S.quickBtn} onClick={() => setIsModalOpen(true)}>
            <span style={S.quickIcon}><Mail size={16} /></span>
            View Outlook Reports
            {pendingBugsCount > 0 && <span style={S.quickBadge}>{pendingBugsCount}</span>}
          </button>
          <Link to="/admin/create-bug" style={{ textDecoration: 'none' }}>
            <button className="qa-btn" style={S.quickBtn}>
              <span style={S.quickIcon}><Plus size={16} /></span>
              Create New Bug
            </button>
          </Link>
          <Link to="/admin/bug-list" style={{ textDecoration: 'none' }}>
            <button className="qa-btn" style={S.quickBtn}>
              <span style={S.quickIcon}><List size={16} /></span>
              View All Bugs
            </button>
          </Link>
        </div>

        <div style={S.activityCard}>
          <div style={S.activityTitle}>Recent Activity</div>
          <div style={{ fontSize: '11px', color: S.textSec, fontWeight: 400, marginBottom: '14px', marginTop: '-8px' }}>Latest bug updates and changes</div>
          {recentBugs.slice(0, 5).map((bug, idx) => (
            <div key={idx} style={{ ...S.activityItem, ...(idx === Math.min(4, recentBugs.length - 1) ? { borderBottom: 'none', marginBottom: 0, paddingBottom: 0 } : {}) }}>
              <div style={bug.status === 'Resolved' ? S.actIconResolved : S.actIconBug}>
                {bug.status === 'Resolved' ? <CheckCircle size={14} /> : <Bug size={14} />}
              </div>
              <div>
                <div style={S.actText}>
                  <strong>{bug.reportedBy?.name}</strong> reported "{bug.title?.slice(0, 26)}{bug.title?.length > 26 ? '…' : ''}"
                </div>
                <div style={S.actTime}>{formatDate(bug.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BugReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => { fetchDashboardData(); checkForNewBugs(); }}
      />
    </div>
  );
};

export default Dashboard;