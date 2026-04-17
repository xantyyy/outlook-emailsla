import React from "react";
import { COLOR_GRID } from "./messagingConstants";

export default function CustomColorPicker({ currentColor, onColorSelect, onClose, pickerRef }) {
  return (
    <div className="mp-color-picker-popup" ref={pickerRef}>
      <div className="mp-color-picker-title">Font color</div>
      <div className="mp-color-picker-grid">
        {COLOR_GRID.map((row, ri) => (
          <div key={ri} className="mp-color-picker-row">
            {row.map((color, ci) => (
              <button
                key={ci}
                className={`mp-color-swatch ${currentColor === color ? "mp-color-swatch--active" : ""}`}
                style={{
                  background: color,
                  border: color === "#ffffff" ? "1px solid #e0e0e0" : "none",
                }}
                title={color}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onColorSelect(color);
                }}
              />
            ))}
          </div>
        ))}
      </div>
      <button
        className="mp-color-more"
        onMouseDown={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v8M8 12h8"/>
        </svg>
        More colors…
      </button>
    </div>
  );
}
