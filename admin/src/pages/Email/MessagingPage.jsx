import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from '@tanstack/react-query';
import "./MessagingPage.css";
import MessageSidebar, { MessageNavSidebar, MessageInboxPanel } from "./MessageSidebar";
import EmailDetail from "./EmailDetail";
import ComposePanel from "./ComposePanel";
import ContextMenu from "./ContextMenu";
import api from "../../services/api";
import { useFolderMessages, TAB_TO_FOLDER, useNewMessageNotifier } from "../../hooks/useFolderMessages";
import { usePrefetchThread } from "../../hooks/useThread";
import { Clock, AlertTriangle, CheckCircle, RefreshCw, Wifi, WifiOff, X, Mail } from "lucide-react";

/* ─── Design Tokens ─────────────────────────────────────────────────────────── */
const T = {
  bg0:          '#ffffff',
  bg1:          '#ffffff',
  bg2:          '#f0f2f7',
  bg3:          '#e6e9f0',
  bg4:          '#d8dce8',
  border:       'rgba(100,116,160,0.10)',
  borderHi:     'rgba(100,116,160,0.18)',
  text0:        '#0d1021',
  text1:        '#2d3454',
  text2:        '#8892b0',
  text3:        '#b0bad4',

  // Brand — deep crimson accent
  crimson:      '#9b1c1c',
  crimsonMid:   '#b91c1c',
  crimsonBright:'#dc2626',
  crimsonLo:    'rgba(155,28,28,0.08)',
  crimsonGlow:  'rgba(155,28,28,0.18)',

  green:        '#059669',
  greenLo:      'rgba(5,150,105,0.07)',
  orange:       '#d97706',
  orangeLo:     'rgba(217,119,6,0.07)',
  red:          '#dc2626',
  redLo:        'rgba(220,38,38,0.07)',
  blue:         '#2563eb',
  blueLo:       'rgba(37,99,235,0.07)',

  font:         "'DM Sans', 'Segoe UI', system-ui, sans-serif",
  fontMono:     "'DM Mono', 'Fira Code', monospace",

  radius:       '14px',
  radiusSm:     '9px',
  radiusXs:     '6px',

  shadow:       '0 1px 4px rgba(13,16,33,0.06)',
  shadowMd:     '0 4px 20px rgba(13,16,33,0.08)',
  shadowLg:     '0 8px 36px rgba(13,16,33,0.11)',
  shadowCrimson:'0 4px 18px rgba(155,28,28,0.22)',
};

const AVATAR_COLORS = [
  '#9b1c1c','#b91c1c','#9d174d','#7c2d12',
  '#059669','#d97706','#2563eb','#7c3aed',
];

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function mapGraphEmail(m) {
  const from      = m.from?.emailAddress;
  const initials  = (from?.name || from?.address || '?')
    .split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
  const colorIdx  = (from?.address || '').charCodeAt(0) % AVATAR_COLORS.length;
  return {
    id: m.id, msId: m.id,
    sender: from?.name || from?.address || 'Unknown',
    senderEmail: from?.address || '',
    subject: m.subject || '(no subject)',
    preview: m.bodyPreview || '',
    time: formatGraphDate(m.receivedDateTime),
    read: m.isRead, starred: m.flag?.flagStatus === 'flagged',
    status: 'new', avatar: initials, avatarColor: AVATAR_COLORS[colorIdx],
    body: m.body?.content || m.bodyPreview || '', bodyType: m.body?.contentType || 'text',
    to: (m.toRecipients || []).map(r => r.emailAddress?.name || r.emailAddress?.address),
    cc: (m.ccRecipients || []).map(r => r.emailAddress?.name || r.emailAddress?.address),
    hasAttachments: m.hasAttachments || false, thread: [],
    graphId: m.id, conversationId: m.conversationId || null,
    receivedAt: m.receivedDateTime || null, source: 'outlook',
  };
}

function formatGraphDate(iso) {
  if (!iso) return '';
  const d = new Date(iso), now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (new Date(now - 86400000).toDateString() === d.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const SLA_TARGET = { high: 1, normal: 4, low: 24 };

/* ─── Pill / Badge helper ────────────────────────────────────────────────────── */
const Pill = ({ label, color, bg, border }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '2px 10px', borderRadius: 20,
    background: bg, color, border: `1px solid ${border}`,
    fontSize: 10.5, fontWeight: 700, letterSpacing: '0.04em',
    textTransform: 'uppercase', fontFamily: T.font,
  }}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }}/>
    {label}
  </span>
);

/* ─── SlaBanner ──────────────────────────────────────────────────────────────── */
const SlaBanner = ({ ticket }) => {
  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);
  if (!ticket) return null;

  const target    = SLA_TARGET[ticket.priority] ?? 4;
  const remaining = target - ticket.hoursElapsed;
  const isBreached = remaining < 0;
  const isUrgent   = !isBreached && remaining < target * 0.25;
  const pct        = Math.min((ticket.hoursElapsed / target) * 100, 100);
  const fmt  = h  => { const a = Math.abs(h); return a < 1 ? `${Math.round(a*60)} min` : `${a.toFixed(1)} hrs`; };

  const color = isBreached ? T.red : isUrgent ? T.orange : T.green;
  const bg    = isBreached ? T.redLo : isUrgent ? T.orangeLo : T.greenLo;
  const Icon  = isBreached ? AlertTriangle : isUrgent ? Clock : CheckCircle;

  return (
    <div style={{
      background: bg,
      borderBottom: `1px solid ${color}28`,
      padding: '10px 24px',
      display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: `${color}15`, display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0, border: `1px solid ${color}25`,
      }}>
        <Icon size={13} color={color} strokeWidth={2.5}/>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color, fontFamily: T.font }}>
            SLA — Ticket #{ticket.id}
          </span>
          <Pill
            label={ticket.priority}
            color={color}
            bg={`${color}10`}
            border={`${color}28`}
          />
          <span style={{
            fontSize: 12, fontWeight: 800, color, fontFamily: T.font, marginLeft: 'auto',
          }}>
            {isBreached ? `+${fmt(Math.abs(remaining))} OVERDUE` : `${fmt(remaining)} left`}
          </span>
        </div>
        <div style={{
          height: 3, background: 'rgba(0,0,0,0.06)', borderRadius: 10, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${pct}%`, background: color,
            borderRadius: 10, transition: 'width 0.5s cubic-bezier(.4,0,.2,1)',
            boxShadow: `0 0 8px ${color}55`,
          }}/>
        </div>
      </div>
    </div>
  );
};

/* ─── OutlookBanner (disconnected) ──────────────────────────────────────────── */
const OutlookBanner = ({ onConnect, connecting, syncError, onDismissError }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '10px 24px', flexShrink: 0,
    background: syncError ? T.redLo : T.blueLo,
    borderBottom: `1px solid ${syncError ? 'rgba(220,38,38,0.14)' : 'rgba(37,99,235,0.12)'}`,
  }}>
    {/* icon */}
    <div style={{
      width: 36, height: 36, borderRadius: 11,
      background: 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, boxShadow: '0 4px 14px rgba(37,99,235,0.26)',
    }}>
      <Mail size={14} color="#fff"/>
    </div>

    <div style={{ flex: 1, minWidth: 0 }}>
      {syncError ? (
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: T.red, fontFamily: T.font }}>
          {syncError}
        </p>
      ) : (
        <>
          <p style={{ margin: '0 0 1px', fontSize: 12.5, fontWeight: 700, color: T.blue, fontFamily: T.font }}>
            Connect your Outlook account
          </p>
          <p style={{ margin: 0, fontSize: 11, color: T.text2, fontFamily: T.font }}>
            Sync real emails, send messages, and manage your inbox.
          </p>
        </>
      )}
    </div>

    {syncError ? (
      <button onClick={onDismissError} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: T.text2, display: 'flex', padding: 5, borderRadius: 7,
        transition: 'background 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = T.bg3}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
        <X size={13}/>
      </button>
    ) : (
      <button onClick={onConnect} disabled={connecting} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 16px', borderRadius: 10, border: 'none',
        background: connecting ? T.bg3 : 'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%)',
        color: connecting ? T.text2 : '#fff',
        fontSize: 11.5, fontWeight: 600,
        cursor: connecting ? 'not-allowed' : 'pointer',
        flexShrink: 0, transition: 'all 0.18s',
        boxShadow: connecting ? 'none' : '0 4px 14px rgba(37,99,235,0.26)',
        fontFamily: T.font,
      }}>
        {connecting
          ? <><RefreshCw size={11} style={{ animation: 'mp-spin 0.8s linear infinite' }}/>Connecting…</>
          : <><Wifi size={11}/>Connect Outlook</>}
      </button>
    )}
  </div>
);

/* ─── OutlookSyncBar (connected) ─────────────────────────────────────────────── */
const OutlookSyncBar = ({ outlookInfo, onSync, syncing }) => {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 24px', flexShrink: 0,
      background: T.greenLo,
      borderBottom: `1px solid rgba(5,150,105,0.13)`,
      fontSize: 13,
    }}>
      {/* pulse dot */}
      <span style={{ position: 'relative', flexShrink: 0, width: 8, height: 8 }}>
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: T.green, animation: 'mp-pulse 2s ease-in-out infinite',
        }}/>
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%', background: T.green,
        }}/>
      </span>

      <span style={{ fontWeight: 700, color: T.green, fontFamily: T.font, fontSize: 13 }}>Outlook</span>
      <span style={{ color: T.text3 }}>·</span>
      <span style={{
        color: T.text2, overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', maxWidth: 220, fontFamily: T.font, fontSize: 13,
      }}>
        {outlookInfo?.email}
      </span>

      {outlookInfo?.lastSyncAt && (
        <span style={{ color: T.text3, marginLeft: 'auto', fontFamily: T.font, fontSize: 12 }}>
          Synced {new Date(outlookInfo.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}

      {/* Sync button */}
      <button onClick={onSync} disabled={syncing} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: '#ffffff',
        border: 'none',
        boxShadow: syncing
          ? 'inset 3px 3px 8px rgba(13,39,80,0.12), inset -3px -3px 8px rgba(255,255,255,0.85)'
          : '6px 6px 16px rgba(13,39,80,0.14), -4px -4px 12px rgba(255,255,255,0.92)',
        cursor: syncing ? 'not-allowed' : 'pointer',
        color: T.green, fontSize: 12, fontWeight: 600,
        padding: '6px 16px', borderRadius: 20, fontFamily: T.font,
        transition: 'all 0.18s',
      }}
        onMouseEnter={e => { if (!syncing) e.currentTarget.style.boxShadow = '8px 8px 20px rgba(13,39,80,0.18), -5px -5px 14px rgba(255,255,255,0.95)'; }}
        onMouseLeave={e => { if (!syncing) e.currentTarget.style.boxShadow = '6px 6px 16px rgba(13,39,80,0.14), -4px -4px 12px rgba(255,255,255,0.92)'; }}>
        <RefreshCw size={11} style={{ animation: syncing ? 'mp-spin 0.8s linear infinite' : 'none' }}/>
        {syncing ? 'Syncing…' : 'Sync'}
      </button>
    </div>
  );
};

/* ─── LoadingInbox ───────────────────────────────────────────────────────────── */
const LoadingInbox = () => (
  <div style={{
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 18,
    background: T.bg0,
  }}>
    <div style={{
      width: 60, height: 60, borderRadius: 20,
      background: T.bg1, border: `1px solid ${T.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: T.shadowMd,
    }}>
      <RefreshCw size={22} style={{ animation: 'mp-spin 0.8s linear infinite', color: T.crimson }}/>
    </div>
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: T.text0, fontFamily: T.font, fontWeight: 600, margin: '0 0 4px', fontSize: 14 }}>
        Loading your inbox…
      </p>
      <p style={{ color: T.text2, fontFamily: T.font, margin: 0, fontSize: 12 }}>
        Connecting to Outlook
      </p>
    </div>
    <style>{`
      @keyframes mp-spin { to { transform: rotate(360deg); } }
    `}</style>
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════════
   MessagingPage
══════════════════════════════════════════════════════════════════════════════ */
export default function MessagingPage() {
  const location       = useLocation();
  const incomingTicket = location.state?.ticket ?? null;

  const queryClient = useQueryClient();
  const [activeTab,          setActiveTab]         = useState("all");
  const [selectedMsg,        setSelectedMsg]       = useState(null);
  const [contextMenu,        setContextMenu]       = useState(null);
  const [composeMode,        setComposeMode]        = useState(false);
  const [composeInitial,     setComposeInitial]    = useState(null);
  const [mobileSidebarOpen,  setMobileSidebarOpen] = useState(false);
  const [activeTicket,       setActiveTicket]      = useState(incomingTicket);

  const [outlookStatus, setOutlookStatus] = useState('loading');
  const [outlookInfo,   setOutlookInfo]   = useState(null);
  const [connectingOL,  setConnectingOL]  = useState(false);
  const [syncingOL,     setSyncingOL]     = useState(false);
  const [syncError,     setSyncError]     = useState('');

  const folderId = TAB_TO_FOLDER[activeTab] ?? 'inbox';
  const contextRef = useRef(null);
  const syncingRef = useRef(false);

  const {
    data:       msgList = [],
    isLoading:  msgLoading,
    isFetching: msgFetching,
    isError:    msgError,
    refetch:    refetchMessages,
  } = useFolderMessages(folderId, {
    enabled:  outlookStatus === 'connected',
    isActive: true,
  });

  // ── Per-folder counts for the nav sidebar (fetched once, not polled aggressively) ──
  const { data: inboxMsgs    = [] } = useFolderMessages('inbox',       { enabled: outlookStatus === 'connected', isActive: false });
  const { data: sentMsgs     = [] } = useFolderMessages('sentitems',   { enabled: outlookStatus === 'connected', isActive: false });
  const { data: draftsMsgs   = [] } = useFolderMessages('drafts',      { enabled: outlookStatus === 'connected', isActive: false });
  const { data: spamMsgs     = [] } = useFolderMessages('junkemail',   { enabled: outlookStatus === 'connected', isActive: false });
  const { data: trashMsgs    = [] } = useFolderMessages('deleteditems',{ enabled: outlookStatus === 'connected', isActive: false });

  const folderCounts = {
    inbox:      inboxMsgs.length     || null,
    sent:       sentMsgs.length      || null,
    all:        inboxMsgs.length     || null,
    drafts:     draftsMsgs.length    || null,
    spam:       spamMsgs.length      || null,
    trash:      trashMsgs.length     || null,
    favourites: msgList.filter(m => m.starred).length || null,
  };

  /* ── New-message notification trackers (per folder) ── */
  const isOLConnected = outlookStatus === 'connected';
  const { newCount: inboxNewCount, clearNew: clearInboxNew } = useNewMessageNotifier('inbox',       isOLConnected);
  const { newCount: spamNewCount,  clearNew: clearSpamNew  } = useNewMessageNotifier('junkemail',   isOLConnected);

  // Map folder key → clearNew handler (extend for other folders as needed)
  const newMsgCounts = {
    inbox: inboxNewCount,
    all:   inboxNewCount,   // "All Mail" mirrors inbox
    spam:  spamNewCount,
  };

  const handleClearNew = (key) => {
    if (key === 'inbox' || key === 'all') clearInboxNew();
    if (key === 'spam')                   clearSpamNew();
  };

  const prefetchThread = usePrefetchThread(outlookStatus === 'connected');

  useEffect(() => {
    if (!msgList.length) {
      setSelectedMsg(null);
      return;
    }

    setSelectedMsg(prev => {
      if (prev && msgList.some(m => m.id === prev.id)) return prev;
      return msgList[0];
    });
  }, [msgList]);

  /* ── Outlook status ── */
  const checkOutlookStatus = useCallback(async () => {
    try {
      const res = await api.get('/outlook/status');
      if (res.data.connected) {
        setOutlookStatus('connected');
        setOutlookInfo({ email: res.data.email, displayName: res.data.displayName, lastSyncAt: res.data.lastSyncAt });
        return true;
      } else {
        setOutlookStatus('disconnected'); setOutlookInfo(null); return false;
      }
    } catch { setOutlookStatus('disconnected'); return false; }
  }, []);

  useEffect(() => { checkOutlookStatus(); }, [checkOutlookStatus]);

  /* ── Sync ── */
  const handleManualSync = useCallback(async () => {
    if (syncingOL) return;
    setSyncError(''); setSyncingOL(true);
    try {
      await queryClient.invalidateQueries(['messages']);
      await queryClient.invalidateQueries(['thread']);
    } catch (err) {
      setSyncError(err?.response?.data?.message || err.message || 'Sync failed');
    } finally {
      setSyncingOL(false);
    }
  }, [queryClient, syncingOL]);

  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const ok       = params.get('outlook_connected');
    const errParam = params.get('outlook_error');
    if (ok === '1') {
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(async () => {
        const connected = await checkOutlookStatus();
        if (connected) await handleManualSync();
      }, 600);
    } else if (errParam) {
      window.history.replaceState({}, '', window.location.pathname);
      setSyncError(`Outlook connection failed: ${decodeURIComponent(errParam)}`);
      setOutlookStatus('disconnected');
    }
  }, [checkOutlookStatus, handleManualSync]);

  useEffect(() => {
    if (outlookStatus !== 'connected') return;
    handleManualSync();
  }, [outlookStatus, handleManualSync]);

  /* ── Connect / Disconnect ── */
  const handleConnectOutlook = async () => {
    setConnectingOL(true); setSyncError('');
    try {
      const res = await api.get('/outlook/auth/start');
      if (res.data.redirectUrl) window.location.href = res.data.redirectUrl;
      else throw new Error(res.data.message || 'Could not get auth URL');
    } catch(err) {
      setSyncError(`Could not start Outlook connection: ${err.response?.data?.message || err.message}`);
      setConnectingOL(false);
    }
  };

  const handleDisconnectOutlook = async () => {
    try { await api.delete('/outlook/disconnect'); } catch {}
    setOutlookStatus('disconnected'); setOutlookInfo(null); setSelectedMsg(null);
  };

  /* ── Misc effects ── */
  useEffect(() => { if (location.state?.ticket) setActiveTicket(location.state.ticket); }, [location.state]);

  useEffect(() => {
    const h = e => { if (contextRef.current && !contextRef.current.contains(e.target)) setContextMenu(null); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    const h = () => { if (window.innerWidth > 680) setMobileSidebarOpen(false); };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  /* ── Handlers ── */
  const handleContextMenu = (e, msg) => {
    e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, msg });
  };

  const handleContextAction = (action, msg) => {
    if (action === "delete") {
      if (msg.graphId && outlookStatus === 'connected')
        api.delete(`/outlook/emails/${msg.graphId}`).catch(() => {});
      queryClient.setQueryData(['messages', folderId], prev => prev ? prev.filter(m => m.id !== msg.id) : prev);
      if (selectedMsg?.id === msg.id) setSelectedMsg(null);
    } else if (action === "markUnread") {
      if (msg.graphId && outlookStatus === 'connected')
        api.patch(`/outlook/emails/${msg.graphId}/read`, { isRead: !msg.read }).catch(() => {});
      queryClient.setQueryData(['messages', folderId], prev => prev ? prev.map(m => m.id === msg.id ? { ...m, read: !m.read } : m) : prev);
      if (selectedMsg?.id === msg.id) setSelectedMsg(prev => prev ? { ...prev, read: !prev.read } : prev);
    } else if (action === "star") {
      queryClient.setQueryData(['messages', folderId], prev => prev ? prev.map(m => m.id === msg.id ? { ...m, starred: !m.starred } : m) : prev);
      if (selectedMsg?.id === msg.id) setSelectedMsg(prev => prev ? { ...prev, starred: !prev.starred } : prev);
    } else if (action === "open" || action === "reply") {
      setSelectedMsg(msg); setComposeMode(false); setComposeInitial(null);
    }
    setContextMenu(null);
  };

  const handleSelectMsg = msg => {
    setSelectedMsg(msg); setComposeMode(false); setComposeInitial(null); setMobileSidebarOpen(false);
    if (msg.graphId && !msg.read && outlookStatus === 'connected') {
      api.patch(`/outlook/emails/${msg.graphId}/read`, { isRead: true }).catch(() => {});
      queryClient.setQueryData(['messages', folderId], prev => prev ? prev.map(m => m.id === msg.id ? { ...m, read: true } : m) : prev);
    }
  };

  const handleStatusChange = (msgId, newStatus) => {
    queryClient.setQueryData(['messages', folderId], prev => prev ? prev.map(m => m.id === msgId ? { ...m, status: newStatus } : m) : prev);
    setSelectedMsg(prev => prev?.id === msgId ? { ...prev, status: newStatus } : prev);
  };

  const handleCompose = (initialData = null) => {
    setComposeMode(true); setSelectedMsg(null); setComposeInitial(initialData); setMobileSidebarOpen(false);
  };
  const handleExpandToCompose = data => handleCompose(data);
  const handleMobileBack      = ()    => setMobileSidebarOpen(true);

  /* ── Render ── */
  return (
    <div className="mp-root" style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: T.bg0, fontFamily: T.font,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

        @keyframes mp-spin   { to { transform: rotate(360deg); } }
        @keyframes mp-fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
        @keyframes mp-pulse  {
          0%, 100% { opacity: 1;   transform: scale(1);   }
          50%       { opacity: 0.4; transform: scale(1.9); }
        }

        * { box-sizing: border-box; }
        .mp-root  { animation: mp-fadein 0.22s ease; }
        .mp-root * { font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif !important; }

        /* ── Action toolbar redesign ── */
        .mp-action-toolbar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 20px;
          background: ${T.bg1};
          border-bottom: 1px solid ${T.border};
          flex-shrink: 0;
        }

        /* Group wrapper (Reply / Reply all / Forward) */
        .mp-toolbar-group {
          display: flex;
          align-items: center;
          background: ${T.bg0};
          border: 1px solid ${T.border};
          border-radius: 11px;
          overflow: hidden;
          gap: 0;
        }

        .mp-toolbar-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: transparent;
          border: none;
          border-right: 1px solid ${T.border};
          color: ${T.text1};
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
        }
        .mp-toolbar-btn:last-child { border-right: none; }
        .mp-toolbar-btn:hover {
          background: ${T.bg2};
          color: ${T.text0};
        }

        /* Standalone icon buttons (delete, star) */
        .mp-toolbar-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: 1px solid ${T.border};
          background: ${T.bg0};
          color: ${T.text2};
          cursor: pointer;
          transition: all 0.15s;
        }
        .mp-toolbar-icon:hover {
          background: ${T.bg2};
          color: ${T.text1};
          border-color: ${T.borderHi};
        }
        .mp-toolbar-icon.starred {
          background: rgba(217,119,6,0.08);
          color: ${T.orange};
          border-color: rgba(217,119,6,0.20);
        }

        /* More dropdown chevron */
        .mp-toolbar-more {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 34px;
          border-left: 1px solid ${T.border};
          background: transparent;
          border-top: none; border-right: none; border-bottom: none;
          color: ${T.text2};
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .mp-toolbar-more:hover { background: ${T.bg2}; color: ${T.text0}; }

        /* Status badges */
        .mp-status-badges {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
        }

        .mp-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 11px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: default;
          user-select: none;
        }
        .mp-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        /* outlook badge */
        .mp-badge-outlook {
          background: rgba(37,99,235,0.07);
          color: #2563eb;
          border: 1px solid rgba(37,99,235,0.16);
        }
        .mp-badge-outlook .mp-badge-dot { background: #2563eb; }

        /* "New" badge */
        .mp-badge-new {
          background: rgba(5,150,105,0.07);
          color: #059669;
          border: 1px solid rgba(5,150,105,0.18);
        }
        .mp-badge-new .mp-badge-dot {
          background: #059669;
          animation: mp-pulse 2s ease-in-out infinite;
        }

        /* Mobile header */
        .mp-mobile-header {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          flex-shrink: 0;
        }
        .mp-mobile-back-btn,
        .mp-mobile-inbox-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          padding: 6px 10px;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .mp-mobile-back-btn:hover  { background: ${T.bg2}; }
        .mp-mobile-inbox-btn:hover { background: ${T.crimsonLo}; }

        @media (max-width: 680px) {
          .mp-mobile-header { display: flex; }
        }
      `}</style>

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebarOpen && (
        <div className="mp-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)} aria-hidden="true"
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(13,16,33,0.36)', zIndex: 100, backdropFilter: 'blur(3px)',
          }}
        />
      )}

      {/* ── SLA Banner ── */}
      {activeTicket && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <SlaBanner ticket={activeTicket}/>
          <button onClick={() => setActiveTicket(null)} style={{
            position: 'absolute', top: '50%', transform: 'translateY(-50%)',
            right: 18, background: 'none', border: 'none', cursor: 'pointer',
            color: T.text2, display: 'flex', alignItems: 'center',
            justifyContent: 'center', width: 26, height: 26,
            borderRadius: 7, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = T.text1; e.currentTarget.style.background = T.bg3; }}
            onMouseLeave={e => { e.currentTarget.style.color = T.text2; e.currentTarget.style.background = 'none'; }}
            title="Dismiss">
            <X size={13}/>
          </button>
        </div>
      )}

      {/* ── Outlook status bars ── */}
      {outlookStatus === 'disconnected' && (
        <OutlookBanner
          onConnect={handleConnectOutlook}
          connecting={connectingOL}
          syncError={syncError}
          onDismissError={() => setSyncError('')}
        />
      )}
      {outlookStatus === 'connected' && (
        <OutlookSyncBar
          outlookInfo={outlookInfo}
          onSync={handleManualSync}
          syncing={syncingOL}
          onDisconnect={handleDisconnectOutlook}
        />
      )}

      {/* ── Main layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left nav: navigation links + labels */}
        <MessageNavSidebar
          activeNavKey={activeTab}
          setActiveNavKey={setActiveTab}
          onCompose={handleCompose}
          mobileSidebarOpen={mobileSidebarOpen}
          folderCounts={folderCounts}
          newMsgCounts={newMsgCounts}
          onClearNew={handleClearNew}
        />

        {/* Inbox panel: message list, search, filters */}
        <MessageInboxPanel
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          msgList={msgList}
          selectedMsg={selectedMsg}
          composeMode={composeMode}
          onSelectMsg={handleSelectMsg}
          onCompose={handleCompose}
          onContextMenu={handleContextMenu}
        />

        {/* ── Main content ── */}
        <main className="mp-main" style={{
          flex: 1, overflow: 'hidden', display: 'flex',
          flexDirection: 'column', background: T.bg0, position: 'relative',
        }}>
          {/* Mobile header */}
          <div className="mp-mobile-header" style={{ background: T.bg1, borderBottom: `1px solid ${T.border}` }}>
            <button className="mp-mobile-back-btn" onClick={handleMobileBack}
              aria-label="Back to inbox" style={{ color: T.text1 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Inbox
            </button>
            <button className="mp-mobile-inbox-btn" onClick={() => handleCompose(null)}
              aria-label="Compose" style={{ color: T.crimson }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Compose
            </button>
          </div>

          {outlookStatus === 'loading' ? (
            <LoadingInbox/>
          ) : composeMode ? (
            <ComposePanel
              onClose={() => { setComposeMode(false); setComposeInitial(null); }}
              initialToChips={composeInitial?.toChips}
              initialCcChips={composeInitial?.ccChips}
              initialSubject={composeInitial?.subject}
              initialBody={composeInitial?.body}
              initialAttachments={composeInitial?.attachments}
              outlookConnected={outlookStatus === 'connected'}
            />
          ) : (
            <EmailDetail
              selectedMsg={selectedMsg}
              onExpandToCompose={handleExpandToCompose}
              outlookConnected={outlookStatus === 'connected'}
              onStatusChange={handleStatusChange}
              onSyncEmails={handleManualSync}
            />
          )}
        </main>
      </div>

      <ContextMenu contextMenu={contextMenu} contextRef={contextRef} onAction={handleContextAction}/>
    </div>
  );
}