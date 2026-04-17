import React, { useState } from "react";
import { EMAIL_STATUSES } from "./messagingConstants";

/* ── Design tokens ── */
const T = {
  bg0:          '#ffffff',
  bg1:          '#ffffff',
  bg2:          '#f5f5f5',
  bg3:          '#e5e7eb',
  surface:      '#ffffff',
  border:       'rgba(0,0,0,0.08)',
  borderHi:     'rgba(0,0,0,0.14)',
  text0:        '#111827',
  text1:        '#374151',
  text2:        '#9ca3af',
  violet:       '#B90000',
  violetBright: '#6b0000',
  violetLo:     'rgba(139,0,0,0.08)',
  violetMd:     'rgba(139,0,0,0.15)',
  font:         "'Poppins', 'Inter', system-ui, sans-serif",
  shadowOut:    '5px 5px 14px rgba(13,39,80,0.18), -4px -4px 10px rgba(255,255,255,0.95)',
  shadowIn:     'inset 3px 3px 8px rgba(13,39,80,0.15), inset -2px -2px 6px rgba(255,255,255,0.88)',
  shadowHover:  '7px 7px 18px rgba(13,39,80,0.22), -5px -5px 13px rgba(255,255,255,1)',
};

const NAV_ITEMS = [
  {
    key: 'inbox', label: 'Inbox', count: 382,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
      </svg>
    ),
  },
  {
    key: 'sent', label: 'Sent Mails', count: 129,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    ),
  },
  {
    key: 'all', label: 'All Mail', count: 20,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    ),
  },
  {
    key: 'drafts', label: 'Drafts', count: 20,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    key: 'favourites', label: 'Favourites', count: 12,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    key: 'spam', label: 'Spam', count: null,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  {
    key: 'trash', label: 'Trash', count: 10,
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
      </svg>
    ),
  },
];

const LABELS = [
  { key: 'personal', label: 'Personal', count: 12, color: '#a3e635' },
  { key: 'school',   label: 'School',   count: 20, color: '#a10000' },
  { key: 'social',   label: 'Social',   count: 21, color: '#a855f7' },
];

const STATUS_META = {
  all:     { dot:'#8b0000', color:'#8b0000'  },
  open:    { dot:'#ef4444', color:'#991b1b'  },
  new:     { dot:'#f59e0b', color:'#92400e'  },
  pending: { dot:'#8b5cf6', color:'#5b21b6'  },
  onhold:  { dot:'#0ea5e9', color:'#075985'  },
  solved:  { dot:'#10b981', color:'#065f46'  },
};

function groupByConversation(messages) {
  const map = new Map();
  for (const msg of messages) {
    const key = msg.conversationId || msg.id;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(msg);
  }
  const groups = [];
  map.forEach(msgs => {
    const sorted = [...msgs].sort((a, b) => new Date(a.receivedAt||0) - new Date(b.receivedAt||0));
    groups.push(sorted);
  });
  groups.sort((a, b) => new Date(b[b.length-1].receivedAt||0) - new Date(a[a.length-1].receivedAt||0));
  return groups;
}

/* ── Message row — subject on top, sender below, preview below ── */
function MsgRow({ msg, isSelected, composeMode, onSelectMsg, onContextMenu, indent=false, badgeCount=0, badgeExpanded=false, onBadgeClick=null }) {
  const st = EMAIL_STATUSES.find(s => s.key === msg.status);
  const sc = STATUS_META[msg.status];
  const selected = isSelected && !composeMode;

  return (
    <div
      onClick={() => onSelectMsg(msg)}
      onContextMenu={e => onContextMenu(e, msg)}
      style={{
        padding: '14px 16px',
        cursor: 'pointer',
        background: selected ? 'rgba(139,0,0,0.07)' : indent ? 'rgba(0,0,0,0.02)' : 'transparent',
        borderLeft: selected ? '3px solid #8b0000' : indent ? '3px solid rgba(0,0,0,0.08)' : '3px solid transparent',
        transition: 'all 0.15s ease',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(0,0,0,0.03)'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = indent ? 'rgba(0,0,0,0.02)' : 'transparent'; }}
    >
      {/* Row 1: Subject + Time */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
          {!msg.read && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b0000', flexShrink: 0 }}/>
          )}
          <span style={{
            fontSize: 13, fontWeight: !msg.read ? 700 : 600,
            color: T.text0, fontFamily: T.font,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>
            {msg.subject}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <span style={{ fontSize: 10.5, color: T.text2, fontFamily: T.font, whiteSpace: 'nowrap' }}>{msg.time}</span>
          {badgeCount > 1 && onBadgeClick && (
            <button
              onClick={e => { e.stopPropagation(); onBadgeClick(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 3, background: T.bg2, border: 'none', borderRadius: 20, padding: '2px 6px 2px 4px', cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <span style={{ background: T.violet, color: '#fff', borderRadius: 8, padding: '0 4px', fontSize: 9, fontWeight: 700, lineHeight: '15px', display: 'inline-block', minWidth: 14, textAlign: 'center' }}>{badgeCount}</span>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={T.text2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: badgeExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Sender + status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: T.text1, fontFamily: T.font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {msg.sender}
        </span>
        {st && sc && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 20, background: T.bg2, fontSize: 9.5, fontWeight: 700, color: sc.color, fontFamily: T.font, flexShrink: 0, letterSpacing: '0.03em' }}>
            <span style={{ width: 3, height: 3, borderRadius: '50%', background: sc.dot, display: 'inline-block' }}/>
            {st.label}
          </span>
        )}
      </div>

      {/* Row 3: Preview */}
      <div style={{ fontSize: 11.5, color: T.text2, fontFamily: T.font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {msg.preview}
      </div>
    </div>
  );
}

function ConvGroup({ group, selectedMsg, composeMode, onSelectMsg, onContextMenu }) {
  const [expanded, setExpanded] = useState(false);
  const latest = group[group.length - 1];
  const older  = group.slice(0, group.length - 1);
  const hasMore = older.length > 0;
  const anySelected = group.some(m => m.id === selectedMsg?.id);
  const isExpanded  = expanded || anySelected;
  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      <MsgRow
        msg={latest}
        isSelected={latest.id === selectedMsg?.id}
        composeMode={composeMode}
        onSelectMsg={onSelectMsg}
        onContextMenu={onContextMenu}
        badgeCount={hasMore ? group.length : 0}
        badgeExpanded={isExpanded}
        onBadgeClick={hasMore ? () => setExpanded(v => !v) : null}
      />
      {hasMore && isExpanded && (
        <div style={{ background: 'rgba(0,0,0,0.02)', borderTop: `1px solid rgba(0,0,0,0.06)` }}>
          {[...older].reverse().map((msg, i) => (
            <div key={msg.id} style={{ borderBottom: i < older.length - 1 ? `1px solid ${T.border}` : 'none' }}>
              <MsgRow
                msg={msg}
                isSelected={msg.id === selectedMsg?.id}
                composeMode={composeMode}
                onSelectMsg={onSelectMsg}
                onContextMenu={onContextMenu}
                indent
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   LEFT NAV SIDEBAR
══════════════════════════════════════════════════════════════════ */
export function MessageNavSidebar({ activeNavKey, setActiveNavKey, onCompose, mobileSidebarOpen }) {
  const adminData = (() => {
    try { return JSON.parse(localStorage.getItem('adminData') || '{}'); } catch { return {}; }
  })();

  const getUserInitials = () => {
    if (!adminData?.name) return 'A';
    const names = adminData.name.trim().split(' ');
    return names.length >= 2
      ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
      : names[0][0].toUpperCase();
  };

  return (
    <aside
      className={`mp-sidebar${mobileSidebarOpen ? ' mp-sidebar--open' : ''}`}
      style={{
        width: 240,
        minWidth: 240,
        maxWidth: 240,
        background: T.bg0,
        borderRight: `1px solid rgba(13,39,80,0.08)`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      <style>{`
        .mp-sidebar::-webkit-scrollbar { display: none; }
        .mp-sidebar * { font-family: 'Poppins', 'Inter', system-ui, sans-serif !important; }
      `}</style>

      {/* ── User profile header ── */}
      <div style={{ padding: '20px 16px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          {/* Avatar */}
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: adminData?.profilePicture
              ? `url(${adminData.profilePicture}) center/cover`
              : 'linear-gradient(135deg,#9b1c1c 0%,#c0392b 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
            boxShadow: '0 4px 12px rgba(139,0,0,0.28)',
          }}>
            {!adminData?.profilePicture && getUserInitials()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text0, fontFamily: T.font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {adminData?.name || 'Admin User'}
            </div>
            <div style={{ fontSize: 10.5, color: T.text2, fontFamily: T.font, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {adminData?.email || ''}
            </div>
          </div>

          {/* + and ... action buttons */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button
              onClick={onCompose}
              style={{ width: 26, height: 26, borderRadius: 8, background: T.violet, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 8px rgba(139,0,0,0.28)' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button style={{ width: 26, height: 26, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text2 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
            </button>
          </div>
        </div>

        {/* New Message button */}
        <button
          onClick={onCompose}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '10px 0', borderRadius: 10, border: 'none',
            background: T.violet, color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: T.font,
            boxShadow: '0 4px 14px rgba(255, 0, 0, 0.52)', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.violetBright; e.currentTarget.style.boxShadow = '0 6px 18px rgba(202, 15, 15, 0.61)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.violet; e.currentTarget.style.boxShadow = '0 4px 14px rgba(211, 14, 14, 0.33)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Message
        </button>
      </div>

      {/* ── Navigation ── */}
      <div style={{ padding: '0 12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px' }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: T.text2, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: T.font }}>Navigation</span>
          <button style={{ width: 20, height: 20, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text2 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => {
            const active = activeNavKey === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveNavKey(item.key)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 10, border: 'none',
                  background: active ? T.violetLo : 'transparent',
                  color: active ? T.violet : T.text1,
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: T.font,
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = T.text0; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text1; } }}
              >
                <span style={{ color: active ? T.violet : T.text2, transition: 'color 0.15s', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 700 : 500, textAlign: 'left', letterSpacing: '-0.1px' }}>{item.label}</span>
                {item.count != null && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: active ? T.violet : T.text2, minWidth: 20, textAlign: 'right' }}>{item.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: 'rgba(0,0,0,0.08)', margin: '8px 16px' }}/>

      {/* ── Labels ── */}
      <div style={{ padding: '0 12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px' }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: T.text2, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: T.font }}>Labels</span>
          <button style={{ width: 20, height: 20, borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text2 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {LABELS.map(lbl => (
            <button
              key={lbl.key}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: T.text1, cursor: 'pointer', transition: 'all 0.15s', fontFamily: T.font }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${lbl.color}`, background: 'transparent', flexShrink: 0, display: 'inline-block' }}/>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 500, textAlign: 'left', letterSpacing: '-0.1px' }}>{lbl.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.text2 }}>{lbl.count}</span>
            </button>
          ))}
          <button
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, border: 'none', background: 'transparent', color: T.text2, cursor: 'pointer', transition: 'all 0.15s', fontFamily: T.font }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = T.text1; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.text2; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Add Labels</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ══════════════════════════════════════════════════════════════════
   INBOX PANEL
══════════════════════════════════════════════════════════════════ */
export function MessageInboxPanel({ activeTab, setActiveTab, msgList, selectedMsg, composeMode, onSelectMsg, onCompose, onContextMenu }) {
  const [searchVal, setSearchVal] = useState("");
  const [inboxTab,  setInboxTab]  = useState("All");

  const filteredMessages = msgList.filter(m => {
    const passesTab    = inboxTab === "Unread" ? !m.read : inboxTab === "Starred" ? m.starred : true;
    const passesSearch = !searchVal ||
      m.sender?.toLowerCase().includes(searchVal.toLowerCase()) ||
      m.subject?.toLowerCase().includes(searchVal.toLowerCase()) ||
      m.preview?.toLowerCase().includes(searchVal.toLowerCase());
    return passesTab && passesSearch;
  });

  const groups      = groupByConversation(filteredMessages);
  const unreadCount = msgList.filter(m => !m.read).length;
  const totalCount  = msgList.length;

  return (
    <div style={{
      width: 280,
      minWidth: 280,
      maxWidth: 280,
      background: '#ffffff',
      borderRight: `1px solid rgba(13,39,80,0.08)`,
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      <style>{`
        .ms-inbox-list::-webkit-scrollbar { width: 3px; }
        .ms-inbox-list::-webkit-scrollbar-thumb { background: #dcdce2; border-radius: 4px; }
      `}</style>

      {/* ── Inbox header ── */}
      <div style={{ padding: '24px 20px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: T.text0, margin: 0, fontFamily: T.font, letterSpacing: '-0.4px' }}>
            Inbox
          </h2>
          <button
            onClick={onCompose}
            aria-label="Compose"
            style={{ width: 30, height: 30, borderRadius: '50%', background: T.violet, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 2px 10px rgba(139,0,0,0.30)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = T.violetBright; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.violet; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: T.text2, fontFamily: T.font }}>
          {totalCount} Messages · {unreadCount} Unread
        </p>
      </div>

      {/* ── Search ── */}
      <div style={{ padding: '10px 14px 8px', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.text2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search"
            value={searchVal}
            onChange={e => setSearchVal(e.target.value)}
            style={{ width: '100%', background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '9px 12px 9px 32px', fontSize: 13, color: T.text1, outline: 'none', fontFamily: T.font, boxSizing: 'border-box', transition: 'background 0.15s' }}
            onFocus={e => e.target.style.background = '#ebebee'}
            onBlur={e => e.target.style.background = '#f3f4f6'}
          />
        </div>
      </div>

      {/* ── Tabs: All / Unread / Starred ── */}
      <div style={{ padding: '2px 14px 12px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['All', 'Unread', 'Starred'].map(tab => {
            const active = inboxTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setInboxTab(tab)}
                style={{
                  padding: '5px 14px', borderRadius: 20, border: 'none',
                  background: active ? T.violet : '#f3f4f6',
                  color: active ? '#fff' : T.text2,
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: T.font,
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#e5e7eb'; e.currentTarget.style.color = T.text1; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = T.text2; } }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', flexShrink: 0 }}/>

      {/* ── Message list ── */}
      <div
        className="ms-inbox-list"
        style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#dcdce2 transparent' }}
      >
        {groups.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: T.text2, fontFamily: T.font }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 500 }}>No messages</span>
          </div>
        ) : groups.map(group => (
          <ConvGroup
            key={group[group.length - 1].conversationId || group[0].id}
            group={group}
            selectedMsg={selectedMsg}
            composeMode={composeMode}
            onSelectMsg={onSelectMsg}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DEFAULT EXPORT — backward compat
══════════════════════════════════════════════════════════════════ */
export default function MessageSidebar(props) {
  const { activeTab, setActiveTab, msgList, selectedMsg, composeMode, onSelectMsg, onCompose, onContextMenu, mobileSidebarOpen } = props;
  const [activeNavKey, setActiveNavKey] = useState('inbox');

  return (
    <>
      <MessageNavSidebar
        activeNavKey={activeNavKey}
        setActiveNavKey={setActiveNavKey}
        onCompose={onCompose}
        mobileSidebarOpen={mobileSidebarOpen}
      />
      <MessageInboxPanel
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        msgList={msgList}
        selectedMsg={selectedMsg}
        composeMode={composeMode}
        onSelectMsg={onSelectMsg}
        onCompose={onCompose}
        onContextMenu={onContextMenu}
      />
    </>
  );
}