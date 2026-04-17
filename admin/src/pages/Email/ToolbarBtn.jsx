import React from "react";

export default function ToolbarBtn({ title, onClick, children }) {
  return (
    <button
      className="mp-toolbar-btn"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick && onClick();
      }}
    >
      {children}
    </button>
  );
}
