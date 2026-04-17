// ── Email / Send Statuses ────────────────────────────────────────────────────
export const EMAIL_STATUSES = [
  { key: "new",     label: "New",     bg: "#ffa500", text: "#1a1a1a" },
  { key: "open",    label: "Open",    bg: "#a10304", text: "#ffffff" },
  { key: "pending", label: "Pending", bg: "#1b64b9", text: "#ffffff" },
  { key: "onhold",  label: "On Hold", bg: "#09090b", text: "#ffffff" },
  { key: "solved",  label: "Solved",  bg: "#71717a", text: "#ffffff" },
];

// ── Context Menu Items ───────────────────────────────────────────────────────
export const CONTEXT_MENU_ITEMS = [
  { label: "Open", action: "open" },
  { label: "Reply", action: "reply", bold: true },
  { label: "Reply All", action: "replyAll" },
  { label: "Forward", action: "forward" },
  { label: "Forward as attachment", action: "forwardAttachment" },
  { label: "Mark as unread", action: "markUnread" },
  { label: "Move to Junk", action: "junk" },
  { label: "Mute", action: "mute" },
  { label: "Delete", action: "delete" },
  {
    label: "Star",
    action: "star",
    starColors: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#d1d5db"],
  },
  { label: "Archive", action: "archive" },
  { label: "Move to", action: "moveTo", hasArrow: true },
  { label: "Copy to", action: "copyTo", hasArrow: true },
];

// ── Font Color Grid (6 rows × 10 cols) ───────────────────────────────────────
export const COLOR_GRID = [
  ["#c00000","#ff0000","#ffc000","#ffff00","#92d050","#00b050","#00b0f0","#0070c0","#002060","#7030a0"],
  ["#e06666","#f6b26b","#ffd966","#93c47d","#76a5af","#6fa8dc","#8e7cc3","#c27ba0","#e69138","#6d9eeb"],
  ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#a2c4c9","#9fc5e8","#b4a7d6","#d5a6bd","#f9a825","#4fc3f7"],
  ["#f4cccc","#fce5cd","#fff2cc","#d9ead3","#d0e4f7","#c9daf8","#d9d2e9","#ead1dc","#fff8e1","#e1f5fe"],
  ["#ffffff","#efefef","#d9d9d9","#b7b7b7","#999999","#666666","#434343","#222222","#000000","#1a1a2e"],
  ["#ff4500","#ff6b6b","#ffa07a","#ffd700","#adff2f","#7cfc00","#00fa9a","#00ced1","#1e90ff","#9370db"],
];

// ── Font Family Options ──────────────────────────────────────────────────────
export const FONT_FAMILIES = [
  { value: "sans-serif", label: "Sans Serif" },
  { value: "serif", label: "Serif" },
  { value: "monospace", label: "Monospace" },
  { value: "Arial", label: "Arial" },
  { value: "Arial Black", label: "Arial Black" },
  { value: "Calibri", label: "Calibri" },
  { value: "Cambria", label: "Cambria" },
  { value: "Comic Sans MS", label: "Comic Sans MS" },
  { value: "Courier New", label: "Courier New" },
  { value: "Georgia", label: "Georgia" },
  { value: "Gill Sans", label: "Gill Sans" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Impact", label: "Impact" },
  { value: "Lucida Console", label: "Lucida Console" },
  { value: "Palatino", label: "Palatino" },
  { value: "Tahoma", label: "Tahoma" },
  { value: "Times New Roman", label: "Times New Roman" },
  { value: "Trebuchet MS", label: "Trebuchet MS" },
  { value: "Verdana", label: "Verdana" },
];

// ── Font Size Options ────────────────────────────────────────────────────────
export const FONT_SIZES = [
  "8px","9px","10px","11px","12px","14px","16px","18px",
  "20px","24px","28px","32px","36px","48px","72px"
];