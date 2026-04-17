import React from "react";
import { CONTEXT_MENU_ITEMS } from "./messagingConstants";

export default function ContextMenu({ contextMenu, contextRef, onAction }) {
  if (!contextMenu) return null;

  return (
    <div
      ref={contextRef}
      className="mp-context-menu"
      style={{ top: contextMenu.y, left: contextMenu.x }}
    >
      {CONTEXT_MENU_ITEMS.map((item, idx) => (
        <div key={idx}>
          {item.action === "star" ? (
            <div className="mp-context-item mp-context-star-row">
              <span className="mp-context-label">{item.label}</span>
              <div className="mp-star-colors">
                {item.starColors.map((color, ci) => (
                  <button
                    key={ci}
                    className="mp-star-color-btn"
                    style={{ background: color }}
                    onClick={() => onAction("star", contextMenu.msg, color)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <button
              className={`mp-context-item ${item.bold ? "mp-context-item--bold" : ""}`}
              onClick={() => onAction(item.action, contextMenu.msg)}
            >
              <span className="mp-context-label">{item.label}</span>
              {item.hasArrow && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
