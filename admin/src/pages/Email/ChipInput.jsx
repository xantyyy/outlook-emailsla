import React from "react";

export default function ChipInput({ label, chips, setChips, inputValue, setInputValue, showBcc, onBccClick }) {
  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && inputValue.trim()) {
      e.preventDefault();
      setChips((prev) => [...prev, { id: Date.now(), label: inputValue.trim() }]);
      setInputValue("");
    } else if (e.key === "Backspace" && !inputValue && chips.length > 0) {
      setChips((prev) => prev.slice(0, -1));
    }
  };

  const removeChip = (id) => setChips((prev) => prev.filter((c) => c.id !== id));

  return (
    <div className="mp-chip-row">
      <span className="mp-chip-row-label">{label}</span>
      <div className="mp-chip-area">
        {chips.map((chip) => (
          <span key={chip.id} className="mp-chip">
            <span className="mp-chip-initial">{chip.label[0]?.toUpperCase()}</span>
            <span className="mp-chip-name">{chip.label}</span>
            <button
              className="mp-chip-remove"
              onClick={() => removeChip(chip.id)}
              title="Remove"
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="mp-chip-input"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={chips.length === 0 ? "Add recipients…" : ""}
        />
      </div>
      {showBcc && (
        <button className="mp-bcc-btn" onClick={onBccClick}>
          Bcc
        </button>
      )}
    </div>
  );
}
