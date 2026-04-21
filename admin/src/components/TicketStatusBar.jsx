/**
 * components/TicketStatusBar.jsx  (FRONTEND)
 *
 * Drop-in status bar for EmailDetail / TicketDetail.
 * Shows:
 *  • Colored status badge (New / Open / Pending)
 *  • Live SLA countdown timer (pauses when Pending)
 *  • "SLA EXPIRED" warning when time runs out
 *
 * Props:
 *   conversationId  {string}    — Graph conversationId
 *   ticketId        {string}    — MongoDB _id (for socket room)
 *
 * Usage:
 *   <TicketStatusBar conversationId={email.conversationId} ticketId={ticket._id} />
 */

import React, { useMemo } from 'react';
import {
  useTicket,
  useTicketSocketSync,
  useSlaTimer,
  useUpdateTicketStatus,
} from '../hooks/useTickets';

/* ── Format ms → "MM:SS" ── */
function formatMs(ms) {
  if (!isFinite(ms) || ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const min      = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const sec      = (totalSec % 60).toString().padStart(2, '0');
  return `${min}:${sec}`;
}

/* ── Status badge colour map ── */
const STATUS_CONFIG = {
  new:     { label: 'NEW',     bg: '#e0f2fe', color: '#0369a1', dot: '#0ea5e9' },
  open:    { label: 'OPEN',    bg: '#fef9c3', color: '#854d0e', dot: '#eab308' },
  pending: { label: 'PENDING', bg: '#fce7f3', color: '#9d174d', dot: '#ec4899' },
};

export default function TicketStatusBar({ conversationId, ticketId }) {
  const { data: ticket, isLoading } = useTicket(conversationId);
  const { remainingMs, isExpired, isPaused } = useSlaTimer(ticket);
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateTicketStatus();

  // Subscribe to real-time socket updates for this ticket
  useTicketSocketSync(ticketId, conversationId);

  const cfg = STATUS_CONFIG[ticket?.status] || STATUS_CONFIG.open;

  if (isLoading || !ticket) return null;

  const timerColor = isExpired
    ? '#dc2626'                     // red when expired
    : isPaused
      ? '#6b7280'                   // grey when paused
      : remainingMs < 60_000
        ? '#dc2626'                 // red when < 1 min
        : remainingMs < 120_000
          ? '#f59e0b'               // amber when < 2 min
          : '#16a34a';              // green otherwise

  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      gap:            '12px',
      padding:        '8px 16px',
      backgroundColor: '#f8fafc',
      borderBottom:   '1px solid #e2e8f0',
      flexWrap:       'wrap',
    }}>
      {/* Status badge */}
      <span style={{
        display:         'inline-flex',
        alignItems:      'center',
        gap:             '6px',
        padding:         '3px 10px',
        borderRadius:    '9999px',
        backgroundColor: cfg.bg,
        color:           cfg.color,
        fontSize:        '11px',
        fontWeight:      700,
        letterSpacing:   '0.05em',
        userSelect:      'none',
      }}>
        <span style={{
          width:           '7px',
          height:          '7px',
          borderRadius:    '50%',
          backgroundColor: cfg.dot,
          flexShrink:      0,
          animation:       ticket.status === 'open' ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }} />
        {cfg.label}
      </span>

      {/* SLA Timer */}
      {ticket.slaDeadline && (
        <span style={{
          display:     'inline-flex',
          alignItems:  'center',
          gap:         '5px',
          fontSize:    '12px',
          fontWeight:  600,
          color:       timerColor,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {/* Clock icon */}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>

          {isExpired
            ? 'SLA EXPIRED'
            : isPaused
              ? `PAUSED · ${formatMs(remainingMs)}`
              : `${formatMs(remainingMs)} remaining`
          }
        </span>
      )}

      {/* Manual status buttons (agent override) */}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
        {['open', 'pending'].map(s => (
          s !== ticket.status && (
            <button
              key={s}
              disabled={isUpdating}
              onClick={() => updateStatus({
                ticketId:       ticket._id,
                conversationId: ticket.conversationId,
                newStatus:      s,
                reason:         'manual_agent',
              })}
              style={{
                padding:         '3px 10px',
                borderRadius:    '6px',
                border:          '1px solid #cbd5e1',
                backgroundColor: 'white',
                fontSize:        '11px',
                fontWeight:      600,
                cursor:          isUpdating ? 'not-allowed' : 'pointer',
                color:           '#475569',
                textTransform:   'capitalize',
              }}
            >
              Mark {s}
            </button>
          )
        ))}
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}