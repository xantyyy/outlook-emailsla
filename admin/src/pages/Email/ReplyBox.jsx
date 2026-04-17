import React, { useState, useRef, useEffect, useCallback } from "react";
import ChipInput from "./ChipInput";
import FormattingToolbar from "./FormattingToolbar";
import BottomToolBtn from "./BottomToolBtn";

const T = {
  bg0:      '#f0f0f3',
  bg1:      '#f0f0f3',
  bg2:      '#e8e8ec',
  bg3:      '#dcdce2',
  surface:  '#f0f0f3',
  border:   'rgba(13,39,80,0.07)',
  borderHi: 'rgba(13,39,80,0.13)',
  text0:    '#0f172a',
  text1:    '#334155',
  text2:    '#94a3b8',
  accent:   '#8b0000',
  accentLo: 'rgba(139,0,0,0.08)',
  green:    '#059669',
  red:      '#dc2626',
  redLo:    'rgba(220,38,38,0.07)',
  blue:     '#1e40af',
  blueLo:   'rgba(30,64,175,0.07)',
  font:     "'Poppins', system-ui, sans-serif",
  // neumorphic shadows
  shadowOut: '5px 5px 14px rgba(13,39,80,0.22), -4px -4px 10px rgba(255,255,255,0.98)',
  shadowIn:  'inset 3px 3px 8px rgba(13,39,80,0.18), inset -2px -2px 6px rgba(255,255,255,0.90)',
  shadowHover: '7px 7px 18px rgba(13,39,80,0.28), -5px -5px 13px rgba(255,255,255,1)',
};

const EMOJIS = [
  "\uD83D\uDE00","\uD83D\uDE02","\uD83D\uDE0A","\uD83D\uDE0D","\uD83E\uDD70","\uD83D\uDE0E","\uD83E\uDD13","\uD83D\uDE05","\uD83D\uDE2D","\uD83E\uDD7A",
  "\uD83D\uDE21","\uD83E\uDD2F","\uD83E\uDD73","\uD83D\uDE34","\uD83E\uDD17","\uD83D\uDC4D","\uD83D\uDC4E","\uD83D\uDE4F","\uD83D\uDD25","\u2764\uFE0F",
  "\u2705","\u26A1","\uD83C\uDF89","\uD83D\uDCA1","\uD83D\uDD0E","\uD83D\uDCC5","\uD83D\uDE80","\uD83D\uDCAC","\uD83D\uDCE7","\u2B50",
];

const SEND_STATUSES = [
  { key:"new",     label:"New",     color:'#b45309', dot:'#f59e0b' },
  { key:"open",    label:"Open",    color:'#991b1b', dot:'#ef4444' },
  { key:"pending", label:"Pending", color:'#1e40af', dot:'#3b82f6' },
  { key:"onhold",  label:"On Hold", color:'#6b21a8', dot:'#a855f7' },
  { key:"solved",  label:"Solved",  color:'#166534', dot:'#10b981' },
];

const MIN_H = 72;
const MAX_H = 420;

/* ── Small neumorphic icon button ─────────────────────────────────────────── */
const NeuBtn = ({ title, onClick, children, active, circle }) => (
  <button title={title} onClick={onClick} style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: circle ? 32 : 30, height: circle ? 32 : 30,
    borderRadius: circle ? '50%' : 8,
    border: 'none',
    background: T.bg0,
    boxShadow: active ? T.shadowIn : T.shadowOut,
    color: active ? T.accent : '#6b7a99',
    cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
  }}
    onMouseEnter={e => {
      if (!active) {
        e.currentTarget.style.boxShadow = T.shadowHover;
        e.currentTarget.style.color = T.text1;
      }
    }}
    onMouseLeave={e => {
      e.currentTarget.style.boxShadow = active ? T.shadowIn : T.shadowOut;
      e.currentTarget.style.color = active ? T.accent : '#6b7a99';
    }}>
    {children}
  </button>
);

export default function ReplyBox({
  boxRef,
  replyToChips, setReplyToChips, replyToInput, setReplyToInput,
  replyCcChips, setReplyCcChips, replyCcInput, setReplyCcInput,
  showReplyCc, setShowReplyCc,
  replyText, setReplyText,
  onSend, onClose,
  onExpandToCompose,
  isSending        = false,
  sendError        = null,
  replyAll         = false,
  outlookConnected = false,
  selectedMsg      = null,
}) {
  const replyRef        = useRef(null);
  const fileInputRef    = useRef(null);
  const photoInputRef   = useRef(null);
  const sendDropdownRef = useRef(null);
  const emojiWrapRef    = useRef(null);

  const [showSendDropdown, setShowSendDropdown] = useState(false);
  const [showEmojiPicker,  setShowEmojiPicker]  = useState(false);
  const [attachments,      setAttachments]       = useState([]);
  const [selectedStatus,   setSelectedStatus]    = useState("open");
  const [editorH,          setEditorH]           = useState(MIN_H);

  const currentStatus  = SEND_STATUSES.find(s => s.key === selectedStatus) || SEND_STATUSES[1];
  const isOutlookEmail = !!selectedMsg?.msId;
  const canSendOutlook = isOutlookEmail && outlookConnected;

  const grow = useCallback(() => {
    const el = replyRef.current;
    if (!el) return;
    el.style.height = '0px';
    const sh = el.scrollHeight;
    const next = Math.min(Math.max(sh, MIN_H), MAX_H);
    el.style.height = next + 'px';
    setEditorH(next);
  }, []);

  useEffect(() => { grow(); }, [grow]);

  useEffect(() => {
    const h = (e) => {
      if (sendDropdownRef.current && !sendDropdownRef.current.contains(e.target)) setShowSendDropdown(false);
      if (emojiWrapRef.current    && !emojiWrapRef.current.contains(e.target))    setShowEmojiPicker(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setAttachments(prev => [...prev, ...files.map(f => ({ id: Date.now() + Math.random(), name: f.name }))]);
    e.target.value = "";
  };
  const removeAttachment = (id) => setAttachments(prev => prev.filter(a => a.id !== id));

  const insertEmoji = (emoji) => {
    replyRef.current?.focus();
    document.execCommand("insertText", false, emoji);
    setShowEmojiPicker(false);
    setTimeout(grow, 0);
  };

  const insertLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) { replyRef.current?.focus(); document.execCommand("createLink", false, url); }
  };

  const handleSendOption = (option) => {
    setShowSendDropdown(false);
    if (option === "send") {
      const bodyHtml = replyRef.current?.innerHTML || "";
      const bodyText = replyRef.current?.innerText  || "";
      if (!bodyText.trim()) return;
      onSend(bodyHtml, { replyAll, status: selectedStatus });
    } else if (option === "schedule") {
      alert("Schedule send: Coming soon!");
    }
  };

  const handleExpandToCompose = () => {
    const currentBody = replyRef.current?.innerHTML || "";
    onExpandToCompose?.({ toChips: replyToChips, ccChips: replyCcChips, body: currentBody, attachments });
  };

  const sendBtnBg    = canSendOutlook
    ? 'linear-gradient(135deg,#8b0000,#c0392b)'
    : `linear-gradient(135deg,${currentStatus.color},${currentStatus.color}cc)`;
  const sendBtnLabel = isSending
    ? "Sending…"
    : canSendOutlook
      ? (replyAll ? "Reply All via Outlook" : "Reply via Outlook")
      : `Send as ${currentStatus.label}`;
  const atMax = editorH >= MAX_H;

  return (
    <div className="mp-reply-box" ref={boxRef} style={{
      background: T.bg0,
      padding: '10px 12px 12px',
      display: 'flex',
      flexDirection: 'column',
      gap: 7,
    }}>
      <style>{`
        @keyframes rb-spin    { to { transform:rotate(360deg) } }
        @keyframes rb-slideUp { from { opacity:0;transform:translateY(8px) } to { opacity:1;transform:translateY(0) } }
        .rb-editor[contenteditable]:empty::before {
          content: attr(data-placeholder);
          color: ${T.text2};
          pointer-events: none;
        }
        .rb-editor { transition: height 0.1s ease; box-sizing: border-box; }
        .rb-editor::-webkit-scrollbar { width: 3px; }
        .rb-editor::-webkit-scrollbar-thumb { background: ${T.bg3}; border-radius: 4px; }
        .rb-chip-del:hover { color: ${T.red} !important; }
      `}</style>

      <input ref={fileInputRef}  type="file" multiple         style={{ display:'none' }} onChange={handleFileChange} />
      <input ref={photoInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileChange} />

      {/* ── To row bubble ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '8px 12px',
        borderRadius: 14,
        
        gap: 8, minHeight: 38,
        background: T.bg0,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: T.text2,
          minWidth: 16, fontFamily: T.font,
          textTransform: 'uppercase', letterSpacing: '0.7px', flexShrink: 0,
        }}>To</span>

        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
          {replyToChips.map(chip => (
            <span key={chip.id} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 10px 3px 5px', borderRadius: 20,
              background: T.bg0, boxShadow: T.shadowOut,
              fontSize: 11.5, color: T.text1, fontWeight: 500,
              fontFamily: T.font, flexShrink: 0,
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                background: T.accent, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 8, fontWeight: 700, flexShrink: 0,
              }}>
                {chip.label[0]?.toUpperCase()}
              </span>
              {chip.label}
              <button className="rb-chip-del"
                onClick={() => setReplyToChips(prev => prev.filter(c => c.id !== chip.id))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text2, fontSize: 14, lineHeight: 1, padding: 0, display: 'flex', alignItems: 'center', transition: 'color 0.12s' }}>×</button>
            </span>
          ))}
          <input
            value={replyToInput}
            onChange={e => setReplyToInput(e.target.value)}
            onKeyDown={e => {
              if ((e.key === "Enter" || e.key === ",") && replyToInput.trim()) {
                e.preventDefault();
                setReplyToChips(prev => [...prev, { id: Date.now(), label: replyToInput.trim() }]);
                setReplyToInput("");
              } else if (e.key === "Backspace" && !replyToInput && replyToChips.length > 0) {
                setReplyToChips(prev => prev.slice(0, -1));
              }
            }}
            placeholder={replyToChips.length === 0 ? "Add recipients…" : ""}
            style={{ border: 'none', outline: 'none', fontSize: 12, flex: 1, minWidth: 80, color: T.text1, background: 'transparent', fontFamily: T.font }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button onClick={() => setShowReplyCc(true)} style={{
            fontSize: 10.5, fontWeight: 600, color: T.text2,
            background: T.bg0, border: 'none', cursor: 'pointer',
            padding: '3px 9px', borderRadius: 20,
            boxShadow: T.shadowOut,
            fontFamily: T.font, transition: 'all 0.15s', letterSpacing: '0.02em',
          }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = T.shadowHover; e.currentTarget.style.color = T.text1; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = T.shadowOut; e.currentTarget.style.color = T.text2; }}>
            Bcc
          </button>
          <NeuBtn title="Open full compose" onClick={handleExpandToCompose}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          </NeuBtn>
          <NeuBtn title="Close reply" onClick={onClose}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </NeuBtn>
        </div>
      </div>

      {/* Cc row bubble */}
      {(showReplyCc || replyCcChips.length > 0) && (
        <div style={{ borderRadius: 14, overflow: 'hidden' }}>
          <ChipInput label="Cc" chips={replyCcChips} setChips={setReplyCcChips} inputValue={replyCcInput} setInputValue={setReplyCcInput}/>
        </div>
      )}

      {/* Outlook notice bubble */}
      {canSendOutlook && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 12px', borderRadius: 14,
          
          background: T.bg0,
          fontSize: 11.5, color: T.blue, fontWeight: 600,
          flexShrink: 0, fontFamily: T.font,
        }}>
          <div style={{ width: 24, height: 24, borderRadius: 8, background: T.bg0, boxShadow: T.shadowOut, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          {replyAll ? "Reply All" : "Reply"} via Outlook
          {selectedMsg?.senderEmail && (
            <span style={{ fontWeight: 400, color: 'rgba(30,64,175,0.5)', fontSize: 11 }}>
              &nbsp;→ <strong style={{ color: T.blue }}>{selectedMsg.senderEmail}</strong>
            </span>
          )}
        </div>
      )}

      {/* ── Editor bubble (inset + formatting toolbar inside) ── */}
      <div style={{ borderRadius: 16, background: T.bg0, overflow: 'hidden' }}>
        <FormattingToolbar editorRef={replyRef}/>
        <div
          ref={replyRef}
          className="rb-editor"
          contentEditable={!isSending}
          suppressContentEditableWarning
          data-placeholder="Write your reply…"
          onInput={e => { setReplyText(e.currentTarget.innerText); grow(); }}
          onKeyDown={() => setTimeout(grow, 0)}
          onPaste={() => setTimeout(grow, 0)}
          style={{
            width: '100%', height: editorH + 'px',
            overflowY: atMax ? 'auto' : 'hidden', overflowX: 'hidden',
            padding: '12px 16px',
            fontSize: 13, lineHeight: 1.75,
            color: T.text1, fontFamily: T.font,
            wordBreak: 'break-word', whiteSpace: 'pre-wrap',
            outline: 'none', background: 'transparent',
            ...(isSending ? { opacity: 0.4, pointerEvents: 'none' } : {}),
          }}
        />
      </div>

      {/* Send error bubble */}
      {sendError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 12px', borderRadius: 14,
          background: T.bg0,
          fontSize: 12, color: T.red, fontWeight: 500,
          flexShrink: 0, fontFamily: T.font,
        }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, background: T.bg0, boxShadow: T.shadowOut, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          {sendError}
        </div>
      )}

      {/* Attachments bubble */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px', borderRadius: 14, background: T.bg0 }}>
          {attachments.map(a => (
            <span key={a.id} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 11px', borderRadius: 20,
              background: T.bg0, boxShadow: T.shadowOut,
              fontSize: 11, color: T.text1, fontFamily: T.font,
            }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={T.text2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              {a.name}
              <button onClick={() => removeAttachment(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.text2, fontSize: 13, lineHeight: 1, padding: 0, transition: 'color 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.color = T.red}
                onMouseLeave={e => e.currentTarget.style.color = T.text2}>×</button>
            </span>
          ))}
        </div>
      )}

      {/* ── Bottom toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px',
        borderRadius: 14,
        background: T.bg0,
        gap: 8,
      }}>
        {/* Left tools */}
        <div ref={emojiWrapRef} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {[
            { title: "Attach file",  icon: <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>, onClick: () => fileInputRef.current?.click() },
            { title: "Insert link",  icon: <><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>, onClick: insertLink },
            { title: "Insert photo", icon: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>, onClick: () => photoInputRef.current?.click() },
            { title: "Signature",    icon: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>, onClick: () => { replyRef.current?.focus(); document.execCommand("insertHTML", false, "<br/>-- <br/>Your Name"); setTimeout(grow, 0); } },
            { title: "More options", icon: <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>, onClick: () => {} },
          ].map(({ title, icon, onClick }, i) => (
            <NeuBtn key={i} title={title} onClick={onClick}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
            </NeuBtn>
          ))}

          {/* Emoji */}
          <div style={{ position: 'relative' }}>
            <NeuBtn title="Emoji" onClick={() => setShowEmojiPicker(v => !v)} active={showEmojiPicker}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </NeuBtn>
            {showEmojiPicker && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 12px)', left: 0, zIndex: 400,
                background: T.bg0, borderRadius: 18,
                boxShadow: '10px 10px 28px rgba(13,39,80,0.18), -6px -6px 18px rgba(255,255,255,0.92)',
                padding: 14, width: 228, animation: 'rb-slideUp 0.15s ease',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.text2, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.7px', fontFamily: T.font }}>Emoji</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4 }}>
                  {EMOJIS.map((emoji, i) => (
                    <button key={i} onMouseDown={e => { e.preventDefault(); insertEmoji(emoji); }}
                      style={{ fontSize: 17, background: T.bg0, border: 'none', cursor: 'pointer', borderRadius: 10, padding: 5, lineHeight: 1, boxShadow: '3px 3px 7px rgba(13,39,80,0.10), -2px -2px 5px rgba(255,255,255,0.9)', transition: 'all 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '5px 5px 12px rgba(13,39,80,0.16), -3px -3px 8px rgba(255,255,255,0.95)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = '3px 3px 7px rgba(13,39,80,0.10), -2px -2px 5px rgba(255,255,255,0.9)'}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — send group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NeuBtn title="Discard" onClick={onClose} circle>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </NeuBtn>

          <div ref={sendDropdownRef} style={{ position: 'relative', display: 'flex', borderRadius: 20, overflow: 'hidden', boxShadow: isSending ? 'none' : canSendOutlook ? '0 4px 16px rgba(139,0,0,0.30)' : `0 4px 14px ${currentStatus.color}32` }}>
            <button onClick={() => handleSendOption("send")} disabled={isSending}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px',
                background: isSending ? T.bg3 : sendBtnBg,
                color: isSending ? T.text2 : '#fff', border: 'none',
                borderRadius: canSendOutlook ? '20px' : '20px 0 0 20px',
                fontSize: 12, fontWeight: 700, cursor: isSending ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s', fontFamily: T.font, letterSpacing: '0.01em',
              }}>
              {isSending
                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'rb-spin 0.8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              }
              {sendBtnLabel}
            </button>

            {!canSendOutlook && (
              <button disabled={isSending}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32,
                  background: isSending ? T.bg3 : sendBtnBg,
                  color: isSending ? T.text2 : 'rgba(255,255,255,0.85)',
                  border: 'none', borderLeft: '1px solid rgba(255,255,255,0.18)',
                  borderRadius: '0 20px 20px 0',
                  cursor: isSending ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
                }}
                onMouseDown={e => { e.stopPropagation(); if (!isSending) setShowSendDropdown(v => !v); }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            )}

            {showSendDropdown && !canSendOutlook && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 12px)', right: 0,
                minWidth: 185, zIndex: 400, animation: 'rb-slideUp 0.15s ease',
                background: T.bg0, borderRadius: 18, padding: 6,
                boxShadow: '10px 10px 28px rgba(13,39,80,0.18), -6px -6px 18px rgba(255,255,255,0.92)',
              }}>
                {SEND_STATUSES.map(status => (
                  <button key={status.key} onClick={() => { setSelectedStatus(status.key); setShowSendDropdown(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '8px 13px', border: 'none',
                      background: selectedStatus === status.key ? T.bg2 : 'transparent',
                      fontSize: 12, color: T.text1, cursor: 'pointer',
                      textAlign: 'left', transition: 'background 0.12s',
                      fontFamily: T.font, borderRadius: 11,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = T.bg2}
                    onMouseLeave={e => e.currentTarget.style.background = selectedStatus === status.key ? T.bg2 : 'transparent'}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: status.dot, flexShrink: 0, boxShadow: `0 0 6px ${status.dot}70` }}/>
                    {status.label}
                    {selectedStatus === status.key && (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}