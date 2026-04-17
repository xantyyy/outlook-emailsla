import React, { useRef, useState } from "react";
import ToolbarBtn from "./ToolbarBtn";
import CustomColorPicker from "./CustomColorPicker";
import { FONT_FAMILIES, FONT_SIZES } from "./messagingConstants";

export default function FormattingToolbar({ editorRef }) {
  const [showFontSize, setShowFontSize] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [textColor, setTextColor] = useState("#000000");
  const fontSizeRef = useRef(null);
  const colorPickerRef = useRef(null);

  const execFormat = (cmd, value = null) => {
    editorRef?.current?.focus();
    document.execCommand(cmd, false, value);
  };

  const applyFontSize = (size) => {
    editorRef?.current?.focus();
    document.execCommand("fontSize", false, "7");
    const fontElements = editorRef?.current?.querySelectorAll('font[size="7"]');
    fontElements?.forEach((el) => {
      el.removeAttribute("size");
      el.style.fontSize = size;
    });
    setShowFontSize(false);
  };

  const applyTextColor = (color) => {
    setTextColor(color);
    editorRef?.current?.focus();
    document.execCommand("foreColor", false, color);
    setShowColorPicker(false);
  };

  return (
    <div className="mp-toolbar">
      {/* Undo / Redo */}
      <div className="mp-toolbar-group">
        <ToolbarBtn title="Undo" onClick={() => execFormat("undo")}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6"/><path d="M3 13C5.33 9 9 7 13 7c3.31 0 6.24 1.34 8.37 3.5"/>
          </svg>
        </ToolbarBtn>
        <ToolbarBtn title="Redo" onClick={() => execFormat("redo")}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6"/><path d="M21 13C18.67 9 15 7 11 7c-3.31 0-6.24 1.34-8.37 3.5"/>
          </svg>
        </ToolbarBtn>
      </div>

      <div className="mp-toolbar-divider" />

      {/* Font Family */}
      <div className="mp-toolbar-group">
        <select
          className="mp-toolbar-select"
          defaultValue="sans-serif"
          onChange={(e) => execFormat("fontName", e.target.value)}
        >
          {FONT_FAMILIES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="mp-toolbar-divider" />

      {/* Font Size */}
      <div className="mp-toolbar-group" style={{ position: "relative" }} ref={fontSizeRef}>
        <ToolbarBtn title="Font Size" onClick={() => setShowFontSize((v) => !v)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 7 4 4 20 4 20 7"/>
            <line x1="9" y1="20" x2="15" y2="20"/>
            <line x1="12" y1="4" x2="12" y2="20"/>
          </svg>
        </ToolbarBtn>
        {showFontSize && (
          <div className="mp-fontsize-dropdown">
            {FONT_SIZES.map((sz) => (
              <button
                key={sz}
                className="mp-fontsize-option"
                onMouseDown={(e) => { e.preventDefault(); applyFontSize(sz); }}
              >
                {sz}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mp-toolbar-divider" />

      {/* B I U + Color */}
      <div className="mp-toolbar-group">
        <ToolbarBtn title="Bold" onClick={() => execFormat("bold")}>
          <strong style={{ fontSize: 13, lineHeight: 1 }}>B</strong>
        </ToolbarBtn>
        <ToolbarBtn title="Italic" onClick={() => execFormat("italic")}>
          <em style={{ fontSize: 13, lineHeight: 1, fontFamily: "serif" }}>I</em>
        </ToolbarBtn>
        <ToolbarBtn title="Underline" onClick={() => execFormat("underline")}>
          <span style={{ fontSize: 13, textDecoration: "underline", lineHeight: 1 }}>U</span>
        </ToolbarBtn>

        {/* Custom Color Picker */}
        <div className="mp-color-btn-wrap" style={{ position: "relative" }}>
          <ToolbarBtn title="Text Color" onClick={() => setShowColorPicker((v) => !v)}>
            <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1, color: "#333" }}>A</span>
              <span style={{ display: "block", height: 3, background: textColor, borderRadius: 2, width: 14 }} />
            </span>
          </ToolbarBtn>
          {showColorPicker && (
            <CustomColorPicker
              currentColor={textColor}
              onColorSelect={applyTextColor}
              onClose={() => setShowColorPicker(false)}
              pickerRef={colorPickerRef}
            />
          )}
        </div>
      </div>

      <div className="mp-toolbar-divider" />

      {/* Alignment, Lists, Indent */}
      <div className="mp-toolbar-group">
        <ToolbarBtn title="Align Left" onClick={() => execFormat("justifyLeft")}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/>
            <line x1="15" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/>
          </svg>
        </ToolbarBtn>
        <ToolbarBtn title="Numbered List" onClick={() => execFormat("insertOrderedList")}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/>
            <line x1="10" y1="18" x2="21" y2="18"/>
            <path d="M4 6h1v4"/><path d="M4 10h2"/>
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
          </svg>
        </ToolbarBtn>
        <ToolbarBtn title="Bullet List" onClick={() => execFormat("insertUnorderedList")}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/>
            <line x1="9" y1="18" x2="20" y2="18"/>
            <circle cx="4" cy="6" r="1" fill="currentColor"/>
            <circle cx="4" cy="12" r="1" fill="currentColor"/>
            <circle cx="4" cy="18" r="1" fill="currentColor"/>
          </svg>
        </ToolbarBtn>
        <ToolbarBtn title="Decrease Indent" onClick={() => execFormat("outdent")}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="11 17 6 12 11 7"/>
            <line x1="21" y1="17" x2="6" y2="17"/><line x1="21" y1="12" x2="10" y2="12"/>
            <line x1="21" y1="7" x2="6" y2="7"/>
          </svg>
        </ToolbarBtn>
        <ToolbarBtn title="Increase Indent" onClick={() => execFormat("indent")}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13 17 18 12 13 7"/>
            <line x1="3" y1="17" x2="18" y2="17"/><line x1="3" y1="12" x2="8" y2="12"/>
            <line x1="3" y1="7" x2="18" y2="7"/>
          </svg>
        </ToolbarBtn>
      </div>

      <div className="mp-toolbar-divider" />

      {/* Blockquote, Strikethrough, Clear */}
      <div className="mp-toolbar-group">
        <ToolbarBtn title="Blockquote" onClick={() => execFormat("formatBlock", "blockquote")}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
          </svg>
        </ToolbarBtn>
        <ToolbarBtn title="Strikethrough" onClick={() => execFormat("strikeThrough")}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.3 4.9c-2.3-.6-4.4-1-6.2-.9-2.7 0-5.3.7-5.3 3.6 0 1.5 1.8 3.3 3.6 4.5H3"/>
            <path d="M21 12H3"/>
            <path d="M7 12c-.2 1.6.8 3.4 2.4 4.5C11 17.5 13.4 18 16 18c1.7 0 3.3-.3 4.5-.9"/>
          </svg>
        </ToolbarBtn>
        <ToolbarBtn title="Remove Formatting" onClick={() => execFormat("removeFormat")}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="7" x2="20" y2="7"/><line x1="10" y1="11" x2="16" y2="11"/>
            <line x1="8" y1="15" x2="18" y2="15"/><line x1="3" y1="19" x2="21" y2="19"/>
            <line x1="4" y1="4" x2="20" y2="20"/>
          </svg>
        </ToolbarBtn>
      </div>
    </div>
  );
}
