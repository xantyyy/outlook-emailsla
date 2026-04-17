import React, { useRef, useState, useEffect } from "react";
import ChipInput from "./ChipInput";
import FormattingToolbar from "./FormattingToolbar";

export default function ComposePanel({ onClose, initialToChips, initialCcChips, initialSubject, initialBody, initialAttachments }) {
  const composeBodyRef = useRef(null);
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const sendDropdownRef = useRef(null);
  const templatesRef = useRef(null);

  const [composeToChips, setComposeToChips] = useState(initialToChips || []);
  const [composeCcChips, setComposeCcChips] = useState(initialCcChips || []);
  const [composeBccChips, setComposeBccChips] = useState([]);
  const [composeToInput, setComposeToInput] = useState("");
  const [composeCcInput, setComposeCcInput] = useState("");
  const [composeBccInput, setComposeBccInput] = useState("");
  const [composeSubject, setComposeSubject] = useState(initialSubject || "");
  const [showComposeBcc, setShowComposeBcc] = useState(false);
  const [showSendDropdown, setShowSendDropdown] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [attachments, setAttachments] = useState(initialAttachments || []);
  const [savedDraft] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("open");

  const SEND_STATUSES = [
    { key: "new",     label: "New",     bg: "#ffa500", text: "#1a1a1a" },
    { key: "open",    label: "Open",    bg: "#a10304", text: "#ffffff" },
    { key: "pending", label: "Pending", bg: "#1b64b9", hover: "#0284c7", text: "#ffffff" },
    { key: "onhold",  label: "On Hold", bg: "#09090b", hover: "#000000", text: "#ffffff" },
    { key: "solved",  label: "Solved",  bg: "#71717a", hover: "#52525b", text: "#ffffff" },
  ];

  const currentStatus = SEND_STATUSES.find((s) => s.key === selectedStatus) || SEND_STATUSES[1];

  // Populate body from initialBody (HTML) after mount
  useEffect(() => {
    if (initialBody && composeBodyRef.current) {
      composeBodyRef.current.innerHTML = initialBody;
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (sendDropdownRef.current && !sendDropdownRef.current.contains(e.target)) {
        setShowSendDropdown(false);
      }
      if (templatesRef.current && !templatesRef.current.contains(e.target)) {
        setShowTemplates(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newAttachments = files.map((f) => ({
      id: Date.now() + Math.random(),
      name: f.name,
      size: f.size,
      file: f,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = "";
  };

  const removeAttachment = (id) => setAttachments((prev) => prev.filter((a) => a.id !== id));

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileType = (name) => {
    const ext = name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    if (["doc", "docx"].includes(ext)) return "word";
    if (["xls", "xlsx"].includes(ext)) return "excel";
    if (["zip", "rar", "7z"].includes(ext)) return "archive";
    return "file";
  };

  const FILE_CONFIGS = {
    pdf:     { bg: "#fde8e8", color: "#c00000", label: "PDF" },
    image:   { bg: "#e8f4fd", color: "#0070c0", label: "IMG" },
    word:    { bg: "#e8f0fd", color: "#1a56db", label: "DOC" },
    excel:   { bg: "#e8fdf0", color: "#00703a", label: "XLS" },
    archive: { bg: "#fef9e8", color: "#b45309", label: "ZIP" },
    file:    { bg: "#f3f4f6", color: "#4b5563", label: "FILE" },
  };

  const FileIcon = ({ type }) => {
    const { bg, color, label } = FILE_CONFIGS[type] || FILE_CONFIGS.file;
    return (
      <div className="mp-file-icon-wrap" style={{ background: bg }}>
        <svg width="18" height="20" viewBox="0 0 24 28" fill="none">
          <path d="M4 0h11l7 7v21H4z" fill={bg} stroke={color} strokeWidth="1.5"/>
          <path d="M15 0l7 7h-7z" fill={color} opacity="0.4"/>
        </svg>
        <span className="mp-file-icon-label" style={{ color }}>{label}</span>
      </div>
    );
  };

  const handleSendOption = (option) => {
    setShowSendDropdown(false);
    if (option === "send") onClose();
    else if (option === "schedule") alert("Schedule send: Coming soon!");
    else if (option === "merge") alert("Start mail merge: Coming soon!");
  };

  return (
    <div className="mp-compose-panel">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileChange} />
      <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFileChange} />

      {/* Formatting Toolbar — at the very top */}
      <FormattingToolbar editorRef={composeBodyRef} />

      {/* Action Bar */}
      <div className="mp-compose-action-bar">
        {/* Left: quick icon tools */}
        <div className="mp-compose-action-left">
          <button className="mp-compose-tool-btn" title="Emoji">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>
          <button className="mp-compose-tool-btn" title="More options">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button className="mp-compose-tool-btn" title="Discard draft" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
          <button className="mp-compose-tool-btn" title="Attach file" onClick={() => fileInputRef.current?.click()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
        </div>

        {/* Right: saved draft + templates + send */}
        <div className="mp-compose-action-right">
          {/* Saved draft indicator */}
          {savedDraft && (
            <span className="mp-saved-draft-indicator">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Saved draft
            </span>
          )}

          {/* Templates */}
          <div className="mp-templates-wrap" ref={templatesRef}>
            <button className="mp-templates-btn" onClick={() => setShowTemplates((v) => !v)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              Templates
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {showTemplates && (
              <div className="mp-templates-dropdown">
                <div className="mp-templates-empty">No templates yet</div>
              </div>
            )}
          </div>

          {/* Send group */}
          <div className="mp-compose-send-group" ref={sendDropdownRef} style={{ position: "relative" }}>
            <button
              className="mp-send-btn"
              onClick={() => handleSendOption("send")}
              style={{ background: currentStatus.bg }}
              onMouseEnter={(e) => e.currentTarget.style.background = currentStatus.hover}
              onMouseLeave={(e) => e.currentTarget.style.background = currentStatus.bg}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Send as {currentStatus.label}
            </button>
            <button
              className="mp-send-arrow-btn"
              title="Change status"
              style={{ background: currentStatus.bg, borderLeft: `1px solid rgba(255,255,255,0.25)` }}
              onMouseEnter={(e) => e.currentTarget.style.background = currentStatus.hover}
              onMouseLeave={(e) => e.currentTarget.style.background = currentStatus.bg}
              onMouseDown={(e) => { e.stopPropagation(); setShowSendDropdown((v) => !v); }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {showSendDropdown && (
              <div className="mp-send-dropdown" style={{ right: 0, left: "auto", minWidth: 180 }}>
                {SEND_STATUSES.map((status) => (
                  <button
                    key={status.key}
                    className="mp-send-dropdown-item"
                    onClick={() => { setSelectedStatus(status.key); setShowSendDropdown(false); }}
                    style={selectedStatus === status.key ? { background: "#f3f4f6" } : {}}
                  >
                    <span
                      className="mp-status-dot"
                      style={{ background: status.bg }}
                    />
                    {status.label}
                    {selectedStatus === status.key && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", color: "#6b7280" }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content: recipients, subject, attachments, body */}
      <div className="mp-compose-scroll-area">
      {/* To */}
      <ChipInput
        label="To"
        chips={composeToChips}
        setChips={setComposeToChips}
        inputValue={composeToInput}
        setInputValue={setComposeToInput}
        showBcc
        onBccClick={() => setShowComposeBcc(true)}
      />

      {/* Cc */}
      <ChipInput
        label="Cc"
        chips={composeCcChips}
        setChips={setComposeCcChips}
        inputValue={composeCcInput}
        setInputValue={setComposeCcInput}
      />

      {/* Bcc */}
      {showComposeBcc && (
        <ChipInput
          label="Bcc"
          chips={composeBccChips}
          setChips={setComposeBccChips}
          inputValue={composeBccInput}
          setInputValue={setComposeBccInput}
        />
      )}

      {/* Subject */}
      <div className="mp-compose-subject-row">
        <input
          className="mp-compose-subject-input"
          type="text"
          placeholder="Add a subject"
          value={composeSubject}
          onChange={(e) => setComposeSubject(e.target.value)}
        />
      </div>

      {/* Attachment cards */}
      {attachments.length > 0 && (
        <div className="mp-compose-attachments">
          <div className="mp-compose-attachments-label">Attachments</div>
          <div className="mp-compose-attachment-cards">
            {attachments.map((a) => {
              const type = getFileType(a.name);
              const size = formatFileSize(a.size);
              return (
                <div key={a.id} className="mp-compose-attachment-card">
                  <FileIcon type={type} />
                  <div className="mp-compose-attachment-info">
                    <span className="mp-compose-attachment-name">{a.name}</span>
                    {size && <span className="mp-compose-attachment-size">{size}</span>}
                  </div>
                  <button className="mp-compose-attachment-x" onClick={() => removeAttachment(a.id)} title="Remove">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Body */}
      <div
        ref={composeBodyRef}
        className="mp-compose-body"
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Write your message here&#8230;"
      />
      </div>{/* end mp-compose-scroll-area */}
    </div>
  );
}