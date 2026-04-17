import React, { useState } from "react";
import { EMAIL_STATUSES } from "./messagingConstants";

const T = {
  bg0:         '#f0f0f3',
  bg1:         '#ffffff',
  bg2:         '#f5f5f5',
  bg3:         '#e5e7eb',
  surface:     '#ffffff',
  border:      'rgba(0,0,0,0.08)',
  borderHi:    'rgba(0,0,0,0.14)',
  text0:       '#111827',
  text1:       '#374151',
  text2:       '#9ca3af',
  violet:      '#8b0000',
  violetBright:'#6b0000',
  violetLo:    'rgba(139,0,0,0.08)',
  violetMd:    'rgba(139,0,0,0.15)',
  font:        "'Poppins', 'Inter', system-ui, sans-serif",
  shadowOut:   '5px 5px 14px rgba(13,39,80,0.18), -4px -4px 10px rgba(255,255,255,0.95)',
  shadowIn:    'inset 3px 3px 8px rgba(13,39,80,0.15), inset -2px -2px 6px rgba(255,255,255,0.88)',
  shadowHover: '7px 7px 18px rgba(13,39,80,0.22), -5px -5px 13px rgba(255,255,255,1)',
};

const STATUS_FILTERS = [
  { key:"all",     label:"All"     },
  { key:"open",    label:"Open"    },
  { key:"new",     label:"New"     },
  { key:"pending", label:"Pending" },
  { key:"onhold",  label:"On Hold" },
  { key:"solved",  label:"Solved"  },
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

function MsgRow({ msg, isSelected, composeMode, onSelectMsg, onContextMenu, indent=false, badgeCount=0, badgeExpanded=false, onBadgeClick=null }) {
  const st = EMAIL_STATUSES.find(s => s.key === msg.status);
  const sc = STATUS_META[msg.status];
  const selected = isSelected && !composeMode;
  return (
    <div
      onClick={() => onSelectMsg(msg)}
      onContextMenu={e => onContextMenu(e, msg)}
      style={{
        padding:'10px 12px',
        margin: selected ? '4px 8px' : '0',
        cursor:'pointer',
        background: selected ? '#fff' : indent ? 'rgba(0,0,0,0.02)' : 'transparent',
        borderLeft: selected ? 'none' : indent ? `2px solid rgba(0,0,0,0.10)` : '2px solid transparent',
        borderRadius: selected ? 12 : 0,
        boxShadow: selected ? `0 8px 28px rgba(0,0,0,0.18)` : `0 2px 8px rgba(0,0,0,0.10)`,
        transform: selected ? 'scale(1.01)' : 'scale(1)',
        transition:'all 0.15s ease',
        position:'relative',
        zIndex: selected ? 2 : 1,
      }}
      onMouseEnter={e=>{ if(!selected) e.currentTarget.style.background='rgba(0,0,0,0.03)'; }}
      onMouseLeave={e=>{ if(!selected) e.currentTarget.style.background=indent?'rgba(0,0,0,0.02)':'transparent'; }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, paddingTop:3, flexShrink:0, width:12 }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:!msg.read?T.violet:'transparent', flexShrink:0, boxShadow:!msg.read?`0 0 8px ${T.violet}`:'none', transition:'all 0.2s' }}/>
          {msg.starred && <svg width="8" height="8" viewBox="0 0 24 24" fill="#d97706" stroke="#d97706" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
        </div>
        <div style={{ width:36, height:36, borderRadius:11, background:msg.avatarColor, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0, fontFamily:T.font, boxShadow:`0 2px 8px ${msg.avatarColor}35`, letterSpacing:'0.02em' }}>
          {msg.avatar}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6, marginBottom:3 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, minWidth:0 }}>
              <span style={{ fontSize:13, fontWeight:!msg.read?700:500, color:!msg.read?T.text0:T.text1, fontFamily:T.font, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'-0.01em' }}>{msg.sender}</span>
              {st && sc && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'1px 6px', borderRadius:20, background:T.bg0, boxShadow:'3px 3px 7px rgba(13,39,80,0.12), -2px -2px 5px rgba(255,255,255,0.9)', fontSize:9.5, fontWeight:700, color:sc.color, fontFamily:T.font, flexShrink:0, letterSpacing:'0.03em' }}>
                  <span style={{ width:3, height:3, borderRadius:'50%', background:sc.dot, display:'inline-block' }}/>
                  {st.label}
                </span>
              )}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
              <span style={{ fontSize:10.5, color:T.text2, fontFamily:T.font }}>{msg.time}</span>
              {badgeCount > 1 && onBadgeClick && (
                <button onClick={e=>{ e.stopPropagation(); onBadgeClick(); }}
                  style={{ display:'flex', alignItems:'center', gap:3, background:T.bg0, boxShadow:badgeExpanded?T.shadowIn:T.shadowOut, border:'none', borderRadius:20, padding:'2px 6px 2px 3px', cursor:'pointer', transition:'all 0.15s' }}>
                  <span style={{ background:T.violet, color:'#fff', borderRadius:8, padding:'0 4px', fontSize:9, fontWeight:700, lineHeight:'15px', display:'inline-block', minWidth:14, textAlign:'center' }}>{badgeCount}</span>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={T.text2} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform:badgeExpanded?'rotate(180deg)':'none', transition:'transform 0.18s' }}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
              )}
            </div>
          </div>
          <div style={{ fontSize:12, fontWeight:!msg.read?600:400, color:!msg.read?T.text1:T.text2, fontFamily:T.font, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3, letterSpacing:'-0.005em' }}>{msg.subject}</div>
          <div style={{ fontSize:11.5, color:T.text2, fontFamily:T.font, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{msg.preview}</div>
        </div>
      </div>
    </div>
  );
}

function ConvGroup({ group, selectedMsg, composeMode, onSelectMsg, onContextMenu }) {
  const [expanded, setExpanded] = useState(false);
  const latest = group[group.length-1];
  const older  = group.slice(0, group.length-1);
  const hasMore = older.length > 0;
  const anySelected = group.some(m => m.id === selectedMsg?.id);
  const isExpanded  = expanded || anySelected;
  return (
    <div style={{ borderBottom:`1px solid ${T.border}` }}>
      <MsgRow msg={latest} isSelected={latest.id===selectedMsg?.id} composeMode={composeMode} onSelectMsg={onSelectMsg} onContextMenu={onContextMenu} badgeCount={hasMore?group.length:0} badgeExpanded={isExpanded} onBadgeClick={hasMore?()=>setExpanded(v=>!v):null}/>
      {hasMore && isExpanded && (
        <div style={{ background:'rgba(0,0,0,0.02)', borderTop:`1px solid rgba(0,0,0,0.06)` }}>
          {[...older].reverse().map((msg, i) => (
            <div key={msg.id} style={{ borderBottom:i<older.length-1?`1px solid ${T.border}`:'none' }}>
              <MsgRow msg={msg} isSelected={msg.id===selectedMsg?.id} composeMode={composeMode} onSelectMsg={onSelectMsg} onContextMenu={onContextMenu} indent/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Neumorphic pill button ─────────────────────────────────────────────────── */
function NeuPill({ label, active, color, dot, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 20, border: 'none',
        background: T.bg0,
        boxShadow: active ? T.shadowIn : T.shadowOut,
        color: active ? (color || T.violet) : T.text2,
        fontSize: 11, fontWeight: active ? 700 : 500,
        cursor: 'pointer', transition: 'all 0.15s',
        fontFamily: T.font, whiteSpace: 'nowrap', flexShrink: 0,
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.boxShadow = T.shadowHover; e.currentTarget.style.color = T.text1; } }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = active ? T.shadowIn : T.shadowOut; e.currentTarget.style.color = active ? (color || T.violet) : T.text2; }}
    >
      {dot && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
          background: active ? dot : '#d1d5db',
          boxShadow: active ? `0 0 5px ${dot}90` : 'none',
          transition: 'all 0.15s',
        }}/>
      )}
      {children || label}
    </button>
  );
}

export default function MessageSidebar({ activeTab, setActiveTab, msgList, selectedMsg, composeMode, onSelectMsg, onCompose, onContextMenu, mobileSidebarOpen }) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchVal,    setSearchVal]    = useState("");
  const tabs = ["All", "Read", "Unread"];

  const filteredMessages = msgList.filter(m => {
    const passesTab    = activeTab==="Read" ? m.read : activeTab==="Unread" ? !m.read : true;
    const passesStatus = statusFilter==="all" || m.status===statusFilter;
    const passesSearch = !searchVal || m.sender?.toLowerCase().includes(searchVal.toLowerCase()) || m.subject?.toLowerCase().includes(searchVal.toLowerCase()) || m.preview?.toLowerCase().includes(searchVal.toLowerCase());
    return passesTab && passesStatus && passesSearch;
  });

  const groups = groupByConversation(filteredMessages);
  const unreadCount = msgList.filter(m => !m.read).length;

  return (
    <aside className={`mp-sidebar${mobileSidebarOpen?' mp-sidebar--open':''}`} style={{ background:T.bg0, borderRight:`1px solid rgba(13,39,80,0.08)`, display:'flex', flexDirection:'column', width:320 }}>
      <style>{`
        * { font-family: 'Poppins', 'Inter', system-ui, sans-serif !important; }
        .ms-msg-list::-webkit-scrollbar { width: 3px; }
        .ms-msg-list::-webkit-scrollbar-thumb { background: #dcdce2; border-radius: 4px; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding:'16px 14px 12px', background:T.bg0 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:32, height:32, borderRadius:11,
              background: T.bg0,
              boxShadow: T.shadowOut,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.violet} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div>
              <h1 style={{ fontSize:15, fontWeight:700, color:T.text0, margin:0, fontFamily:T.font, letterSpacing:'-0.3px', lineHeight:1 }}>Inbox</h1>
              {unreadCount > 0 && <span style={{ fontSize:10, color:T.text2, fontFamily:T.font }}>{unreadCount} unread</span>}
            </div>
          </div>
          <button onClick={onCompose} aria-label="Compose"
            style={{ width:34, height:34, borderRadius:'50%', background:T.bg0, color:T.violet, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:T.shadowOut, transition:'all 0.15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.boxShadow=T.shadowHover; e.currentTarget.style.color=T.violetBright; }}
            onMouseLeave={e=>{ e.currentTarget.style.boxShadow=T.shadowOut; e.currentTarget.style.color=T.violet; }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>

        {/* Search */}
        <div style={{ position:'relative' }}>
          <svg style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.text2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search…" value={searchVal} onChange={e=>setSearchVal(e.target.value)}
            style={{ width:'100%', background:T.bg0, border:'none', borderRadius:20, padding:'7px 10px 7px 32px', fontSize:12.5, color:T.text1, outline:'none', fontFamily:T.font, boxShadow:T.shadowIn, transition:'box-shadow 0.15s', boxSizing:'border-box' }}
            onFocus={e=>e.target.style.boxShadow='inset 4px 4px 10px rgba(13,39,80,0.18), inset -3px -3px 8px rgba(255,255,255,0.88)'}
            onBlur={e=>e.target.style.boxShadow=T.shadowIn}
          />
        </div>
      </div>


      {/* ── Tabs: All / Read / Unread ── */}
      <div style={{ padding:'0 14px 10px', background:T.bg0 }}>
        <div style={{ display:'flex', borderBottom:'2px solid rgba(13,39,80,0.07)' }}>
          {[
            { key:'All',    color:'#8b0000' },
            { key:'Read',   color:'#059669' },
            { key:'Unread', color:'#2563eb' },
          ].map(({ key, color }) => {
            const active = activeTab === key;
            return (
              <button key={key} onClick={() => setActiveTab(key)}
                style={{
                  flex:1, padding:'7px 0', border:'none', background:'transparent',
                  borderBottom: `2.5px solid ${active ? color : 'transparent'}`,
                  marginBottom: '-2px',
                  color: active ? color : T.text2,
                  fontSize:12.5, fontWeight: active ? 700 : 500,
                  cursor:'pointer', transition:'all 0.18s', fontFamily:T.font,
                }}
                onMouseEnter={e=>{ if(!active) e.currentTarget.style.color = T.text1; }}
                onMouseLeave={e=>{ if(!active) e.currentTarget.style.color = T.text2; }}>
                {key}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Status filters ── */}
      <div style={{ padding:'0 14px 12px', background:T.bg0 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:7 }}>
          {STATUS_FILTERS.map(sf => {
            const m = STATUS_META[sf.key];
            const active = statusFilter === sf.key;
            return (
              <button key={sf.key} onClick={() => setStatusFilter(sf.key)}
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:5,
                  padding:'6px 4px', borderRadius:20, border:'none',
                  background: active ? m.dot : T.bg0,
                  boxShadow: active
                    ? `inset 3px 3px 7px rgba(0,0,0,0.18), inset -2px -2px 5px rgba(255,255,255,0.15), 0 0 0 2px ${m.dot}`
                    : T.shadowOut,
                  color: active ? '#fff' : T.text2,
                  fontSize:11, fontWeight: active ? 700 : 500,
                  cursor:'pointer', transition:'all 0.18s',
                  fontFamily:T.font, whiteSpace:'nowrap', width:'100%',
                }}
                onMouseEnter={e=>{ if(!active){ e.currentTarget.style.boxShadow=T.shadowHover; e.currentTarget.style.color=m.color; }}}
                onMouseLeave={e=>{ if(!active){ e.currentTarget.style.boxShadow=T.shadowOut; e.currentTarget.style.color=T.text2; }}}>
                <span style={{
                  width:6, height:6, borderRadius:'50%', flexShrink:0,
                  background: active ? 'rgba(255,255,255,0.8)' : m.dot,
                  boxShadow: active ? 'none' : `0 0 5px ${m.dot}90`,
                  transition:'all 0.15s',
                }}/>
                {sf.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Quick links: Drafts / Starred ── */}
      <div style={{ padding:'0 14px 14px', background:T.bg0 }}>
        <div style={{ display:'flex', gap:0, background:T.bg0, borderRadius:20, boxShadow:T.shadowIn, overflow:'hidden' }}>
          {[
            { label:'Drafts',  color:'#6366f1', icon:<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>, fill:false },
            { label:'Starred', color:'#d97706', icon:<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>, fill:false },
          ].map(({ label, color, icon, fill }, i) => (
            <button key={label} onClick={() => {}}
              style={{
                flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                padding:'9px 12px', border:'none',
                borderRight: i === 0 ? '1px solid rgba(13,39,80,0.07)' : 'none',
                background:'transparent',
                color: T.text2, fontSize:12, fontWeight:600,
                cursor:'pointer', fontFamily:T.font, transition:'all 0.15s',
              }}
              onMouseEnter={e=>{ e.currentTarget.style.color=color; e.currentTarget.style.background='rgba(13,39,80,0.03)'; }}
              onMouseLeave={e=>{ e.currentTarget.style.color=T.text2; e.currentTarget.style.background='transparent'; }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill={fill ? color : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height:1, background:'linear-gradient(to right, transparent, rgba(13,39,80,0.08), transparent)', margin:'0 14px 4px' }}/>

      {/* ── Message list ── */}
      <div className="ms-msg-list" style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin', scrollbarColor:'#dcdce2 transparent' }}>
        {groups.length === 0 ? (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:200, gap:10, color:T.text2, fontFamily:T.font }}>
            <div style={{ width:44, height:44, borderRadius:14, background:T.bg0, boxShadow:T.shadowOut, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:0.4 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <span style={{ fontSize:12.5, fontWeight:500 }}>No messages</span>
          </div>
        ) : groups.map(group => (
          <ConvGroup key={group[group.length-1].conversationId||group[0].id} group={group} selectedMsg={selectedMsg} composeMode={composeMode} onSelectMsg={onSelectMsg} onContextMenu={onContextMenu}/>
        ))}
      </div>
    </aside>
  );
}