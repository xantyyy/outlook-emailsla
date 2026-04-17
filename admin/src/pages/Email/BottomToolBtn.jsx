import React from "react";

export default function BottomToolBtn({ title, onClick, children }) {
  return (
    <button className="mp-bottom-tool-btn" title={title} onClick={onClick}>
      {children}
    </button>
  );
}
