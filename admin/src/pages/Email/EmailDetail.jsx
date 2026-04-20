import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from '@tanstack/react-query';
import api from "../../services/api";
import { useThread } from "../../hooks/useThread";
import ActionBtn from "./ActionBtn";
import ReplyBox from "./ReplyBox";

/* ── Design tokens (Light Mode — Maroon & White) ────────────────────────────── */
const T = {
  bg0:         '#ffffff',
  bg1:         '#ffffff',
  bg2:         '#f5eeee',
  bg3:         '#ede0e0',
  surface:     '#ffffff',
  surfaceHi:   '#fdf8f8',
  border:      'rgba(139,0,0,0.10)',
  borderHi:    'rgba(139,0,0,0.18)',
  text0:       '#0d0ae2',
  text1:       '#000000',
  text2:       '#000000',
  violet:      '#8b0000',
  violetBright:'#6b0000',
  violetLo:    'rgba(139,0,0,0.08)',
  violetMd:    'rgba(139,0,0,0.15)',
  cyan:        '#b91c1c',
  green:       '#059669',
  greenLo:     'rgba(5,150,105,0.08)',
  red:         '#dc2626',
  redLo:       'rgba(220,38,38,0.07)',
  font:        "'Poppins', 'Inter', system-ui, sans-serif",
};

const EMAIL_STATUSES = [
  { key:"new",     label:"New",     color:'#d97706', bg:'rgba(217,119,6,0.1)'   },
  { key:"open",    label:"Open",    color:'#dc2626', bg:'rgba(220,38,38,0.09)'  },
  { key:"pending", label:"Pending", color:'#8b0000', bg:'rgba(139,0,0,0.09)'    },
  { key:"onhold",  label:"On Hold", color:'#9d174d', bg:'rgba(157,23,77,0.09)'  },
  { key:"solved",  label:"Solved",  color:'#059669', bg:'rgba(5,150,105,0.09)'  },
];
function getStatusByKey(k) { return EMAIL_STATUSES.find(s => s.key === k) || EMAIL_STATUSES[1]; }

function EmailBody({ body, bodyType }) {
  const iframeRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState(40);
  const isHtml = bodyType === "html" || bodyType === "HTML" ||
    (typeof body === "string" && /<[a-z][\s\S]*>/i.test(body));
  useEffect(() => {
    if (!isHtml || !iframeRef.current) return;
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    const cleanedBody = isHtml ? stripQuotedContent(body || "") : (body || "");
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500&display=swap" rel="stylesheet"/>
      <style>
        *{box-sizing:border-box;margin:0;padding:0;font-size:13px !important;font-family:'Poppins',system-ui,sans-serif !important;line-height:1.55 !important}
        html,body{overflow:hidden;width:100%}
        body{font-size:13px !important;line-height:1.55;font-weight:400;color:#222222;word-break:break-word;display:inline-block;min-width:100%;background:transparent}
        p,div,span,td,th,li,h1,h2,h3,h4,h5,h6,strong,em,b,i,u{font-size:13px !important;font-family:'Poppins',system-ui,sans-serif !important;font-weight:400 !important;color:#222222 !important}
        strong,b{font-weight:600 !important}
        p{margin:0 0 0.5em}p:last-child{margin-bottom:0}
        a{color:#2563eb !important;text-decoration:none}a:hover{text-decoration:underline}
        img{max-width:100%;height:auto;border-radius:6px}table{border-collapse:collapse}
      </style></head><body>${stripInlineFontStyles(cleanedBody)}</body></html>`);
    doc.close();
    const getH = () => { const b = doc.body; return Math.max(40,(b?.offsetHeight||b?.scrollHeight||40)+4); };
    const resize = () => setIframeHeight(getH());
    iframe.onload = resize; setTimeout(resize,100); setTimeout(resize,350);
  }, [body, isHtml]);
  if (!body) return <p style={{ color:T.text2, fontSize:11, fontStyle:"italic", fontFamily:T.font }}>(No message body)</p>;
  if (isHtml) return (
    <div style={{ borderRadius:6 }}>
      <iframe ref={iframeRef} title="email-body" sandbox="allow-same-origin"
        style={{ width:"100%", height:iframeHeight, border:"none", display:"block", overflow:"hidden", background:"transparent" }} />
    </div>
  );
  return (
    <div style={{ fontSize:13, lineHeight:1.55, color:'#222222', fontFamily:T.font }}>
      {body.split("\n").map((line,i) => <p key={i} style={{ margin:line.trim()===""?"0.35em 0":"0" }}>{line||"\u00A0"}</p>)}
    </div>
  );
}

const ACOLORS = ['#1d4ed8','#7c3aed','#0891b2','#059669','#d97706','#dc2626','#9d174d','#0f766e','#6d28d9','#b45309'];
function avatarColor(name) { let h=0; for (let c of (name||'')) h=(h*31+c.charCodeAt(0))%ACOLORS.length; return ACOLORS[h]; }
function initials(name) { return (name||'?').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(); }
function formatThreadDate(iso) {
  if (!iso) return '';
  const d=new Date(iso), now=new Date(), diffMs=now-d, diffH=diffMs/36e5, diffD=diffMs/864e5;
  if (diffH<1) return Math.max(1,Math.round(diffH*60))+'m ago';
  if (diffH<24) return d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  if (diffD<2) return 'Yesterday '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  return d.toLocaleDateString([],{month:'short',day:'numeric'})+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
}

function stripInlineFontStyles(html) {
  if (!html) return html;
  return html.replace(/(<[^>]+)\sstyle="([^"]*)"/gi, (match, tag, styleVal) => {
    const cleaned = styleVal
      .replace(/font-size\s*:[^;]+;?/gi, '')
      .replace(/font-family\s*:[^;]+;?/gi, '')
      .replace(/color\s*:[^;]+;?/gi, '')
      .replace(/mso-[^:]+:[^;]+;?/gi, '')
      .trim().replace(/;+$/, '');
    return cleaned ? `${tag} style="${cleaned}"` : tag;
  });
}

function stripQuotedContent(html) {
  if (!html) return html;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 1. Outlook OWA wrapper divs — nuke element + all siblings after it
    doc.querySelectorAll('#divRplyFwdMsg, #appendonsend, .OutlookMessageHeader, [id^="divRply"], [id^="divFwd"]')
      .forEach(el => {
        let s = el.nextSibling;
        while (s) { const t = s.nextSibling; s.parentNode?.removeChild(s); s = t; }
        el.remove();
      });

    // 2. Gmail / Apple quotes
    doc.querySelectorAll('.gmail_quote, blockquote[type="cite"]').forEach(el => el.remove());

    // 3. All blockquotes
    doc.querySelectorAll('blockquote').forEach(el => el.remove());

    // 4. ANY <hr> → remove it AND everything that comes after it in the document
    //    Outlook always places a <hr> as the reply separator
    const firstHr = doc.querySelector('hr');
    if (firstHr) {
      // Remove all siblings after the hr in its parent
      let s = firstHr.nextSibling;
      while (s) { const t = s.nextSibling; s.parentNode?.removeChild(s); s = t; }
      // Also remove all nodes after hr's parent chain up to body
      let parent = firstHr.parentElement;
      while (parent && parent !== doc.body) {
        let sib = parent.nextSibling;
        while (sib) { const t = sib.nextSibling; sib.parentNode?.removeChild(sib); sib = t; }
        parent = parent.parentElement;
      }
      firstHr.remove();
    }

    // 5. Walk all remaining elements — find any node containing From+Sent+To pattern
    //    and remove it + everything after it (catches Outlook desktop inline quote)
    const walk = Array.from(doc.body.querySelectorAll('*'));
    for (const el of walk) {
      if (!doc.body.contains(el)) continue;
      const txt = el.textContent || '';
      const hasMeta = /From\s*:/i.test(txt) && /Sent\s*:/i.test(txt) && /To\s*:/i.test(txt);
      if (!hasMeta) continue;
      const bodyLen = (doc.body.textContent || '').trim().length;
      // Only strip if this is NOT the whole body
      if (bodyLen > txt.trim().length + 10) {
        let s = el.nextSibling;
        while (s) { const t = s.nextSibling; s.parentNode?.removeChild(s); s = t; }
        // Walk up and remove trailing siblings
        let p = el.parentElement;
        while (p && p !== doc.body) {
          let sib = p.nextSibling;
          while (sib) { const t = sib.nextSibling; sib.parentNode?.removeChild(sib); sib = t; }
          p = p.parentElement;
        }
        el.remove();
        break;
      }
    }

    return doc.body.innerHTML;
  } catch { return html; }
}

const MAX_BUBBLE_HEIGHT = 200;

function ThreadMessageBody({ body, bodyType, isSentByMe, onLong }) {
  const iframeRef = useRef(null);
  const [height, setHeight] = useState(24);
  const [realHeight, setRealHeight] = useState(24);
  const [showFull, setShowFull] = useState(false); // false = show clean body by default
  const [expanded, setExpanded] = useState(false);
  const isHtml = bodyType==='html'||bodyType==='HTML'||(typeof body==='string'&&/<[a-z][\s\S]*>/i.test(body));
  const cleanBody = isHtml ? stripQuotedContent(body) : body;
  const hasQuoted = isHtml && (cleanBody||'').length < (body||'').length-50;
  const displayBody = showFull ? body : cleanBody; // showFull=false hides quoted, true shows it

  const textColor = '#222222';
  const btnColor  = isSentByMe ? '#1e3a5f' : T.text2;

  useEffect(() => {
    if (!isHtml||!iframeRef.current) return;
    const doc=iframeRef.current.contentDocument||iframeRef.current.contentWindow?.document;
    if (!doc) return;
    doc.open();
    const forcedColor = '#222222';
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500&display=swap" rel="stylesheet"/>
      <style>
        *{box-sizing:border-box;margin:0;padding:0;font-size:13px !important;font-family:'Poppins',system-ui,sans-serif !important;line-height:1.55 !important}
        html,body{overflow:hidden;width:100%}
        body{font-size:13px !important;line-height:1.55;font-weight:400;color:${forcedColor} !important;word-break:break-word;background:transparent;display:inline-block;min-width:100%}
        p,div,span,td,th,li,h1,h2,h3,h4,h5,h6,strong,em,b,i,u{font-size:13px !important;color:${forcedColor} !important;font-family:'Poppins',system-ui,sans-serif !important;font-weight:400 !important}
        strong,b{font-weight:600 !important}
        p{margin:0 0 0.35em}p:last-child{margin-bottom:0}
        a{color:#2563eb !important;text-decoration:underline}
        img{max-width:100%;height:auto}table{border-collapse:collapse}
      </style></head><body>${stripInlineFontStyles(displayBody||'')}</body></html>`);
    doc.close();
    setHeight(24);
    const getH=()=>{ const b=doc.body; return Math.max(24,(b?.offsetHeight||b?.scrollHeight||24)+2); };
    const resize=()=>{ const h=getH(); setRealHeight(h); setHeight(expanded?h:Math.min(h,MAX_BUBBLE_HEIGHT)); };
    iframeRef.current.onload=resize; setTimeout(resize,80); setTimeout(resize,300);
  }, [displayBody,isHtml,textColor,isSentByMe,expanded]);

  const isTruncated = !expanded && realHeight > MAX_BUBBLE_HEIGHT;
  const wordCount = (body||'').replace(/<[^>]*>/g,'').split(/\s+/).filter(Boolean).length;
  const isLong = isTruncated || wordCount > 20;
  useEffect(()=>{ onLong?.(isLong); }, [isLong, onLong]);

  if (!body) return null;
  const gradientEnd = isSentByMe ? `rgba(221,232,248,0.97)` : `rgba(240,240,243,0.97)`;

  const textContent = isHtml ? (
    <div style={{ position:'relative' }}>
      <iframe ref={iframeRef} title="thread-body" sandbox="allow-same-origin"
        style={{ width:'100%',height,border:'none',display:'block',overflow:'hidden',background:'transparent',transition:'height 0.2s ease' }} />
      {isTruncated && <div style={{ position:'absolute',bottom:0,left:0,right:0,height:44,background:`linear-gradient(to bottom,transparent,${gradientEnd})`,borderRadius:'0 0 4px 4px',pointerEvents:'none' }} />}
    </div>
  ) : (
    <div style={{ fontSize:13,lineHeight:1.55,color:'#222222',fontFamily:T.font,fontWeight:400,maxHeight:expanded?'none':`${MAX_BUBBLE_HEIGHT}px`,overflow:'hidden',position:'relative',transition:'max-height 0.2s ease' }}>
      {body.split('\n').map((line,i)=><p key={i} style={{ margin:line.trim()===''?'0.3em 0':0, color:'#222222' }}>{line||'\u00A0'}</p>)}
      {isTruncated && <div style={{ position:'absolute',bottom:0,left:0,right:0,height:44,background:`linear-gradient(to bottom,transparent,${gradientEnd})`,pointerEvents:'none' }} />}
    </div>
  );

  return (
    <div>
      {textContent}
      {((isTruncated || (expanded && realHeight > MAX_BUBBLE_HEIGHT)) || hasQuoted) && (
        <div style={{ display:'flex',alignItems:'center',gap:8,marginTop:8,flexWrap:'wrap' }}>
          {(isTruncated || (expanded && realHeight > MAX_BUBBLE_HEIGHT)) && (
            <button onClick={e=>{e.stopPropagation();setExpanded(v=>!v);}}
              style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'4px 12px',border:'none',borderRadius:20,background:'#ffffff',boxShadow:`4px 4px 12px rgba(13,39,80,0.14), -3px -3px 8px rgba(255,255,255,0.9)`,fontSize:10,color:btnColor,cursor:'pointer',fontFamily:T.font,fontWeight:600,letterSpacing:'0.02em',transition:'all 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='6px 6px 16px rgba(13,39,80,0.18), -4px -4px 10px rgba(255,255,255,0.95)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='4px 4px 12px rgba(13,39,80,0.14), -3px -3px 8px rgba(255,255,255,0.9)'}>
              {expanded ? 'Show less' : 'See more'}
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform:expanded?'rotate(180deg)':'none',transition:'transform 0.15s' }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          )}
          {hasQuoted && (
            <button onClick={e=>{e.stopPropagation();setShowFull(v=>!v);}}
              style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'4px 12px',border:'none',borderRadius:20,background:'#ffffff',boxShadow:`4px 4px 12px rgba(13,39,80,0.14), -3px -3px 8px rgba(255,255,255,0.9)`,fontSize:10,color:btnColor,cursor:'pointer',fontFamily:T.font,fontWeight:600,letterSpacing:'0.02em',transition:'all 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.boxShadow='6px 6px 16px rgba(13,39,80,0.18), -4px -4px 10px rgba(255,255,255,0.95)'}
              onMouseLeave={e=>e.currentTarget.style.boxShadow='4px 4px 12px rgba(13,39,80,0.14), -3px -3px 8px rgba(255,255,255,0.9)'}>
              <span style={{letterSpacing:3,fontSize:8}}>•••</span>{showFull?'Hide quoted':'Show quoted'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DateDivider({ label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, margin:'18px 0 14px', userSelect:'none' }}>
      <div style={{ flex:1, height:1, background:'linear-gradient(to right, transparent, rgba(100,116,160,0.18))' }}/>
      <span style={{ fontSize:11, fontWeight:600, color:T.text2, fontFamily:T.font, letterSpacing:'0.04em', whiteSpace:'nowrap', padding:'2px 10px', borderRadius:20, background:'#ffffff', boxShadow:'3px 3px 8px rgba(207, 209, 212, 0.1), -1px -1px 4px rgba(99, 97, 97, 0.9)' }}>
        {label}
      </span>
      <div style={{ flex:1, height:1, background:'linear-gradient(to left, transparent, rgba(100,116,160,0.18))' }}/>
    </div>
  );
}

function getDateLabel(iso) {
  if (!iso) return null;
  const d = new Date(iso), now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today - msgDay) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

function MessageHeader({ name, email, to, cc, date, isSentByMe, onReply, onReplyAll }) {
  const color = isSentByMe ? T.violet : avatarColor(name);
  return (
    <div style={{ display:'flex', gap:12, marginBottom:16 }}>
      {/* Avatar */}
      <div style={{ position:'relative', flexShrink:0 }}>
        <div style={{ width:44, height:44, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:700, color:'#fff', fontFamily:T.font }}>
          {initials(name)}
        </div>
        <div style={{ position:'absolute', bottom:-2, right:-2, width:14, height:14, borderRadius:'50%', background:T.green, border:`2px solid ${T.bg1}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>
      {/* Info */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
          <span style={{ fontSize:15, fontWeight:700, color:T.text0, fontFamily:T.font }}>{name}</span>
          <div style={{ display:'flex', alignItems:'center', gap:10, color:T.text2 }}>
            {/* Action icon buttons */}
            {[
              { title:'Emoji', path:<><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>, onClick:null },
              { title:'Reply', path:<><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></>, onClick:onReply },
              { title:'Reply All', path:<><polyline points="7 17 2 12 7 7"/><polyline points="12 17 7 12 12 7"/><path d="M22 18v-2a4 4 0 0 0-4-4H2"/></>, onClick:onReplyAll },
            ].map(({title, path, onClick}) => (
              <button key={title} title={title} onClick={e=>{e.stopPropagation();onClick?.();}}
                style={{ all:'unset', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:8, transition:'all 0.15s' }}
                onMouseEnter={e=>{e.currentTarget.style.background=T.bg2; e.currentTarget.style.color=T.text0;}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.color=T.text2;}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
              </button>
            ))}
            <div style={{ width:1, height:16, background:T.border, margin:'0 2px' }} />
            <button title="More" style={{ all:'unset', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', width:28, height:28, borderRadius:8, transition:'all 0.15s' }}
              onMouseEnter={e=>{e.currentTarget.style.background=T.bg2;}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
          </div>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:13, color:T.text2, display:'flex', alignItems:'center', gap:4, fontFamily:T.font }}>
              To:&nbsp;
              <div style={{ display:'flex', alignItems:'center', gap:4, background:T.greenLo, padding:'1px 8px', borderRadius:4, color:T.green, fontWeight:600, fontSize:13 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {to}
              </div>
            </div>
            {cc && cc.length > 0 && (
              <div style={{ fontSize:13, color:T.text2, display:'flex', alignItems:'center', gap:4, marginTop:4, fontFamily:T.font }}>
                Cc:&nbsp;{cc.map((c,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(217,119,6,0.08)', padding:'1px 8px', borderRadius:4, color:'#d97706', fontWeight:600 }}>
                    {c.name || c.email}
                  </div>
                ))}
              </div>
            )}
          </div>
          <span style={{ fontSize:12, color:T.text2, flexShrink:0, marginTop:2, fontFamily:T.font }}>{date}</span>
        </div>
      </div>
    </div>
  );
}

function ThreadCard({ msg, isLast, defaultExpanded = false, onReply, onReplyAll, outlookConnected, isSentByMe }) {
  const [showFull,    setShowFull]    = useState(false);
  const [hasQuoted,   setHasQuoted]   = useState(false);
  const [isExpanded,  setIsExpanded]  = useState(defaultExpanded);

  const name       = msg.from?.emailAddress?.name||msg.from?.emailAddress?.address||'Unknown';
  const email      = msg.from?.emailAddress?.address || '';
  const rawDate    = msg.receivedDateTime||msg.sentDateTime;
  const displayDate = rawDate ? new Date(rawDate).toLocaleDateString([],{weekday:'short',month:'numeric',day:'numeric',year:'numeric'})+' '+new Date(rawDate).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : '';
  const to         = msg.toRecipients?.[0]?.emailAddress?.name || msg.toRecipients?.[0]?.emailAddress?.address || 'Recipient';
  const cc         = (msg.ccRecipients||[]).map(r=>({name:r.emailAddress?.name, email:r.emailAddress?.address}));

  if (!isExpanded) {
    return (
      <div onClick={()=>setIsExpanded(true)}
        style={{ padding:'12px 20px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, marginBottom:8, cursor:'pointer', display:'flex', alignItems:'center', gap:14, transition:'all 0.15s', boxShadow:'0 1px 3px rgba(139,0,0,0.06)' }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='#dc2626'; e.currentTarget.style.boxShadow='0 2px 8px rgba(220,38,38,0.10)';}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='#e5e7eb'; e.currentTarget.style.boxShadow='0 1px 3px rgba(139,0,0,0.06)';}}>
        <div style={{ width:34, height:34, borderRadius:'50%', background:isSentByMe?T.violet:avatarColor(name), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0, fontFamily:T.font }}>
          {initials(isSentByMe?'You':name)}
        </div>
        <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:13, fontWeight:700, color:T.text0, whiteSpace:'nowrap', fontFamily:T.font }}>{isSentByMe?'You':name}</span>
          <span style={{ fontSize:13, color:T.text2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, fontFamily:T.font }}>{msg.bodyPreview||'...'}</span>
        </div>
        <span style={{ fontSize:12, color:T.text2, whiteSpace:'nowrap', fontFamily:T.font }}>{displayDate}</span>
      </div>
    );
  }

  return (
    <div style={{ background:'#fff', border:'1.5px solid #dc2626', borderRadius:8, marginBottom:12, boxShadow:'rgba(139, 0, 0, 0.07) 0px 2px 8px', animation:'ed-fadeUp 0.25s ease' }}>
      <div onClick={()=>setIsExpanded(false)} style={{ padding:'20px 24px 0', cursor:'pointer' }}>
        <MessageHeader name={isSentByMe?'You':name} email={email} to={isSentByMe?to:'Me'} cc={isSentByMe?cc:[]} date={displayDate} isSentByMe={isSentByMe} onReply={onReply} onReplyAll={onReplyAll} />
      </div>
      <div style={{ padding:'0 24px 20px' }}>
        <ThreadMessageBody body={msg.body?.content||msg.bodyPreview} bodyType={msg.body?.contentType} isSentByMe={isSentByMe} onLong={()=>{}} />
        {hasQuoted && (
          <button onClick={()=>setShowFull(v=>!v)}
            style={{ all:'unset', cursor:'pointer', display:'flex', alignItems:'center', gap:8, marginTop:14, color:T.text2, fontSize:12, fontWeight:600, fontFamily:T.font }}>
            <span style={{ letterSpacing:2 }}>•••</span>{showFull?'Hide quoted':'Show quoted'}<span style={{ letterSpacing:2 }}>•••</span>
          </button>
        )}
      </div>
    </div>
  );
}

function OriginalMsgBubble({ msg, isOutlookEmail, onReply, onReplyAll, outlookConnected }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const name       = msg.sender || 'Unknown';
  const rawDate    = msg.receivedAt || msg.sentAt;
  const displayDate = rawDate
    ? new Date(rawDate).toLocaleDateString([],{weekday:'short',month:'numeric',day:'numeric',year:'numeric'})+' '+new Date(rawDate).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})
    : msg.time || '';
  const to = 'Me';
  const cc = msg.cc || [];

  if (!isExpanded) {
    return (
      <div onClick={()=>setIsExpanded(true)}
        style={{ padding:'12px 20px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, marginBottom:8, cursor:'pointer', display:'flex', alignItems:'center', gap:14, transition:'all 0.15s', boxShadow:'0 1px 3px rgba(139,0,0,0.06)' }}
        onMouseEnter={e=>{e.currentTarget.style.borderColor='#dc2626'; e.currentTarget.style.boxShadow='0 2px 8px rgba(220,38,38,0.10)';}}
        onMouseLeave={e=>{e.currentTarget.style.borderColor='#e5e7eb'; e.currentTarget.style.boxShadow='0 1px 3px rgba(139,0,0,0.06)';}}>
        <div style={{ width:34, height:34, borderRadius:'50%', background:avatarColor(name), display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0, fontFamily:T.font }}>
          {initials(name)}
        </div>
        <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:13, fontWeight:700, color:T.text0, whiteSpace:'nowrap', fontFamily:T.font }}>{name}</span>
          <span style={{ fontSize:13, color:T.text2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, fontFamily:T.font }}>{msg.preview||msg.body?.slice?.(0,80)||'...'}</span>
        </div>
        <span style={{ fontSize:12, color:T.text2, whiteSpace:'nowrap', fontFamily:T.font }}>{displayDate}</span>
      </div>
    );
  }

  return (
    <div style={{ background:'#fff', border:'1.5px solid #dc2626', borderRadius:8, marginBottom:12, boxShadow:'rgba(139, 0, 0, 0.07) 0px 2px 8px', animation:'ed-fadeUp 0.3s ease' }}>
      <div onClick={()=>setIsExpanded(false)} style={{ padding:'20px 24px 0', cursor:'pointer' }}>
        <MessageHeader name={name} email={msg.senderEmail} to={to} cc={cc} date={displayDate} isSentByMe={false} onReply={onReply} onReplyAll={onReplyAll} />
      </div>
      <div style={{ padding:'0 24px 20px' }}>
        <ThreadMessageBody body={msg.body} bodyType={msg.bodyType} isSentByMe={false} onLong={()=>{}} />
        {msg.attachments && msg.attachments.length > 0 && (
          <div style={{ marginTop:24 }}>
            <span style={{ fontSize:11, fontWeight:700, color:T.text2, letterSpacing:'0.05em', textTransform:'uppercase', fontFamily:T.font }}>ATTACHMENTS</span>
            <div style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:10 }}>
              {msg.attachments.map((file,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10, background:T.bg2, border:`1px solid ${T.border}`, minWidth:160 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.text2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
                  <span style={{ fontSize:12, fontWeight:600, color:T.text1, fontFamily:T.font }}>{file.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {outlookConnected && (
          <div style={{ display:'flex', gap:6, marginTop:16 }}>
            {[
              {label:'Reply', icon:<><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></>, action:onReply},
              {label:'Reply All', icon:<><polyline points="7 17 2 12 7 7"/><polyline points="12 17 7 12 12 7"/><path d="M22 18v-2a4 4 0 0 0-4-4H2"/></>, action:onReplyAll},
            ].map(({label,icon,action})=>(
              <button key={label} onClick={e=>{e.stopPropagation();action?.();}}
                style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 14px', border:`1px solid ${T.border}`, borderRadius:20, background:T.bg1, fontSize:12, fontWeight:600, color:T.text2, cursor:'pointer', transition:'all 0.15s', fontFamily:T.font }}
                onMouseEnter={e=>{e.currentTarget.style.background=T.violetLo; e.currentTarget.style.color=T.violet; e.currentTarget.style.borderColor=T.borderHi;}}
                onMouseLeave={e=>{e.currentTarget.style.background=T.bg1; e.currentTarget.style.color=T.text2; e.currentTarget.style.borderColor=T.border;}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmailDetail({ selectedMsg, onExpandToCompose, outlookConnected, onStatusChange, onSyncEmails }) {
  const [replyMode,        setReplyMode]        = useState(null);
  const [replyText,        setReplyText]        = useState("");
  const [expandedThreadIds,setExpandedThreadIds]= useState({});
  const [replyToChips,     setReplyToChips]     = useState([]);
  const [replyCcChips,     setReplyCcChips]     = useState([]);
  const [replyToInput,     setReplyToInput]     = useState("");
  const [replyCcInput,     setReplyCcInput]     = useState("");
  const [showReplyCc,      setShowReplyCc]      = useState(false);
  const [showForwardMenu,  setShowForwardMenu]  = useState(false);
  const [emailStatus,      setEmailStatus]      = useState(null);
  const [isSending,        setIsSending]        = useState(false);
  const [sendError,        setSendError]        = useState(null);
  const [sendSuccess,      setSendSuccess]      = useState(false);
  const [myEmail,          setMyEmail]          = useState('');
  const [replyPanelH,      setReplyPanelH]      = useState(0);
  const emailDetailRef = useRef(null);
  const replyBoxRef    = useRef(null);
  const replyPanelRef  = useRef(null);
  const forwardMenuRef = useRef(null);
  const queryClient = useQueryClient();

  const {
    data: selectedThreadData,
    isLoading: threadLoading,
    refetch: refetchThread,
  } = useThread(selectedMsg?.graphId, { enabled: outlookConnected && !!selectedMsg?.graphId });

  const selectedEmail = selectedThreadData?.selectedEmail || selectedMsg;
  const thread = selectedThreadData?.thread || [];

  useEffect(() => {
    if (!replyMode || !replyPanelRef.current) { setReplyPanelH(0); return; }
    const ro = new ResizeObserver(entries => { for (const entry of entries) setReplyPanelH(entry.contentRect.height); });
    ro.observe(replyPanelRef.current);
    return () => ro.disconnect();
  }, [replyMode]);

  useEffect(() => {
    setReplyMode(null); setReplyText(""); setExpandedThreadIds({});
    setReplyToChips([]); setReplyCcChips([]); setReplyToInput(""); setReplyCcInput("");
    setShowReplyCc(false); setShowForwardMenu(false);
    setEmailStatus(getStatusByKey(selectedMsg?.status||"new"));
    setIsSending(false); setSendError(null); setSendSuccess(false);
  }, [selectedMsg?.id]);

  useEffect(() => { if (selectedMsg?.status) setEmailStatus(getStatusByKey(selectedMsg.status)); }, [selectedMsg?.status]);
  useEffect(() => {
    const h=(e)=>{ if(forwardMenuRef.current&&!forwardMenuRef.current.contains(e.target)) setShowForwardMenu(false); };
    document.addEventListener("mousedown",h); return()=>document.removeEventListener("mousedown",h);
  }, []);
  useEffect(() => {
    if (replyMode&&replyBoxRef.current) setTimeout(()=>replyBoxRef.current?.scrollIntoView({behavior:"smooth",block:"nearest"}),80);
  }, [replyMode]);
  useEffect(() => { if (!sendSuccess) return; const id=setTimeout(()=>setSendSuccess(false),4000); return()=>clearTimeout(id); }, [sendSuccess]);
  useEffect(() => {
    if (!outlookConnected) return;
    api.get('/outlook/status').then(r=>setMyEmail((r.data.email||'').toLowerCase())).catch(()=>{});
  }, [outlookConnected]);

  const openReply = (mode) => {
    setReplyMode(mode); setReplyText(""); setShowReplyCc(false); setSendError(null); setSendSuccess(false);
    const toNames=mode==="reply"?[selectedMsg.sender]:[selectedMsg.sender,...(selectedMsg.cc||[])].filter(Boolean);
    setReplyToChips(toNames.map((name,i)=>({id:i,label:name}))); setReplyCcChips([]); setReplyToInput(""); setReplyCcInput("");
  };
  const closeReply = () => { setReplyMode(null); setReplyText(""); setReplyToChips([]); setReplyCcChips([]); setSendError(null); };

  const sendReply = async (bodyHtml, { replyAll=false, status="open" }={}) => {
    const body=bodyHtml||replyText; if (!body?.trim()) return;
    const isOutlookEmail=!!selectedMsg?.msId;
    if (isOutlookEmail&&outlookConnected) {
      setIsSending(true); setSendError(null);
      try {
        const token=localStorage.getItem("adminToken");
        const endpoint=replyAll?"replyAll":"reply";
        const res=await fetch(`/api/outlook/emails/${selectedMsg.msId}/${endpoint}`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({body,replyAll})});
        const data=await res.json();
        if (!res.ok) throw new Error(data.message||"Failed to send reply");
        if (onStatusChange&&status) onStatusChange(selectedMsg.id,status);
        setSendSuccess(true); closeReply();
        setTimeout(async () => {
          await queryClient.invalidateQueries(['thread', selectedMsg.graphId]);
          await queryClient.invalidateQueries(['messages']);
          onSyncEmails?.();
        }, 2000);
      } catch(err) { setSendError(err.message||"Failed to send. Please try again."); }
      finally { setIsSending(false); }
      return;
    }
    if (onStatusChange&&status) onStatusChange(selectedMsg.id,status);
    closeReply();
  };

  const handleExpandToCompose=({toChips,ccChips,body,attachments})=>{
    closeReply(); onExpandToCompose?.({toChips,ccChips,subject:selectedMsg?`Re: ${selectedMsg.subject}`:"",body,attachments});
  };
  const handleForward=(type)=>{
    setShowForwardMenu(false);
    const subject=selectedMsg?`Fwd: ${selectedMsg.subject}`:"";
    const bodyText=type==="attachment"
      ?`<br/><br/>--- Forwarded as attachment ---<br/><b>From:</b> ${selectedMsg?.sender}<br/><b>Subject:</b> ${selectedMsg?.subject}<br/>`
      :`<br/><br/>--- Forwarded message ---<br/><b>From:</b> ${selectedMsg?.sender}<br/><b>Subject:</b> ${selectedMsg?.subject}<br/><br/>${selectedMsg?.body?.replace(/\n/g,"<br/>")||""}`;
    onExpandToCompose?.({toChips:[],ccChips:[],subject,body:bodyText,attachments:[]});
  };

  const Abtn = ({onClick,label,icon,active,children}) => (
    <button onClick={onClick} title={label}
      style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 13px',borderRadius:10,border:`1px solid ${active?'rgba(139,0,0,0.35)':T.border}`,background:active?T.violetLo:T.bg1,color:active?T.violetBright:T.text2,fontSize:12,fontWeight:600,cursor:'pointer',transition:'all 0.15s',fontFamily:T.font,letterSpacing:'0.01em',whiteSpace:'nowrap' }}
      onMouseEnter={e=>{if(!active){e.currentTarget.style.background=T.bg2;e.currentTarget.style.color=T.text1;e.currentTarget.style.borderColor=T.borderHi;}}}
      onMouseLeave={e=>{if(!active){e.currentTarget.style.background=T.bg1;e.currentTarget.style.color=T.text2;e.currentTarget.style.borderColor=T.border;}}}>
      {icon}{children}
    </button>
  );

  if (!selectedMsg) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',gap:20,background:T.bg0 }}>
      <div style={{ position:'relative' }}>
        <div style={{ width:64,height:64,borderRadius:20,background:T.bg1,border:`1px solid ${T.border}`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(139,0,0,0.08)' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={T.text2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <div style={{ position:'absolute',inset:-1,borderRadius:20,background:'linear-gradient(135deg,rgba(139,0,0,0.07),transparent)',pointerEvents:'none' }}/>
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:14,fontWeight:600,color:T.text1,fontFamily:T.font,margin:'0 0 4px' }}>No message selected</p>
        <p style={{ fontSize:12,color:T.text2,fontFamily:T.font,margin:0 }}>Select a message to start reading</p>
      </div>
    </div>
  );

  const isOutlookEmail = !!selectedMsg?.msId;

  return (
    <div style={{ display:'flex',flexDirection:'column',position:'absolute',inset:0,overflow:'hidden',background:T.bg0 }}>
      <style>{`
        @keyframes ed-fadeUp   { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ed-slideDown{ from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ed-spin     { to{transform:rotate(360deg)} }
        * { font-family: 'Poppins', 'Inter', system-ui, sans-serif !important; }
      `}</style>

      {/* ── Toolbar ── */}
      <div style={{ display:'flex',alignItems:'center',gap:6,padding:'10px 16px',borderBottom:`1px solid ${T.border}`,background:'#ffffff',flexShrink:0,flexWrap:'wrap' }}>

        {/* Reply */}
        <button onClick={()=>openReply("reply")} title="Reply"
          style={{ display:'flex',alignItems:'center',gap:6,padding:'7px 16px',borderRadius:20,border:'none',background:replyMode==='reply'?'inset':'#ffffff',boxShadow:replyMode==='reply'?'inset 3px 3px 8px rgba(13,39,80,0.14),inset -2px -2px 6px rgba(255,255,255,0.85)':'6px 6px 16px rgba(13,39,80,0.13),-4px -4px 12px rgba(255,255,255,0.92)',color:replyMode==='reply'?T.violetBright:T.text1,fontSize:12,fontWeight:600,cursor:'pointer',transition:'all 0.15s',fontFamily:T.font,whiteSpace:'nowrap' }}
          onMouseEnter={e=>{if(replyMode!=='reply'){e.currentTarget.style.boxShadow='8px 8px 20px rgba(13,39,80,0.17),-5px -5px 14px rgba(255,255,255,0.95)';e.currentTarget.style.color=T.violetBright;}}}
          onMouseLeave={e=>{if(replyMode!=='reply'){e.currentTarget.style.boxShadow='6px 6px 16px rgba(13,39,80,0.13),-4px -4px 12px rgba(255,255,255,0.92)';e.currentTarget.style.color=T.text1;}}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
          Reply
        </button>

        {/* Delete + Star icon buttons */}
        {[
          {icon:<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></>,label:'Delete'},
          {icon:<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,label:'Important'},
        ].map(({icon,label})=>(
          <button key={label} title={label}
            style={{ display:'flex',alignItems:'center',justifyContent:'center',width:36,height:36,borderRadius:'50%',border:'none',background:'#ffffff',color:T.text2,cursor:'pointer',transition:'all 0.15s',boxShadow:'6px 6px 16px rgba(13,39,80,0.13),-4px -4px 12px rgba(255,255,255,0.92)' }}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow='8px 8px 20px rgba(13,39,80,0.17),-5px -5px 14px rgba(255,255,255,0.95)';e.currentTarget.style.color=T.text0;}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow='6px 6px 16px rgba(13,39,80,0.13),-4px -4px 12px rgba(255,255,255,0.92)';e.currentTarget.style.color=T.text2;}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
          </button>
        ))}

        <div style={{ flex:1 }} />

        {/* Outlook badge */}
        {isOutlookEmail && (
          <div style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:20,background:'#ffffff',boxShadow:'6px 6px 16px rgba(13,39,80,0.13),-4px -4px 12px rgb(255, 255, 255)',color:'#2563eb',fontSize:11.5,fontWeight:700,fontFamily:T.font,letterSpacing:'0.03em' }}>
            <div style={{ width:6,height:6,borderRadius:'50%',background:'#2563eb',boxShadow:'0 0 6px rgba(37,99,235,0.5)' }}/>Outlook
          </div>
        )}

        {/* Status badge */}
        {emailStatus && (
          <div style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:20,background:'#ffffff',boxShadow:'6px 6px 16px rgba(13,39,80,0.13),-4px -4px 12px rgba(255,255,255,0.92)',color:emailStatus.color,fontSize:11.5,fontWeight:700,flexShrink:0,fontFamily:T.font,letterSpacing:'0.03em' }}>
            <span style={{ width:6,height:6,borderRadius:'50%',background:emailStatus.color,display:'inline-block',boxShadow:`0 0 6px ${emailStatus.color}80` }}/>{emailStatus.label}
          </div>
        )}
      </div>

      {sendSuccess && (
        <div style={{ margin:'10px 16px 0',padding:'9px 14px',background:T.greenLo,border:`1px solid rgba(5,150,105,0.2)`,borderRadius:12,display:'flex',alignItems:'center',gap:10,fontSize:12,fontWeight:600,color:T.green,animation:'ed-fadeUp 0.2s ease',fontFamily:T.font }}>
          <div style={{ width:18,height:18,borderRadius:6,background:'rgba(5,150,105,0.12)',display:'flex',alignItems:'center',justifyContent:'center' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          Reply sent to {selectedMsg?.senderEmail||selectedMsg?.sender} via Outlook
        </div>
      )}

      {/* ── Scroll area ── */}
      <div className="ed-scroll" ref={emailDetailRef}
        style={{ padding:'0',paddingBottom:replyMode?`${replyPanelH}px`:'0',overflowY:'auto',flex:1,minHeight:0,scrollbarWidth:'thin',scrollbarColor:`${T.bg3} transparent`,transition:'padding-bottom 0.1s ease' }}>
        <style>{`.ed-scroll::-webkit-scrollbar{width:3px}.ed-scroll::-webkit-scrollbar-thumb{background:${T.bg3};border-radius:4px}`}</style>

        {(()=>{
          const raw = selectedMsg.subject || '';
          const prefixMatch = raw.match(/^((?:RE|FWD|FW):\s*)+/i);
          const prefix = prefixMatch ? prefixMatch[0].trim() : null;
          const cleanSubject = prefix ? raw.slice(prefix.length).trim() : raw;
          // Only use "to" recipients (not CC) for the summary line
          const toRecipients = (selectedMsg.to || []).filter(Boolean);
          const MAX_SHOW = 1;
          const shown = [selectedMsg.sender];
          const extra = toRecipients.length > 0 ? toRecipients.length - 1 : 0;

          return (
            <div style={{ marginBottom:0 }}>
              <div style={{ display:'flex',alignItems:'center',gap:14,padding:'16px 20px',borderRadius:0,background:'#ffffff',boxShadow:`0 4px 16px rgba(13,39,80,0.12)` }}>
                <div style={{ width:42,height:42,borderRadius:14,flexShrink:0,background:avatarColor(shown[0]||''),display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:'#fff',fontFamily:T.font,boxShadow:'4px 4px 10px rgba(13,39,80,0.15), -3px -3px 8px rgba(255,255,255,0.8)' }}>
                  {initials(shown[0]||'')}
                </div>
                <div style={{ flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:3 }}>
                  <div style={{ fontSize:12,fontWeight:700,color:T.text0,fontFamily:T.font,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                    {shown.join(', ')}
                  </div>
                  {toRecipients.length > 0 && (
                    <div style={{ fontSize:11,color:T.text2,fontFamily:T.font,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>
                      To: {toRecipients[0]}{extra > 0 ? ` +${extra} others` : ''}
                    </div>
                  )}
                  <div style={{ display:'flex',alignItems:'center',gap:6,flexWrap:'wrap' }}>
                    {prefix && (
                      <span style={{ display:'inline-flex',alignItems:'center',fontSize:9,fontWeight:700,color:'#fff',background:T.violet,borderRadius:5,padding:'1px 8px',fontFamily:T.font,letterSpacing:'0.06em',textTransform:'uppercase',flexShrink:0 }}>
                        {prefix.replace(/:\s*$/,'')}
                      </span>
                    )}
                    <span style={{ fontSize:12,fontWeight:600,color:T.text1,fontFamily:T.font,letterSpacing:'-0.2px',lineHeight:1.3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{cleanSubject}</span>
                  </div>
                </div>
                <div style={{ flexShrink:0,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2 }}>
                  <div style={{ fontSize:11,fontWeight:600,color:T.text1,fontFamily:T.font }}>
                    {selectedMsg.time ? new Date(selectedMsg.time).toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'}) : ''}
                  </div>
                  <div style={{ fontSize:10,color:T.text2,fontFamily:T.font,fontWeight:400 }}>
                    {selectedMsg.time ? new Date(selectedMsg.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}) : ''}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <div style={{ marginBottom:12,padding:'18px 18px',paddingTop:'18px' }}>

          {threadLoading && (
            <div style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 4px',color:T.text2,fontSize:11.5,fontFamily:T.font }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.violet} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation:'ed-spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              Loading conversation…
            </div>
          )}

          {/* ── Unified thread render: oldest → newest (mirrors Outlook) ────────
               useThread now returns the full sorted thread (including the clicked
               message) so we no longer render OriginalMsgBubble separately.
               Every message uses ThreadCard for a consistent collapsed/expanded UX.
               The last card (newest reply) starts expanded so the user lands on it.
          ─────────────────────────────────────────────────────────────────────── */}
          {!threadLoading && (() => {
            // Fallback: if thread is empty (e.g. Outlook not connected), show selectedMsg alone
            const allMsgs = thread.length > 0
              ? thread
              : [{ ...selectedMsg, id: selectedMsg.graphId || selectedMsg.id, from: { emailAddress: { name: selectedMsg.sender, address: selectedMsg.senderEmail } }, receivedDateTime: selectedMsg.receivedAt, body: { content: selectedMsg.body, contentType: selectedMsg.bodyType || 'html' } }];

            const items = [];
            let lastLabel = null;

            allMsgs.forEach((m, idx) => {
              const iso = m.receivedDateTime || m.sentDateTime;
              const label = getDateLabel(iso);
              if (label && label !== lastLabel) {
                items.push(<DateDivider key={`div-${idx}`} label={label}/>);
                lastLabel = label;
              }
              const senderAddr = (m.from?.emailAddress?.address || '').toLowerCase();
              const sentByMe   = !!(myEmail && senderAddr === myEmail);
              const isLast     = idx === allMsgs.length - 1;
              items.push(
                <ThreadCard
                  key={m.id}
                  msg={m}
                  isLast={isLast}
                  defaultExpanded={isLast}
                  onReply={()=>openReply('reply')}
                  onReplyAll={()=>openReply('replyAll')}
                  outlookConnected={outlookConnected}
                  isSentByMe={sentByMe}
                />
              );
            });
            return items;
          })()}
        </div>
      </div>

      {replyMode && (
        <div ref={replyPanelRef} style={{ position:'absolute',bottom:0,left:0,right:0,background:T.bg1,borderTop:`1px solid ${T.borderHi}`,boxShadow:'0 -6px 28px rgba(139,0,0,0.08)',zIndex:50,animation:'ed-fadeUp 0.2s ease' }}>
          <ReplyBox
            boxRef={replyBoxRef}
            replyToChips={replyToChips} setReplyToChips={setReplyToChips}
            replyToInput={replyToInput} setReplyToInput={setReplyToInput}
            replyCcChips={replyCcChips} setReplyCcChips={setReplyCcChips}
            replyCcInput={replyCcInput} setReplyCcInput={setReplyCcInput}
            showReplyCc={showReplyCc} setShowReplyCc={setShowReplyCc}
            replyText={replyText} setReplyText={setReplyText}
            onSend={sendReply} onClose={closeReply}
            onExpandToCompose={handleExpandToCompose}
            scrollContainerRef={emailDetailRef}
            outlookConnected={outlookConnected} selectedMsg={selectedMsg}
            isSending={isSending} sendError={sendError}
            replyAll={replyMode==="replyAll"}
          />
        </div>
      )}
    </div>
  );
}