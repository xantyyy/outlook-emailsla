/**
 * models/ticket.model.js
 *
 * MongoDB schema for email-based tickets.
 * Tracks status (New / Open / Pending), full SLA timer state,
 * and a complete status history log.
 *
 * SLA TIMER FIELDS EXPLAINED
 * ──────────────────────────
 *  slaDeadline      – absolute UTC timestamp when SLA expires (set on New → Open)
 *  slaStartedAt     – when the SLA timer first started (immutable after creation)
 *  slaDurationMs    – total SLA duration in ms (default: 5 min for testing)
 *  slaPausedAt      – if set, the timer is currently paused (status = Pending)
 *  slaTotalPausedMs – cumulative ms the timer has been paused so far
 *  slaExpired       – true once deadline has passed without resolution
 *
 * DERIVED VALUE (not stored, computed on read):
 *   timeRemainingMs = slaDeadline - Date.now() - (currently paused ms if applicable)
 *
 * STATUS HISTORY
 * ──────────────
 *  Each status change appends { status, changedAt, reason } to statusHistory.
 *  This gives a full audit trail of every transition.
 */

const mongoose = require('mongoose');

/* ── Sub-schema: one entry in the status change log ── */
const StatusHistorySchema = new mongoose.Schema(
  {
    status:    { type: String, enum: ['new', 'open', 'pending', 'on_hold', 'solved'], required: true },
    changedAt: { type: Date,   default: Date.now },
    reason:    { type: String, default: '' },  // e.g. "agent_reply", "customer_reply", "email_opened"
  },
  { _id: false }
);

/* ── Main Ticket schema ── */
const TicketSchema = new mongoose.Schema(
  {
    /* ── Identification ───────────────────────────────────────── */
    conversationId: { type: String, required: true, index: true, unique: true },
    // The Graph conversationId links all Graph messages in a thread.

    latestMessageId: { type: String, default: null },
    // Graph message ID of the most-recent email in this conversation.

    subject: { type: String, default: '(no subject)' },

    /* ── Participants ─────────────────────────────────────────── */
    customerEmail:  { type: String, required: true, index: true },
    customerName:   { type: String, default: '' },
    agentUserId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    // agentUserId = the OutlookToken userId who "owns" this inbox

    /* ── Status ───────────────────────────────────────────────── */
    status: {  // agent status
      type:    String,
      enum:    ['new', 'open', 'pending', 'on_hold', 'solved'],
      default: 'new',
      index:   true,
    },
    customerStatus: {
      type:    String,
      enum:    ['new', 'open', 'pending', 'on_hold', 'solved'],
      default: 'new',
      index:   true,
    },

    statusHistory: { type: [StatusHistorySchema], default: [] },

    lastSentBy: { type: String, enum: ['agent', 'customer'], default: null },

    /* ── SLA Timer ────────────────────────────────────────────── */
    slaDurationMs:    { type: Number, default: 5 * 60 * 1000 }, // 5 min (testing)
    slaStartedAt:     { type: Date,   default: null },           // when timer first started
    slaDeadline:      { type: Date,   default: null },           // absolute expiry timestamp
    slaPausedAt:      { type: Date,   default: null },           // non-null = currently paused
    slaTotalPausedMs: { type: Number, default: 0 },              // cumulative paused time
    slaExpired:       { type: Boolean, default: false },

    /* ── Graph subscription tracking ─────────────────────────── */
    graphSubscriptionId: { type: String, default: null },
    // Stored so we can renew/delete the subscription when the ticket closes.

    /* ── Misc ─────────────────────────────────────────────────── */
    source:    { type: String, default: 'outlook' },
    createdAt: { type: Date,   default: Date.now },
    updatedAt: { type: Date,   default: Date.now },
  },
  {
    timestamps: true, // auto-manages createdAt / updatedAt
  }
);

/* ── Indexes ── */
TicketSchema.index({ status: 1, slaDeadline: 1 }); // for SLA expiry scans
TicketSchema.index({ agentUserId: 1, status: 1 });

/* ── Instance helpers ── */

/**
 * Returns the effective ms remaining on the SLA.
 * Returns 0 if expired, Infinity if timer not yet started.
 */
TicketSchema.methods.getSlaRemainingMs = function () {
  if (!this.slaDeadline) return Infinity;
  if (this.slaExpired)   return 0;

  const now = Date.now();

  // If currently paused, add the in-progress pause duration
  const currentPauseMs = this.slaPausedAt
    ? now - new Date(this.slaPausedAt).getTime()
    : 0;

  const remaining = new Date(this.slaDeadline).getTime()
    + this.slaTotalPausedMs
    + currentPauseMs
    - now;

  return Math.max(0, remaining);
};

module.exports = mongoose.model('Ticket', TicketSchema);